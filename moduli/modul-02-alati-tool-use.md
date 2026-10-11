# Modul 02 — Alati: kako agent deluje u svetu

> **Vreme:** 4–6 časova rada · **Preduslovi:** [modul 01](modul-01-osnove-llm.md) · **Stanje:** prva radna verzija

U modulu 01 model je bio sjajan sagovornik — ali samo sagovornik. Ako ste ga pitali koliko je sati, pogodio bi (ili izmislio). Nije mogao da pročita vaš fajl, da izračuna `17 * 234` bez greške, da pogleda podatke koji nisu u kontekstu. U ovom modulu dajemo modelu **ruke**: alate (eng. *tools*) — funkcije u našem kodu koje model može da *zatraži*, a naš program izvršava i vraća mu rezultat. To je mehanizam koji se zove tool use ili function calling (eng. *tool use*, *function calling*), i bez njega nema agenta. Kraj modula: imate bota koji odgovara iz **stvarnih podataka**, ne iz nagađanja.

---

## 1. Zašto alati: tri stvari koje čist model ne može

Model je, podsetimo, motor koji predviđa sledeći token. Iz toga slede tri tvrde granice:

1. **Ne zna.** Nema sat, nema kalendar, nema današnje vesti. Sve „aktuelno" za njega je trenutak obuke. Pitajte ga za datum — dobićete samouvereno nagađanje.
2. **Ne vidi.** Vaši fajlovi, baze, beleške — ne postoje za model dok im sadržaj ne ubacite u kontekst. A kontekst je, iz modula 01, skup i ograničen.
3. **Ne sme.** Model ne može ništa da *učini*: ne otvara fajl, ne šalje mejl, ne upisuje u bazu. Samo tekstuje.

Alat razbija sve tri granice odjednom: to je **funkcija u vašem kodu** koju je modelu opisali tako da je može zatražiti kada zatreba. Model i dalje samo tekstuje — ali sada njegov tekst može da znači „izvrši `vreme_u_gradu(grad='tokio')`", a rezultat mu se vraća nazad u razgovor. Model ne izvršava ništa sam: **svaki izvršni korak je i dalje pod vašom kontrolom, u vašem kodu.** Ta činjenica je srce i bezbednosti (sekcija 4) i cele arhitekture agenata.

## 2. Anatomija alata: opis je interfejs

Da bi model tražio alat, mora ga „videti" u pozivu. Alat se definiše sa tri dela:

```text
1. IME        — kraći tehnički identifikator: "vreme_u_gradu", "izracunaj"
2. OPIS       — rečenica (ili dve) šta alat radi i KADA ga koristiti
3. ŠEMA       — koje parametre prima, kojeg tipa, koji su obavezni
               (JSON Schema: type, properties, required)
```

Ključna spoznaja celog modula: **model ne vidi vaš kod — vidi samo opis i šemu.** Opis je, doslovno, interfejs alata ka modelu, kao dokumentacija ka kolegi koji danas počinje da radi. Pišite ga za tu osobu: šta alat radi, čemu služi, koje vrednosti prima, koje ograničenje ima.

Uporedite loš i dobar opis istog alata za računanje:

- **Loš:** „Kalkulator." — Model ne zna da li sme `sqrt`, da li razume „koliko je to po osobi", da li je za velike ili male brojeve. Pogrešno će ga koristiti.
- **Dobro:** „Računa matematički izraz sa brojevima. Podržava: + - * / % i stepenovanje (**). Ne podržava funkcije poput sqrt ili sin — koren izrazi kao stepen (npr. 2**0.5). Vraća tačan broj ili grešku."

Isti kod, potpuno drugačije ponašanje modela. Pravila za pisanje opisa:

1. **Recite kada alat koristiti — i kada ne** („koristi je kad te pitaju za trenutno vreme — sam ga ne znaš").
2. **Navedite ograničenja u samom opisu** (podržane operacije, dozvoljene vrednosti, jedinice).
3. **Jedan alat — jedna namena.** Ako se dva alata preklapaju, model nagađa koji da bira — a nagađanje je ono što izbegavamo.
4. **Opis parametra je isto opis alata:** „ime fajla tačno onako kako ga je vratio alat `listaj_fajlove`" sprečava izmišljanje imena.

## 3. Tok poziva alata: šta se zapravo desi

Kada u poziv uključite spisak alata, razgovor dobija novu vrstu poruke. Ceo tok jedne **runde** (eng. *round*):

```text
   poruke (system, user)  +  spisak alata
              │
              ▼
        ┌──────────┐   ne treba mu alat
        │  MODEL   │ ──────────────────► običan tekstualni odgovor. Kraj.
        └──────────┘
              │ treba mu podatak
              ▼
   poruka assistant sa zahtevom za alat (eng. *tool call*):
   izvrši vreme_u_gradu sa argumentima {"grad": "tokio"}
              │
              ▼
   VAŠ KOD: json.loads(argumenti) → poziv funkcije → rezultat (tekst)
              │
              ▼
   poruka uloge "tool" sa rezultatom (vezana preko tool_call_id)
              │
              ▼
        ┌──────────┐
        │  MODEL   │ ──► konačan odgovor korisniku (sada sa stvarnim podatkom)
        └──────────┘
```

Tri detalja u kojima svi prvi put pocrne:

- **Argumenti stižu kao JSON *tekst*, ne kao rečnik.** `poziv.function.arguments` je string — mora `json.loads(...)`. Prvo pravilo kada „ništa ne radi".
- **Poruku sa zahtevom vraćate u istoriju.** Modelova poruka sa `tool_calls` ide u listu poruka, a vaš rezultat dolazi kao poruka uloge **tool** sa `tool_call_id` koji se poklapa — tako model zna na šta se rezultat odnosi.
- **Jedna poruka može tražiti više alata odjednom** (paralelni pozivi, eng. *parallel tool calls*) — npr. vreme u dva grada. Zato rezultate obrađujemo u petlji.

Koliko rundi? Pitanje „koliko je sati u Londonu ako polazim iz Beograda u 7?" može zahtevati: dva poziva vremena, pa računanje — dve, tri runde. Petlja koja ponavlja „model traži — kod izvršava — rezultat vraća" dok model ne odgovori tekstom je mehaničko srce i modula 03; ovde je pišemo kao običnu `for` petlju sa gornjom granicom.

## 4. Bezbedno izvršavanje: pravila od prvog dana

Od prve vežbe važi: model predlaže, **kod odlučuje**. Pet gvozdenih pravila:

1. **Nikad `eval`.** Ako alat treba da računa — parse-ujte izraz preko `ast` modula (vežba ispod). `eval` na tekstu koji je *smislio model* je vrata za sve.
2. **Sandbox za fajlove.** Alat za čitanje pušta samo unutar jednog direktorijuma (`sandbox/`); sve izvan — greška. Putanju rešavate (`resolve()`) i proveravate da li počinje sandbox-om, pre čitanja.
3. **Najmanja dozvola (eng. *least privilege*).** Alat ume samo ono što mu je potrebno za zadatak: čitanje, a ne brisanje; jedan direktorijum, a ne ceo disk.
4. **Greška ide modelu, ne čoveku.** Kada alat pukne (fajl ne postoji, loš argument), ne obustavljajte program — vratite modelu tekst `GREŠKA: ...`. Model tada sam ispravlja zahtev i pokušava drugačije. To je najjeftinija „samo-korekcija" u celom kursu.
5. **Model ne bira adrese.** Kod mrežnih alata, URL servisa je fiksiran u kodu (lista dozvoljenih servisa), ne u argumentu koji model smisla.

O ovome se u modulu 09 gradi ceo sistem (potvrde korisnika, ograničenja, tajne); navika se usvaja od danas.

## 5. Vežbe sa pravim API-jem

Kao i u modulu 01: z.ai/GLM kroz OpenAI-kompatibilan interfejs, ključ samo u environment varijabli (`Z_AI_API_KEY`; opciono `Z_AI_BASE_URL`, `Z_AI_MODEL`). Sav kod radi sa bilo kojim provajderom koji podržava isti interfejs.

### 5.1 Priprema

```bash
# Virtuelno okruženje i biblioteke (ako nisu iz modula 01)
python3 -m venv .venv
source .venv/bin/activate
pip install openai tzdata        # tzdata: baza vremenskih zona (na Windows-u obavezna)

# Sandbox direktorijum za vežbe sa fajlovima
mkdir -p sandbox
printf '# Beleške sa sastanka\n\n- sledeći korak: napisati prvi alat\n- pitanje: kada model stvarno bira alat?\n' > sandbox/beleske.md
```

### 5.2 Prvi alat: vreme u gradu

Prvi alat je vreme — jer model *definitivno* ne zna koliko je sati, pa je izbor alata očigledan. Umesto spoljnog servisa koristimo standardnu biblioteku (`zoneinfo`): isti obrazac važi i za pravi API — samo se unutar funkcije umesto `zoneinfo` pozove HTTP servis. Sačuvajte kao `02_prvi_alat.py`:

```python
"""Vežba 2.1 — prvi alat: model traži vreme, naš kod odgovara.

Ključ i konfiguracija dolaze isključivo iz environment varijabli:
  Z_AI_API_KEY   — obavezno: vaš API ključ
  Z_AI_BASE_URL  — opciono: podrazumevano https://api.z.ai/api/paas/v4
  Z_AI_MODEL     — opciono: naziv modela po vašem planu
"""

import json
import os
import sys
from datetime import datetime
from zoneinfo import ZoneInfo

from openai import OpenAI

# --- 1. Funkcija koju izvršava NAŠ kod (model je samo traži) ---------------

GRADOVI = {
    "beograd": "Europe/Belgrade",
    "novi sad": "Europe/Belgrade",
    "niš": "Europe/Belgrade",
    "london": "Europe/London",
    "tokio": "Asia/Tokyo",
    "new york": "America/New_York",
}

def vreme_u_gradu(grad: str) -> str:
    """Trenutno vreme u gradu — iz naše male 'suve' baze vremenskih zona."""
    zona = GRADOVI.get(grad.strip().lower())
    if zona is None:
        poznati = ", ".join(sorted(GRADOVI))
        return f"GREŠKA: nepoznat grad '{grad}'. Podržani: {poznati}."
    return datetime.now(ZoneInfo(zona)).strftime("%d.%m.%Y. %H:%M (%Z)")

# --- 2. Definicija alata: ono što MODEL vidi -------------------------------

SH_VREME = {
    "type": "function",
    "function": {
        "name": "vreme_u_gradu",
        "description": (
            "Vraća trenutno lokalno vreme i datum u zadatom gradu. "
            "Koristi ovaj alat kad te pitaju koliko je sati ili koji je datum "
            "bilo gde u svetu — sam ne znaš trenutno vreme. "
            "Podržani gradovi: " + ", ".join(sorted(GRADOVI)) + "."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "grad": {
                    "type": "string",
                    "description": "Ime grada malim slovima, npr. 'beograd' ili 'tokio'.",
                },
            },
            "required": ["grad"],
        },
    },
}

# --- 3. Glavni tok: jedna runda „model traži — kod izvršava — model odgovara"

def main() -> None:
    api_key = os.environ.get("Z_AI_API_KEY", "")
    if not api_key:
        sys.exit("Nema Z_AI_API_KEY. Postavite environment varijablu pa ponovo pokrenite.")

    client = OpenAI(
        api_key=api_key,
        base_url=os.environ.get("Z_AI_BASE_URL", "https://api.z.ai/api/paas/v4"),
    )
    model = os.environ.get("Z_AI_MODEL", "glm-4.6")

    pitanje = " ".join(sys.argv[1:]) or "Koliko je sati u Beogradu?"
    poruke = [
        {"role": "system",
         "content": "Ti si precizan asistent. Za trenutno vreme uvek koristi alat — nikad ne pogađaš."},
        {"role": "user", "content": pitanje},
    ]

    odgovor = client.chat.completions.create(
        model=model, messages=poruke, tools=[SH_VREME], temperature=0.2,
    )
    poruka = odgovor.choices[0].message

    if not poruka.tool_calls:                    # model je odgovorio bez alata
        print(poruka.content)
        return

    poruke.append(poruka)                        # zahtev vraćamo u istoriju
    for poziv in poruka.tool_calls:
        print(f"→ model traži: {poziv.function.name}({poziv.function.arguments})")
        argumenti = json.loads(poziv.function.arguments)   # argumenti su JSON tekst!
        rezultat = vreme_u_gradu(**argumenti)
        print(f"  naš kod vraća: {rezultat}")
        poruke.append({"role": "tool", "tool_call_id": poziv.id, "content": rezultat})

    odgovor = client.chat.completions.create(    # drugi poziv: model ima podatke
        model=model, messages=poruke, tools=[SH_VREME], temperature=0.2,
    )
    print(odgovor.choices[0].message.content)

if __name__ == "__main__":
    main()
```

Pokrenite: `python 02_prvi_alat.py`, pa probajte i dvogradska pitanja:

```bash
python 02_prvi_alat.py "Koliko je sati u Beogradu i u Tokiu?"
python 02_prvi_alat.py "Koji je datum danas u New Yorku?"
```

Šta da primetite:

- kod pitanja sa **dva grada** model često traži oba poziva u **jednoj** poruci (paralelni pozivi) — naša petlja po `tool_calls` ih obrađuje redom;
- ako pitate za grad koji nije na listi, alat vraća `GREŠKA: nepoznat grad...` — a model to iskreno prenosi korisniku. Podaci dolaze odavde, ne iz mašte;
- pitajte nešto gde alat ne treba („Objasni šta je vremenska zona") — model odgovara bez alata. Bira **sam**, iz opisa.

**Eksperiment (2 min):** obrišite iz opisa rečenicu „sam ne znaš trenutno vreme" i probajte ponovo nekoliko pitanja. Da li model ponekad pokuša da pogodi vreme bez alata? To je, u malom, cela poenta dobrog opisa: ponašanje modela se podešava tekstom.

### 5.3 Zadatak 2: tri alata i mini-petlja

Sada botu dajemo još dve ruke: bezbedan kalkulator (preko `ast`-a — nikad `eval`) i čitanje fajlova ograničeno na `sandbox/`. Sa više alata i više rundi, uvodimo **registar alata** — rečnik ime → funkcija — i mini-petlju koja ponavlja runde dok model ne odgovori tekstom:

```python
import ast
import operator
from pathlib import Path

SANDBOX = Path(__file__).parent / "sandbox"

def izracunaj(izraz: str) -> str:
    """Bezbedno računanje: dozvoljeni su samo brojevi i + - * / % **."""
    BINARNE = {ast.Add: operator.add, ast.Sub: operator.sub, ast.Mult: operator.mul,
               ast.Div: operator.truediv, ast.Mod: operator.mod, ast.Pow: operator.pow}
    UNARNE = {ast.USub: operator.neg, ast.UAdd: operator.pos}

    def evaluiraj(cvor):
        if isinstance(cvor, ast.Constant) and isinstance(cvor.value, (int, float)):
            return cvor.value
        if isinstance(cvor, ast.BinOp) and type(cvor.op) in BINARNE:
            return BINARNE[type(cvor.op)](evaluiraj(cvor.left), evaluiraj(cvor.right))
        if isinstance(cvor, ast.UnaryOp) and type(cvor.op) in UNARNE:
            return UNARNE[type(cvor.op)](evaluiraj(cvor.operand))
        raise ValueError(f"nepodržana operacija: {ast.dump(cvor)[:40]}")

    return str(evaluiraj(ast.parse(izraz, mode="eval").body))

def procitaj_fajl(ime: str) -> str:
    """Čita fajl — ali samo unutar sandbox direktorijuma."""
    fajl = (SANDBOX / ime).resolve()
    if not fajl.is_relative_to(SANDBOX.resolve()):
        return "GREŠKA: putanja izlazi van sandbox direktorijuma."
    try:
        sadrzaj = fajl.read_text(encoding="utf-8")
    except FileNotFoundError:
        return f"GREŠKA: fajl '{ime}' ne postoji u sandbox-u."
    return sadrzaj[:2000]        # sečemo na razumnu dužinu za kontekst
```

Registar i šeme (dodaju se uz `SH_VREME` iz vežbe 2.1):

```python
FUNKCIJE = {"vreme_u_gradu": vreme_u_gradu, "izracunaj": izracunaj, "procitaj_fajl": procitaj_fajl}

SH_ALATI = [
    SH_VREME,
    {"type": "function", "function": {
        "name": "izracunaj",
        "description": (
            "Računa tačan rezultat matematičkog izraza sa brojevima. "
            "Podržava samo + - * / % i stepenovanje (**); ne podržava funkcije "
            "(sqrt, sin...) — koren izrazi kao stepen, npr. 2**0.5. "
            "Koristi je za svako računanje tačnih brojeva — sam grešiš u aritmetici."
        ),
        "parameters": {"type": "object", "properties": {
            "izraz": {"type": "string", "description": "Izraz, npr. '(1240 + 610) * 0.2' ili '2**10'."},
        }, "required": ["izraz"]},
    }},
    {"type": "function", "function": {
        "name": "procitaj_fajl",
        "description": (
            "Čita tekstualni fajl iz direktorijuma 'sandbox' u radnom direktorijumu "
            "(md, txt, csv). Vraća najviše 2000 znakova. Koristi je kada te pitaju "
            "o sadržaju fajlova ili ti treba podatak iz njih — ne smišljaš sadržaj."
        ),
        "parameters": {"type": "object", "properties": {
            "ime": {"type": "string", "description": "Ime fajla, npr. 'beleske.md'."},
        }, "required": ["ime"]},
    }},
]
```

I mini-petlja koja sve to povezuje:

```python
SYSTEM_PROMPT = (
    "Ti si pomoćnik sa alatima. Pravila: (1) za trenutno vreme, računanje i "
    "sadržaj fajlova koristi alate, nikad nagađanje; (2) ako alat vrati GREŠKA, "
    "ispravi zahtev i pokušaj drugačije; (3) konačan odgovor daješ tek kada "
    "imaš sve što ti treba."
)

def pokreni(client, model, pitanje: str, max_rundi: int = 5) -> None:
    poruke = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": pitanje},
    ]
    for _ in range(max_rundi):
        odgovor = client.chat.completions.create(
            model=model, messages=poruke, tools=SH_ALATI, temperature=0.2,
        )
        poruka = odgovor.choices[0].message
        if not poruka.tool_calls:                    # tekst = kraj razgovora
            print(poruka.content or "")
            return
        poruke.append(poruka)
        for poziv in poruka.tool_calls:
            fn = FUNKCIJE.get(poziv.function.name)
            try:
                argumenti = json.loads(poziv.function.arguments or "{}")
                rezultat = str(fn(**argumenti)) if fn else f"GREŠKA: nema alata '{poziv.function.name}'."
            except Exception as g:                   # greška ide modelu, ne čoveku
                rezultat = f"GREŠKA: {g}"
            print(f"[alat] {poziv.function.name} → {rezultat[:80]}")
            poruke.append({"role": "tool", "tool_call_id": poziv.id, "content": rezultat})
    print("(zaustavljeno: dostignut max_rundi — o ovome više u modulu 03)")
```

Celokupno rešenje — funkcije, registar, šeme i mini-petlju, uz `main()` po uzoru na vežbu 2.1 (samo se umesto ručnih poziva poziva `pokreni(client, model, pitanje)`) — sačuvajte kao `03_bot_sa_alatima.py`. Probajte pitanja koja **kombinuju** alate:

```bash
python 03_bot_sa_alatima.py "Koliko je sati u Tokiu, i koliko će biti kod nas kada tamo bude podne?"
python 03_bot_sa_alatima.py "Pročitaj beleske.md i izračunaj koliko je 15% od 12400."
```

Ovo su prva prava agencijska pitanja: model mora sam da **sastavi redosled** (uzmi vreme → izračunaj; pročitaj fajl → izračunaj) i da **spoji rezultate** u jedan odgovor. Zapamtite funkciju `pokreni` — u modulu 03 ona postaje petlja agenta, uz cilj, kočnice i trag.

### 5.4 Zadatak 3: greške su za model, ne za čoveka

Namerno izazovite probleme i posmatrajte šta se desi:

1. pitajte za grad koji ne postoji: „Koliko je sati u Atlantidi?";
2. tražite nepostojeći fajl: „Šta piše u tajne-beleske.txt?";
3. pitajte: „Koliki je koren iz 144?" — model mora sam da se seti `144**0.5`, jer smo mu u opisu rekli da `sqrt` ne postoji.

Sva tri slučaja završavaju se `GREŠKA: ...` u poruci uloge `tool` — i tu počinje lepo: model **čita grešku i koriguje se** u sledećoj rundi. Ako grešku vidite samo u terminalu, a model „umesto toga" izmišlja — proverite da li ste rezultat zaista vratili kao `tool` poruku, a ne samo odštampali.

### 5.5 Zadatak 4 (domaći): četvrti alat i prva ručna evaluacija

1. **Dodajte četvrti alat po izboru:** npr. `listaj_fajlove()` (spisak fajlova u sandbox-u), `prebroj_reci(ime)` ili — za one sa internetskim pristupom — pravi mrežni alat, npr. vremensku prognozu sa javnog servisa `wttr.in` (bez ključa: `httpx.get("https://wttr.in/Beograd?format=3", timeout=5.0)`; `httpx` dolazi uz `openai`). Zapamtite: adresa servisa fiksna u kodu, `timeout` obavezan, greška kao tekst.
2. **Eksperiment sa opisom:** sačuvajte staru verziju opisa alata u Git. Izmenite opis (skratite ga na jednu rečenicu) i postavite istih pet pitanja. Zapišite u koji se slučajeva promenilo ponašanje. To je vaša prva ručna evaluacija (eng. *evaluation*) — najava modula 07.
3. **Dnevnik grešaka:** vodite listu „model je pogrešio jer..." sa tri unosa (opis alata? šema? sistemski prompt?). Popravite po jedan uzrok i zapišite šta se promenilo.

## 6. Tipične greške u korišćenju alata — i dijagnoza

Kada bot koristi alat pogrešno, uzrok je skoro uvek jedan od ova četiri:

| Simptom | Uzrok | Lek |
|---|---|---|
| Model ne zove alat iako treba (nagađa vreme, „računa" sam) | opis ne kaže *kada* alat koristiti, ni da model sam ne može | u opis: „koristi za X — sam ne znaš X" |
| Model zove pogrešan alat iz dva slična | preklapajuće namene | jedan alat — jedna namena; razdvojite ili spojite |
| Pogrešni argumenti (izmišljeno ime fajla, grad velikim slovima) | šema bez opisa parametra i ograničenja | opišite format i dozvoljene vrednosti; normalizujte u kodu (`.lower()`) |
| Model zapne, ponavlja isti zahtev | greška alata ne stiže do modela (program pukne ili se ćuti) | uhvatite izuzetak i vratite `GREŠKA: ...` kao tool poruku |

Redosled provere pri dijagnostici: **opis alata → šema → sistemski prompt → sam kod.** Skoro uvek stane na prvom koraku.

## 7. Pitanja za samoproveru

1. Nabrojite tri stvari koje čist model ne može, i objasnite kako alat rešava svaku od njih.
2. Šta model vidi od alata, a šta ne? Zašto kažemo da je „opis interfejs ka modelu"?
3. Opisati tok jedne runde poziva alata: koje poruke nastaju, čemu služi `tool_call_id`, i zašto argumente moramo `json.loads`-ovati?
4. Zašto grešku alata vraćamo modelu kao poruku, umesto da obustavimo program? Šta se time dobija?
5. Vaš bot pomeće vreme u Tokiju sa računanjem procenta, i oba puta bira pogrešan alat. Kojim redosledom proveravate uzroke, i zašto baš tim?
6. Zašto `izracunaj` koristi `ast` umesto `eval`, i šta bi bilo najgore kada bismo dozvolili modelu da prosledi proizvoljan URL mrežnom alatu?

## Šta sledi

Alati su ruke — ali ruke bez plana su samo nagađanje. U [**modulu 03 — Agent od nule**](modul-03-agent-od-nule.md) pretvaramo mini-petlju iz ovog modula u pravog agenta: zadatak umesto pitanja, plan, kočnice (maksimalan broj koraka, budžet tokena), čitljiv trag rada — svega ~100 linija Pythona, bez ijednog frameworka. Uživo: [radionica 02](../radionice/radionica-02-alati-i-tool-use.md) obrađuje materijal ovog modula. 🚀
