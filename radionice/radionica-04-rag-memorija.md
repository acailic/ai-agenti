# Radionica 04 — Memorija i RAG: agent koji zna vaše dokumente

> **Povezani modul:** [modul 04 — Memorija i RAG](../MAPA-UCENJA.md)
> **Trajanje:** 4 časa · **Format:** predavanje 30% / vežbe 70% · **Nivo: srednji**

## Cilj radionice

Učesnici grade mini pretraživač nad sopstvenim dokumentima: dele tekst na delove, računaju ugnežđene reprezentacije (eng. *embeddings*), čuvaju ih u vektorskoj bazi (eng. *vector database*) i sastavljaju cevovod (eng. *pipeline*) RAG (eng. *retrieval-augmented generation*): pitanje → pretraga → relevantni odlomci u kontekst → odgovor sa navođenjem izvora. Kroz to shvataju i granice: kada RAG pomaže, a kada samo doda sloj koji pravi nove greške.

## Agenda po satima

| Sat | Sadržaj |
|---|---|
| **1. sat** | Zašto „model ne zna" naše stvari (15 min). Ugnežđene reprezentacije — intuicija: slično značenje = blizu u prostoru brojeva (30 min). Arhitektura RAG-a na crtežu: indeksiranje vs. upit (15 min). |
| **2. sat** | Vežba 1: deljenje teksta na odlomke (eng. *chunking*) — veličina, preklapanje, zašto to uopšte ima značaja (30 min). Vežba 2: ugnežđivanje odlomaka i čuvanje u lokalnu vektorsku bazu (30 min). |
| **3. sat** | Vežba 3: pretraga po sličnosti za korisničko pitanje + sastavljanje prompta sa nađenim odlomcima (50 min). Kratko: navođenje izvora u odgovoru — zašto je obavezno (10 min). |
| **4. sat** | Vežba 4: testiranje granica — pitanja na koja dokumenti nemaju odgovor; koliko je model „siguran" kad nema izvora (30 min). Diskusija: RAG nije rešenje za sve — memorija, sažimanje, klasična baza (20 min). Zatvaranje (10 min). |

## Vežbe

1. **Deljenje teksta (30 min):** jedan duži dokument (npr. pravilnik) → odlomci od ~300 tokena sa preklapanjem; uporediti na pragu rečenice naspram fiksne dužine.
2. **Indeks (30 min):** izračunati ugnežđene reprezentacije za sve odlomke; sačuvati ( SQLite + numeričke kolone sasvim dovoljno za radionicu); provera „sličnosti" dva odlomka ručno.
3. **Upit (50 min):** za pitanje korisnika — ugnežđivanje pitanja, pretraga k-najbližih, slaganje prompta sa citatima; odgovor obavezno sa izvorom („prema odlomku #4…").
4. **Granice (30 min):** pitanja bez pokrića u dokumentima — šta odgovara model? Dodati ograničenje „ako nema izvora, reci otvoreno".

## Domaći

- Ugraditi RAG u agenta iz radionice 03 kao alat `trazi_u_dokumentima` — agent sada sam odlučuje kada da pretražuje.
- Meriti: za 10 pitanja upisati da li je odgovor tačan / izmišljen / nedovoljan — prvi mali evaluacioni skup (najava modula 07).
- Za napredne: eksperimentisati sa veličinom odlomaka (100 vs 500 tokena) i zapisati utisak.

## Materijali — checklist za učesnike

- [ ] odrađene radionice 01–03 (radna petlja agenta je dobar kontekst, ali nije uslov);
- [ ] sopstveni dokument za indeksiranje: PDF ili tekst od 5+ stranica (pravilnik, uputstvo, diplomski 🙂);
- [ ] API pristup koji podržava ugnežđivanja (embedding endpoint; z.ai/GLM nudi, ili drugi provajder po izboru);
- [ ] Python 3.10+; `numpy` instaliran.

## Za voditelja

- Cilj radionice je *razumevanje cevovoda*, ne brzina: svesno koristimo „glupu" lokalnu bazu umesto gotovih servisa, da bi se svaki korak video.
- Pripremiti „pokvareni" dokument (protivrečne stavke) za vežbu 4 — granice se najbolje uče na primeru koji pukne načas.
