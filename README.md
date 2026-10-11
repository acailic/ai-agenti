# AI i agenti na srpskom

> Kompletan, praktičan kurs o izgradnji AI agenata — na srpskom jeziku, za developere u Srbiji i regionu. Od prvog poziva API-ju do sopstvenog agenta u produkciji, sa vežbama na svakom koraku.

## Zašto ovaj repozitorijum postoji

Oblast AI agenata (eng. *AI agents*) raste brzinom koja je teška za praćenje — ali gotovo sav sistematski materijal je na engleskom. Za developere koji najbrže uče na maternjem jeziku, to je realna barijera. Ovde se gradi kompletan kurs na srpskom: od toga šta je token i šta je kontekst, preko alata i petlje agenta, do memorije, evaluacije i produkcije — sa vežbama, domaćim, radionicama i rečnikom pojmova. Bez kopiranja, bez prevoda tuđeg gradiva: originalan materijal na srpskom, licenciran tako da se slobodno koristi (CC BY 4.0).

## Mapa modula

Kompletna mapa sa ishodima, preduslovima i procenom vremena po modulu je u [MAPA-UCENJA.md](MAPA-UCENJA.md). Pregled ukratko:

| # | Modul | Status | Vreme | Radionica |
|---|---|---|---|---|
| 00 | [Uvod u agente](moduli/modul-00-uvod-u-agente.md) — šta je agent, zašto sad, kako se uči | ✅ | 2–3 časa | [01 ✅](radionice/radionica-01-prvi-koraci.md) |
| 01 | [Osnove rada sa LLM-ovima](moduli/modul-01-osnove-llm.md) — tokeni, kontekst, prompt kao program | ✅ | 5–7 časova | [01 ✅](radionice/radionica-01-prvi-koraci.md) |
| 02 | [Alati](moduli/modul-02-alati-tool-use.md) — kako agent deluje u svetu | ✅ | 4–6 časova | [02 ✅](radionice/radionica-02-alati-i-tool-use.md) |
| 03 | [Agent od nule](moduli/modul-03-agent-od-nule.md) — petlja odlučivanja bez frameworka | ✅ | 6–8 časova | [03 🔜](radionice/radionica-03-agent-od-nule.md) |
| 04 | [Memorija i RAG](moduli/modul-04-memorija-i-rag.md) — agent koji zna vaše dokumente | ✅ | 6–8 časova | [04 ✅](radionice/radionica-04-rag-memorija.md) |
| 05 | [Inženjering konteksta](moduli/modul-05-inzenjering-konteksta.md) — šta agent zna u svakom trenutku | ✅ | 5–7 časova | — |
| 06 | [Protokoli: MCP i A2A](moduli/modul-06-protokoli-mcp-a2a.md) — agent povezan sa svetom po ugovoru | ✅ | 4–6 časova | [06 ✅](radionice/radionica-06-protokoli.md) |
| 07 | [Evaluacija agenata](moduli/modul-07-evaluacija-agenata.md) — kako znati da li je agent dobar | ✅ | 5–7 časova | [05 🔜](radionice/radionica-05-evaluacija.md) |
| 08 | Multi-agent sistemi | ✅ | 4–6 časova | — |
| 09 | U produkciju: bezbednost, opservabilnost, troškovi | 🔜 | 5–7 časova | — |
| 10 | Završni projekat: portfolio agent | 🔜 | 8–12 časova | — |

**Legenda:** ✅ napisano (modul / kompletna radionica sa rešenjima) · 🔜 planirano (radionica-skeleta: cilj, agenda, vežbe, domaći)

Pored modula:

- **[REČNIK.md](REČNIK.md)** — srpsko-engleski rečnik svih pojmova kursa (preko osamdeset termina, sa uputom na modul u kome se pojavljuju).
- **[radionice/](radionice/)** — radionice za uživo vođen prolaz kroz ključne module, po sat vremena: 01, 02, 04 i 06 su kompletne sa rešenjima vežbi; 03 i 05 su skele.
- **[O-AUTORU.md](O-AUTORU.md)** — ko piše i zašto.

## Odakle da krenem?

Pet brzih pitanja — odgovorite sebi iskreno, i prvo „ne“ pokazuje vaš modul:

1. **Znate li šta je AI agent i po čemu se razlikuje od chatbota?** Ne → počnite sa [modulom 00](moduli/modul-00-uvod-u-agente.md) (2–3 časa, bez preduslova).
2. **Jeste li već pozvali API nekog velikog modela iz sopstvenog Python koda?** Ne → [modul 01](moduli/modul-01-osnove-llm.md) (tu je i prva vežba sa pravim API-jem).
3. **Znate li šta je poziv alata (tool call) i zašto se argumenti parsiraju iz JSON teksta?** Ne → [modul 02](moduli/modul-02-alati-tool-use.md).
4. **Jeste li sami napisali petlju agenta (bez frameworka)?** Ne → [modul 03](moduli/modul-03-agent-od-nule.md) — srce puta.
5. **Treba vam agent koji odgovara iz vaših dokumenata, ili vas zanima kako se kontrolišu trošak i kvalitet konteksta?** Prvo → [modul 04](moduli/modul-04-memorija-i-rag.md); drugo → [modul 05](moduli/modul-05-inzenjering-konteksta.md) (idealno oba, redom).

Na sva pet „da“ — [modul 06](moduli/modul-06-protokoli-mcp-a2a.md) (protokoli: MCP i A2A) i [modul 07](moduli/modul-07-evaluacija-agenata.md) (evaluacija agenata) su sledeći redom; polja 09–10 se pišu po [mapi](MAPA-UCENJA.md) ili javite da pomognete.

**Šta vam treba za početak:** osnovni Python (promenljive, funkcije, pokretanje skripte), pristup jednom komercijalnom API-ju velikog modela (dovoljan je najjeftiniji plan; u vežbama koristimo z.ai/GLM, ali kod radi sa bilo kojim OpenAI-kompatibilnim provajderom) i Git nalog za portfolio. Jedno gvozdeno pravilo od prvog dana: **API ključ u environment varijabli, nikad u kodu.**

## Kako doprineti

Doprinosi **na srpskom jeziku** su srdačno dobrodošli: ispravke, novi primeri, prijave nejasnoća, prevodi termina. Kratko: otvorite *issue* za grešku ili nejasnoću, *pull request* za konkretne ispravke; za veće izmene (novi modul, radionica) prvo se javite u issue-u da se dogovorimo o obimu. Jezička pravila kursa: **latinica, ekavica**, topli nastavnički ton; termini na engleskom u zagradi pri prvoj upotrebi, u skladu sa [REČNIK-om](REČNIK.md).

Kompletan vodič (šta je dobrodošlo, jezička i tehnička pravila, kako proveriti izmene pre slanja) je u [CONTRIBUTING.md](CONTRIBUTING.md).

## Licenca i zahvalnice

Sav sadržaj u ovom repozitorijumu objavljen je pod licencom **[Creative Commons Attribution 4.0 International (CC BY 4.0)](LICENSE)** — slobodno ga koristite, prilagođavajte i gradite na njemu, uz navođenje izvora.

**Inspiracija:** redosled tema (osnove LLM-ova → alati → agent od nule → memorija/RAG → inženjering konteksta → protokoli → evaluacija → multi-agent sistemi → produkcija) prati konsenzus oblasti, a kao struktura inspiriran je sjajnim open-source kursom [datawhalechina/hello-agents](https://github.com/datawhalechina/hello-agents) (licenciran CC BY-NC-SA 4.0). **Sav tekst, kod, vežbe i primeri u ovom repozitorijumu su originalno delo, pisani za ovaj kurs** — ništa nije preuzeto niti prevedeno iz tog ili bilo kog drugog kursa.

## Status projekta

Radna verzija, otvorena za prve čitaoce i doprinosioce: mapa učenja, devet modula (00–08), rečnik pojmova i šest radionica (01, 02, 04 i 06 kompletne sa rešenjima vežbi). Dalji moduli (09–10) se pišu redom po [mapi učenja](MAPA-UCENJA.md). ⚓
