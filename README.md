# AI i agenti na srpskom

> Mapa učenja i radionice o izgradnji AI agenata — na srpskom jeziku, za developere u Srbiji i regionu.

## Zašto ovaj repozitorijum postoji

Oblast AI agenata (eng. *AI agents*) raste brzinom koja je teška za praćenje — ali gotovo sav sistematski materijal je na engleskom. Za developere koji najbrže uče na maternjem jeziku, to je realna barijera. Ovde se gradi kompletan, praktičan kurs na srpskom: od prvog poziva API-ju (šta je token, šta je kontekst, šta je prompt kao program) do sopstvenog agenta u produkciji — sa vežbama, domaćim, radionicama i evaluacijom. Bez kopiranja, bez prevoda tuđeg gradiva: originalan materijal na srpskom.

## Šta ćete naći

- **[MAPA-UCENJA.md](MAPA-UCENJA.md)** — kompletna mapa učenja: 11 modula (00–10), sa ishodima, preduslovima i procenom vremena po modulu.
- **[moduli/](moduli/)** — gradivo po modulima. Napisano:
  - [Modul 00 — Uvod u agente: šta je agent, zašto sad, kako se uči](moduli/modul-00-uvod-u-agente.md)
  - [Modul 01 — Osnove rada sa LLM-ovima: tokeni, kontekst, prompt kao program](moduli/modul-01-osnove-llm.md) (uključuje prvu vežbu sa pravim API-jem)
  - [Modul 02 — Alati: kako agent deluje u svetu](moduli/modul-02-alati-tool-use.md) (tool use, šeme funkcija, bezbedno izvršavanje)
  - [Modul 03 — Agent od nule: petlja odlučivanja bez frameworka](moduli/modul-03-agent-od-nule.md)
  - moduli 04–10: u izradi prema mapi
- **[REČNIK.md](REČNIK.md)** — srpsko-engleski rečnik pojmova korišćenih kroz kurs (preko četrdeset termina, sa uputom na modul u kome se pojavljuju).
- **[radionice/](radionice/)** — radionice za uživo vođen prolaz kroz ključne module, po sat vremena. Kompletne (sa rešenjima vežbi): 01 i 02; skele (cilj, agenda po satima, vežbe, domaći, checklist materijala): 03–05.
- **[O-AUTORU.md](O-AUTORU.md)** — ko piše i zašto.

## Kako početi

Otvorite [mapu učenja](MAPA-UCENJA.md) i krenite redom — moduli se nadovezuju, a preduslovi su naznačeni. Dovoljan je osnovni Python i pristup jednom (najjeftinijem) planu bilo kog velikog modela sa OpenAI-kompatibilnim interfejsom (eng. *OpenAI-compatible interface*); u vežbama koristimo z.ai/GLM. Jedno gvozdeno pravilo od prvog dana: **API ključ u environment varijabli, nikad u kodu.**

## Licenca i zahvalnice

Sav sadržaj u ovom repozitorijumu objavljen je pod licencom **[Creative Commons Attribution 4.0 International (CC BY 4.0)](LICENSE)**.

**Inspiracija:** redosled tema (osnove LLM-ova → alati → agent od nule → memorija/RAG → inženjering konteksta → protokoli → evaluacija → multi-agent sistemi → produkcija) prati konsenzus oblasti, a kao struktura inspirisan je sjajnim open-source kursom [datawhalechina/hello-agents](https://github.com/datawhalechina/hello-agents) (licenciran CC BY-NC-SA 4.0). **Sav tekst, kod, vežbe i primeri u ovom repozitorijumu su originalno delo, pisani za ovaj kurs** — ništa nije preuzeto niti prevedeno iz tog ili bilo kog drugog kursa.

## Kako doprineti

Doprinosi **na srpskom jeziku** su srdačno dobrodošli: ispravke, novi primeri, prevod termina, izveštaji o nejasnoćama. Otvorite *issue* ili pošaljite *pull request* — za veće izmene (novi modul, radionica) prvo se javite u issue-u da se dogovorimo o obimu i pravcu. Jezička pravila kursa: **latinica, ekavica**, topli nastavnički ton; termini na engleskom u zagradi pri prvoj upotrebi.

## Status projekta

Radna verzija: mapa, četiri modula (00–03), rečnik pojmova i pet radionica (01 i 02 kompletne, 02 sa rešenjima vežbi). Redosled izrade daljih modula prati [mapa učenja](MAPA-UCENJA.md). ⚓
