# Radionica 03 — Agent od nule: petlja odlučivanja bez frameworka

> **Povezani modul:** [modul 03 — Agent od nule](../moduli/modul-03-agent-od-nule.md) (preporučeno pročitati pre radionice)
> **Trajanje:** 4 časa · **Format:** predavanje 20% / vežbe 80% · **Nivo: srednji**

## Cilj radionice

Svakom učesniku, iz početka i bez frameworka, izlazi sopstveni agent: petlja (eng. *agent loop*) u kojoj model razmišlja, zatraži alat, dobije rezultat, i ponavlja dok ne završi zadatak. Ključna spoznaja radionice: agent je **program sa ~100 linija** koji bi svaki učesnik umeo da objasni liniju po liniju — frameworki samo slažu iste delove umesto vas.

## Agenda po satima

| Sat | Sadržaj |
|---|---|
| **1. sat** | Ponovimo: alati iz radionice 02 (15 min). Petlja agenta: opažaj → razmišljaj → deluj (eng. *perceive–think–act*), na crtežu i u pseudokodu (30 min). Zajedno: skelet petlje — tri izlaza iz iteracije (alat / finalni odgovor / prekidač) na lažnom modelu, bez mreže (15 min). |
| **2. sat** | Vežba: dovođenje petlje do života — agent koji rešava zadatak „sredi ovaj direktorijum": lista fajlove, čita, preimenuje uz potvrdu (60 min). |
| **3. sat** | Vežba nastavak + bezbednosna ograničenja: maksimalan broj koraka, lista dozvoljenih operacija, zaustavljanje na konstantan budžet tokena (50 min). Kratko: gde petlja „pukne" — slučajevi beskonačnog ponavljanja i kako ih preseći (10 min). |
| **4. sat** | Zajednička autopsija: log jednog trajekta agenta (poruke, odluke, troškovi) — čitanje traga (eng. *trace*) kao veština (30 min). Diskusija: šta bi ovde uradio framework, i da li bi nam pomoglo (20 min). Zatvaranje i domaći (10 min). |

## Priprema pre radionice (učesnici)

Odrađene [radionice 01](radionica-01-prvi-koraci.md) i [02](radionica-02-alati-i-tool-use.md) (alati rade, ključ u environment varijabli `Z_AI_API_KEY`), modul [03](../moduli/modul-03-agent-od-nule.md) pročitan barem do sekcije 3. Zatim:

```bash
pip install openai

# test direktorijum sa 5 neurednih fajlova (isti za celu grupu)
mkdir -p radionica03-sandbox
cd radionica03-sandbox
cat > "priprema za sastanak (STARA).txt" <<'KRAJ'
Sastanak tima, 12.03: idemo na novi termin nedeljnih pregleda — sreda 10h.
Zapisnik vodi Milica od aprila. Stari zapisnici idu u arhivu na kraju meseca.
KRAJ
cat > "Ideje za blog post.md" <<'KRAJ'
# Ideje u toku

1. Zašto petlja agenta nije magija — tri izlaza iz iteracije.
2. Kako smo ubrzali pretragu u našem alatu za podršku.
3. Beleške sa čitanjem dokumentacije MCP protokola.
KRAJ
cat > "troskovi-nacrt-NOVI2.csv" <<'KRAJ'
mesec,kategorija,iznos_rsd
januar,alati,4200
februar,alati,4200
februar,obuka,15000
mart,alati,4200
KRAJ
cat > "beleške sa kavom.txt" <<'KRAJ'
Razgovor sa Nanom: zanima je radionica o alatima, pita da li snimamo.
Poslati joj materijale i snimak kad bude. Podsetiti u ponedeljak.
KRAJ
cat > "uputstvo-KOPIJA-za-slanje.md" <<'KRAJ'
# Uputstvo za postavljanje okruženja

Klonirati repozitorijum, pokrenuti venv, pa install requirements.
Za pokretanje testova: make check. Za produkciju: pogledati uputstvo
za izdavanje verzija (docs/izdavanje.md).
KRAJ
cd ..
```

Napomena o trošku: vežba 1 ne ide na mrežu uopšte (lažni model); vežbe 2 i 3 troše koliko i jedan razgovor srednje dužine — manje od kafe. Sandbox prati `git init` ako želite lak „undo" (preporučeno: jeste).

---

## Vežba 1 — Skelet petlje: tri izlaza, na lažnom modelu (45 min)

**Zadatak:** napišite petlju agenta od pseudokoda do koda — i pokrenite je **bez ijednog poziva API-ja**. Trik: lažni model (eng. *mock*) sa unapred snimljenim odgovorima, istog oblika kakav vraća pravi provajder. Petlja ne zna razliku — i baš to je prva lekcija: petlja je obrazac, model je zamena.

**Rešenje** — sačuvajte kao `r03_v1_skelet.py` (bez mreže — čist Python):

```python
"""Radionica 03, vežba 1 — skelet petlje agenta, na lažnom modelu (bez mreže).

Petlja agenta ima tri izlaza iz iteracije: (1) model traži alat,
(2) model daje finalni odgovor, (3) kočnica prekida petlju.
LazniModel glumi provajdera sa snimljenim odgovorima; kad ga u vežbi 2
zamenite pravim klijentom, petlja ostaje ista — to je poenta.
"""

import json
from types import SimpleNamespace


# --- alati: dva bezazlena opažaja (u vežbi 2 dolaze pravi) --------------------

def vreme() -> str:
    return "12:00, sreda"

def spisak_zadataka() -> str:
    return "1. sastanak tima u 14h\n2. pregled koda u 16h"

FUNKCIJE = {"vreme": vreme, "spisak_zadataka": spisak_zadataka}


# --- lažni model: poruke istog oblika kao pravi API ---------------------------

def poruka(content=None, tool_calls=None):
    """Odgovor modela istog oblika kao choices[0].message iz pravog API-ja."""
    return SimpleNamespace(content=content, tool_calls=tool_calls)

def poziv(ime, argumenti=None, pid=1):
    """Jedan zahtev za alat, istog oblika kao stavka iz tool_calls."""
    argumenti = json.dumps(argumenti or {}, ensure_ascii=False)
    return SimpleNamespace(id=str(pid),
                           function=SimpleNamespace(name=ime, arguments=argumenti))

class LazniModel:
    """Vraća snimljene odgovore redom; kad ponestane, ćuti.

    Namerno ne čita istoriju poruka: nije pametan, samo poslušan —
    dovoljno da petlju vidimo u radu bez ključa i bez mreže.
    """

    def __init__(self, scenario):
        self._scenario = list(scenario)

    def odgovori(self):
        if self._scenario:
            return self._scenario.pop(0)
        return poruka(content="(model više ne odgovara)")


# --- petlja: opažaj → razmišljaj → deluj, sa tri izlaza -----------------------

def pokreni(model, zadatak, max_koraka=6):
    poruke = [{"role": "user", "content": zadatak}]
    for korak in range(1, max_koraka + 1):        # izlaz 3: prekidač
        odgovor = model.odgovori()
        if odgovor.tool_calls:                    # izlaz 1: traži alat
            for p in odgovor.tool_calls:
                argumenti = json.loads(p.function.arguments)
                rezultat = str(FUNKCIJE[p.function.name](**argumenti))
                print(f"[korak {korak}] alat {p.function.name}({argumenti}) → {rezultat!r}")
                poruke.append({"role": "tool", "tool_call_id": p.id,
                               "content": rezultat})
            continue
        print(f"[korak {korak}] finalni odgovor: {odgovor.content}")   # izlaz 2
        return odgovor.content
    return f"(kočnica: dostignut max_koraka={max_koraka})"


if __name__ == "__main__":
    print("== scenario A: dva alata, pa finalni odgovor ==")
    model = LazniModel([
        poruka(tool_calls=[poziv("vreme", pid=1)]),
        poruka(tool_calls=[poziv("spisak_zadataka", pid=2)]),
        poruka(content="Sada je 12:00 (sreda). Prvo ti je na spisku sastanak tima u 14h."),
    ])
    pokreni(model, "Koliko je sati i šta mi je prvo na spisku danas?")

    print("\n== scenario B: model se vrti u krug ==")
    model = LazniModel([poruka(tool_calls=[poziv("vreme", pid=i)])
                        for i in range(1, 8)])
    pokreni(model, "Koliko je sati?", max_koraka=4)
```

**Provere:**

```bash
python r03_v1_skelet.py
```

Scenario A mora proći kroz sva tri izlaza osim prekidača: dva poziva alata, pa finalni odgovor. Scenario B je srce vežbe: model zauvek traži isto — i **petlja se sama zaustavlja** na `max_koraka`, jer joj to jedino preostaje. Ubeđivanje modela da prestane je promena prompta; kočnica je promena koda — i zato se piše u kodu (modul 03, sekcija 5).

**Tri tačke koje na ovoj vežbi moraju da sednu:** (1) petlja ne zna da je model lažan — obrazac je nezavisan od provajdera, i zato se testira bez ključa i bez troška; (2) `tool_calls` i `role: "tool"` su ugovor o obliku poruka — vežba 2 će iste redove puniti pravim odgovorima; (3) beskonačno ponavljanje nije teorijski slučaj: scenario B se dešava i pravim modelima, i upravo zato kočnica postoji pre nego što treba.

## Vežba 2 — Agent za red u direktorijumu (75 min)

**Zadatak:** zamenite lažni model pravim i pustite agenta da sredi `radionica03-sandbox/`: tri alata — `listaj_fajlove`, `procitaj_fajl`, `preimenuj_uz_potvrdu`. Preimenovanje je nepovratno dovoljno da traži potvrdu čoveka u petlji (eng. *human in the loop*): alat pita u terminalu, čovek odgovara sa `d`, tek onda se izvršava. Zadatak agentu ide u prvoj `user` poruci; redosled rada agent sam bira.

**Rešenje** — sačuvajte kao `r03_v2_agent.py`:

```python
"""Radionica 03, vežba 2 — agent za red u direktorijumu, sa pravim modelom.

  Z_AI_API_KEY   — obavezno: vaš API ključ
  Z_AI_BASE_URL  — opciono: podrazumevano https://api.z.ai/api/paas/v4
  Z_AI_MODEL     — opciono: model za razgovor (podrazumevano glm-4.6)

Alati: listaj_fajlove, procitaj_fajl, preimenuj_uz_potvrdu.
Preimenovanje je jedina akcija koja menja svet — i traži potvrdu čoveka.
"""

import json
import os
import re
import sys
from pathlib import Path

from openai import OpenAI

SANDBOX = Path(__file__).parent / "radionica03-sandbox"
BEZBEDNO_IME = re.compile(r"^[a-z0-9][a-z0-9 ._-]*$", re.IGNORECASE)

# --- alati: dva opažaja i jedna potvrđena akcija ------------------------------

def listaj_fajlove() -> str:
    imena = sorted(p.name for p in SANDBOX.iterdir() if p.is_file())
    return "\n".join(imena) or "(direktorijum je prazan)"

def procitaj_fajl(ime: str) -> str:
    fajl = (SANDBOX / ime).resolve()
    if not fajl.is_relative_to(SANDBOX.resolve()):
        return "GREŠKA: putanja izlazi van radnog direktorijuma."
    try:
        return fajl.read_text(encoding="utf-8")[:1500]
    except FileNotFoundError:
        return f"GREŠKA: fajl '{ime}' ne postoji (kopiraj ime tačno iz listaj_fajlove)."

def preimenuj_uz_potvrdu(staro: str, novo: str) -> str:
    put_staro = (SANDBOX / staro).resolve()
    if not put_staro.is_relative_to(SANDBOX.resolve()):
        return "GREŠKA: putanja izlazi van radnog direktorijuma."
    if not BEZBEDNO_IME.match(novo):
        return ("GREŠKA: novo ime nije bezbedno — dozvoljeni su slova, cifre, "
                "razmak, tačka, crtica i donja crta, bez putanja.")
    if not put_staro.exists():
        return f"GREŠKA: fajl '{staro}' ne postoji."
    if (SANDBOX / novo).exists():
        return f"GREŠKA: fajl '{novo}' već postoji — predloži drugo ime."
    odgovor = input(f"[potvrda] preimenuj '{staro}' → '{novo}'? [d/N] ").strip().lower()
    if odgovor not in ("d", "da"):
        return "KORISNIK ODBIO: preimenovanje nije izvršeno; predloži drugo ime."
    put_staro.rename(SANDBOX / novo)
    return f"OK: preimenovano u '{novo}'."

FUNKCIJE = {"listaj_fajlove": listaj_fajlove,
            "procitaj_fajl": procitaj_fajl,
            "preimenuj_uz_potvrdu": preimenuj_uz_potvrdu}

SH_ALATI = [
    {"type": "function", "function": {
        "name": "listaj_fajlove",
        "description": "Vraća imena svih fajlova u radnom direktorijumu, po jedan u redu. "
                       "Prvi korak svakog pregleda.",
        "parameters": {"type": "object", "properties": {}, "required": []},
    }},
    {"type": "function", "function": {
        "name": "procitaj_fajl",
        "description": "Čita sadržaj fajla iz radnog direktorijuma (najviše 1500 znakova). "
                       "Ime mora biti tačno onako kako ga je vratio listaj_fajlove.",
        "parameters": {"type": "object", "properties": {
            "ime": {"type": "string", "description": "Ime fajla iz spiska."},
        }, "required": ["ime"]},
    }},
    {"type": "function", "function": {
        "name": "preimenuj_uz_potvrdu",
        "description": "Preimenuje fajl u radnom direktorijumu — ali tek pošto čovek potvrdi "
                       "u terminalu. Predloži novo ime: mala slova, reči spojene crticom, "
                       "bez sufiksa kao STARA, NOVI2, KOPIJA; dodaj godinu ili mesec ako se "
                       "iz sadržaja vidi. Pozivaj jedan fajl u jednom koraku.",
        "parameters": {"type": "object", "properties": {
            "staro": {"type": "string", "description": "Tačno staro ime iz listaj_fajlove."},
            "novo": {"type": "string", "description": "Predloženo novo ime, npr. 'troskovi-2025.csv'."},
        }, "required": ["staro", "novo"]},
    }},
]
```

(Isti fajl se nastavlja — sistemski prompt, petlja i `main` idu odmah ispod šema:)

```python
# --- petlja agenta: ista tri izlaza, sad sa pravim modelom --------------------

SYSTEM_PROMPT = (
    "Ti si 'Domar', agent za red u direktorijumu. Radiš SAMO kroz alate. "
    "Postupak: (1) izlistaj fajlove; (2) pročitaj svaki pre predloga; "
    "(3) za svaki predloži novo ime — jasno, mala slova, reči crticom, bez "
    "sufiksa STARA/NOVI/KOPIJA, sa mesecom ili godinom iz sadržaja ako se vidi; "
    "(4) preimenuj jedan po jedan — čovek potvrđuje svaki; ako čovek odbije, "
    "predloži drugo ime, ne inzistiraj. Na kraju rezimuj šta je urađeno. "
    "Ako alat vrati GREŠKA, popravi zahtev i nastavi."
)

def agent(client, model, zadatak: str, max_koraka: int = 20) -> str:
    poruke = [{"role": "system", "content": SYSTEM_PROMPT},
              {"role": "user", "content": zadatak}]
    for korak in range(1, max_koraka + 1):
        odgovor = client.chat.completions.create(
            model=model, messages=poruke, tools=SH_ALATI, temperature=0.2)
        poruka = odgovor.choices[0].message
        if not poruka.tool_calls:                     # finalni odgovor
            return poruka.content or ""
        poruke.append(poruka)
        for poziv_ in poruka.tool_calls:              # jedan ili više alata
            try:
                argumenti = json.loads(poziv_.function.arguments or "{}")
                rezultat = str(FUNKCIJE[poziv_.function.name](**argumenti))
            except Exception as g:
                rezultat = f"GREŠKA: {g}"
            print(f"[korak {korak}] {poziv_.function.name}({argumenti}) → {rezultat[:60]}")
            poruke.append({"role": "tool", "tool_call_id": poziv_.id,
                           "content": rezultat})
    return f"(kočnica: dostignut max_koraka={max_koraka})"

def main() -> None:
    api_key = os.environ.get("Z_AI_API_KEY", "")
    if not api_key:
        sys.exit("Nema Z_AI_API_KEY. Postavite environment varijablu pa ponovo pokrenite.")
    if not SANDBOX.is_dir():
        sys.exit("Nema radionica03-sandbox/ — pokrenite pripremu iz početka radionice.")
    client = OpenAI(api_key=api_key,
                    base_url=os.environ.get("Z_AI_BASE_URL", "https://api.z.ai/api/paas/v4"))
    model = os.environ.get("Z_AI_MODEL", "glm-4.6")
    zadatak = ("Sredi direktorijum: pregledaj sve fajlove i preimenuj ih u jasna, "
               "uredna imena, uz potvrdu za svaki.")
    print(agent(client, model, zadatak))

if __name__ == "__main__":
    main()
```

**Provere:**

```bash
python r03_v2_agent.py
```

Gledajte terminal kao zajednički trag: svaki korak piše koji alat, sa kojim argumentima, i šta je vratio; kad dođe red na preimenovanje, pitanje je čitko — `d` ili bilo šta drugo. Odbijte namerno jedan predlog i posmatrajte šta agent radi s odbijanjem (dobra reakcija: novi predlog; loša: isti predlog u krug — tada se popravlja opis alata, ne kod). Posle pokretanja: `ls radionica03-sandbox/` — sva imena čista? Pokrenite agenta **drugi put**: kod praznog posla (nema šta da sređuje) dobar agent kratko kaže da je gotovo, i to bez petljanja po fajlovima.

**Tačke koje moraju da sednu:** (1) potvrda živi u alatu, ne u petlji — petlja je generička, alat zna šta je opasno (modul 09 će ovo razviti u suvi rad i dnevnik odluka); (2) `procitaj` pre `preimenuj` se ne dešava slučajno — to piše u opisu alata i sistemskom promptu, i zato opisi jesu interfejs (radionica 02); (3) agent je ~130 linija i **nema ni jednu liniju koju ne biste umeli da objasnite** — pročitajte ga naglas sebi; gde zapnete, tu je vaša rupa iz gradiva, ne magija.

## Vežba 3 — Kočnice: dozvoljene operacije i budžet tokena (50 min)

**Zadatak:** dodajte dve odbrane koje agent nosi u svaki ozbiljan posao: **spisak dozvoljenih operacija** (alat koji nije na spisku — modelu ne postoji; najmanja dozvola iz modula 02) i **budžet tokena** — meki prag koji upozorava u trag, i tvrdi koji prekida zadatak, pre nego što račun eksplodira. Obe su male izmene petlje; velika je disciplina da postoje od početka.

**Rešenje** — sačuvajte kao `r03_v3_kocnice.py` (zahteva `r03_v2_agent.py` pored sebe):

```python
"""Radionica 03, vežba 3 — kočnice: dozvoljene operacije + budžet tokena.

  Z_AI_API_KEY   — obavezno: vaš API ključ (opciono Z_AI_BASE_URL, Z_AI_MODEL)

Koristi alate i prompt iz vežbe 2 (r03_v2_agent.py mora postojati pored).
"""

import json
import os
import sys

from openai import OpenAI

from r03_v2_agent import FUNKCIJE, SH_ALATI, SYSTEM_PROMPT

MEKI_BUDZET = 15_000    # tokena: upozorenje u trag, rad se nastavlja
TVRDI_BUDZET = 30_000   # tokena: prekid zadatka — budžet bez tvrdog limita je dekoracija

def agent_sa_kocnicama(client, model, zadatak: str, max_koraka: int = 20,
                       dozvoljeni: set[str] | None = None,
                       meki: int = MEKI_BUDZET, tvrdi: int = TVRDI_BUDZET) -> str:
    """Petlja iz vežbe 2 + tri kočnice: koraci, dozvoljene operacije, budžet."""
    alati = [a for a in SH_ALATI
             if dozvoljeni is None or a["function"]["name"] in dozvoljeni]
    izvrsioci = {ime: fn for ime, fn in FUNKCIJE.items()
                 if dozvoljeni is None or ime in dozvoljeni}
    poruke = [{"role": "system", "content": SYSTEM_PROMPT},
              {"role": "user", "content": zadatak}]
    potroseno, upozoreno = 0, False
    for korak in range(1, max_koraka + 1):
        odgovor = client.chat.completions.create(
            model=model, messages=poruke, tools=alati, temperature=0.2)
        usage = getattr(odgovor, "usage", None)
        potroseno += getattr(usage, "total_tokens", 0) or 0
        if potroseno >= tvrdi:                        # kočnica 2: tvrdi budžet
            return f"(tvrdi limit budžeta: {potroseno} tokena — zadatak prekinut)"
        if potroseno >= meki and not upozoreno:       # kočnica 2: meki budžet
            upozoreno = True
            print(f"[budžet] meki limit: {potroseno} tokena od {meki}")
        poruka = odgovor.choices[0].message
        if not poruka.tool_calls:
            return poruka.content or ""
        poruke.append(poruka)
        for poziv_ in poruka.tool_calls:
            try:
                argumenti = json.loads(poziv_.function.arguments or "{}")
                rezultat = str(izvrsioci[poziv_.function.name](**argumenti))
            except Exception as g:
                rezultat = f"GREŠKA: {g}"              # i nedozvoljeni alat ovde završi
            print(f"[korak {korak}] {poziv_.function.name}({argumenti}) → {rezultat[:60]}")
            poruke.append({"role": "tool", "tool_call_id": poziv_.id,
                           "content": rezultat})
    return f"(kočnica: dostignut max_koraka={max_koraka})"

def main() -> None:
    api_key = os.environ.get("Z_AI_API_KEY", "")
    if not api_key:
        sys.exit("Nema Z_AI_API_KEY. Postavite environment varijablu pa ponovo pokrenite.")
    client = OpenAI(api_key=api_key,
                    base_url=os.environ.get("Z_AI_BASE_URL", "https://api.z.ai/api/paas/v4"))
    model = os.environ.get("Z_AI_MODEL", "glm-4.6")

    # suvi rad (modul 09): samo opažaji, ništa se ne menja — a kamoli bez potvrde
    zadatak = ("Pregledaj direktorijum i izveštaj koja bi nova imena bila dobra "
               "za svaki fajl — ali ništa nemoj preimenovati.")
    izvestaj = agent_sa_kocnicama(client, model, zadatak,
                                  dozvoljeni={"listaj_fajlove", "procitaj_fajl"})
    print("\n== izveštaj (suvi rad) ==")
    print(izvestaj)

if __name__ == "__main__":
    main()
```

**Provere:**

```bash
python r03_v3_kocnice.py
```

Prvo pokrenite ovako kako jeste: agent ima samo dva alata — preimenovanje za njega ne postoji — pa izveštava predloge bez ijednog dodira po fajlovima. To je **suvi rad** (eng. *dry run*), prvi susret sa modulom 09. Zatim namerno pokvarite spisak (npr. `procitaj_fajlovs` umesto `procitaj_fajl`) i posmatrajte kako izgleda kad model zahteva alat kog nema: dočeka ga `GREŠKA` — greška je odgovor, petlja živi. Za pun rad pustite `dozvoljeni=None` (svi alati) i zadatak iz vežbe 2 — potvrde i dalje štite. Na kraju, namerno spustite `tvrdi=2000` i pokrenite pun zadatak: meki upozori, tvrdi prekine — i svet ostaje ceo, a račun pod kontrolom.

**Tačke koje moraju da sednu:** (1) kočnica koja se testira na bezbedan način (mali budžet, loš spisak) je kočnica koja će raditi i kad zatreba; (2) dozvoljene operacije se filtriraju pre poziva modela — model ne vidi nedozvoljene alate, i to je bezbednost po dizajnu, ne po molbi; (3) redosled u kodu: budžet se proverava odmah po odgovoru, pre no što se rezultat iskoristi — kočnica koja kasni, ne koči.

## Domaći

- Proširiti agenta sa jednim alatom po izboru i pokrenuti ga na tri različita zadatka; zapisati gde je odstupio od plana i zašto.
- Isključiti ograničenje `max_koraka` (namerno!) i dokumentovati šta se desilo sa troškom posle 30+ koraka — bolje sada, na 50 dinara, nego posle na 50 evra.
- Za napredne: sažeti istoriju razgovora kada pređe N tokena (prvi susret sa modulom 05).
- Sa rezultatima iz treće tačke doći na [radionicu 04](radionica-04-rag-memorija.md): tamo rešavamo baš to — pamćenje van prozora.

## Materijali — checklist za učesnike

- [ ] odrađene radionice 01 i 02 (alati rade, ključ u environment varijabli);
- [ ] test direktorijum `radionica03-sandbox/` sa 5 neurednih fajlova (skripta u „Pripremi");
- [ ] [modul 03](../moduli/modul-03-agent-od-nule.md) pročitan barem do sekcije 3 (radionica ide istim redom);
- [ ] tri fajla u radnom direktorijumu: `r03_v1_skelet.py`, `r03_v2_agent.py`, `r03_v3_kocnice.py` — rastu iz vežbe u vežbu;
- [ ] čitav rad u virtuelnom okruženju, projekat u Git-u (ovo je već navika, zar ne?).

## Za voditelja

- Poruka radionice koju ponoviti tri puta: **nije magija, petlja je.** Kada je učesnici jednom napišu, frameworki postaju izbor, a ne misterija.
- Vežba 1 je vaš osigurani tempo: ko završi ranije, neka doda treći alat lažnom modelu (npr. `danasnji_datum`) i scenario gde ga model zove pogrešnim imenom — greška kao odgovor, još uvek bez mreže.
- Sandbox obavezno pratiti `git init`-om u njemu — najlakši „undo" za čitav direktorijum; odbijanja potvrda namerno pokazati na projektoru (reakcija agenta na odbijanje je najbolja diskusija drugog sata).
- Isplanirati 2. sat pažljivo: prvi stvarni poziv modela je trenutak kada svi gledaju poruke o greškama; najčešći kvarovi: environment varijabla postavljena u drugom terminalu, i model koji preimenuje a da prvo nije pročitao (lek: opis alata, ne pretnja promptu).
- Za 4. sat pripremiti unapred sačuvan trag jednog pokretanja (izlaz u fajl) — autopsija traga radi i bez mreže, a pokazuje i pad: čitajte ga sa tri pitanja iz modula 03 (šta je hteo, šta je radio, gde je skrenuo).
- Ako grupa zaostaje: vežbu 1 svesti na scenario A, vežbu 3 na pokretanje u suvom režimu. Ne skraćivati vežbu 2 — ona je srce radionice.
