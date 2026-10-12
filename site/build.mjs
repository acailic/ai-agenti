#!/usr/bin/env node
/* ai-agenti-srb site generator.
 *
 * Markdown u repozitorijumu je izvor istine; ova skripta ga renderuje u
 * statični sajt commitovan pod docs/ (GitHub Pages servira iz main /docs).
 *
 *   node site/build.mjs          generiši docs/
 *   node site/build.mjs --check  padni ako je docs/ zastareo
 *   node site/build.mjs --serve  serviraj docs/ na :8093 (rebuild pri izmeni)
 *
 * Bez frejmworka: marked (markdown) pinned u package.json. Izlaz je bez
 * ikakvih spoljnih zavisnosti — čist HTML/CSS/JS.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, rmSync, statSync, watch } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { Marked } from 'marked';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const SERVE = process.argv.includes('--serve');

const GITHUB_BASE = 'https://github.com/acailic/ai-agenti-srb';
const SITE_URL = 'https://acailic.github.io/ai-agenti-srb';
const USLUGE_URL = 'https://acailic.github.io/usluge/';

/* ── markdown pipeline ─────────────────────────────────────────── */

const marked = new Marked({ gfm: true });
const renderMd = (md) => marked.parse(md);

const escapeAttr = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

const decodeEntities = (s) =>
  s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
   .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'");

/* srpske dijakritike u ASCII, pa slug — da sidro "Šta je agent?" bude #sta-je-agent */
const deSerb = (s) =>
  s.replace(/[čć]/g, 'c').replace(/Č/g, 'C').replace(/Ć/g, 'C')
   .replace(/ž/g, 'z').replace(/Ž/g, 'Z')
   .replace(/š/g, 's').replace(/Š/g, 'S')
   .replace(/đ/g, 'dj').replace(/Đ/g, 'Dj');
const slugify = (s) =>
  deSerb(decodeEntities(s).replace(/<[^>]+>/g, '').toLowerCase())
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'sekcija';

/* dodaj id h2/h3 i vrati (html, toc) */
function addHeadingIds(html) {
  const toc = [];
  const seen = new Map();
  const out = html.replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/g, (_m, lvl, attrs, inner) => {
    let slug = slugify(inner);
    const n = seen.get(slug) || 0;
    seen.set(slug, n + 1);
    if (n > 0) slug = `${slug}-${n + 1}`;
    if (lvl === '2') toc.push({ id: slug, text: decodeEntities(inner.replace(/<[^>]+>/g, '')) });
    const kept = attrs.replace(/\s*id="[^"]*"/, '');
    return `<h${lvl}${kept} id="${slug}">${inner}</h${lvl}>`;
  });
  return { html: out, toc };
}

/* čist tekst iz renderovanog HTML-a (za pretragu i opise);
   blok tagovi razdvajaju reči, inline tagovi se uklanjaju bez prostora */
const stripTags = (html) => decodeEntities(
  html.replace(/<\/?(p|li|h[1-6]|tr|td|th|table|blockquote|pre|div|ul|ol|hr)[^>]*>/gi, ' ')
      .replace(/<[^>]+>/g, '')
).replace(/\s+/g, ' ').trim();

/* ── prepisivanje veza: relativne → sajtske strane ili GitHub ──── */

/* mapa izvornih .md fajlova → sajtske putanje (napuni se posle definicije sadržaja) */
const sitePageFor = (repoPath) => SITE_MD.get(repoPath) || null;

function normalizeTarget(href, fromDir) {
  if (/^(https?:|mailto:|#)/.test(href)) return { kind: 'external' };
  const anchor = href.includes('#') ? '#' + href.split('#').slice(1).join('#') : '';
  let path = href.split('#')[0];
  if (!path) return { kind: 'external' };
  try { path = decodeURIComponent(path); } catch { /* zadrži original */ }
  const stack = (fromDir + path).split('/');
  const resolved = [];
  for (const part of stack) {
    if (part === '' || part === '.') continue;
    if (part === '..') resolved.pop();
    else resolved.push(part);
  }
  path = resolved.join('/');
  /* veza na direktorijum (npr. radionice/) može doći i bez prateće kose crte */
  const site = sitePageFor(path) || (!path.endsWith('/') ? sitePageFor(path + '/') : null);
  if (site) return { kind: 'site', path: site, anchor };
  return { kind: 'github', url: `${GITHUB_BASE}/blob/main/${path}` };
}

function relUrl(fromDir, toPath) {
  const trailing = toPath.endsWith('/') ? '/' : '';
  const from = fromDir.split('/').filter(Boolean);
  const to = toPath.split('/').filter(Boolean);
  let i = 0;
  while (i < from.length && i < to.length && from[i] === to[i]) i++;
  return '../'.repeat(from.length - i) + to.slice(i).join('/') + trailing;
}

/* relativne veze u .md fajlovima se razrešavaju u odnosu na direktorijum IZVORA,
   a sajtski URL-ovi računaju u odnosu na direktorijum IZLAZA strane */
const srcDirOf = (file) => (file.includes('/') ? file.slice(0, file.lastIndexOf('/') + 1) : '');

function rewriteLinks(html, srcDir, outDir) {
  return html.replace(/href="([^"]+)"/g, (m, href) => {
    const t = normalizeTarget(href, srcDir);
    if (t.kind === 'external') return m;
    if (t.kind === 'github') return `href="${t.url}"`;
    return `href="${relUrl(outDir, t.path)}${t.anchor}"`;
  });
}

/* ── parsiranje dokumenta (naslov, telo, toc, opis) ────────────── */

function parseDoc(file, kind) {
  const raw = readFileSync(join(ROOT, file), 'utf8');
  const titleMatch = raw.match(/^# (.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : file;
  let html = renderMd(raw.replace(/^# .+\n/, ''));
  const { html: withIds, toc } = addHeadingIds(html);
  html = withIds;

  /* prvi pravi pasus (ne naslov, ne meta blok) → meta description;
     poslednja reč se odseca samo ako je pasus stvarno skraćen na 190 znakova */
  const firstPara = stripTags(renderMd(
    raw.split(/\n\n/).slice(1).find((p) => {
      const t = p.trim();
      return t && !t.startsWith('>') && !t.startsWith('#');
    }) || ''));
  let description = firstPara;
  if (description.length > 190) description = description.slice(0, 190).replace(/\s\S*$/, '');

  /* blockquote sa metapodacima (Vreme/Preduslovi) ostaje kao meta panel */
  return { file, kind, title, html, toc, description, raw };
}

/* ── model sadržaja ────────────────────────────────────────────── */

const MODULES = [
  { n: '00', slug: 'uvod-u-agente', title: 'Uvod u agente', tagline: 'šta je agent, zašto sad, kako se uči', vreme: '2–3 časa' },
  { n: '01', slug: 'osnove-llm', title: 'Osnove rada sa LLM-ovima', tagline: 'tokeni, kontekst, prompt kao program', vreme: '5–7 časova' },
  { n: '02', slug: 'alati-tool-use', title: 'Alati', tagline: 'kako agent deluje u svetu', vreme: '4–6 časova' },
  { n: '03', slug: 'agent-od-nule', title: 'Agent od nule', tagline: 'petlja odlučivanja bez frameworka', vreme: '6–8 časova' },
  { n: '04', slug: 'memorija-i-rag', title: 'Memorija i RAG', tagline: 'agent koji zna vaše dokumente', vreme: '6–8 časova' },
  { n: '05', slug: 'inzenjering-konteksta', title: 'Inženjering konteksta', tagline: 'šta agent zna u svakom trenutku', vreme: '5–7 časova' },
  { n: '06', slug: 'protokoli-mcp-a2a', title: 'Protokoli: MCP i A2A', tagline: 'agent povezan sa svetom po ugovoru', vreme: '4–6 časa' },
  { n: '07', slug: 'evaluacija-agenata', title: 'Evaluacija agenata', tagline: 'kako znati da li je agent dobar', vreme: '5–7 časova' },
  { n: '08', slug: 'multi-agent-sistemi', title: 'Multi-agent sistemi', tagline: 'tim agenata koji sarađuje', vreme: '4–6 časa' },
  { n: '09', slug: 'u-produkciju', title: 'U produkciju', tagline: 'bezbednost, opservabilnost, troškovi', vreme: '5–7 časova' },
  { n: '10', slug: 'zavrsni-projekat', title: 'Završni projekat', tagline: 'od ideje do isporučenog agenta', vreme: '8–12 časova' },
].map((m) => ({ ...m, file: `moduli/modul-${m.n}-${m.slug}.md`, dir: `modul/${m.n}-${m.slug}/` }));

const RADIONICE = [
  { n: '01', slug: 'prvi-koraci', file: 'radionice/radionica-01-prvi-koraci.md', dir: 'radionice/01-prvi-koraci/', moduli: ['00', '01'] },
  { n: '02', slug: 'alati-i-tool-use', file: 'radionice/radionica-02-alati-i-tool-use.md', dir: 'radionice/02-alati-i-tool-use/', moduli: ['02'] },
  { n: '03', slug: 'agent-od-nule', file: 'radionice/radionica-03-agent-od-nule.md', dir: 'radionice/03-agent-od-nule/', moduli: ['03'] },
  { n: '04', slug: 'rag-memorija', file: 'radionice/radionica-04-rag-memorija.md', dir: 'radionice/04-rag-memorija/', moduli: ['04'] },
  { n: '05', slug: 'evaluacija', file: 'radionice/radionica-05-evaluacija.md', dir: 'radionice/05-evaluacija/', moduli: ['07'] },
  { n: '06', slug: 'protokoli', file: 'radionice/radionica-06-protokoli.md', dir: 'radionice/06-protokoli/', moduli: ['06'] },
];

/* izvorni .md → sajtska putanja (za prepisivanje veza) */
const SITE_MD = new Map([
  ...MODULES.map((m) => [m.file, m.dir]),
  ...RADIONICE.map((r) => [r.file, r.dir]),
  ['radionice/', 'radionice/'],
  ['REČNIK.md', 'recnik/'],
  ['MAPA-UCENJA.md', 'mapa/'],
  ['README.md', ''],
  ['O-AUTORU.md', 'o-autoru/'],
  ['radionica/PONUDA.md', 'radionica/'],
  ['radionica/ai-agenti-za-dev-timove.md', 'radionica/program/'],
]);

/* ── školjka strane (nav, footer, SEO head) ────────────────────── */

function page({ title, description, body, fromDir = '', type = 'website' }) {
  const asset = (p) => relUrl(fromDir, p);
  const home = fromDir ? relUrl(fromDir, '') : 'index.html';
  const mapaHref = fromDir === 'mapa/' ? './' : relUrl(fromDir, 'mapa/');
  const radioniceHref = fromDir === 'radionice/' ? './' : relUrl(fromDir, 'radionice/');
  const recnikHref = fromDir === 'recnik/' ? './' : relUrl(fromDir, 'recnik/');
  const pretragaHref = fromDir === 'pretraga/' ? './' : relUrl(fromDir, 'pretraga/');
  const canonical = SITE_URL + '/' + fromDir;
  return `<!doctype html>
<html lang="sr-Latn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeAttr(title)}</title>
<meta name="description" content="${escapeAttr(description)}">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="${escapeAttr(title)}">
<meta property="og:description" content="${escapeAttr(description)}">
<meta property="og:type" content="${type}">
<meta property="og:url" content="${canonical}">
<meta property="og:locale" content="sr_Latn">
<meta property="og:site_name" content="AI i agenti na srpskom">
<meta name="twitter:card" content="summary">
<link rel="stylesheet" href="${asset('assets/site.css')}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🤖%3C/text%3E%3C/svg%3E">
</head>
<body data-root="${fromDir ? relUrl(fromDir, '') : ''}">
<a class="skip-link" href="#main">Pređi na sadržaj</a>
<nav class="site-nav" aria-label="Sajt">
  <a class="brand" href="${home}"><span class="logo">🤖</span> AI i agenti na srpskom</a>
  <a href="${mapaHref}">Mapa kursa</a>
  <a href="${radioniceHref}">Radionice</a>
  <a href="${recnikHref}">Rečnik</a>
  <form class="nav-search" action="${pretragaHref}" method="get" role="search">
    <input type="search" name="q" placeholder="Pretraga kursa…" aria-label="Pretraga kursa">
  </form>
  <span class="spacer"></span>
  <a href="${GITHUB_BASE}" rel="noopener">GitHub ↗</a>
</nav>
<main id="main">
${body}
</main>
<footer class="site-footer">
  <span>Sadržaj pod <a href="${GITHUB_BASE}/blob/main/LICENSE" rel="noopener">CC BY 4.0</a> · sajt se generiše iz markdown izvora.</span>
  <span><a href="${relUrl(fromDir, 'radionica/')}">Radionica za dev timove</a> · <a href="${USLUGE_URL}" rel="noopener">Usluge</a> · <a href="${GITHUB_BASE}" rel="noopener">GitHub</a></span>
</footer>
<script src="${asset('assets/site.js')}" defer></script>
</body>
</html>
`;
}

const chip = (text, cls = '') => `<span class="chip ${cls}">${text}</span>`;

/* ── strane dokumenata ─────────────────────────────────────────── */

const tocHtml = (toc, label = 'Na ovoj strani') =>
  toc.length
    ? `<nav class="toc" aria-label="Sadržaj strane"><div class="toc-title">${label}</div><ol>${toc
        .map((t) => `<li><a href="#${t.id}">${t.text}</a></li>`).join('')}</ol></nav>`
    : '';

const sourceLine = (file, fromDir) =>
  `<p class="source-line">Izvor: <a href="${GITHUB_BASE}/blob/main/${file}" rel="noopener">${file} na GitHubu ↗</a></p>`;

const pagerNav = (prev, next, fromDir, labelSg) => `<div class="pager">
  ${prev ? `<a href="${relUrl(fromDir, prev.dir)}"><span class="dir">← Prethodni${labelSg ? ' ' + labelSg : ''}</span>${escapeAttr(prev.title)}</a>` : '<span></span>'}
  ${next ? `<a class="pager-next" href="${relUrl(fromDir, next.dir)}"><span class="dir">Sledeći${labelSg ? ' ' + labelSg : ''} →</span>${escapeAttr(next.title)}</a>` : '<span></span>'}
</div>`;

function docPage(doc, { fromDir, prev, next, pagerLabel, extraHead = '' }) {
  const body = `<div class="page article-layout">
${tocHtml(doc.toc)}
<div>
  <header class="article-header">
    <h1>${escapeAttr(doc.title)}</h1>
    ${extraHead}
  </header>
  <article>
${rewriteLinks(doc.html, srcDirOf(doc.file), fromDir)}
  </article>
  ${sourceLine(doc.file, fromDir)}
  ${pagerNav(prev, next, fromDir, pagerLabel)}
</div>
</div>`;
  return {
    path: `${fromDir}index.html`,
    html: page({ title: `${doc.title} — AI i agenti na srpskom`, description: doc.description, body, fromDir, type: 'article' }),
    searchDoc: { url: fromDir, title: doc.title, kind: doc.kind, text: stripTags(doc.html) },
  };
}

/* module: prvi blockquote (Vreme/Preduslovi) postaje meta panel */
function modulePage(m, prev, next) {
  const doc = parseDoc(m.file, 'modul');
  return docPage(doc, {
    fromDir: m.dir, prev, next, pagerLabel: 'modul',
    extraHead: `<div class="meta-chips">${chip(`modul ${m.n}`, 'modnum')}${chip(`⏱ ${m.vreme}`)}</div>`,
  });
}

function radionicaPage(r, prev, next) {
  const doc = parseDoc(r.file, 'radionica');
  const moduliChips = r.moduli
    .map((n) => MODULES.find((x) => x.n === n))
    .filter(Boolean)
    .map((mm) => `<a class="chip modnum chip-link" href="${relUrl(r.dir, mm.dir)}">modul ${mm.n}</a>`)
    .join('');
  return docPage(doc, {
    fromDir: r.dir, prev, next, pagerLabel: '',
    extraHead: `<div class="meta-chips">${chip(`radionica ${r.n}`, 'modnum')}${moduliChips}</div>`,
  });
}

/* prosta strana bez brojača (mapa, rečnik, autor, ponuda, program) */
function simplePage(file, kind, fromDir, extraHead = '', label = 'Na ovoj strani') {
  const doc = parseDoc(file, kind);
  const body = `<div class="page article-layout">
${tocHtml(doc.toc, label)}
<div>
  <header class="article-header">
    <h1>${escapeAttr(doc.title)}</h1>
    ${extraHead}
  </header>
  <article class="searchable" data-searchable="${kind === 'recnik' ? '1' : ''}">
${rewriteLinks(doc.html, srcDirOf(file), fromDir)}
  </article>
  ${sourceLine(file, fromDir)}
</div>
</div>`;
  return {
    path: `${fromDir}index.html`,
    html: page({ title: `${doc.title} — AI i agenti na srpskom`, description: doc.description, body, fromDir, type: 'article' }),
    searchDoc: { url: fromDir, title: doc.title, kind, text: stripTags(doc.html) },
  };
}

/* ── indeks radionica ──────────────────────────────────────────── */

function radioniceIndexPage() {
  const docs = RADIONICE.map((r) => ({ r, doc: parseDoc(r.file, 'radionica') }));
  const items = docs.map(({ r, doc }) => {
    const teaser = doc.description.length > 160 ? doc.description.slice(0, 157).replace(/\s\S*$/, '') + '…' : doc.description;
    const moduli = r.moduli.map((n) => `modul ${n}`).join(' · ');
    return `<a class="dive-card" href="${relUrl('radionice/', r.dir)}">
  <span class="dc-name">Radionica ${r.n} — ${escapeAttr(doc.title.replace(/^Radionica \d+ — /, ''))}</span>
  <span class="dc-headline">${escapeAttr(teaser)}</span>
  <span class="dc-meta">${chip(moduli, 'modnum')}</span>
</a>`;
  }).join('\n');

  const body = `<div class="page">
<section class="hero hero-compact">
  <div class="kicker">Praktične radionice kursa</div>
  <h1>Radionice</h1>
  <p class="tagline">Šest radionica od po sat vremena: uživo vođen prolaz kroz ključne module, sa rešenjima vežbi. Svaka radi samostalno — potrebni su samo osnovni Python i (za neke vežbe) API ključ.</p>
</section>
<section class="cta-banner" aria-label="Radionica za timove">
  <div>
    <h2>Za dev timove: „AI agenti za dev timove" — 2 časa, 80% prakse</h2>
    <p>Komercijalna radionica za ceo tim (4–12 učesnika): petlja agenta, evaluacioni skup, višeagentski scenario — materijali ostaju timu (CC BY 4.0).</p>
  </div>
  <a class="btn btn-primary" href="${relUrl('radionice/', 'radionica/')}">Vidi ponudu</a>
</section>
<section class="home-section">
  <div class="dive-grid">
${items}
  </div>
</section>
</div>`;
  return {
    path: 'radionice/index.html',
    html: page({
      title: 'Radionice — AI i agenti na srpskom',
      description: 'Šest besplatnih radionica kursa (po sat vremena, sa rešenjima vežbi) i komercijalna radionica „AI agenti za dev timove" za razvojne timove.',
      body, fromDir: 'radionice/',
    }),
    searchDoc: { url: 'radionice/', title: 'Radionice (indeks)', kind: 'stranica', text: 'šest besplatnih radionica kursa sa rešenjima vežbi: prvi koraci, alati i tool use, agent od nule, memorija i RAG, evaluacija, protokoli' },
  };
}

/* ── početna strana ────────────────────────────────────────────── */

function extractSection(md, headingRe) {
  const m = md.match(headingRe);
  if (!m) return '';
  const after = md.slice(m.index + m[0].length);
  const next = after.search(/^##? /m);
  return renderMd((next === -1 ? after : after.slice(0, next)).trim());
}

function homePage() {
  const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
  const whySection = extractSection(readme, /^## Zašto ovaj repozitorijum postoji\n/m);
  const startSection = extractSection(readme, /^## Odakle da krenem\?\n/m);

  const rows = MODULES.map((m) => {
    const rad = RADIONICE.find((r) => r.moduli.includes(m.n));
    return `<a class="dive-card" href="${m.dir}">
  <span class="dc-name">${chip(m.n, 'modnum')} ${escapeAttr(m.title)}</span>
  <span class="dc-headline">${escapeAttr(m.tagline)}</span>
  <span class="dc-meta">${chip(`⏱ ${m.vreme}`)}${rad ? chip(`radionica ${rad.n}`, 'chip-link') : ''}</span>
</a>`;
  }).join('\n');

  const body = `<div class="page">
<section class="hero">
  <div class="kicker">Kompletan kurs · 11 modula · CC BY 4.0</div>
  <h1>AI i agenti na srpskom</h1>
  <p class="tagline">Od prvog poziva API-ju do sopstvenog agenta u produkciji — praktičan kurs za developere, sa vežbama na svakom koraku, radionicama i rečnikom pojmova. Bez kopiranja, bez prevoda tuđeg gradiva.</p>
  <div class="cta">
    <a class="btn btn-primary" href="modul/00-uvod-u-agente/">Kreni od modula 00</a>
    <a class="btn btn-ghost" href="#moduli">Mapa kursa</a>
    <a class="btn btn-ghost" href="pretraga/">Pretraga kursa</a>
  </div>
</section>

<section class="cta-banner" aria-label="Radionica za dev timove">
  <div>
    <h2>Treba vam timski start? Radionica „AI agenti za dev timove"</h2>
    <p>Dva časa, 80% prakse, 4–12 učesnika: tim sam piše petlju agenta, evaluacioni skup i višeagentski scenario. Materijali ostaju timu (CC BY 4.0).</p>
  </div>
  <a class="btn btn-primary" href="radionica/">Vidi ponudu</a>
  <a class="btn btn-ghost" href="${USLUGE_URL}" rel="noopener">Druge usluge ↗</a>
</section>

<section class="home-section" id="moduli">
  <h2>Moduli</h2>
  <p style="color:var(--ink-soft)">Jedanaest modula od uvoda do završnog projekta — svaki sa vežbama i procenom vremena. Detaljna mapa sa ishodima i preduslovima: <a href="mapa/">mapa učenja</a>.</p>
  <div class="dive-grid">
${rows}
  </div>
</section>

<section class="home-section" id="radionice">
  <h2>Radionice</h2>
  <p style="color:var(--ink-soft)">Šest besplatnih radionica (po sat vremena, sa rešenjima) vodi kroz ključne module: <a href="radionice/">vidi sve radionice</a>.</p>
</section>

<section class="home-section">
  <h2>Zašto ovaj kurs postoji</h2>
  <div class="readable">
${rewriteLinks(whySection, '', '')}
  </div>
</section>

<section class="home-section">
  <h2>Odakle da krenem?</h2>
  <div class="readable">
${rewriteLinks(startSection, '', '')}
  </div>
</section>

<section class="home-section">
  <h2>Rečnik pojmova</h2>
  <p style="color:var(--ink-soft)">Sto i više termina na srpskom sa engleskim originalom: <a href="recnik/">pretraživi rečnik</a>. Autor kursa: <a href="o-autoru/">o autoru</a>.</p>
</section>
</div>`;

  return {
    path: 'index.html',
    html: page({
      title: 'AI i agenti na srpskom — kompletan praktičan kurs za developere',
      description: 'Kompletan kurs o izgradnji AI agenata na srpskom: 11 modula od prvog poziva API-ju do produkcije, vežbe, radionice i rečnik pojmova. CC BY 4.0.',
      body, fromDir: '',
    }),
    searchDoc: { url: '', title: 'AI i agenti na srpskom (početna)', kind: 'stranica', text: 'kompletan praktičan kurs o izgradnji AI agenata na srpskom za developere: moduli, vežbe, radionice, rečnik pojmova, produkcija, evaluacija, RAG, protokoli MCP A2A' },
  };
}

/* ── strana pretrage ───────────────────────────────────────────── */

function pretragaPage() {
  const body = `<div class="page page-narrow">
<section class="hero hero-compact">
  <div class="kicker">Pretraga celog kursa</div>
  <h1>Pretraga</h1>
  <p class="tagline">Traži po svim modulima, radionicama i rečniku. Radi bez obzira na dijakritike — „recnik" nalaže „REČNIK".</p>
</section>
<section class="search-section">
  <form class="search-big" role="search">
    <input type="search" id="q" name="q" placeholder="npr. petlja agenta, kontekstni prozor, tool call…" aria-label="Upit pretrage" autofocus>
  </form>
  <p class="search-status" id="status" role="status" aria-live="polite"></p>
  <div id="results"></div>
  <noscript><p>Za pretragu je potreban JavaScript — sadržaj je uvek dostupan kroz <a href="${relUrl('pretraga/', 'mapa/')}">mapu kursa</a> i <a href="${relUrl('pretraga/', 'recnik/')}">rečnik</a>.</p></noscript>
</section>
</div>`;
  return {
    path: 'pretraga/index.html',
    html: page({
      title: 'Pretraga — AI i agenti na srpskom',
      description: 'Pretraga celog kursa o AI agentima na srpskom: moduli, radionice, rečnik pojmova.',
      body, fromDir: 'pretraga/',
    }),
  };
}

/* ── generisanje izlaza ────────────────────────────────────────── */

const pages = [
  ...MODULES.map((m, i) => modulePage(m, MODULES[i - 1], MODULES[i + 1])),
  ...RADIONICE.map((r, i) => radionicaPage(r, RADIONICE[i - 1], RADIONICE[i + 1])),
  radioniceIndexPage(),
  simplePage('MAPA-UCENJA.md', 'stranica', 'mapa/', '', 'Sadržaj mape'),
  simplePage('REČNIK.md', 'recnik', 'recnik/',
    '<div class="meta-chips"><input type="search" id="recnik-filter" class="filter-input" placeholder="Filtriraj pojmove… (npr. token, RAG, agent)" aria-label="Filtriraj pojmove rečnika"></div>', 'Sekcije rečnika'),
  simplePage('O-AUTORU.md', 'stranica', 'o-autoru/'),
  simplePage('radionica/PONUDA.md', 'stranica', 'radionica/',
    `<div class="meta-chips">${chip('2 časa')}${chip('4–12 učesnika')}${chip('online ili uživo')}</div>`),
  simplePage('radionica/ai-agenti-za-dev-timove.md', 'stranica', 'radionica/program/',
    `<p class="lead" style="margin:0"><a href="${relUrl('radionica/program/', 'radionica/')}">← Nazad na ponudu</a></p>`),
  pretragaPage(),
  homePage(),
];

const outputs = new Map();
const searchDocs = [];
for (const p of pages) {
  outputs.set(p.path, p.html);
  if (p.searchDoc) searchDocs.push(p.searchDoc);
}

outputs.set('search-index.json', JSON.stringify(searchDocs));
outputs.set('assets/site.css', readFileSync(join(ROOT, 'site/assets/site.css'), 'utf8'));
outputs.set('assets/site.js', readFileSync(join(ROOT, 'site/assets/site.js'), 'utf8'));

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...pages.map((p) => p.path.replace(/index\.html$/, ''))]
  .map((u) => `  <url><loc>${SITE_URL}/${u}</loc></url>`).join('\n')}
</urlset>
`;
outputs.set('sitemap.xml', sitemap);
outputs.set('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`);
outputs.set('.nojekyll', '');

const DOCS = join(ROOT, 'docs');
if (CHECK) {
  let ok = true;
  for (const [path, content] of outputs) {
    const file = join(DOCS, path);
    if (!existsSync(file) || readFileSync(file, 'utf8') !== content) {
      console.error(`STALE: docs/${path}`);
      ok = false;
    }
  }
  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const f of readdirSync(dir)) {
      const full = join(dir, f);
      if (statSync(full).isDirectory()) walk(full);
      else if (!outputs.has(relative(DOCS, full))) { console.error(`EXTRA: docs/${relative(DOCS, full)}`); ok = false; }
    }
  };
  walk(DOCS);
  if (!ok) { console.error('docs/ nije svež — pokreni: npm run build'); process.exit(1); }
  console.log(`docs/ je svež (${outputs.size} fajlova).`);
} else {
  rmSync(DOCS, { recursive: true, force: true });
  for (const [path, content] of outputs) {
    const file = join(DOCS, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, content);
  }
  console.log(`Upisano ${outputs.size} fajlova u docs/.`);
}

/* ── dev server ────────────────────────────────────────────────── */

if (SERVE) {
  const { createServer } = await import('node:http');
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.json': 'application/json', '.xml': 'application/xml' };
  createServer((req, res) => {
    let p = req.url.split('?')[0];
    if (p.endsWith('/')) p += 'index.html';
    try {
      res.setHeader('Content-Type', types[p.slice(p.lastIndexOf('.'))] || 'text/plain');
      res.end(readFileSync(join(DOCS, decodeURIComponent(p.replace(/^\//, '')))));
    } catch { res.statusCode = 404; res.end('nije nađeno'); }
  }).listen(8093, () => console.log('docs/ se servira na http://localhost:8093'));
  let timer;
  const rebuild = () => {
    clearTimeout(timer);
    timer = setTimeout(() => spawn(process.execPath, [join(ROOT, 'site/build.mjs')], { stdio: 'inherit' }), 150);
  };
  for (const dir of [join(ROOT, 'moduli'), join(ROOT, 'radionice'), join(ROOT, 'radionica'), join(ROOT, 'site/assets'),
    join(ROOT, 'README.md'), join(ROOT, 'MAPA-UCENJA.md'), join(ROOT, 'REČNIK.md'), join(ROOT, 'O-AUTORU.md')]) {
    if (existsSync(dir)) watch(dir, { recursive: true }, rebuild);
  }
}
