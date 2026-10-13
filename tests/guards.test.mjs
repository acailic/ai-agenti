#!/usr/bin/env node
/* Guard testovi repozitorijuma (node --test, bez spoljnih zavisnosti).
 *
 * 1. Čistoća docs/: docs/ je generisan izlaz — site/build.mjs ga briše
 *    rmSync-om i upisuje iznova samo svoje poznate fajlove. Svaki izvorni
 *    markdown/asset posvećen pod docs/ bi TIHO NESTAO pri sledećoj
 *    regeneraciji sajta (zamka gubitka podataka; tako je PR #8 izgubio
 *    promocija/ izvore, popravljeno u PR #10 premeštanjem u root).
 *    Test pada ako build prijavljuje EXTRA fajlove pod docs/ — dakle bilo
 *    šta što build ne generiše, uključujući rukom dodate izvore.
 *
 * 2. Interni linkovi: relativni linkovi između modula, radionica i korenskih
 *    .md fajlova moraju resolving-ovati — ciljni fajl/direktorijum postoji,
 *    a sidro (#...) pokazuje na stvaran naslov ciljnog fajla. Ograde koda
 *    (```/~~~) i inline kod se PRVO skidaju: linkovi unutar koda su lažni
 *    pogoci (npr. FUNKCIJE[...](**argumenti) u python vežbama).
 *
 *    Sidra se prihvataju u obe konvencije koje repo koristi: sajtski slug
 *    (dijakritike u ASCII, „š"→„s") i GitHub slug (dijakritike ostaju),
 *    jer se izvori renderuju i na sajtu i na GitHubu.
 *
 * Pokretanje: npm test  (deo npm run check i CI lanca — .github/workflows/ci.yml)
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { slugify } from '../site/slug.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

/* ── skup izvora koji se proverava ─────────────────────────────── */
/* sav sadržaj koji sajt renderuje (moduli, radionice, radionica/, korenski
   .md); promocija/ su draftovi za spoljne objave i ne renderuju se na sajtu */

const SRC_DIRS = ['moduli', 'radionice', 'radionica'];
const SRC_FILES = [
  'README.md', 'MAPA-UCENJA.md', 'REČNIK.md', 'O-AUTORU.md', 'CONTRIBUTING.md',
];

const SOURCES = [
  ...SRC_DIRS.flatMap((d) =>
    readdirSync(join(ROOT, d)).filter((f) => f.endsWith('.md')).map((f) => `${d}/${f}`)),
  ...SRC_FILES,
].sort();

/* ── skidanje koda pre bilo kakve ekstrakcije ──────────────────── */

function stripCode(md) {
  let inFence = false;
  const lines = md.split('\n').map((line) => {
    if (/^\s*(`{3,}|~{3,})/.test(line)) { inFence = !inFence; return ''; }
    return inFence ? '' : line;
  });
  return lines.join('\n').replace(/`[^`\n]*`/g, ' ');
}

/* ── naslovi fajla → skup prihvatljivih sidara ─────────────────── */

/* čist tekst naslova: [tekst](url) → tekst; zvezdice, podvlake, backtick i html tagovi nestaju */
const cleanHeading = (s) => s
  .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/<[^>]+>/g, '')
  .replace(/[*_`]+/g, '')
  .trim();

/* GitHub konvencija: mala slova, interpunkcija ven, razmak → -, dijakritike ostaju */
const githubSlug = (s) =>
  s.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s+/g, '-');

function headingSlugs(mdStripped) {
  const slugs = new Set();
  const lines = mdStripped.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const atx = lines[i].match(/^#{1,6}\s+(.+?)\s*#*\s*$/);
    if (atx) {
      const t = cleanHeading(atx[1]);
      slugs.add(slugify(t));
      slugs.add(githubSlug(t));
      continue;
    }
    const setext = lines[i].match(/^ {0,3}(={3,}|-{3,})\s*$/);
    if (setext && i > 0) {
      const prev = lines[i - 1].trim();
      if (prev && !/^#{1,6}\s/.test(prev) && !/^[`>*]|^\d+\./.test(prev)) {
        const t = cleanHeading(prev);
        slugs.add(slugify(t));
        slugs.add(githubSlug(t));
      }
    }
  }
  return slugs;
}

/* keš: fajl → (stripped sadržaj, sidra) — REČNIK i moduli su česti ciljevi */
const parsed = new Map();
function parsedOf(file) {
  if (!parsed.has(file)) {
    const stripped = stripCode(readFileSync(join(ROOT, file), 'utf8'));
    parsed.set(file, { stripped, slugs: headingSlugs(stripped) });
  }
  return parsed.get(file);
}

/* ── guard 1: docs/ sme da sadrži samo izlaz builda ────────────── */

test('docs/ sadrži samo fajlove koje build generiše (data-loss guard)', () => {
  const r = spawnSync(process.execPath, ['site/build.mjs', '--check'], { cwd: ROOT, encoding: 'utf8' });
  assert.ok(!r.error, `node site/build.mjs --check se nije ni pokrenuo: ${r.error}`);

  const out = (r.stdout || '') + (r.stderr || '');
  const extra = [...out.matchAll(/^EXTRA: (.+)$/gm)].map((m) => m[1]);
  if (extra.length) {
    assert.fail(
      `Izvorni fajl(ovi) žive pod generisanim docs/:\n  ${extra.join('\n  ')}\n` +
      'docs/ build briše rmSync-om pri svakoj regeneraciji — ovi fajlovi bi bili ' +
      'izgubljeni (data-loss zamka). Premesti izvor van docs/ (kao promocija/ u ' +
      'PR #10), pa regeneriši: npm run build');
  }
  assert.equal(r.status, 0,
    `docs/ nije tačan izlaz builda (STALE iznad?). Regeneriši: npm run build\n${out.trim()}`);
});

/* ── guard 2: interni linkovi resolving-uju ────────────────────── */

test('interni linkovi između izvora resolving-uju (fajl + sidro)', () => {
  const problems = [];
  /* inline link [tekst](cilj), bez slika ![alt](src) i bez naslova u cilju */
  const LINK_RE = /(?<!!)\[[^\]]*\]\(\s*([^)\s]+)(?:\s+"[^"]*")?\s*\)/g;

  for (const file of SOURCES) {
    const { stripped, slugs: ownSlugs } = parsedOf(file);
    stripped.split('\n').forEach((line, idx) => {
      for (const m of line.matchAll(LINK_RE)) {
        const raw = m[1];
        const where = `${file}:${idx + 1}`;

        if (/^(https?:|mailto:)/i.test(raw)) continue; // spoljašnje

        /* čisti sidro → naslov u ovom fajlu */
        if (raw.startsWith('#')) {
          const anchor = raw.slice(1);
          if (!ownSlugs.has(anchor)) problems.push(`${where} → ${raw} — sidro nije naslov fajla ${file}`);
          continue;
        }

        const [rawPath, ...rest] = raw.split('#');
        const anchor = rest.join('#') || null;
        let p;
        try { p = decodeURIComponent(rawPath); } catch { p = rawPath; }
        const resolved = normalize(join(dirname(file), p));
        const full = join(ROOT, resolved);
        if (!existsSync(full)) { problems.push(`${where} → ${raw} — cilj ne postoji: ${resolved}`); continue; }

        /* sidro u .md cilju (isti slug algoritam kao sajt + GitHub varijanta) */
        if (anchor && resolved.endsWith('.md') && statSync(full).isFile()) {
          if (!parsedOf(resolved).slugs.has(anchor)) {
            problems.push(`${where} → ${raw} — sidro nije naslov cilja ${resolved}`);
          }
        }
      }
    });
  }

  assert.deepEqual(problems, [],
    `Pokvarenih internih linkova: ${problems.length}\n  ${problems.join('\n  ')}`);
});
