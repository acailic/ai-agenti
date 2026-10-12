/* ai-agenti-srb — pretraga sajta i filter rečnika (čist JS, bez zavisnosti).
   Sve radi klijentski: indeks se generiše pri buildu (docs/search-index.json). */

(() => {
  'use strict';

  /* normalizacija za pretragu: svaki znak nezavisno (dijakritika 1:1, ostalo
     u razmak) — dužina ostaje ista, pa su indeksi u savijenom tekstu istovremeno
     i indeksi u originalnom; bez sabijanja „dj" u „d" */
  const fold = (s) =>
    String(s).toLowerCase()
      .replace(/[čć]/g, 'c').replace(/ž/g, 'z').replace(/š/g, 's').replace(/đ/g, 'd')
      .replace(/[^a-z0-9]/g, ' ');
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* ── pretraga sajta (/pretraga/) ─────────────────────────────── */

  const qInput = document.getElementById('q');
  const resultsEl = document.getElementById('results');
  const statusEl = document.getElementById('status');

  if (qInput && resultsEl) {
    const root = document.body.dataset.root || '';
    let index = null;

    const fetchIndex = () =>
      index ? Promise.resolve(index) : fetch(root + 'search-index.json').then((r) => r.json())
        .then((docs) => { index = docs; return docs; });

    /* isečak oko pogotka: fold je po-znakovni, pa su indeksi u savijenom
       tekstu ujedno i indeksi u originalnom — rez i oznake su tačni */
    const snippet = (text, tokens, hit) => {
      const start = hit >= 0 ? Math.max(0, hit - 80) : 0;
      const end = Math.min(text.length, hit >= 0 ? hit + 140 : 140);
      const raw = (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
      const seg = fold(raw);
      let out = '';
      let i = 0;
      while (i < raw.length) {
        let best = -1, bestLen = 0;
        for (const t of tokens) {
          const at = seg.indexOf(t, i);
          if (at !== -1 && (best === -1 || at < best)) { best = at; bestLen = t.length; }
        }
        if (best === -1) { out += esc(raw.slice(i)); break; }
        out += esc(raw.slice(i, best)) + '<mark>' + esc(raw.slice(best, best + bestLen)) + '</mark>';
        i = best + bestLen;
      }
      return out;
    };

    const search = () => {
      const tokens = qInput.value.trim() ? fold(qInput.value).split(/\s+/).filter((t) => t.length > 1) : [];
      if (!tokens.length) {
        resultsEl.innerHTML = '';
        if (statusEl) statusEl.textContent = 'Unesite pojam — npr. „petlja agenta".';
        return;
      }
      fetchIndex().then((docs) => {
        const hits = [];
        for (const d of docs) {
          const hay = fold(d.title + ' ' + d.kind + ' ' + d.text);
          const counts = tokens.map((t) => hay.split(t).length - 1);
          if (counts.some((c) => c === 0)) continue;
          const score = counts.reduce((a, b) => a + b, 0) + (fold(d.title).includes(tokens[0]) ? 5 : 0);
          const hitAt = fold(d.text).indexOf(tokens[0]);
          hits.push({ d, score, hitAt });
        }
        hits.sort((a, b) => b.score - a.score);
        if (statusEl) statusEl.textContent = `${hits.length} ${hits.length === 1 ? 'rezultat' : 'rezultata'} za „${qInput.value}".`;
        resultsEl.innerHTML = hits.slice(0, 30).map(({ d, hitAt }) =>
          `<div class="search-result"><div class="sr-title"><a href="${(document.body.dataset.root || '') + d.url}">${esc(d.title)}</a>` +
          `<span class="sr-kind">${esc(d.kind)}</span></div><div class="sr-snippet">${snippet(d.text, tokens, hitAt)}</div></div>`
        ).join('');
      }).catch(() => { if (statusEl) statusEl.textContent = 'Indeks pretrage nije dostupan.'; });
    };

    const initial = new URLSearchParams(location.search).get('q') || '';
    if (initial) qInput.value = initial;
    let deb;
    qInput.addEventListener('input', () => { clearTimeout(deb); deb = setTimeout(search, 120); });
    search();
  }

  /* ── filter rečnika (/recnik/) ───────────────────────────────── */

  const filter = document.getElementById('recnik-filter');
  const searchable = document.querySelector('[data-searchable="1"]');

  if (filter && searchable) {
    const status = document.createElement('p');
    status.className = 'search-status';
    filter.after(status);
    const rows = [...searchable.querySelectorAll('tbody tr')];
    const headings = [...searchable.querySelectorAll('h2')];

    const apply = () => {
      const tokens = filter.value.trim() ? fold(filter.value).split(/\s+/).filter((t) => t.length > 1) : [];
      let shown = 0;
      for (const tr of rows) {
        const hay = fold(tr.textContent);
        const ok = !tokens.length || tokens.every((t) => hay.includes(t));
        tr.toggleAttribute('data-filter-hide', !ok);
        if (ok) shown++;
      }
      for (const h of headings) {
        let el = h.nextElementSibling, anyVisible = false;
        while (el && !/^H[12]$/.test(el.tagName)) {
          if (el.tagName === 'TABLE' && el.querySelector('tbody tr:not([data-filter-hide])')) anyVisible = true;
          el = el.nextElementSibling;
        }
        h.toggleAttribute('data-filter-hide', !anyVisible && tokens.length > 0);
      }
      status.textContent = tokens.length ? `${shown} ${shown === 1 ? 'pojam' : 'pojmova'} odgovara filtru.` : '';
    };
    filter.addEventListener('input', apply);
  }
})();
