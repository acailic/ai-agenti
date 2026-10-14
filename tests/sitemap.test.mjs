#!/usr/bin/env node
/* Guard test pokrivenosti sitemap.xml (node --test, bez spoljnih zavisnosti).
 *
 * 3. Sitemap pokrivenost: sitemap.xml mora da sadrži SVAKU stranicu koju
 *    build isporuči. Stranice se ne nabrajaju ručno (moduli 00–10, radionice,
 *    mapa, početna…): test šeta docs/ — tačno ono što GitHub Pages servira —
 *    pa pokriva i svaku buduću stranicu. Dodavanje stranice bez sitemap
 *    unosa obara test (mutation provera), a ni višak ni duplikat <loc>
 *    unosa nije dozvoljen.
 *
 *    Osnovni URL sajta se izvodi iz robots.txt (Sitemap: linija) — jedini
 *    izvor istine ostaje site/build.mjs, testovi ga ne ponavljaju.
 *
 *    Test čita komitovan docs/ i ne rebuilduje ga sam: svežinu garantuje
 *    guard 1 iz guards.test.mjs (build --check) u istom `npm test` pozivu,
 *    a CI pokreće isti lanac preko npm run check.
 *
 * Pokretanje: npm test  (deo npm run check i CI lanca — .github/workflows/ci.yml)
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DOCS = join(ROOT, 'docs');

/* ── otkrivanje objavljenih stranica ───────────────────────────── */

/* svaka objavljena HTML stranica: docs/index.html → '', a
 * docs/modul/00-uvod-u-agente/index.html → 'modul/00-uvod-u-agente/'.
 * Budući ne-index .html fajl ispliva sa punom relativnom putanjom, pa ga
 * test pokrivenosti sili da se namenski objavi (i uđe u sitemap). */
function discoverPages() {
  const pages = [];
  const walk = (dir) => {
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, f.name);
      if (f.isDirectory()) walk(full);
      else if (f.name.endsWith('.html')) {
        const rel = relative(DOCS, full).split('\\').join('/');
        const urlDir =
          rel === 'index.html' ? '' : rel.endsWith('/index.html') ? rel.slice(0, -'index.html'.length) : rel;
        pages.push({ rel, urlDir });
      }
    }
  };
  walk(DOCS);
  pages.sort((a, b) => a.urlDir.localeCompare(b.urlDir));
  return pages;
}

/* osnovni URL sajta iz robots.txt — Sitemap: linija je javni zapis baze */
function siteBase() {
  const robots = readFileSync(join(DOCS, 'robots.txt'), 'utf8');
  const m = robots.match(/^Sitemap:\s+(\S+)\/sitemap\.xml$/m);
  if (!m) throw new Error('robots.txt nema „Sitemap: <baza>/sitemap.xml" liniju');
  return m[1];
}

const pageUrl = (base, urlDir) => `${base}/${urlDir}`;

/* ── guard 3: sitemap pokriva sve objavljene stranice ───────────── */

test('sitemap.xml pokriva svaku objavljenu stranicu — bez nedostajućih, viška i duplikata', () => {
  const base = siteBase();
  const xml = readFileSync(join(DOCS, 'sitemap.xml'), 'utf8');
  assert.match(xml, /<urlset xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/,
    'sitemap.xml: nedostaje <urlset> sa ispravnom šemom');

  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.ok(locs.length > 0, 'sitemap.xml nema nijedan <loc> unos');
  assert.equal(new Set(locs).size, locs.length, 'sitemap.xml ima duplikat <loc> unosa');

  const pages = discoverPages();
  assert.ok(pages.length > 0, 'docs/ nema nijednu HTML stranicu');

  const pageUrls = new Set(pages.map((p) => pageUrl(base, p.urlDir)));
  const missing = pages.filter((p) => !locs.includes(pageUrl(base, p.urlDir)));
  assert.deepEqual(missing, [],
    `Objavljene stranice kojih nema u sitemap.xml (ubaci ih u pages niz builda, da uđu u sitemap):\n  ${
      missing.map((p) => `docs/${p.rel} → ${pageUrl(base, p.urlDir)}`).join('\n  ')}`);

  const extra = locs.filter((l) => !pageUrls.has(l));
  assert.deepEqual(extra, [],
    `<loc> unosi bez stranice pod docs/ (zastareo sitemap ili pogrešan URL):\n  ${extra.join('\n  ')}`);
});
