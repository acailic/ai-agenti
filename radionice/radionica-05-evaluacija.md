# Radionica 05 — Evaluacija: kako znati da li je agent dobar?

> **Povezani modul:** [modul 07 — Evaluacija agenata](../moduli/modul-07-evaluacija-agenata.md)
> **Trajanje:** 4 časa · **Format:** predavanje 30% / vežbe 70% · **Nivo: napredni**

## Cilj radionice

Učesnici prestaju da unapređuju agente „na osećaj": grade mali evaluacioni skup (eng. *evaluation set*) za sopstvenog agenta iz radionica 02–04, definišu metrike koje nešto zaista mere, upoznaju ocenjivanje pomoću modela (eng. *LLM-as-a-judge*) sa njegovim zamkama, i uvode regresione provere: da izmena prompta više ne može da „tiho" pokvari ono što je već radilo.

## Agenda po satima

| Sat | Sadržaj |
|---|---|
| **1. sat** | Anegdota greške: „popravili smo prompt, pokvarili smo pola funkcionalnosti" — zašto je nagađanje skupo (15 min). Šta merimo: tačnost, potpunost, format, trošak, latencija, bezbednost — izbor po slučaju upotrebe (35 min). |
| **2. sat** | Vežba 1: pisanje evaluacionog skupa — 15–20 primera (ulaz → očekivano), uključujući granične (eng. *edge cases*) i „nepoštene" upite (60 min). |
| **3. sat** | Vežba 2: automatsko ocenjivanje — pravila u kodu (format, obavezni delovi) + ocenjivanje pomoću modela za sadržaj, sa kalibracijom na par primera koje i sami ocenimo (60 min). |
| **4. sat** | Vežba 3: A/B poređenje dve verzije prompta nad istim skupom — tabela rezultata i odluka (40 min). Diskusija: šta radimo kad metrike kažu „bolje", a osećaj „gore"? (15 min) Zatvaranje (5 min). |

## Vežbe

1. **Evaluacioni skup (60 min):** za sopstvenog agenta — 15+ primera sa očekivanim ishodima; obavezno uključiti: upit izvan domena, upit sa pogrešnim pretpostavkama, zahtev za nemoguću akciju. Format: JSONL fajl, verzionisan.
2. **Automatsko ocenjivanje (60 min):** dva sloja — deterministička pravila (parsira li se izlaz? ima li izvor?) i ocenjivač-model (da li je odgovor tačan prema očekivanom?); provera slaganja ocenjivača sa sopstvenim ocenama na 5 primera.
3. **A/B promptova (40 min):** stara vs. nova verzija sistema prompta; pokrenuti skup; sastaviti tabelu po metrikama; doneti odluku i zapisati obrazloženje.

## Domaći

- Ponoviti A/B sa promenom *modela* umesto prompta (npr. dva modela po izboru) — razlika u ceni naspram kvaliteta na istom skupu.
- Dodati metrike troška: prosečan broj tokena po primeru; odgovor na pitanje „isplati li se poboljšanje od 5% tačnosti za 40% skuplji poziv?".
- Uvesti evaluaciju kao CI korak: skripta koja pada ako tačnost padne ispod praga (makar i samo lokalni `make check`).

## Materijali — checklist za učesnike

- [ ] sopstveni agent iz ranijih radionica (ili bar jedna skripta sa sistemskim promptom);
- [ ] izdvojen budžet od par hiljada tokena za ocenjivačke pozive (zaboravićete na njega — to je poenta);
- [ ] Git repozitorijum sa istorijom promptova (da imate šta da A/B uporedite);
- [ ] sveska/tabela za rezultate — brojevi koje ne zapišete su brojevi koje nemate.

## Za voditelja

- Najvažniji trenutak radionice: kada učesniku metrika kaže nešto suprotno od osećaja. Ne rešavati — pustiti grupu da ispita *zašto*; tu se uči najviše.
- Ocenjivač-model kalibrisati javno, na primeru celoj grupi, pre puštanja u samostalan rad.
