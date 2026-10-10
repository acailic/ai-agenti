# Radionica 01 — Prvi koraci: LLM API u praksi

> **Povezani moduli:** [modul 00 — Uvod u agente](../moduli/modul-00-uvod-u-agente.md) i [modul 01 — Osnove rada sa LLM-ovima](../moduli/modul-01-osnove-llm.md)
> **Trajanje:** 4 časa · **Format:** predavanje 30% / vežbe 70% · **Nivo: početni**

## Cilj radionice

Učesnici samostalno izvršavaju pozive LLM API-ju iz Pythona: razumeju tokene i kontekstni prozor, pišu strukturiran prompt po šablonu (uloga–zadatak–kontekst–format–ograničenja) i — najvažnije — ključ API-ja drže isključivo u environment varijabli. Na odlasku svako ima repozitorijum sa tri radeće skripte.

## Agenda po satima

| Sat | Sadržaj |
|---|---|
| **1. sat** | Dobro došli i razbijanje leda (10 min). Šta je agent, šta je chatbot — radna definicija i pitanja (25 min). Kako model radi: token, verovatnoća, temperatura — sa živim demonstracijama (25 min). |
| **2. sat** | Kontekstni prozor kao novčanik: cena po tokenu, ulaz/izlaz, zašto se istorija plaća svaki put (20 min). Zajednička vežba: priprema okruženja, `pip install openai`, postavljanje `Z_AI_API_KEY` (40 min). **Zastavica:** niko ne nastavlja dok svima ne radi `import openai`. |
| **3. sat** | Vežba 1: prvi poziv — `01_prvi_poziv.py` iz modula 01, uz objašnjenje svake linije (30 min). Vežba 2: temperatura 0.0 vs 1.5, pet ponavljanja, uporediti (30 min). |
| **4. sat** | Vežba 3: JSON izlaz koji kod parsira, uključujući obradu lošeg formatu (35 min). Pregled šablona prompta i zajednička diskusija: gde je greška u promptu, a gde u kodu (15 min). Domaći, zatvaranje i gde dalje (10 min). |

## Vežbe

1. **Prvi poziv (30 min):** skripta `01_prvi_poziv.py` iz [modula 01, sekcija 5.3](../moduli/modul-01-osnove-llm.md#53-prvi-poziv). Svako pokreće sam; voditelj obilazi i skida prve prepreke (najčešće: environment varijabla nije postavljena u istom terminalu).
2. **Temperatura (25 min):** isto pitanje, pet puta na 0.0, pet puta na 1.5 — uporediti ponovljivost, gramatiku, sadržaj. Zaključak zapisati u komentar koda.
3. **JSON izlaz (40 min):** tražiti strogo definisan JSON od modela; parsirati `json.loads`; namerno izazvati i obraditi loš format. Bonus polaznicima koji završe ranije: polje „sigurnost" i upozorenje.

## Domaći

- Zadatak 4 iz modula 01: skripta `04_prompt_kao_program.py` — ekstrakcija zadataka iz tekstualnog fajla + brojanje tokena ulaza.
- Sve skripte poslati u sopstveni javni repozitorijum `vežbe-ai-agenti` (README sa jednim naslovom je dovoljan za sada).
- Za bonus ljubopitljive: registrujte se na jedan mrežni „tokenizer playground" i izmerite koliko tokena ima jedan pasus na ćirilici vs. latinici.

## Materijali — checklist za učesnike

- [ ] laptop sa Python 3.10+ i pristupom internetu;
- [ ] aktivan API nalog (z.ai/GLM ili bilo koji OpenAI-kompatibilni provajder) **sa kreiranim ključem pre radionice** — najčešći blok prvog sata je baš ovaj;
- [ ] `git --version` radi u terminalu (instaliran i konfigurisan);
- [ ] pročitan [modul 00](../moduli/modul-00-uvod-u-agente.md) (kraći je od šoljice kafa vremena);
- [ ] omiljeni editor sa Python podrškom (VS Code je sasvim dovoljan).

## Za voditelja

- Pripremljen „rezervni" ključ za hitne slučajeve demonstracija — ali **ne** projiciran na ekran; učesnici koriste svoje.
- Ako grupa zaostane na sat 2, skratiti vežbu 3 na zajedničko izvođenje — cilj je da prvi sat rada sa API-jem bude *uspeh*, ne *dubina*.
