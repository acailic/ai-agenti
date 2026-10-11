# Radionica 02 — Alati i tool use: dajemo modelu ruke

> **Povezani modul:** [modul 02 — Alati: kako agent deluje u svetu](../moduli/modul-02-alati-tool-use.md) (preporučeno pročitati sekcije 1–4 pre radionice)
> **Trajanje:** 4 časa · **Format:** predavanje 25% / vežbe 75% · **Nivo: srednji**

## Cilj radionice

Učesnici definišu alate (eng. *tools*) tako da ih model pouzdano koristi, implementiraju petlju „model traži — kod izvršava — rezultat se vraća modelu" i stiču kritički pogled na bezbednost izvršavanja. Rezultat radionice: bot sa tri alata (vreme u gradu, bezbedan kalkulator, čitanje fajla iz sandbox-a) koji odgovara korisniku iz **stvarnih podataka** — i spisak dijagnoza za kad (ne kad — *kad*) model pogreši.

## Agenda po satima

| Sat | Sadržaj |
|---|---|
| **1. sat** | Zašto alati: tri stvari koje čist model ne može (zna, vidi, sme) i demo „model pogađa vreme" (25 min). Anatomija alata: ime, opis, šema parametara — zašto je *opis* interfejs ka modelu, loš vs. dobar opis na živom primeru (35 min). |
| **2. sat** | Zajedno: vežba 1 — prvi alat `vreme_u_gradu`; tok poziva alata na dijagramu; prvi „traži — izvršava — vraća" kod svakog učesnika (50 min). Pauza — pitanja (10 min). |
| **3. sat** | Vežba 2: dodavanje kalkulatora (bezbedno, preko `ast` — nikad `eval`) i čitanja fajlova ograničenog na `sandbox/`; registar alata i mini-petlja (50 min). Kratki ulomak: greška ide modelu kao poruka, ne čoveku — demo samo-korekcije (10 min). |
| **4. sat** | Vežba 3: „stres test" — namerna pitanja-zamke, dijagnoza (opis? šema? prompt?) i popravka dok se ponašanje ne popravi (45 min). Diskusija: bezbednost — ko sme da pokreće šta; zatvaranje i domaći (15 min). |

## Priprema pre radionice (učesnici)

Sve iz [radionice 01](radionica-01-prvi-koraci.md) i:

```bash
pip install openai tzdata          # tzdata: baza vremenskih zona (na Windows-u obavezna)
mkdir -p sandbox
printf '# Beleške sa sastanka\n\n- sledeći korak: napisati prvi alat\n- pitanje: kada model stvarno bira alat?\n' > sandbox/beleske.md
```

Ključ i dalje **samo** u environment varijabli `Z_AI_API_KEY` — pravilo iz radionice 01 važi zauvek.

---

## Vežba 1 — Prvi alat: vreme u gradu (50 min)

**Zadatak:** napišite program koji pita model za vreme, a model — pošto ne zna koliko je sati — traži od vašeg alata. Jedna runda: poziv → `tool_calls` → izvršenje → rezultat u `tool` poruci → konačan odgovor.

**Rešenje** — sačuvajte kao `r02_v1_prvi_alat.py`:

```python
"""Radionica 02, vežba 1 — prvi alat: model traži vreme, naš kod odgovara.

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

GRADOVI = {
    "beograd": "Europe/Belgrade", "novi sad": "Europe/Belgrade", "niš": "Europe/Belgrade",
    "london": "Europe/London", "tokio": "Asia/Tokyo", "new york": "America/New_York",
}

def vreme_u_gradu(grad: str) -> str:
    """Trenutno vreme u gradu — iz naše male 'suve' baze vremenskih zona."""
    zona = GRADOVI.get(grad.strip().lower())
    if zona is None:
        poznati = ", ".join(sorted(GRADOVI))
        return f"GREŠKA: nepoznat grad '{grad}'. Podržani: {poznati}."
    return datetime.now(ZoneInfo(zona)).strftime("%d.%m.%Y. %H:%M (%Z)")

SH_VREME = {
    "type": "function",
    "function": {
        "name": "vreme_u_gradu",
        "description": (
            "Vraća trenutno lokalno vreme i datum u zadatom gradu. Koristi ovaj alat "
            "kad te pitaju koliko je sati ili koji je datum bilo gde — sam ne znaš "
            "trenutno vreme. Podržani gradovi: " + ", ".join(sorted(GRADOVI)) + "."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "grad": {"type": "string",
                         "description": "Ime grada malim slovima, npr. 'beograd' ili 'tokio'."},
            },
            "required": ["grad"],
        },
    },
}

def main() -> None:
    api_key = os.environ.get("Z_AI_API_KEY", "")
    if not api_key:
        sys.exit("Nema Z_AI_API_KEY. Postavite environment varijablu pa ponovo pokrenite.")

    client = OpenAI(api_key=api_key,
                    base_url=os.environ.get("Z_AI_BASE_URL", "https://api.z.ai/api/paas/v4"))
    model = os.environ.get("Z_AI_MODEL", "glm-4.6")

    pitanje = " ".join(sys.argv[1:]) or "Koliko je sati u Beogradu?"
    poruke = [
        {"role": "system",
         "content": "Ti si precizan asistent. Za trenutno vreme uvek koristiš alat — nikad ne pogađaš."},
        {"role": "user", "content": pitanje},
    ]

    odgovor = client.chat.completions.create(
        model=model, messages=poruke, tools=[SH_VREME], temperature=0.2,
    )
    poruka = odgovor.choices[0].message
    if not poruka.tool_calls:
        print(poruka.content)
        return

    poruke.append(poruka)
    for poziv in poruka.tool_calls:                 # može ih biti više odjednom!
        print(f"→ model traži: {poziv.function.name}({poziv.function.arguments})")
        argumenti = json.loads(poziv.function.arguments)   # JSON *tekst*, ne rečnik
        rezultat = vreme_u_gradu(**argumenti)
        print(f"  naš kod vraća: {rezultat}")
        poruke.append({"role": "tool", "tool_call_id": poziv.id, "content": rezultat})

    odgovor = client.chat.completions.create(
        model=model, messages=poruke, tools=[SH_VREME], temperature=0.2,
    )
    print(odgovor.choices[0].message.content)

if __name__ == "__main__":
    main()
```

**Provere za voditelja (i učesnike):**

```bash
python r02_v1_prvi_alat.py                                # jedan grad
python r02_v1_prvi_alat.py "Koliko je sati u Beogradu i u Tokiu?"   # paralelni pozivi
python r02_v1_prvi_alat.py "Koji je danas datum u New Yorku?"
python r02_v1_prvi_alat.py "Objasni šta je vremenska zona."         # bez alata — i to je tačno
```

Tri tačke koje na ovoj vežbi moraju da „sednu": (1) argumenti stižu kao JSON tekst; (2) poruka sa zahtevom vraća se u istoriju, a rezultat dolazi kao `tool` poruka sa `tool_call_id`; (3) model sam bira da li mu treba alat — iz opisa.

## Vežba 2 — Više alata: kalkulator i čitanje fajla (50 min)

**Zadatak:** dodajte `izracunaj` (bezbedno — samo preko `ast` modula, nikad `eval`) i `procitaj_fajl` (samo unutar `sandbox/`), uvedite registar alata i mini-petlju koja podnosi više rundi.

**Rešenje** — sačuvajte kao `r02_v2_bot_sa_alatima.py`:

```python
"""Radionica 02, vežba 2 — bot sa tri alata i mini-petljom (rešenje)."""

import ast
import json
import operator
import os
import sys
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

from openai import OpenAI

SANDBOX = Path(__file__).parent / "sandbox"

# ---------- alati ----------

GRADOVI = {
    "beograd": "Europe/Belgrade", "novi sad": "Europe/Belgrade", "niš": "Europe/Belgrade",
    "london": "Europe/London", "tokio": "Asia/Tokyo", "new york": "America/New_York",
}

def vreme_u_gradu(grad: str) -> str:
    zona = GRADOVI.get(grad.strip().lower())
    if zona is None:
        return "GREŠKA: nepoznat grad. Podržani: " + ", ".join(sorted(GRADOVI)) + "."
    return datetime.now(ZoneInfo(zona)).strftime("%d.%m.%Y. %H:%M (%Z)")

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
        raise ValueError("nepodržana operacija u izrazu")

    return str(evaluiraj(ast.parse(izraz, mode="eval").body))

def procitaj_fajl(ime: str) -> str:
    """Čitanje fajla — ali samo unutar sandbox direktorijuma."""
    fajl = (SANDBOX / ime).resolve()
    if not fajl.is_relative_to(SANDBOX.resolve()):
        return "GREŠKA: putanja izlazi van sandbox direktorijuma."
    try:
        return fajl.read_text(encoding="utf-8")[:2000]
    except FileNotFoundError:
        return f"GREŠKA: fajl '{ime}' ne postoji u sandbox-u."

# ---------- registar i šeme ----------

FUNKCIJE = {"vreme_u_gradu": vreme_u_gradu,
            "izracunaj": izracunaj,
            "procitaj_fajl": procitaj_fajl}

SH_ALATI = [
    {"type": "function", "function": {
        "name": "vreme_u_gradu",
        "description": "Vraća trenutno lokalno vreme i datum u zadatom gradu. Koristi je "
                       "kad te pitaju za vreme ili datum — sam ne znaš trenutno vreme. "
                       "Podržani gradovi: " + ", ".join(sorted(GRADOVI)) + ".",
        "parameters": {"type": "object", "properties": {
            "grad": {"type": "string", "description": "Ime grada malim slovima."},
        }, "required": ["grad"]},
    }},
    {"type": "function", "function": {
        "name": "izracunaj",
        "description": "Računa tačan rezultat matematičkog izraza sa brojevima. Podržava "
                       "samo + - * / % i stepenovanje (**); ne podržava funkcije (sqrt, "
                       "sin...) — koren izrazi kao stepen, npr. 2**0.5. Koristi je za svako "
                       "računanje tačnih brojeva — sam grešiš u aritmetici.",
        "parameters": {"type": "object", "properties": {
            "izraz": {"type": "string", "description": "Izraz, npr. '(1240 + 610) * 0.2'."},
        }, "required": ["izraz"]},
    }},
    {"type": "function", "function": {
        "name": "procitaj_fajl",
        "description": "Čita tekstualni fajl iz direktorijuma 'sandbox' u radnom "
                       "direktorijumu (md, txt, csv), najviše 2000 znakova. Koristi je kada "
                       "te pitaju o sadržaju fajlova — ne smišljaš sadržaj.",
        "parameters": {"type": "object", "properties": {
            "ime": {"type": "string", "description": "Ime fajla, npr. 'beleske.md'."},
        }, "required": ["ime"]},
    }},
]

SYSTEM_PROMPT = (
    "Ti si pomoćnik sa alatima. Pravila: (1) za trenutno vreme, tačno računanje i "
    "sadržaj fajlova koristiš alate, nikad nagađanje; (2) ako alat vrati GREŠKA, "
    "ispraviš zahtev i pokušaš drugačije; (3) konačan odgovor daješ tek kada imaš "
    "sve što ti treba."
)

# ---------- mini-petlja ----------

def pokreni(client, model, pitanje: str, max_rundi: int = 5) -> None:
    poruke = [{"role": "system", "content": SYSTEM_PROMPT},
              {"role": "user", "content": pitanje}]
    for _ in range(max_rundi):
        odgovor = client.chat.completions.create(
            model=model, messages=poruke, tools=SH_ALATI, temperature=0.2,
        )
        poruka = odgovor.choices[0].message
        if not poruka.tool_calls:                    # tekst = kraj
            print(poruka.content or "")
            return
        poruke.append(poruka)
        for poziv in poruka.tool_calls:
            fn = FUNKCIJE.get(poziv.function.name)
            try:
                argumenti = json.loads(poziv.function.arguments or "{}")
                rezultat = str(fn(**argumenti)) if fn else "GREŠKA: nepoznat alat."
            except Exception as g:                   # greška ide modelu, ne čoveku
                rezultat = f"GREŠKA: {g}"
            print(f"[alat] {poziv.function.name} → {rezultat[:80]}")
            poruke.append({"role": "tool", "tool_call_id": poziv.id, "content": rezultat})
    print("(zaustavljeno: dostignut max_rundi)")

def main() -> None:
    api_key = os.environ.get("Z_AI_API_KEY", "")
    if not api_key:
        sys.exit("Nema Z_AI_API_KEY. Postavite environment varijablu pa ponovo pokrenite.")

    client = OpenAI(api_key=api_key,
                    base_url=os.environ.get("Z_AI_BASE_URL", "https://api.z.ai/api/paas/v4"))
    model = os.environ.get("Z_AI_MODEL", "glm-4.6")

    pitanje = " ".join(sys.argv[1:]) or "Koliko je sati u Tokiu, i koliko će biti kod nas kada tamo bude podne?"
    pokreni(client, model, pitanje)

if __name__ == "__main__":
    main()
```

**Provere:**

```bash
python r02_v2_bot_sa_alatima.py "Pročitaj beleske.md i izračunaj koliko je 15% od 12400."
python r02_v2_bot_sa_alatima.py "Koliki je koren iz 144?"      # opis kaže: sqrt ne postoji, 144**0.5 postoji
python r02_v2_bot_sa_alatima.py "Šta piše u ../secret.txt?"    # sandbox odbija — greška ide modelu
```

Ključni uvid vežbe: pitanja koja **kombinuju** alate teraju modela da sam sastavi redosled (čitaj → računaj) — to je već klica agenta iz radionice 03.

## Vežba 3 — Stres test: pitanja-zamke i dijagnoza (45 min)

**Zadatak:** pokrenite bota (rešenje vežbe 2) na pitanjima ispod. Za svako: zapišite šta se desilo, odredite uzrok (opis alata? šema? sistemski prompt?) i popravite **jednu stvar** — pa ponovite isto pitanje.

**Pitanja i očekivani ishodi (rešenje):**

1. **„Koliko je sati u Atlantidi?"**
   Alat vraća `GREŠKA: nepoznat grad...` — dobar bot iskreno kaže da grad nije podržan i nabroji koje jesu. Ako bot *izmisli* vreme: uzrok je sistemski prompt (nije zabranjeno nagađanje) — dodajte „nikad ne izmišljaš rezultate alata".
2. **„Koliki je koren iz 144, i koliko je to procenta od 1200?"**
   Model mora sam: `144**0.5` (jer opis kaže da `sqrt` ne postoji), pa `(12/1200)*100`. Ako model pokuša `sqrt(144)` i dobije grešku — to je *uspeh* dizajna: pročitao je grešku, ispravio se. Ako model „računa u glavi": u opisu `izracunaj` stoji „sam grešiš u aritmetici" — podvucite to u sistemskom promptu („svako računanje ide kroz alat").
3. **„Šta piše u mojim tajnim beleškama?"** (fajl `tajne-beleske.txt` ne postoji)
   Alat vraća grešku da fajl ne postoji; bot to mora reći. Ako izmisli sadržaj — klasična halucinacija; lek je u opisu alata („ne smišljaš sadržaj") i sistemskom promptu.
4. **Bonus — „Kolika je 15% popusta na 12.400 dinara?"**
   Posmatrajte: da li model poziva `izracunaj` ili računa sam? Ako sam — dodajte u sistemski prompt „za svako tačno računanje koristi izracunaj". Pokrenite tri puta: sa i bez popravke.

**Tabela dijagnoze (rešenje za table):**

| Simptom | Prvo proveriti | Tipičan lek |
|---|---|---|
| Model zove pogrešan alat ili ga ne zove | opis alata | recite *kada* se koristi i *šta model sam ne zna* |
| Pogrešni argumenti | opis parametra u šemi | format primera (`'beograd'`, ne `'Beograd, Srbija'`) |
| Model ignoriše rezultat alata | sistemski prompt | „odgovaraj samo iz podataka alata" |
| Model se vrti ukrug | da li greška stiže do modela | vratite `GREŠKA: ...` kao `tool` poruku |
| Program pukne umesto da odgovori | `try/except` oko izvršenja | izuzetak se pretvara u poruku modelu |

Redosled dijagnoze koji ponavljamo do kraja kursa: **opis → šema → sistemski prompt → kod.**

## Domaći

- Dodati četvrti alat po sopstvenom izboru (npr. `listaj_fajlove()`, pretraga lokalnih beleški, ili pravi mrežni alat — javni servis `wttr.in` bez ključa: `httpx.get("https://wttr.in/Beograd?format=3", timeout=5.0)`; adresa fiksirana u kodu, `timeout` obavezan, greška kao tekst) i napisati u README zašto je opis alata napisan baš tako.
- Zapisati tri situacije u kojima je model pogrešio i šta je pomoglo (opis? primer u opisu? validacija?) — ovo je prva „evaluacija" koju radimo, samo ručna (najava modula 07).
- Pripremiti jedno pitanje za diskusiju na početku [radionice 03](radionica-03-agent-od-nule.md).

## Materijali — checklist za učesnike

- [ ] odrađena [radionica 01](radionica-01-prvi-koraci.md) — umeće poziva API-ju iz Pythona;
- [ ] repozitorijum sa vežbama iz radionice 01 (ključ i dalje samo u environment varijabli);
- [ ] pročitane sekcije 1–4 [modula 02](../moduli/modul-02-alati-tool-use.md) (tok poziva alata);
- [ ] Python 3.10+, biblioteke `openai` i `tzdata` instalirane, `Z_AI_API_KEY` postavljen;
- [ ] `sandbox/` direktorijum sa bar jednim `.md` ili `.txt` fajlom (komanda u sekciji „Priprema");
- [ ] slobodnih ~200 MB i živaca za eksperimentisanje. 🙂

## Za voditelja

- „Suvi" izvori podataka (zoneinfo baza umesto servisa vremena, fajlovi umesto mrežnih API-ja) drže fokus na *tool use*, a ne na registracije servisa — na internetu je samo poziv modelu.
- Zastavica bezbednosti: svaki primer koji dira fajl sistem radimo u zasebnom direktorijumu `sandbox/` — navika od prvog dana. `procitaj_fajl` iz rešenja već odbija putanje van sandbox-a; pokazati to namerno (`../secret.txt`).
- Ako grupa zaostane: vežbu 1 radite zajedno na projektoru (ona nosi 80% razumevanja), vežbu 2 skratite na dodavanje samo `izracunaj`, a stres test svedete na pitanja 1 i 2.
- Najčešći kvar na satu 2: environment varijabla postavljena u drugom terminalu; drugi najčešći: `json` modul uvezen van bloka ili `tzdata` nedostaje na Windows-u (`pip install tzdata`).
- Za vežbu 3 imajte pripremljena „loša" opise (skraćeni na jednu rečenicu) za brzu demonstraciju pre-posle; razlika u ponašanju je upečatljivija od bilo kog slajda.
- Poruka koju ponoviti na kraju: **model predlaže, kod izvršava — i kod je onaj koji sme da kaže „ne".**
