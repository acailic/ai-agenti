# Modul 01 — Osnove rada sa LLM-ovima: tokeni, kontekst, prompt kao program

> **Vreme:** 5–7 časova rada · **Preduslovi:** [modul 00](modul-00-uvod-u-agente.md), osnovni Python · **Stanje:** prva radna verzija

Ovo je modul u kome prestajete da budete korisnik, a postajete programer velikih modela. Kraj njega: razumećete šta se doslovno dešava kada pošaljete poruku modelu, zašto kontekstni prozor jeste vaš budžet i vaše ograničenje, i kako se piše prompt koji se ponaša kao program. Najvažnije: **uradićete svoj prvi pravi poziv API-ju** — sa ključem koji nikada ne dolazi u kod.

---

## 1. Kako veliki jezički model zapravo radi

Ceo sistem počiva na jednoj naizgled banalnoj sposobnosti: **na osnovu datog teksta, predvideti sledeći token.** Token (eng. *token*) je komadić teksta — reč, deo reči ili znak interpunkcije. Model ne „razmišlja" u rečenicama; on, token po token, bira šta je najverovatniji nastavak.

Tri praktične posledice koje morate znati od prve vežbe:

1. **Verovatnoća, ne sigurnost.** Isto pitanje može dati različite odgovore. Parametar *temperatura* (eng. *temperature*) kontroliše koliko: niska temperatura → konzervativniji, ponovljiviji izlaz; visoka → raznovrsniji, kreativniji (i skloniji skretanju). Za agenta obično želimo nisku.
2. **Model zna samo ono što mu date (plus ono što je naučio u treniranju).** Nema pristup internetu, vašim fajlovima ni „sećanju" između dva poziva. Sve što treba da zna — mora biti u poruci koju pošaljete. Zvuči ograničavajuće, a zapravo je osnova svega: zato se gradimo alate i memoriju (moduli 02–04).
3. **Samouverenost ≠ tačnost.** Kada model nema pojma, često izumi plauzibilno — to je halucinacija (eng. *hallucination*). Nije „bug" koji će popraviti novija verzija; to je svojstvo načina rada koje inženjeri zaobilaze dizajnom (izvori informacija, ograničenja, testovi).

## 2. Tokeni: jedinica u kojoj se sve plaća

Zašto se toliko priča o tokenima? Jer je token jedinica **svake od tri ograničavajuće veličine**:

- **Cena.** API se naplaćuje po broju tokena ulaza (eng. *input*) i izlaza (eng. *output*). Dugačka istorija razgovora u kontekstu = plaćate je svaki poziv iznova.
- **Ograničenje.** Kontekstni prozor (sekcija 3) meri se u tokenima. Kada se napuni — dodira se zid.
- **Brzina.** Izlazni tokeni se generišu jedan po jedan; dužina izlaza direktno određuje koliko čekate.

Koliki je token? Za engleski je približno 3–4 znaka po tokenu. Za srpski (latinica, ćirilica) odnos je nepovoljniji: naše nastavke („najverovatniji", „razumevanje") tokenizer često seče na više delova, pa računajte grubo **1 token ≈ 2–3 znaka**. Praktična aritmetika: stranica teksta A4 je za engleski oko 500 tokena, za srpski realno 700–900.

**Vežba razmišljanja (bez koda):** pogledajte ove dve poruke i procenite koja je „skuplja":

1. „Objasni mi RAG." (ulaz ~7 tokena)
2. Cela istorija razgovora od 20 poruka + „Objasni mi RAG." (ulaz ~4.000 tokena)

Odgovor: druga je stotinama puta skuplja — a sadržaj pitanja je isti. U agentima se ovo dešava automatski, zato ćemo u modulu 05 učiti upravljanje kontekstom (eng. *context engineering*).

## 3. Kontekst i kontekstni prozor: vaš novčanik

Kontekst (eng. *context*) je **sve što model vidi u jednom pozivu**: sistemski prompt, sva prethodna pitanja i odgovori, rezultati alata, dokumenti koje ste ubacili. Kontekstni prozor (eng. *context window*) je maksimalan broj tokena koji staje — danas to meri na desetine ili stotine hiljada tokena, ali uvek je konačan.

Model kontekst tretira kao **jednu ravnu listu tokena**. On ne pravi razliku „bitno — nebitno": sve što je unutra utiče na izlaz, a kad se prozor napuni, najstarije stvari obično ispadaju. Pravila koja iz toga slede:

1. **Relevantno u kontekst, šum napolje.** Deset dobro izabranih odlomaka pobeđuje celu knjigu ubačenu „pa da vidimo".
2. **Redosled i format imaju značaj.** Važne instrukcije idu na početak ili kraj poruke, ne usred gomile.
3. **Trošak se ponavlja.** Kontekst plaćate na svakom pozivu — agent sa 50 koraka u petlji, i toliko puta plaća istu istoriju, osim ako je ne sažima (modul 05).

Razmislimo analogijom iz modula 00: kontekstni prozor je **radna memorija** agenta. Kratkoročna, skupa, ograničena — i upravo zato najvredniji resurs koji optimizujemo.

## 4. Prompt kao program

U svakodnevnoj upotrebi prompt je poruka prijatelju. U inženjeringu, prompt je **izvorni kod**: od njega zavisi ponašanje sistema, pa se piše pažljivo, verzionisa u Git-u, menja kontrolisano i meri rezultat.

### 4.1 Anatomija razgovora sa API-jem

Poziv API-ju je lista poruka sa ulogama:

- **system** — uputstvo „kako se ponaša": identitet, pravila, format, ograničenja. Vaš „konfiguracioni fajl" za model.
- **user** — šta traži korisnik.
- **assistant** — prethodni odgovori modela (u razgovoru ih vraćate nazad, da bi se održala nit).
- (u modulu 02 dodaćemo i **tool** — rezultate izvršenih alata.)

### 4.2 Pet delova dobrog prompta

Radni šablon koji vam preporučujem (i koji ćemo koristiti u svim vežbama):

```text
1. ULOGA        — ko model „jeste": "Ti si asistent za tehničku podršku..."
2. ZADATAK      — jedan, konkretno definisan: "Pregledaj prijavljeni problem i predloži tri moguća uzroka."
3. KONTEKST     — samo relevantne informacije, označene jasno.
4. FORMAT       — kako treba da izgleda izlaz: lista, tabela, JSON, maksimalno N reči.
5. OGRANIČENJA  — šta se ne sme: ne izmišljaj; ako nemaš podatak, reci "nemam podatak".
```

Dve najčešće greške početnika: **previše zadataka u jednom promptu** (rasparsi ih u korake — to je već pola agenta) i **nedefinisan format izlaza** (pa se onda „čita" odgovor rukom, umesto da ga kod parsira).

### 4.3 Verzionisanje prompta

Od danas vaše promptove čuvajte kao fajlove u projektu (`prompts/` direktorijum), sa komentarom zašto svaka verzija postoji. Kada u modulu 07 dodamo evaluaciju, dobićete petlju: *izmena prompta → merenje → odluka* — umesto „čini mi se da je bolje".

---

## 5. Prva vežba sa pravim API-jem

Vreme je. U ovom odeljku napravimo prvi pravi poziv velikom modelu kroz API. Koristimo **z.ai/GLM** API (pristupačan i dostupan našim čitaocima), kroz OpenAI-kompatibilan interfejs — ali sav kod radi sa bilo kojim provajderom koji podržava isti interfejs, uz promenu dve vrednosti.

### 5.1 Zlatno pravilo: ključ živi u environment varijabli

API ključ (eng. *API key*) je kao lozinka. Kada jednom dospe u kod, u istoriju Git-a ili screenshot — kompromitovan je. Zato:

- **nikad ne pišemo ključ u kod;**
- čuvamo ga u **environment varijabli** (eng. *environment variable*), a kod čita odatle;
- `os.environ[...]` umesto `os.environ.get(...)` kad *želimo* da program glasno pukne ako ključa nema — greška na startu bolja od tajnovite kasnije.

### 5.2 Priprema

```bash
# 1. Virtuelno okruženje (uvek, i u vežbama)
python3 -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate

# 2. Zvanična klijentska biblioteka (OpenAI-kompatibilna)
pip install openai

# 3. Ključ — u environment varijablu, ne u kod!
export Z_AI_API_KEY="ovde-svoj-kljuc"          # Linux/macOS
# Windows PowerShell:  $env:Z_AI_API_KEY = "ovde-svoj-kljuc"
```

Ako radite projekat sa `.env` fajlom (preporučujem biblioteku `python-dotenv`), dodajte `.env` u `.gitignore` **pre prvog** `git add`. Redosled je bitan: `.gitignore` prvo, tajna drugo.

> Napomena: base URL i naziv modela zavise od vašeg naloga/plana. U kodu dole čitaju se iz environment varijabli sa razumnim podrazumevanim vrednostima — proverite u dokumentaciji svog provajdera koje vrednosti važe za vas.

### 5.3 Prvi poziv

Sačuvajte kao `01_prvi_poziv.py`:

```python
"""Vežba 1.1 — prvi poziv LLM API-ju (z.ai/GLM, OpenAI-kompatibilno).

Ključ i konfiguracija dolaze isključivo iz environment varijabli:
  Z_AI_API_KEY   — obavezno: vaš API ključ
  Z_AI_BASE_URL  — opciono: podrazumevano https://api.z.ai/api/paas/v4
  Z_AI_MODEL     — opciono: naziv modela po vašem planu (proverite u dokumentaciji)
"""

import os
import sys

from openai import OpenAI

def main() -> None:
    api_key = os.environ.get("Z_AI_API_KEY", "")
    if not api_key:
        sys.exit("Nema Z_AI_API_KEY. Postavite environment varijablu pa ponovo pokrenite.")

    # Z.ai nudi OpenAI-kompatibilan endpoint — dovoljno je zameniti base_url.
    client = OpenAI(
        api_key=api_key,
        base_url=os.environ.get("Z_AI_BASE_URL", "https://api.z.ai/api/paas/v4"),
    )
    model = os.environ.get("Z_AI_MODEL", "glm-4.6")

    odgovor = client.chat.completions.create(
        model=model,
        messages=[
            {
                "role": "system",
                "content": "Ti si sažet tehnički asistent. Odgovaraš na srpskom, najviše u tri rečenice.",
            },
            {"role": "user", "content": "Šta je token u kontekstu velikih jezičkih modelova?"},
        ],
        temperature=0.2,
    )

    print(odgovor.choices[0].message.content)

if __name__ == "__main__":
    main()
```

Pokrenite: `python 01_prvi_poziv.py`. Ako je sve u redu — čestitamo, upravo ste programski razgovarali sa velikim modelom. Ako je greška, pročitajte je pažljivo: poruke API-ja su pošteno jasne (najčešće: ključ nije postavljen, ključ nije važeći ili naziv modela ne postoji na vašem nalogu).

### 5.4 Zadatak 2: temperatura i ponovljivost

Izmenite poziv tako da pokrenete **isto pitanje pet puta** sa `temperature=0.0`, pa pet puta sa `temperature=1.5`. Sačuvajte odgovore u listu i uporedite:

- Da li su odgovori pri niskoj temperaturi identični (ili gotovo)?
- Šta se dešava sa gramatikom i sadržajem na visokoj?

Ova vežba gradi intuiciju za pravilo koje ćete stalno koristiti: **za ekstrakciju podataka, kod i agente — niska temperatura; za ideje i varijante — viša.**

### 5.5 Zadatak 3: format izlaza koji kod može da parsira

Napišite program koji od modela traži **isključivo JSON** — npr. tri ključa: `tema`, `tezina` (1–5) i `jedna_recenica` — za proizvoljno tehničko pitanje koje korisnik unese. Saveti:

- U system poruci definišite tačan šema izlaza i recite: „Odgovori samo validnim JSON-om, bez uvodnog teksta."
- U kodu parsirajte `json.loads(...)` i obradite slučaj kada model ipak ne poštuje format (to će se dešavati — iskusite to namerno).
- Bonus: pitajte model da sam označi koliko je siguran (`"sigurnost": 0–1`) i ispišite upozorenje ako je nizak.

Zaključak vežbe: kada želite da izlaz **koristi program**, format definisate vi — ne model.

### 5.6 Zadatak 4 (domaći): mini „program" od prompta

Napravite skriptu `04_prompt_kao_program.py` koja za ulaz uzme ime običnog tekstualnog fajla (npr. vaših beleški), a sistemski prompt napiše po šablonu iz sekcije 4.2 (uloga, zadatak, kontekst, format, ograničenja). Program treba da:

1. pročita fajl (sadržaj ide u `user` poruku kao „kontekst");
2. zatraži od modela: „izvuči sve zadatke/obaveze iz teksta u obliku markdown liste";
3. ispiše broj tokena ulaza iz odgovora (`odgovor.usage.prompt_tokens`) — proverite da se slaže sa vašom procenom iz sekcije 2.

Zatim eksperimentišite: šta se desi sa rezultatom ako izbrišete deo „ograničenja" iz sistemskog prompta? Zapišite zapažanje u komentar na kraju fajla — to je početak vaše lične dokumentacije o prompt inženjeringu (eng. *prompt engineering*).

---

## 6. Šta sme, a šta ne sme: zdrav odnos prema izlazu modela

Tri navike koje vas čine inženjerom, a ne srećnim korisnikom:

1. **Veruj, ali proveri.** Za činjenice iz odgovora koje su vam bitne — proverite izvor. Model „glumi" sigurnost i kada nema podataka.
2. **Nešto u kontekst, nešto u kod.** Pravila koja su nepromenljiva (formati, ograničenja) bolje su u kodu nego u promptu; sudbinske stvari ne ostavljajte modelu da „pogodi".
3. **Greške su deo dizajna.** Od prve skripte planirajte: šta ako je odgovor prazan, pregluv JSON, ili prekoračen kvota? API poziv bez obrade grešaka je pola zadatka.

## 7. Pitanja za samoproveru

1. Šta model radi u suštini, token po token? Šta od toga sledi za ponovljivost?
2. Zašto je druga poruka iz sekcije 2 „stotinama puta skuplja" od prve? Koji parametar kontrole ima temperature=0, a koji 1.5 — i kada koristite koji?
3. Nabrojite pet delova radnog šablona prompta i dajte primer zašto nedostatak dela „format izlaza" pravi problem u kodu.
4. Zašto se `Z_AI_API_KEY` čita iz environment varijable, a ne piše u kod? Šta je pravilan redosled kada koristite `.env` fajl u Git projektu?
5. Šta sve ulazi u kontekst jednog poziva agenta? (Zamislite petlju iz modula 00 i nabrojite sve vrste sadržaja.)

## Šta sledi

Imate prvi poziv, osećaj za tokene i šablon za prompt. U [**modulu 02 — Alati**](modul-02-alati-tool-use.md) dajemo modelu ruke: definišemo funkcije koje on može da zatraži, i prvi put puštamo da on bira — a naš kod izvršava. To je prvi korak ka pravom agentu.

A u međuvremenu, ako želite da ovo pređete uživo: pogledajte [radionicu 01](../radionice/radionica-01-prvi-koraci.md). 🚀
