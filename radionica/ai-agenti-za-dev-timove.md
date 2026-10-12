# Radionica „AI agenti za dev timove"

> **Trajanje:** 2 časa · **Format:** 20% priča / 80% praksa · **Učesnici:** 4–12, u parovima ili sami
> **Materijal:** [CC BY 4.0](../LICENSE) — posle radionice ostaje timu
> **Povezani moduli kursa:** pre — [modul 00](../moduli/modul-00-uvod-u-agente.md), [modul 02](../moduli/modul-02-alati-tool-use.md) (sekcije 1–3); posle — [modul 03](../moduli/modul-03-agent-od-nule.md), [modul 07](../moduli/modul-07-evaluacija-agenata.md), [modul 08](../moduli/modul-08-multi-agent-sistemi.md)
> **Javni rep kursa:** <https://github.com/acailic/ai-agenti-srb>

Ovo je paket za plaćenu radionicu od dva časa, namenjen razvojnim timovima (eng. *dev teams*) koji žele praktičan uvod u AI agente — ne slajdove, nego kod koji tim sam piše. Ovaj dokument je materijal za izvođenje: agenda, tri vežbe sa rešenjima i facilitatorske beleške. Komercijalni jednostrani pregled (za koga, šta, cena) je u [PONUDA.md](PONUDA.md).

## Za koga je (i za koga nije)

**Za koga je:** razvojni tim od 4 do 12 ljudi koji je čuo za agente, možda već koristi Copilot ili ChatGPT, ali nije sam napisao petlju agenta (eng. *agent loop*) i ne zna kako se takav sistem proverava. Pretpostavke po učesniku: osnovni Python (promenljive, funkcije, pokretanje skripte, ugađanje u JSON). Iskustvo sa mašinskim učenjem nije potrebno.

**Za koga nije:** tim koji traži pregled komercijalnih platformi i poređenje ponuđača; tim bez ijednog učesnika koji ume da pokrene Python skriptu (tada prvo samostalno odrađiti [modul 00](../moduli/modul-00-uvod-u-agente.md) i [modul 01](../moduli/modul-01-osnove-llm.md)); pojedinci van tima (format je namerno timski).

## Cilj radionice

Za dva časa tim **sam piše**, a ne gleda: (1) petlju agenta od nule, bez frameworka, sa alatima i tri izlaza; (2) mali evaluacioni skup (eng. *evaluation set*) koji meri da li agent stvarno radi, sa stopom prolaznosti (eng. *pass rate*); (3) jedan višeagentski scenario (eng. *multi-agent scenario*) — pregledač i popravljač u rundama, sa granicom rundi. Poruka koja se ponavlja celu radionicu: **nije magija, petlja je.** Kad je tim jednom napiše, frameworki i platforme postaju izbor, a ne misterija.

Sve tri vežbe rade **bez mreže i bez API ključa**, na lažnom modelu (eng. *mock*) — identične poruke kao pravi API, samo skriptirane. Ko ima ključ, na kraju vežbe 1 zamenjuje mozak pravim pozivom modela u nekoliko linija.

## Agenda (120 minuta)

| Vreme | Sadržaj |
|---|---|
| **0:00–0:15** | Uvod (15 min): šta je agent u odnosu na chatbot — petlja opažaj → razmišljaj → deluj; zašto prvo bez frameworka. Živi demo voditelja: agent sortira tiket pred očima tima. |
| **0:15–0:55** | **Vežba 1 (40 min):** agent od nule — sortiranje dolaznih tiketa (eng. *ticket triage*). Alati, petlja, tri izlaza; na lažnom modelu, pa ko ima ključ — live. |
| **0:55–1:25** | **Vežba 2 (30 min):** evaluacija — da li agent stvarno sortira dobro? Evaluacioni skup od 12 scenarija, provere u kodu, stopa prolaznosti, prag za odluku. |
| **1:25–1:50** | **Vežba 3 (25 min):** tim agenata — pregledač i popravljač pregledaju „patch", razmena poruka u rundama, granica rundi, konačni verdikt. |
| **1:50–2:00** | Zatvaranje (10 min): šta tim ima u rukama, mapa kursa za dalje (moduli 03, 07, 08), dogovor o prvom sopstvenom slučaju upotrebe. |

Priča je 25 od 120 minuta (~20%); praksa je 95 minuta (~80%). Vremenske granice su čvrste, sadržaj unutar njih fleksibilan — vidi [facilitatorske beleške](#za-voditelja-facilitatorske-beleške).

## Priprema (pre radionice)

**Učesnici** (odraditi zajedno na početku, 3 minuta): Python 3.10+, kloniran [javni rep kursa](https://github.com/acailic/ai-agenti-srb) ili raspoređen ZIP, jedan terminal po učesniku (ili paru). Instalacija: `pip install openai` — **samo** za opcioni live blok na kraju vežbe 1; sve ostalo je čist Python. API ključ `Z_AI_API_KEY` je opcion: bez njega radi sve, sa njim i live deo.

**Voditelj:** vidi [beleške za voditelja](#za-voditelja-facilitatorske-beleške) — minimum opreme, offline varijanta i najčešći kvarovi.

## Scenario dana: podrška fiktivnog proizvoda „Kratak spoj"

Fiktivni mali SaaS prima tikete na jednu adresu, a tri tima ih preuzimaju: **Backend** (kvarovi), **Proizvod** (poboljšanja) i **Podrška** (pitanja korisnika). Sortiranje dolaznih tiketa (eng. *ticket triage*) je dosadan, ponovljiv posao s jasnim pravilima — tačno ono što je dobar prvi agent: koristan, mali i merljiv. Na istom scenariju rade sve tri vežbe: vežba 1 gradi agenta koji sortira, vežba 2 meri koliko dobro sortira, vežba 3 spaja dva agenta koja pregledaju i poprave zakrpu (eng. *patch*) pre nego što stigne u glavnu granu.

---

## Vežba 1 — Agent od nule: sortiranje tiketa (40 min)

**Zadatak:** napišite agenta koji jedan dolazni tiket pročita, kategorizuje i dodeli timu — bez frameworka, u jednom fajlu. Agent ima **dva alata**: `procitaj_tiket(id)` (čita iz baze tiketa u kodu) i `dodeli_timu(id, tim)` (upisuje dodelu). Petlja je ista kao u pravom sistemu: pošaljete poruke modelu, model traži poziv alata (eng. *tool call*), vi izvršite alat i vratite rezultat, model nastavlja — dok ne da konačan odgovor. **Tri izlaza:** konačan odgovor, prekoračen broj koraka (eng. *max steps*), greška alata.

Mozak je lažni model: funkcija koja prima iste poruke kao pravi API i vraća isti oblik odgovora, ali odlučuje po jednostavnom pravilu (ključne reči u tekstu tiketa). To nam omogućava da petlju napišemo i testiramo **bez mreže** — a kasnije zamenimo mozak pravim pozivom, bez dodirivanja petlje.

Radite u parovima: jedna osoba piše alate i bazu, druga petlju; pa zamenite. Ko zapne na redu, celo rešenje je ispod — čitanje rešenja uz pisanje je legitimna tehnika, kopiranje bez čitanja nije.

**Rešenje** — sačuvajte kao `v1_agent.py` (čist Python, bez mreze):

```python
"""Vežba 1 — agent od nule: sortiranje tiketa za 'Kratak spoj'.

Pokretanje: python v1_agent.py t-101
Radi bez mreze i bez API kljuca: mozak je lažni model (mock).
"""

import json
import sys
from types import SimpleNamespace

# --- baza tiketa: 12 ulaznih tiketa (ista za celu grupu) -----------------------

TIKETI = {
    "t-101": {"naslov": "Login pada na iOS 17",
              "tekst": "Od jutrasnje verzije aplikacija pada cim korisnik dodje na login."},
    "t-102": {"naslov": "Dodajte izvoz u PDF",
              "tekst": "Zeleo bih mogucnost izvoza izvestaja u PDF, ne samo CSV."},
    "t-103": {"naslov": "Kako se menja cena pretplate?",
              "tekst": "Da li se cena menja automatski ili je moram ja da promenim?"},
    "t-104": {"naslov": "API vraca 500 pri pretrazi",
              "tekst": "Pretraga po tagovima baca 500 gresku od juce."},
    "t-105": {"naslov": "Export podataka ne radi",
              "tekst": "Kad kliknem na Export, nista se ne desi. Radilo je prošle nedelje."},
    "t-106": {"naslov": "Tamna tema",
              "tekst": "Zeleo bih tamnu temu u pregledu izvestaja."},
    "t-107": {"naslov": "Gde se vidi istorija faktura?",
              "tekst": "Ne mogu da nadem istoriju faktura u novom dizajnu."},
    "t-108": {"naslov": "Webhook stiže dva puta",
              "tekst": "Isti webhook nam stize po dva puta, pravimo duplikate."},
    "t-109": {"naslov": "Dupli naplatni podaci",
              "tekst": "Kartica nam je naplacena dvaput za isti mesec, molim ispravku."},
    "t-110": {"naslov": "Podsetnik za obnovu licence",
              "tekst": "Zeleo bih automatski podsetnik mesec dana pre isteka licence."},
    "t-111": {"naslov": "Nedovoljno jasno",
              "tekst": "Nesto ne valja, ali ne znam tacno sta; kod nas u firmi sve sporije radi."},
    "t-112": {"naslov": "Mobile app se zatvara sama",
              "tekst": "Aplikacija na telefonu se zatvori nakon nekoliko sekundi."},
}

TIMOVI = ("Backend", "Proizvod", "Podrška")
DODELE = []  # trag svih dodela u ovoj sesiji

# --- alati: jedan opažaj (čitanje) i jedna potvrđena akcija (upis) ------------

def procitaj_tiket(tid: str) -> dict:
    if tid not in TIKETI:
        return {"greska": f"NEZNAM: nema tiketa {tid}"}
    t = TIKETI[tid]
    return {"id": tid, "naslov": t["naslov"], "tekst": t["tekst"]}

def dodeli_timu(tid: str, tim: str) -> dict:
    if tid not in TIKETI:
        return {"greska": f"NEZNAM: nema tiketa {tid}"}
    if tim not in TIMOVI:
        return {"greska": f"NEZNAM: tim mora biti jedan od {TIMOVI}"}
    DODELE.append({"tiket": tid, "tim": tim})
    return {"ok": True, "tiket": tid, "tim": tim}
```

```python
# --- lažni model: poruke istog oblika kao pravi API ---------------------------

BUG_RECI = ("pada", "gresk", "ne radi", "500", "dupl", "zatvor")
FEATURE_RECI = ("zeleo", "dodajte", "mogucnost", "temu", "podsetnik")

def _kategorisi(tiket: dict) -> str:
    tekst = (tiket["naslov"] + " " + tiket["tekst"]).lower()
    if any(r in tekst for r in BUG_RECI):
        return "bug"
    if any(r in tekst for r in FEATURE_RECI):
        return "poboljšanje"
    return "pitanje"

KATEGORIJA_U_TIM = {"bug": "Backend", "poboljšanje": "Proizvod", "pitanje": "Podrška"}

def _poziv_alata(poziv_id: str, ime: str, argumenti: str) -> dict:
    """Pomoćnik: poruka assistant sa jednim tool_calls, kao iz pravog API-ja."""
    return {"role": "assistant", "content": None,
            "tool_calls": [{"id": poziv_id, "type": "function",
                            "function": {"name": ime, "arguments": argumenti}}]}

def lazni_model(poruke: list) -> SimpleNamespace:
    """Mozak: gleda dosadasnju razmenu i bira sledeci korak po pravilu."""
    prosli = [p for p in poruke if p.get("role") == "tool"]
    tiket_id = json.loads(poruke[0]["content"])  # prva user poruka je id

    if not prosli:  # korak 1: prvo procitaj tiket
        return SimpleNamespace(choices=[SimpleNamespace(
            message=_poziv_alata("a1", "procitaj_tiket", json.dumps({"tid": tiket_id})))])

    citanje = next((p for p in prosli if "naslov" in p["content"]), None)
    dodela = next((p for p in prosli if '"ok"' in p["content"]), None)

    if citanje is None:  # alat je vratio NEZNAM — uredno odustani
        return SimpleNamespace(choices=[SimpleNamespace(
            message={"role": "assistant",
                     "content": f"Tiket {tiket_id} ne postoji u bazi "
                                f"(NEZNAM); vratiti pošiljaocu na proveru."})])

    if not dodela:  # korak 2: kategorisi i dodeli
        tiket = json.loads(citanje["content"])
        tim = KATEGORIJA_U_TIM[_kategorisi(tiket)]
        return SimpleNamespace(choices=[SimpleNamespace(
            message=_poziv_alata("a2", "dodeli_timu",
                                 json.dumps({"tid": tiket_id, "tim": tim})))])

    # korak 3: konačan odgovor
    d = json.loads(dodela["content"])
    return SimpleNamespace(choices=[SimpleNamespace(
        message={"role": "assistant",
                 "content": f"Tiket {d['tiket']} je kategorizovan i dodeljen "
                            f"timu {d['tim']}."})])

# --- petlja agenta: tri izlaza — odgovor, max koraka, nepoznat alat ------------

MAX_KORAKA = 5
ALATI = {"procitaj_tiket": procitaj_tiket, "dodeli_timu": dodeli_timu}

def u_recnik(poruka) -> dict:
    """Poruka kao običan rečnik — kakav god mozak vratio (dict sa mock-a ili
    objekat iz pravog SDK-a); petlja uvek radi sa istim oblikom."""
    if isinstance(poruka, dict):
        return poruka
    pozivi = [{"id": p.id, "type": "function",
               "function": {"name": p.function.name,
                            "arguments": p.function.arguments}}
              for p in (poruka.tool_calls or [])]
    return {"role": poruka.role, "content": poruka.content,
            "tool_calls": pozivi}

def pokreni_petlju(mozak, tid: str) -> str:
    poruke = [{"role": "user", "content": json.dumps(tid)}]
    for korak in range(1, MAX_KORAKA + 1):
        odgovor = u_recnik(mozak(poruke).choices[0].message)
        poruke.append(odgovor)
        pozivi = odgovor.get("tool_calls")
        if not pozivi:
            return odgovor["content"]  # izlaz 1: konačan odgovor
        for poziv in pozivi:
            ime = poziv["function"]["name"]
            argumenti = json.loads(poziv["function"]["arguments"])
            if ime not in ALATI:
                return f"GREŠKA: nepoznat alat {ime}"  # izlaz 3
            poruke.append({"role": "tool", "tool_call_id": poziv["id"],
                           "content": json.dumps(ALATI[ime](**argumenti),
                                                 ensure_ascii=False)})
    return "GREŠKA: prekoračen broj koraka"  # izlaz 2

def pokreni(tid: str) -> str:
    return pokreni_petlju(lazni_model, tid)

if __name__ == "__main__":
    print(pokreni(sys.argv[1] if len(sys.argv) > 1 else "t-101"))
```

Pokrenite sa `python v1_agent.py t-104`, pa probajte `t-111` (namerno mutan: nema jasnih ključnih reči, pa pravilo pada na „pitanje" i tim Podrška — razumna odbrana od nagađanja) i `t-109` (dupla naplata: po ključnoj reči „dupl-" agent kaže Backend, a čovek iz podrške preusmerio bi ga sebi — zapamtite taj tiket, vraćamo mu se u vežbi 2). Zatim pokvarite nešto namerno: `python v1_agent.py t-999` — alat vraća NEZNAM, i agent ipak završi uredno.

**Debrief (5 min, na kraju vežbe):** gde u kodu je „agent"? Samo funkcija `pokreni_petlju` — petnaestak linija. Sve ostalo su alati i mozak. Tri izlaza nisu ukras: bez `MAX_KORAKA` agent koji se zaglavi troši novac zauvek, a bez greške na nepoznat alat pucate na prvoj promeni imena. Argumenti alata stižu kao **JSON tekst** koji vi parsirate — zato model ume da „pogreši" argument: to je string, ne poziv funkcije (detaljno u [modulu 02](../moduli/modul-02-alati-tool-use.md)).

**Live varijanta (ko ima ključ, ~10 min):** zamenite samo `lazni_model` pravim pozivom; petlja i alati ostaju netaknuti:

```python
# v1_live.py — mozak pravog modela, ista petlja iz v1_agent.py
import json, os
from openai import OpenAI
from v1_agent import pokreni_petlju

klijent = OpenAI(api_key=os.environ["Z_AI_API_KEY"],
                 base_url=os.getenv("Z_AI_BASE_URL", "https://api.z.ai/api/paas/v4"))

def pravi_model(poruke):
    return klijent.chat.completions.create(
        model=os.getenv("Z_AI_MODEL", "glm-4.6"),
        messages=poruke,
        tools=[{"type": "function", "function": {
            "name": "procitaj_tiket",
            "description": "Vraca naslov i tekst tiketa po identifikatoru.",
            "parameters": {"type": "object",
                           "properties": {"tid": {"type": "string"}},
                           "required": ["tid"]}}},
               {"type": "function", "function": {
            "name": "dodeli_timu",
            "description": "Dodeljuje tiket jednom od timova.",
            "parameters": {"type": "object",
                           "properties": {"tid": {"type": "string"},
                                          "tim": {"type": "string"}},
                           "required": ["tid", "tim"]}}}])

print(pokreni_petlju(pravi_model, "t-111"))
```

Petlja prima mozak kao argument, a svaku njegovu poruku provlači kroz `u_recnik` — mock već vraća rečnik, a objekat pravog SDK-a (`choices[0].message`) pretvara u isti običan rečnik sa `role`, `content` i `tool_calls`, pa je razmena sa pravim API-jem istog oblika kao sa lažnim. Prava lekcija zamene: **petlja ne zna koji je mozak** — nijedno ime mozga nije ukucano u nju (eng. *hard-code*), ona ga samo prima kao argument i traži jednu stvar: da poruka stigne u obliku koji razume. To je podela koju vredi osetiti rukama.

---

## Vežba 2 — Evaluacija: da li agent stvarno sortira dobro? (30 min)

**Zadatak:** napišite evaluacioni skup (eng. *evaluation set*) za agenta iz vežbe 1: 12 scenarija — po jedan za svaki tiket — gde svaki scenario ima `id`, `ulaz` (identifikator tiketa), `ocekivano` (tim kome tiket zaista pripada po dogovorenoj tabeli tima) i `provere` (mehanička pravila nad izlaznom rečenicom: sadrži ime tima, ne sadrži GREŠKA). Zatim runner: pokrene agenta na svakom scenariju, primeni provere, izračuna stopu prolaznosti i uporedi je sa pragom — **izlazni kod 0 ili 1**, da bi se moglo uklopiti u CI.

Pravilo „očekivano" donosi tim, ne pisac prompta: uzorak ispod sadrži dogovorenu istinu podrške „Kratkog spoja", u kojoj naplatne tikete (uključujući `t-109`) preuzima Podrška. Setite se šta je agent uradio sa `t-109` u vežbi 1 — upravo to merimo.

**Rešenje** — sačuvajte kao `v2_eval.py` (bez mreze — agent je lažni, pa je i merenje besplatno i ponovljivo):

```python
"""Vežba 2 — evaluacija agenta za sortiranje tiketa.

Pokretanje: python v2_eval.py
Izlazni kod: 0 ako je stopa prolaznosti iznad praga, inače 1.
Zahteva v1_agent.py u istom direktorijumu.
"""

import sys
from v1_agent import pokreni

PRAG = 0.80  # ispod ovoga ne bismo pustili agenta u probni režim

SCENARIJI = [
    {"id": "kvar-login", "ulaz": "t-101", "ocekivano": "Backend",
     "provere": [{"tip": "sadrzi", "vrednost": "Backend"}]},
    {"id": "izvoz-pdf", "ulaz": "t-102", "ocekivano": "Proizvod",
     "provere": [{"tip": "sadrzi", "vrednost": "Proizvod"}]},
    {"id": "cena-pretplate", "ulaz": "t-103", "ocekivano": "Podrška",
     "provere": [{"tip": "sadrzi", "vrednost": "Podrška"}]},
    {"id": "api-500", "ulaz": "t-104", "ocekivano": "Backend",
     "provere": [{"tip": "sadrzi", "vrednost": "Backend"}]},
    {"id": "export-tiho", "ulaz": "t-105", "ocekivano": "Backend",
     "provere": [{"tip": "sadrzi", "vrednost": "Backend"}]},
    {"id": "tamna-tema", "ulaz": "t-106", "ocekivano": "Proizvod",
     "provere": [{"tip": "sadrzi", "vrednost": "Proizvod"}]},
    {"id": "istorija-faktura", "ulaz": "t-107", "ocekivano": "Podrška",
     "provere": [{"tip": "sadrzi", "vrednost": "Podrška"}]},
    {"id": "webhook-dvaput", "ulaz": "t-108", "ocekivano": "Backend",
     "provere": [{"tip": "sadrzi", "vrednost": "Backend"}]},
    {"id": "dupla-naplata", "ulaz": "t-109", "ocekivano": "Podrška",
     "provere": [{"tip": "sadrzi", "vrednost": "Podrška"}]},
    {"id": "podsetnik-licenca", "ulaz": "t-110", "ocekivano": "Proizvod",
     "provere": [{"tip": "sadrzi", "vrednost": "Proizvod"}]},
    {"id": "muto-nejasno", "ulaz": "t-111", "ocekivano": "Podrška",
     "provere": [{"tip": "sadrzi", "vrednost": "Podrška"}]},
    {"id": "app-se-zatvara", "ulaz": "t-112", "ocekivano": "Backend",
     "provere": [{"tip": "sadrzi", "vrednost": "Backend"}]},
]
for s in SCENARIJI:  # svakom scenariju dodajemo i ne_sadrzi proveru
    s["provere"].append({"tip": "ne_sadrzi", "vrednost": "GREŠKA"})

def provera_je_ok(izlaz: str, p: dict) -> bool:
    if p["tip"] == "sadrzi":
        return p["vrednost"] in izlaz
    if p["tip"] == "ne_sadrzi":
        return p["vrednost"] not in izlaz
    raise ValueError(f"nepoznat tip provere: {p['tip']}")

def main() -> int:
    prosli = 0
    for s in SCENARIJI:
        izlaz = pokreni(s["ulaz"])
        padovi = [p for p in s["provere"] if not provera_je_ok(izlaz, p)]
        status = "OK " if not padovi else "PAD"
        print(f"[{status}] {s['id']}: {izlaz}")
        if padovi:
            print(f"       => pala provera: {padovi}")
        prosli += not padovi
    stopa = prosli / len(SCENARIJI)
    print(f"\nStopa prolaznosti: {prosli}/{len(SCENARIJI)} ({stopa:.0%}), prag {PRAG:.0%}")
    return 0 if stopa >= PRAG else 1

if __name__ == "__main__":
    sys.exit(main())
```

Pokrenite `python v2_eval.py; echo "izlazni kod: $?"`. Očekivano: jedanaest zelenih i **jedan crveni — `dupla-naplata`**: agent kaže Backend, a dogovor tima kaže Podrška. Stopa 11/12 (92%) je iznad praga, pa je izlazni kod 0 — ali crveni scenario je razlog zašto ovaj skup postoji: bez njega bi greška živela tiho u produkciji.

**Popravka u jednom potezu (A/B, 10 min, za brže timove):** otvorite `v1_agent.py` i zamenite celu funkciju `_kategorisi` ovom verzijom (novo je samo prvo pravilo — naplatni tekstovi idu podršci pre bilo koje ključne reči):

```python
def _kategorisi(tiket: dict) -> str:
    tekst = (tiket["naslov"] + " " + tiket["tekst"]).lower()
    if "napla" in tekst:
        return "pitanje"  # naplatne tikete preuzima Podrška, ne bug red
    if any(r in tekst for r in BUG_RECI):
        return "bug"
    if any(r in tekst for r in FEATURE_RECI):
        return "poboljšanje"
    return "pitanje"
```

Pokrenite `v2_eval.py` ponovo: 12/12. To je cela ideja evaluacije u malom — izmena bez skupa je kocka, izmena sa skupom je potez koji se **vidi**: jedanaest starih scenarija su i dalje zeleni, a jedini crveni je ozelenio. U pravom timu tu tabelu rezultata čuvate verzionisanu pored koda, pa `git diff` pokazuje i šta se promenilo i po ceni (detalji i regresione provere: [modul 07](../moduli/modul-07-evaluacija-agenata.md)).

**Debrief (3 min):** provere su namerno glupe i jeftine — `sadrzi` ime tima. To nije lenjost: prvo mehaničko, pa tek onda pametno (ocenjivanje pomoću modela, eng. *LLM-as-a-judge*). I najgluplja provera koja postoji vredi više od utiska „deluje dobro".

---

## Vežba 3 — Tim agenata: pregledač i popravljač (25 min)

**Zadatak:** dva agenta pregledaju i poprave zakrpu (eng. *patch*) pre nego što stigne u glavnu granu. **Pregledač** čita zakrpu i vraća primedbe; **Popravljač** čita primedbe i vraća izmenjenu zakrpu; **vodilja** (eng. *orchestrator*) vodi razmenu u rundama: dok ima primedbi — popravi pa pregledaj opet, najviše tri runde, pa verdikt: odobreno ili vraćamo čoveku. Poruke imaju oblik pravog višeagentskog sistema: pošiljalac, primalac, tekst — u procesu, bez mreže (isti oblik razmišljanja kao protokoli iz [modula 06](../moduli/modul-06-protokoli-mcp-a2a.md), a uloge i granice rundi su iz [modula 08](../moduli/modul-08-multi-agent-sistemi.md)).

Radite u istim parovima: jedna osoba Pregledač, druga Popravljač, petlja na zajedničkom ekranu. Rok je kratak namerno: rok rundi je deo vežbe, ne smetnja.

**Rešenje** — sačuvajte kao `v3_tim.py` (bez mreze):

```python
"""Vežba 3 — tim agenata: Pregledač i Popravljač u rundama.

Pokretanje: python v3_tim.py
Mozgovi su pravila u kodu (bez mreze), ali razmena poruka ima oblik
pravog višeagentskog sistema: pošiljalac, primalac, tekst, runde, trag.
"""

PATCH = '''\
def obradi_zahtev(podatak):
    print("debug: usao u obradi_zahtev")   # DEBUG
    if podatak is None:
        raise ValueError("prazan podatak")
    # TODO: dodati logovanje kad bude potrebno
    return podatak.upper()
'''

PRAVILA = [
    ("TODO", "u zakrpi je ostalo TODO obeležje — rad je nedovršen"),
    ("print(", "u zakrpi je ostao debug print umesto logovanja"),
]

OPIS_U_FIKS = {
    "u zakrpi je ostalo TODO obeležje — rad je nedovršen":
        ("    # TODO: dodati logovanje kad bude potrebno\n",
         "    # logovanje: dogovoreno za sledecu iteraciju\n"),
    "u zakrpi je ostao debug print umesto logovanja":
        ('    print("debug: usao u obradi_zahtev")   # DEBUG\n', ""),
}

def mozak_pregledaca(patch: str) -> list:
    """Pregledač: cita zakrpu i vraca primedbe po pravilima."""
    return [opis for marker, opis in PRAVILA if marker in patch]

def mozak_popravljaca(patch: str, primedbe: list) -> str:
    """Popravljač: cita primedbe i uklanja njihove uzroke iz zakrpe."""
    for opis in primedbe:
        staro, novo = OPIS_U_FIKS[opis]
        patch = patch.replace(staro, novo)
    return patch

def poruka(od: str, ka: str, tekst: str) -> dict:
    return {"od": od, "ka": ka, "tekst": tekst}

def vodilja(patch: str, max_rundi: int = 3):
    """Vodi razmenu do verdikta; vraca (verdikt, trag razmene)."""
    trag = []
    for runda in range(1, max_rundi + 1):
        primedbe = mozak_pregledaca(patch)
        if not primedbe:
            trag.append(poruka("Pregledač", "Vodilja",
                               f"runda {runda}: nema primedbi."))
            return "odobreno", trag
        trag.append(poruka("Pregledač", "Popravljač",
                           f"runda {runda}: " + "; ".join(primedbe)))
        patch = mozak_popravljaca(patch, primedbe)
        trag.append(poruka("Popravljač", "Pregledač",
                           f"runda {runda}: uklonjene primedbe, nova verzija spremna."))
    trag.append(poruka("Vodilja", "covek",
                       f"dostignuta granica rundi ({max_rundi})."))
    return "vratiti coveku na razmatranje", trag

if __name__ == "__main__":
    verdikt, trag = vodilja(PATCH)
    for p in trag:
        print(f"{p['od']} -> {p['ka']}: {p['tekst']}")
    print("Verdikt:", verdikt)
```

Pokrenite `python v3_tim.py`: dve runde — prva nalazi obe primedbe, druga čistu zakrpu — i verdikt „odobreno". Zatim eksperiment za kraj: u `PATCH` vratite `# TODO` red, a u `OPIS_U_FIKS` pokvarite ključ jednog opisa (dve izmenjene reči) — Popravljač pada na `KeyError`, a vi vidite zašto ugovor između agenata (oblik poruka) mora biti pod jednakom disciplinom kao ugovor alata iz vežbe 1.

**Debrief (3 min):** tri stvari su prenete iz prethodnih vežbi, samo na više strana: granica rundi je `MAX_KORAKA` iz vežbe 1; trag razmene je ono što biste logovali i na produkciji (bez traga nema otklanjanja grešaka); verdikt „vratiti čoveku" je poslednja linija odbrane — sistem zna gde je njegova granica.

---

## Zatvaranje — šta tim ima u rukama i gde dalje (10 min)

Na kraju radionice tim ima tri fajla koje je sam (u parovima) napisao: petlju agenta sa alatima i tri izlaza, evaluacioni skup sa runnerom i pragom, i dvoagentsku razmenu u rundama — plus dogovor o prvom sopstvenom slučaju upotrebe. Predloženi prvi korak posle radionice (nedelju dana): izabrati **jedan** ponovljiv zadatak sa jasnim pravilima (kao sortiranje tiketa), prepisati petlju iz vežbe 1, napisati 15 scenarija iz vežbe 2 i pustiti u probni režim tek kad stopa pređe prag. Mapa kursa za samostalni nastavak (sve besplatno, na srpskom, u [javnom repu](https://github.com/acailic/ai-agenti-srb)):

| Kada | Modul | Zašto |
|---|---|---|
| Pre radionice (opciono) | [00 — Uvod u agente](../moduli/modul-00-uvod-u-agente.md), [02 — Alati](../moduli/modul-02-alati-tool-use.md) (sekcije 1–3) | Zajednički rečnik i pozadina poziva alata. |
| Odmah posle | [03 — Agent od nule](../moduli/modul-03-agent-od-nule.md) | Vežba 1, ali punim tempom: memorija, skelet proširen, pravi model. |
| Posle | [07 — Evaluacija agenata](../moduli/modul-07-evaluacija-agenata.md) | Vežba 2 u veliko: JSONL skupovi, ocenjivanje pomoću modela, regresije. |
| Posle | [08 — Multi-agent sistemi](../moduli/modul-08-multi-agent-sistemi.md) | Vežba 3 u veliko: uloge, runde, transfer konteksta, koordinate. |
| Pre prvog produkcijkog agenta | [09 — U produkciju](../moduli/modul-09-u-produkciju.md) | Bezbednost, opservabilnost, troškovi — ono što se pita kad agent radi „u živo". |
| Za portfolio | [10 — Završni projekat](../moduli/modul-10-zavrsni-projekat.md) | Sve spojeno u sopstvenog isporučenog agenta. |

## Za voditelja (facilitatorske beleške)

**Poruka koju ponoviti tri puta:** nije magija, petlja je. Kad učesnici jednom napišu `pokreni`, frameworki su izbor, a ne misterija.

**Tempo.** Vežba 1 je vaš osigurani tempo: ko završi ranije, neka doda treći alat (`danasnji_datum`) i scenario u kojem lažni model zove alat pogrešnim imenom. Spori timovi: preskočite live blok vežbe 1 (dolazi na zatvaranje kao demo na vašem računaru) i vežbu 3 radite zajedno na projektoru — redosled i poruka prežive, samo se obim smanji. Pola sata po vežbi je čvrsto: na pola preostalog vremena saopštite koliko ima do kraja vežbe, i držite se toga.

**Najčešći kvarovi i lekovi:**

- `ModuleNotFoundError: v1_agent` — fajlovi nisu u istom direktorijumu, ili se na Windowsu fajl zove `v1_agent.py.txt` (lek: `dir` i preimenovanje).
- `SyntaxError` u PATCH bloku — tri znaka navoda zaredom; string je sa tri navodnika, sadržaj samo obične.
- `KeyError` u `OPIS_U_FIKS` — to je namereni eksperiment na kraju vežbe 3; ako se pojavi ranije, neko je menjao opis primedbe a ne i ključ.
- Live blok: environment varijabla postavljena u jednom terminalu, a pokrenut drugi; ili 401 — pogrešan ključ. Lek je uvek isti: `echo $Z_AI_API_KEY | head -c 8` u istom terminalu.
- Agent „ništa ne radi" — proverite da li je pokrenut poslednji sačuvani fajl; najviše zbunjuje editor sa nesnimljenim baferom.

**Minimum opreme:** projektor i zid na kome se vidi kod (font 16pt+), jedan laptop po učesniku ili paru, struja i produžni kablovi, flipčart ili tabla za dogovor o „očekivanom" u vežbi 2 (tamo se najviše diskutuje). Mreža je potrebna **samo** za opcioni live blok i za kloniranje repa pre radionice.

**Offline varijanta (potpuna):** sve tri vežbe rade bez mreže i bez ključa — lažni modeli su namerno takvi. Ako je mreža izdata ili nestane: live blok preskočite ili ga izvedite sa svog laptopa na projektoru; rep i dalje možete podeliti sa USB sticka (ZIP pre puta). Ako i to padne: sva rešenja su u ovom dokumentu — radionica se može odradati čitanjem i tipkanjem koda sa projektora.

**O ključu (bezbednost):** ključ samo u environment varijabli, nikad u kodu i nikad u četu. Učesnicima ne delite svoj ključ — live deo radi voditelj sa svog računara; tim koji želi svoj ključ dobije uputstvo iz [modula 01](../moduli/modul-01-osnove-llm.md). Trošak live bloka je nekoliko hiljada tokena — zanemarljivo.

**Za prvi tim (pilot):** posle radionice popunite sa timom tri pitanja — šta je bilo najkorisnije, gde ste zapeli, koji zadatak biste prvi dali agentu — i zapišite gde je koji par zapao u 40. minutu vežbe 1 (to je vaš najbolji pokazatelj za sledeću iteraciju paketa). Pilot je ugovoren popustom za pisanu referencu: vidi [PONUDA.md](PONUDA.md).

## Materijali — checklist

- [ ] Ovaj dokument (`ai-agenti-za-dev-timove.md`) otvoren kod voditelja i učesnika.
- [ ] `v1_agent.py`, `v2_eval.py`, `v3_tim.py` — pišu učesnici; rešenja su u ovom dokumentu, sekcije vežbi.
- [ ] [PONUDA.md](PONUDA.md) poslata organizatoru pre radionice (agenda i priprema učesnika).
- [ ] Za live blok (opciono): `pip install openai`, `Z_AI_API_KEY` u environment varijabli — samo na voditeljevom računaru.
- [ ] Sadržaj je licenciran [CC BY 4.0](../LICENSE): tim može zadržati, prilagoditi i dalje koristiti sve materijale uz navođenje izvora.
