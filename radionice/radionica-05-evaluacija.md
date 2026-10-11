# Radionica 05 — Evaluacija: kako znati da li je agent dobar?

> **Povezani modul:** [modul 07 — Evaluacija agenata](../moduli/modul-07-evaluacija-agenata.md) (preporučeno pročitati sekcije 1–5 pre radionice)
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

## Priprema pre radionice (učesnici)

Odrađene radionice [02](radionica-02-alati-i-tool-use.md)–[04](radionica-04-rag-memorija.md) (ili barem moduli [02](../moduli/modul-02-alati-tool-use.md) i [07](../moduli/modul-07-evaluacija-agenata.md)), ključ i dalje samo u environment varijabli `Z_AI_API_KEY`. Zatim:

```bash
pip install openai
python r05_v1_skup.py      # pravi eval-skup.jsonl za demo agenta (bez mreže)
```

Dva napisa pre početka. **Prvo o agentu pod testom:** idealno nosite sopstvenog agenta iz radionica 02–04 i pišete skup za njega — rešenja su, međutim, samodovoljna: koriste malog demo agenta „Podrška" (baza činjenica o fiktivnoj firmi, jedan alat za pretragu), ugrađenog u rešenje vežbe 3; ako pišete za svog, samo zamenite njegov poziv na jednom jasno označenom mestu. **Drugo o novcu:** vežba 1 i prvi sloj vežbe 2 ne koštaju ništa (bez mreže); sudija i A/B troše po nekoliko hiljada tokena — izdvojite taj budžet svesno, jer ćete bez toga preskočiti baš taj korak (to je, nažalost, i nauka).

Napomena o formatu: skup pišemo kao **JSONL** (eng. *JSON Lines* — jedna JSON vrednost po redu fajla), a ne kao jedan veliki JSON niz iz modula 07. Razlika je mala, a razlog praktičan: po jedan scenario u redu znači da se izmene skupa lepo vide u `git diff`-u (dodao red — dodao scenario), i da fajl raste bez prepravljanja celog niza.

---

## Vežba 1 — Evaluacioni skup: 15 primera sa namernim rupama (60 min)

**Zadatak:** napišite evaluacioni skup za agenta pod testom: najmanje 15 scenarija po anatomiji iz sekcije 3 modula 07 — `id`, `ulaz`, `ocekivano`, `provere` (i `kategorija`, za statistiku) — od kojih svaki treći mora biti „nepošten": van domena, sa pogrešnom pretpostavkom, sa šumom, sa zahtevom za nemoguću akciju. Rešenje ispod je demo skup za agenta „Podrška" + mala skripta koja skup **valjda** (format, jedinstvenost id-jeva, pokrivenost kategorija) — jer skup koji niko ne proverava je samo lista želja.

**Rešenje** — sačuvajte kao `r05_v1_skup.py` (bez mreže — čist Python):

```python
"""Radionica 05, vežba 1 — evaluacioni skup (JSONL) + validacija formata.

Pokretanje bez mreže: pravi eval-skup.jsonl ako ga nema, pa ga valjda.
Demo skup je za agenta 'Podrška' (ugrađen u r05_v4_ab.py); za sopstvenog
agenta menjajte scenarije, ne skriptu.
"""

import json
from pathlib import Path

SKUP_FAJL = Path(__file__).parent / "eval-skup.jsonl"

# --- demo skup: 15 scenarija za 'Podršku' (činjenice 1-4 su u r05_v4_ab.py) ----

SCENARIJI = [
    {"id": "radno-vreme", "kategorija": "direktno",
     "ulaz": "Do kada mogu da zovem vašu podršku?",
     "ocekivano": "Navodi radno vreme podrške (radnim danima, do 17) sa izvorom.",
     "provere": [{"tip": "sadrzi", "vrednost": "17"},
                 {"tip": "regex", "vrednost": "činjenica\\s*1"}]},
    {"id": "rok-tiketa", "kategorija": "direktno",
     "ulaz": "Za koliko dana odgovarate na tiket?",
     "ocekivano": "Rok od 24 časa radnim danima, sa izvorom.",
     "provere": [{"tip": "sadrzi", "vrednost": "24"},
                 {"tip": "regex", "vrednost": "činjenica\\s*2"}]},
    {"id": "obnova-pretplate", "kategorija": "direktno",
     "ulaz": "Kada se pretplata obnavlja?",
     "ocekivano": "Svakog 1. u mesecu, sa izvorom.",
     "provere": [{"tip": "regex", "vrednost": "1\\.\\s*u\\s*mesecu"},
                 {"tip": "regex", "vrednost": "činjenica\\s*4"}]},
    {"id": "sve-o-pretplati", "kategorija": "direktno",
     "ulaz": "Šta sve treba da znam o pretplati?",
     "ocekivano": "Obnavljanje 1. u mesecu i otkaz do 25., sa izvorom.",
     "provere": [{"tip": "sadrzi", "vrednost": "25"},
                 {"tip": "regex", "vrednost": "činjenica\\s*4"}]},
    {"id": "vikend-zovem", "kategorija": "direktno",
     "ulaz": "Da li vas mogu da zovem u nedelju ujutru?",
     "ocekivano": "Podrška radi radnim danima — bez odbijanja, jer činjenica postoji.",
     "provere": [{"tip": "sadrzi", "vrednost": "radn"},
                 {"tip": "ne_sadrzi", "vrednost": "NE ZNAM"}]},
    {"id": "parafraza-tiketa", "kategorija": "parafraza",
     "ulaz": "Poslala sam tiket u petak uveče — da li da čekam odgovor do subote ujutru?",
     "ocekivano": "Objašnjava radne dane i rok od 24 časa, bez novog izmišljanja.",
     "provere": [{"tip": "sadrzi", "vrednost": "radn"},
                 {"tip": "sadrzi", "vrednost": "24"}]},
    {"id": "ljubazno-pitanje", "kategorija": "parafraza",
     "ulaz": "Hvala vam na pomoći do sad! Inače, do kada mogu da vratim licencu?",
     "ocekivano": "Uljudno dalje: rok 14 dana od kupovine, sa izvorom.",
     "provere": [{"tip": "sadrzi", "vrednost": "14"},
                 {"tip": "regex", "vrednost": "činjenica\\s*3"}]},
    {"id": "van-domena-kurs", "kategorija": "van domena",
     "ulaz": "Koja je danas kursna lista evra?",
     "ocekivano": "Odbija: NE ZNAM, bez navođenja bilo koje činjenice.",
     "provere": [{"tip": "sadrzi", "vrednost": "NE ZNAM"},
                 {"tip": "ne_sadrzi", "vrednost": "cinjenica"}]},
    {"id": "van-domena-parking", "kategorija": "van domena",
     "ulaz": "Da li vaša kancelarija ima parking za bicikle?",
     "ocekivano": "Odbija: NE ZNAM — baza podrške o tome nema ništa.",
     "provere": [{"tip": "sadrzi", "vrednost": "NE ZNAM"},
                 {"tip": "ne_sadrzi", "vrednost": "cinjenica"}]},
    {"id": "van-domena-sat", "kategorija": "van domena",
     "ulaz": "Koliko je sati kod vas u kancelariji sada?",
     "ocekivano": "Odbija: NE ZNAM — agent ne zna trenutno vreme.",
     "provere": [{"tip": "sadrzi", "vrednost": "NE ZNAM"},
                 {"tip": "ne_sadrzi", "vrednost": "cinjenica"}]},
]
```

```python
SCENARIJI += [
    {"id": "pogresna-pretpostavka", "kategorija": "pogrešna pretpostavka",
     "ulaz": "Kupio sam licencu prošle nedelje; rok od 30 dana za vraćanje mi "
             "ističe — gde da je prijavim?",
     "ocekivano": "Ispravlja pretpostavku: rok je 14 dana, ne 30; navodi izvor.",
     "provere": [{"tip": "sadrzi", "vrednost": "14"},
                 {"tip": "ne_sadrzi", "vrednost": "30 dana"}]},
    {"id": "dvodelni", "kategorija": "dvodelno",
     "ulaz": "Koliko brzo odgovarate na tiket i do kog datuma mogu da otkažem pretplatu?",
     "ocekivano": "Odgovara na oba dela: 24 časa; otkaz do 25. u mesecu.",
     "provere": [{"tip": "sadrzi", "vrednost": "24"},
                 {"tip": "sadrzi", "vrednost": "25"}]},
    {"id": "nemoguca-akcija", "kategorija": "nemoguća akcija",
     "ulaz": "Otkazite mi odmah pretplatu, danas!",
     "ocekivano": "Objašnjava da sam ne može da otkaže; kaže kako se otkaz daje "
                  "(do 25. u mesecu), sa izvorom.",
     "provere": [{"tip": "sadrzi", "vrednost": "25"},
                 {"tip": "regex", "vrednost": "činjenica\\s*4"}]},
    {"id": "sum-na-pocetku", "kategorija": "šum",
     "ulaz": "Zovem se Milica, vodim nalog AS-2231: kakav je rok za odgovor na tiket?",
     "ocekivano": "Šum ignoriše, odgovara na pitanje: 24 časa radnim danima.",
     "provere": [{"tip": "sadrzi", "vrednost": "24"},
                 {"tip": "regex", "vrednost": "činjenica\\s*2"}]},
    {"id": "polu-informacija", "kategorija": "parafraza",
     "ulaz": "Čula sam da se nešto obnavlja svakog prvog u mesecu — čega tačno?",
     "ocekivano": "Dopunjava: pretplata, sa izvorom.",
     "provere": [{"tip": "sadrzi", "vrednost": "pretplat"},
                 {"tip": "regex", "vrednost": "činjenica\\s*4"}]},
]

# --- validacija: skup koji niko ne proverava je lista želja -------------------

def ucitaj_skup() -> list[dict]:
    """Čita eval-skup.jsonl; pravi ga od demo skupa ako fajla nema."""
    if not SKUP_FAJL.exists():
        SKUP_FAJL.write_text(
            "".join(json.dumps(sc, ensure_ascii=False) + "\n" for sc in SCENARIJI),
            encoding="utf-8")
        print(f"(napravljen {SKUP_FAJL.name} od demo skupa — {len(SCENARIJI)} scenarija)")
    return [json.loads(red) for red in
            SKUP_FAJL.read_text(encoding="utf-8").splitlines() if red.strip()]

def validiraj(scenariji: list[dict]) -> list[str]:
    """Vraća spisak problema sa skupom; prazan spisak = skup je spreman."""
    problemi = []
    id_jevi = [sc.get("id") for sc in scenariji]
    if len(id_jevi) != len(set(id_jevi)):
        problemi.append("id-jevi nisu jedinstveni")
    for sc in scenariji:
        for polje in ("id", "ulaz", "ocekivano", "provere"):
            if not sc.get(polje):
                problemi.append(f"scenario {sc.get('id', '?')}: prazno polje '{polje}'")
    if len(scenariji) < 15:
        problemi.append(f"skup ima {len(scenariji)} scenarija — ispod minimuma od 15")
    kategorije = {sc.get("kategorija", "?") for sc in scenariji}
    for obavezna in ("direktno", "parafraza", "van domena"):
        if obavezna not in kategorije:
            problemi.append(f"nema kategorije '{obavezna}' — granice se ne mere")
    return problemi

def statistika(scenariji: list[dict]) -> None:
    brojaci: dict[str, int] = {}
    for sc in scenariji:
        brojaci[sc.get("kategorija", "?")] = brojaci.get(sc.get("kategorija", "?"), 0) + 1
    print(f"scenarija: {len(scenariji)}, prosečno provera po scenariju: "
          f"{sum(len(sc['provere']) for sc in scenariji) / len(scenariji):.1f}")
    for kat, broj in sorted(brojaci.items(), key=lambda par: -par[1]):
        print(f"   {kat:24s} {broj:2d}")

if __name__ == "__main__":
    scenariji = ucitaj_skup()
    statistika(scenariji)
    for problem in validiraj(scenariji):
        print(f"✘ {problem}")
    print("skup spreman za vežbu 2" if not validiraj(scenariji) else "popraviti pa ponovo")
```

**Provere:**

```bash
python r05_v1_skup.py
```

Otvorite `eval-skup.jsonl` u editoru: petnaest redova, jedan scenario po redu — i probajte `git diff` posle dodavanja jednog scenarija: jedan promenjeni red, čitljiv bez konteksta. Zatim čitajte skup kao listač, ne kao pisac (pravilo iz modula 07): kad `van-domena-kurs` padne, da li ćete iz poruke „odgovor ne sadrži 'NE ZNAM'" znati kuda? Kad padne `pogresna-pretpostavka` na proveri `ne sadrži '30 dana'`? Provera koja padne a da ne kaže kuda — to je provera koju ćete vremenom početi da ignorišete.

**Tri tačke koje moraju da sednu:** (1) trećina skupa su „nepoštena" pitanja — agent koji prolazi samo pristojne upite izgleda odlično dok ne izađe u svet; (2) provera `ne_sadrzi` je isto oružje kao `sadrzi`: „ne sme da ponovi pogrešnu pretpostavku" je pravilo ponašanja, ne dekoracija; (3) skup je **verzionisan dokument**: od sad se menja kroz commit sa obrazloženjem, jer je on specifikacija ponašanja agenta, ne priključak.

## Vežba 2 — Automatsko ocenjivanje u dva sloja (60 min)

**Zadatak:** ocenjivanje koje nešto zaista radi ima dva sloja, i redosled je važan. **Sloj 1 — pravila u kodu** (deterministička provera: sadrži li odgovor obavezne delove, poštuje li format, izbegava li zabranjene): jeftina, glasna, glupa — i zato prva. **Sloj 2 — sudija-model** (ocenjuje sadržaj: da li je odgovor tačan prema očekivanom): pameća, skuplja, pristrasnija — i zato druga, i samo tamo gde pravila ne stignu. U ovoj vežbi gradite oba, a sloj 2 kalibrišete na primerima koje ste sami ocenili pre nego što mu poverujete.

### Sloj 1 — pravila: pokretač bez mreže

**Rešenje** — sačuvajte kao `r05_v2_provere.py` (bez mreže; koristi skup iz vežbe 1 i **unapred zapisane** odgovore agenta, da vidimo tabelu bez potrošenog dinara):

```python
"""Radionica 05, vežba 2 (sloj 1) — determinističke provere na zapisanim odgovorima.

Radi bez mreže: odgovori su konzervirani (kako je agent odgovorio jednog
dana); zamenite ih svežim iz vežbe 3, a provere ostaju iste.
"""

import re
import sys

from r05_v1_skup import ucitaj_skup

PRAG = 0.8

# kako je agent zaista odgovorio (skraćeno) — jedan loš dan podrške
ODGOVORI = {
    "radno-vreme": "Podrška radi radnim danima od 9 do 17 časova [činjenica 1].",
    "rok-tiketa": "Na tiket odgovaramo u roku od 24 časa radnim danima [činjenica 2].",
    "parafraza-tiketa": ("Tikete obrađujemo samo radnim danima, a rok je 24 časa "
                         "[činjenica 2] — pa od petka uveče računajte ponedeljak."),
    "van-domena-kurs": ("Po današnjem kursu lista evro je oko 117 dinara, "
                        "ali za precizne vrednosti pogledajte sajt banke."),
    "dvodelni": ("Odgovaramo u roku od 24 časa [činjenica 2]. Pretplatu možete "
                 "otkazati najkasnije do 25. u mesecu [činjenica 4]."),
    "nemoguca-akcija": ("NE ZNAM — to nije u bazi podrške."),
}

def pokreni_proveru(provera: dict, odgovor: str) -> tuple[bool, str]:
    """Jedna deterministička provera; vraća (prolaz, opis za tabelu)."""
    tip, vrednost = provera["tip"], provera["vrednost"]
    if tip == "sadrzi":
        return vrednost.lower() in odgovor.lower(), f"sadrži '{vrednost}'"
    if tip == "ne_sadrzi":
        return vrednost.lower() not in odgovor.lower(), f"ne sadrži '{vrednost}'"
    if tip == "regex":
        found = re.search(vrednost, odgovor, re.IGNORECASE)
        return found is not None, f"regex /{vrednost}/"
    return False, f"nepoznat tip provere '{tip}'"

def oceni_slojem1(scenariji: list[dict], odgovori: dict) -> float:
    print(f"{'scenario':22s} {'ishod':6s} šta je puklo")
    prolazi = 0
    for sc in scenariji:
        if sc["id"] not in odgovori:
            print(f"{sc['id']:22s} PRESK  nema zapisan odgovor")
            continue
        neuspeli = [opis for prolaz, opis in
                    (pokreni_proveru(p, odgovori[sc["id"]]) for p in sc["provere"])
                    if not prolaz]
        prolaz = not neuspeli
        prolazi += prolaz
        znak = "✔" if prolaz else "✘"
        print(f"{sc['id']:22s} {znak:6s} {'; '.join(neuspeli)}")
    return prolazi / len(odgovori)

if __name__ == "__main__":
    stopa = oceni_slojem1(ucitaj_skup(), ODGOVORI)
    print(f"\nstopa prolaznosti: {stopa:.0%} (prag {PRAG:.0%})")
    sys.exit(0 if stopa >= PRAG else 1)     # kapija: pad = izlazni kod 1
```

**Provere:**

```bash
python r05_v2_provere.py; echo "izlazni kod: $?"
```

Dva scenarija moraju pasti, i to **glasno**: `van-domena-kurs` (agent je nagađao kurs — upravo ono zbog čega postoji „NE ZNAM") i `nemoguca-akcija` (odbio je pitanje na koje **ima** odgovor: činjenica 4 pokriva otkazivanje — odbijanje je tu pogrešan izlaz). Izlazni kod 1 je kapija kako treba: skripta nije pala, skup je **uhvatio grešku**. Ovo je trenutak vežbe: provera od dva stringa vredi koliko i sat čitanja izlaza — ako zna šta da traži.

**Tačke koje moraju da sednu:** (1) sloj 1 ne zna šta je „tačno" — zna šta je **dogovoreno** (NE ZNAM, činjenica N, 24, 25); dogovor se piše u sistemski prompt *zato* što se ovako meri (modul 07, sekcija 3); (2) stopa se računa nad odgovorima koji **postoje** — scenario bez odgovora je PRESK, ne prolaz: statistika koja prašta nepokrenute scenarije laže na gore; (3) prag od 80% sa izlaznim kodom je mini-CI: ubacite ga u `make check` i svaka izmena agenta od sad prolazi kroz ovu vratu.

### Sloj 2 — sudija-model: kalibracija pre poverenja

**Zadatak:** za odgovore koje pravila ne umeju da ocene („da li je ovo *tačno* na dato pitanje?"), pozovite drugi poziv modela — sudiju (eng. *judge*) — ali po dva pravila iz modula 07: **rubrika u promptu** (tačno šta se ocenjuje, šta je prolaz) i **izlaz u strogo dogovorenom obliku** (JSON sa `prolaz` i `razlog`), na temperaturi 0. Pre puštanja u rad, sudija se **kalibriše**: na par primera koje ste sami ocenili, meri se slaganje; gde se ne slaže — popravlja se rubrika (ili primer, ako je on loš), ne rezultat.

**Rešenje** — sačuvajte kao `r05_v3_sudija.py`:

```python
"""Radionica 05, vežba 2 (sloj 2) — sudija-model sa kalibracijom.

  Z_AI_API_KEY   — obavezno: vaš API ključ
  Z_AI_BASE_URL  — opciono: podrazumevano https://api.z.ai/api/paas/v4
  Z_AI_MODEL     — opciono: model za razgovor (podrazumevano glm-4.6)

Kalibracija: pet parova odgovor-dobar / odgovor-loš na koje ZNAMO ishod;
sudija prolazi tek kad se slaže na svih deset ocena.
"""

import json
import os
import re
import sys

from openai import OpenAI

SUDIJA_PROMPT = (
    "Ti si sudija koja ocenjuje odgovore agenta korisničke podrške. Dobijaš: "
    "pitanje korisnika, očekivani ishod i stvarni odgovor agenta. Rubrika: "
    "(1) ODGOVOR TAČAN — agent tvrdi samo ono što sledi iz očekivanog ishoda; "
    "(2) BEZ NAGAĐANJA — ako očekivani ishod kaže da treba odbiti, odgovor "
    "mora odbiti (NE ZNAM) i ništa ne izmišljati; (3) NETAČAN ILI NAGAĐAN "
    "NE PROLAZI. Odgovaraš SAMO JSON objektom oblika "
    '{"prolaz": true|false, "razlog": " jedna recenica"} bez ikakvog drugog teksta.'
)

# pet parova: (pitanje, očekivano, dobar odgovor, loš odgovor) — moje ocene su
# u imenima polja: dobar => prolaz, loš => pad
KALIBRACIJA = [
    ("Do kada mogu da zovem vašu podršku?",
     "Radno vreme: radnim danima do 17 [činjenica 1].",
     "Podrška radi radnim danima od 9 do 17 časova [činjenica 1].",
     "Podrška je dostupna non-stop, zovite bilo kada."),
    ("Za koliko dana odgovarate na tiket?",
     "Rok 24 časa radnim danima [činjenica 2].",
     "Odgovaramo u roku od 24 časa radnim danima [činjenica 2].",
     "Obično odgovorimo za koji dan, zavisi kako nam ide."),
    ("Koja je danas kursna lista evra?",
     "Odbijanje: NE ZNAM, bez činjenica.",
     "NE ZNAM — to nije u bazi podrške.",
     "Evro je danas oko 117 dinara, ali proverite u banci."),
    ("Kupio sam licencu; rok od 30 dana za vraćanje mi ističe?",
     "Ispravka: rok je 14 dana [činjenica 3].",
     "Mala ispravka: rok za vraćanje je 14 dana od kupovine [činjenica 3].",
     "Da, rok od 30 dana vam ističe — pošaljite prijavu."),
    ("Koliko brzo odgovarate na tiket i do kog datuma mogu da otkažem pretplatu?",
     "Oba dela: 24 časa; otkaz do 25. u mesecu.",
     "Rok za tiket je 24 časa [činjenica 2]; pretplata se otkaže do 25. u mesecu [činjenica 4].",
     "Na tiket odgovaramo brzo, a o otkazu Vas će obavestiti kolege."),
]

def sudi(client, model, pitanje: str, ocekivano: str, odgovor: str) -> tuple[bool, str]:
    """Jedna presuda; vraća (prolaz, razlog)."""
    poruke = [
        {"role": "system", "content": SUDIJA_PROMPT},
        {"role": "user",
         "content": (f"Pitanje korisnika: {pitanje}\n\nOčekivani ishod: {ocekivano}\n\n"
                     f"Odgovor agenta: {odgovor}")},
    ]
    izlaz = client.chat.completions.create(
        model=model, messages=poruke, temperature=0,
    ).choices[0].message.content or ""
    poklapanje = re.search(r"\{.*\}", izlaz, re.DOTALL)      # sudija voli uvode
    if not poklapanje:
        return False, "sudija nije vratio JSON: " + izlaz[:60]
    try:
        presuda = json.loads(poklapanje.group(0))
    except json.JSONDecodeError:
        return False, "sudijin JSON ne parsira: " + izlaz[:60]
    return bool(presuda.get("prolaz")), str(presuda.get("razlog", ""))[:80]

def main() -> None:
    api_key = os.environ.get("Z_AI_API_KEY", "")
    if not api_key:
        sys.exit("Nema Z_AI_API_KEY. Postavite environment varijablu pa ponovo pokrenite.")
    client = OpenAI(api_key=api_key,
                    base_url=os.environ.get("Z_AI_BASE_URL", "https://api.z.ai/api/paas/v4"))
    model = os.environ.get("Z_AI_MODEL", "glm-4.6")

    slaganje = 0
    for pitanje, ocekivano, dobar, los in KALIBRACIJA:
        for odgovor, moja in ((dobar, True), (los, False)):
            prolaz, razlog = sudi(client, model, pitanje, ocekivano, odgovor)
            poklapa = prolaz == moja
            slaganje += poklapa
            znak = "=" if poklapa else "≠"
            print(f"[{znak}] {'dobar' if moja else 'loš '} odgovor → sudija: "
                  f"{'prolaz' if prolaz else 'pad  '} · {razlog}")
    print(f"\nslaganje sudije sa mojim ocenama: {slaganje}/10")
    print("kalibracija prošla" if slaganje == 10 else
          "kalibracija NIJE prošla — popravi rubriku (ili primer), pa ponovo")

if __name__ == "__main__":
    main()
```

**Provere:**

```bash
python r05_v3_sudija.py
```

Gledajte redove sa `≠`: to su mesta gde se sudija razilazi s vama — i svako je mala istraga. Tipični uzroci: rubrika premekka (propusti nagađanje „oko 117 dinara" — dodati u rubriku: približne vrednosti su nagađanje), rubrika prekruta (kazni ispravnu dopunu jer „nije doslovno očekivano"), ili loš primer (očekivano napisano maglovito — sudija nije kriv). Postupak je uvek isti: **popravi rubriku ili primer, nikad rezultat** — jer cilj nije da sudija potvrdi agenta, nego da bude merilo koje se poklapa s vašim.

**Tačke koje moraju da sednu:** (1) sudija je **drugi sloj**: prvo pravila (jeftino, glasno), pa sudija samo za scenario koje pravila ne hvataju — ko počne od sudije, potroši budžet na provere koje `in` operator radi besplatno; (2) temperatura 0 i strogi JSON nisu ukus, nego uslov ponovljivosti: sudija koja svaki put drugačije sudi nije merilo; (3) kalibracija na **deset** ocena (pet parova) je minimum, ne cilj — pravi skupovi idu na trideset i više pre nego što se sudiji poveruje.

## Vežba 3 — A/B promptova: isti skup, dve verzije (40 min)

**Zadatak:** pokrenite ceo evaluacioni skup na dve verzije sistemskog prompta — staroj (A) i izmenjenoj (B) — i sastavite tabelu po scenariju. Verzija B ovde donosi jedno pravilo više (dvodelna pitanja — tačka po tačka) i jedno drugačije (odbijanje uvek prvim stavom); da li je bolja — ne odgovara se osećajem, nego tabelom i flipovima. Na kraju se piše odluka sa obrazloženjem, jer tabela bez odluke je samo lep izlaz.

**Rešenje** — sačuvajte kao `r05_v4_ab.py` (zahteva fajlove iz vežbi 1 i 2 pored sebe; koristi skup, provere i — u sebi — demo agenta „Podrška"):

```python
"""Radionica 05, vežba 3 — A/B poređenje dve verzije sistemskog prompta.

  Z_AI_API_KEY   — obavezno: vaš API ključ
  Z_AI_BASE_URL  — opciono: podrazumevano https://api.z.ai/api/paas/v4
  Z_AI_MODEL     — opciono: model za razgovor (podrazumevano glm-4.6)

Koristi eval-skup.jsonl iz vežbe 1 i provere iz vežbe 2.
Rezultate piše u rezultati/a.json i rezultati/b.json za budući dif.
"""

import json
import os
import sys
from datetime import datetime
from pathlib import Path

from openai import OpenAI

from r05_v1_skup import ucitaj_skup
from r05_v2_provere import pokreni_proveru

REZULTATI = Path(__file__).parent / "rezultati"

# --- agent pod testom: 'Podrška' (menjajte poziv agenta za svog) --------------

CINJENICE = {
    1: "Podrška radi radnim danima od 9 do 17 časova.",
    2: "Na tiket odgovaramo u roku od 24 časa radnim danima.",
    3: "Licencu možete vratiti u roku od 14 dana od kupovine.",
    4: "Pretplata se obnavlja automatski svakog 1. u mesecu; otkaz se daje "
       "najkasnije do 25. u mesecu.",
}
KLJUCNE_RECI = {
    "radno vreme": 1, "podrška": 1, "podrsk": 1, "zovem": 1, "zovete": 1,
    "tiket": 2, "odgovor": 2, "rok za": 2,
    "licenc": 3, "vrać": 3,
    "pretplat": 4, "otkaz": 4, "obnavlj": 4, "mesec": 4,
}
SH_ALAT = {"type": "function", "function": {
    "name": "trazi_u_bazi",
    "description": "Pretražuje bazu činjenica firme Studio Dim (radno vreme, "
                   "rokovi, licence, pretplata). Vraća činjenice sa brojevima "
                   "ili NEMA. Za svako pitanje o firmi — prvo ovaj alat.",
    "parameters": {"type": "object", "properties": {
        "pojam": {"type": "string", "description": "Tema iz pitanja, npr. 'radno vreme'."},
    }, "required": ["pojam"]},
}}

def trazi_u_bazi(pojam: str) -> str:
    pojam = pojam.strip().lower()
    nadjeni = {broj for rec, broj in KLJUCNE_RECI.items() if rec in pojam}
    if not nadjeni:
        return "NEMA: u bazi podrške nema ničega o tome."
    return "\n".join(f"[činjenica {b}] {CINJENICE[b]}" for b in sorted(nadjeni))

PROMPT_A = (
    "Ti si agent korisničke podrške firme Studio Dim. Pravila: (1) odgovaraš "
    "SAMO na osnovu alata trazi_u_bazi — svaku tvrdnju potkrepljuješ brojem "
    "činjenice u uglastim zagradama, npr. [činjenica 2]; (2) ako alat vrati "
    "NEMA, odgovor počinje rečenicom 'NE ZNAM — to nije u bazi podrške.' i ne "
    "nagađaš; (3) pogrešnu pretpostavku korisnika ispravljaš i navodiš pravu "
    "vrednost; (4) odgovaraš kratko, najviše tri stava."
)
PROMPT_B = (
    "Ti si agent korisničke podrške firme Studio Dim. Pravila: (1) odgovaraš "
    "SAMO na osnovu alata trazi_u_bazi — svaku tvrdnju potkrepljuješ brojem "
    "činjenice u uglastim zagradama, npr. [činjenica 2]; (2) ako alat vrati "
    "NEMA, odgovor počinje rečenicom 'NE ZNAM — to nije u bazi podrške.' i ne "
    "nagađaš; (3) pogrešnu pretpostavku korisnika ispravljaš i navodiš pravu "
    "vrednost; (4) na pitanje sa više delova odgovaraš tačku po tačku, po jedan "
    "deo pitanja po stavu; (5) nikada ne obećavaš akciju koju sam ne izvršavaš "
    "— umesto toga kažeš kako korisnik to radi."
)
```

```python
def agent(client, model, sistemski_prompt: str, pitanje: str,
          max_koraka: int = 4) -> str:
    """Mini-petlja iz radionice 03: jedan alat, tri do četiri koraka."""
    poruke = [{"role": "system", "content": sistemski_prompt},
              {"role": "user", "content": pitanje}]
    for _ in range(max_koraka):
        odgovor = client.chat.completions.create(
            model=model, messages=poruke, tools=[SH_ALAT], temperature=0.2)
        poruka = odgovor.choices[0].message
        if not poruka.tool_calls:
            return poruka.content or ""
        poruke.append(poruka)
        for poziv_ in poruka.tool_calls:
            try:
                argumenti = json.loads(poziv_.function.arguments or "{}")
                rezultat = trazi_u_bazi(**argumenti)
            except Exception as g:
                rezultat = f"GREŠKA: {g}"
            poruke.append({"role": "tool", "tool_call_id": poziv_.id,
                           "content": rezultat})
    return "GREŠKA: agent nije završio odgovor (max_koraka)."

def verzija(client, model, prompt: str, scenariji: list[dict],
            oznaka: str) -> dict:
    """Jedna verzija prompta kroz ceo skup; piše rezultati/<oznaka>.json."""
    ishodi = []
    for sc in scenariji:
        print(f"  [{oznaka}] {sc['id']}")
        odgovor = agent(client, model, prompt, sc["ulaz"])
        provere = [{"opis": opis, "prolaz": prolaz}
                   for prolaz, opis in (pokreni_proveru(p, odgovor)
                                        for p in sc["provere"])]
        ishodi.append({"id": sc["id"], "prolaz": all(p["prolaz"] for p in provere),
                       "provere": provere, "odgovor": odgovor})
    REZULTATI.mkdir(exist_ok=True)
    fajl = REZULTATI / f"{oznaka}.json"
    fajl.write_text(json.dumps(
        {"vreme": datetime.now().isoformat(timespec="minutes"),
         "stopa": sum(1 for i in ishodi if i["prolaz"]) / len(ishodi),
         "scenariji": ishodi}, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"ishodi": {i["id"]: i["prolaz"] for i in ishodi},
            "stopa": sum(1 for i in ishodi if i["prolaz"]) / len(ishodi),
            "fajl": fajl}

def main() -> None:
    api_key = os.environ.get("Z_AI_API_KEY", "")
    if not api_key:
        sys.exit("Nema Z_AI_API_KEY. Postavite environment varijablu pa ponovo pokrenite.")
    client = OpenAI(api_key=api_key,
                    base_url=os.environ.get("Z_AI_BASE_URL", "https://api.z.ai/api/paas/v4"))
    model = os.environ.get("Z_AI_MODEL", "glm-4.6")
    scenariji = ucitaj_skup()

    print("== verzija A (stari prompt) ==")
    a = verzija(client, model, PROMPT_A, scenariji, "a")
    print("== verzija B (izmenjeni prompt) ==")
    b = verzija(client, model, PROMPT_B, scenariji, "b")

    print(f"\n{'scenario':22s} {'A':^4s} {'B':^4s}  promena")
    for sc in scenariji:
        pre, posle = a["ishodi"][sc["id"]], b["ishodi"][sc["id"]]
        strelica = "" if pre == posle else ("  ← gubitak!" if pre else "  ← popravljen")
        print(f"{sc['id']:22s} {'✔' if pre else '✘':^4s} {'✔' if posle else '✘':^4s}{strelica}")
    print(f"stopa: A {a['stopa']:.0%} · B {b['stopa']:.0%}   "
          f"(rezultati: {a['fajl'].name}, {b['fajl'].name})")
    print("\nodluka: [ A / B ] obrazloženje: [ dva-tri stavka: stopa, flipovi, "
          "utisak čitanja odgovora ]")

if __name__ == "__main__":
    main()
```

**Provere:**

```bash
python r05_v4_ab.py
```

Čitajte izlaz u tri prolaza. Prvi prolaz — **flipovi** (`← gubitak!`, `← popravljen`): svaki je priča za sebe; otvorite `rezultati/b.json` i pročitajte odgovor reč po reč (tamo stoje svi odgovori obe verzije — zato se i pišu). Drugi prolaz — **dvodelni** scenario: da li ga je pravilo (4) u B stvarno popravilo, ili je sreća? Pokrenite još jednom — agenti su nedeterministični, pa se A/B gleda na više od jednog pokretanja kad je razlika mala. Treći prolaz — **odluka**: popunite šablon iz poslednjeg reda; „stopa nepromenjena, ali jedan gubitak i jedan popravak" je legitimna situacija — i tada se odlučuje čitanjem tih dva odgovora, ne bacanjem novčića.

**Tabela dijagnoze (rešenje za tablu):**

| Simptom u A/B | Prvo proveriti | Tipičan lek |
|---|---|---|
| B bolja na dvodelnim, ista svuda | da li je pravilo (4) krivo ili sreća | još pokretanja; pa pročitati odgovore |
| B izgubila scenario koji je A prolazio | odgovor u rezultatima: šta se promenilo | pravilo koje je suviše usko; kalibracija sudije |
| Stopa ista, odgovori različiti | dif po odgovorima, ne po ✔/✘ | odluka po čitljivosti i trošku, ne samo stopi |
| Sve pada u obe verzije | skup (preteške provere?) ili agent | jedan scenario ručno, pa presudit ko laže |
| Rezultati se razlikuju svakim pokretanjem | temperatura; mali broj scenarija | smanjiti temperaturu, povećati skup, više pokretanja |

## Domaći

- Ponoviti A/B sa promenom *modela* umesto prompta (npr. dva modela po izboru) — razlika u ceni naspram kvaliteta na istom skupu.
- Dodati metrike troška: prosečan broj tokena po primeru; odgovor na pitanje „isplati li se poboljšanje od 5% tačnosti za 40% skuplji poziv?".
- Uvesti evaluaciju kao CI korak: skripta koja pada ako tačnost padne ispod praga (makar i samo lokalni `make check`).
- Za napredne: dif režim po obrascu iz modula 07 — `--diff rezultati/a.json rezultati/b.json` na fajlovima koje je vežba 3 već upisala.

## Materijali — checklist za učesnike

- [ ] sopstveni agent iz ranijih radionica (ili bar jedna skripta sa sistemskim promptom);
- [ ] izdvojen budžet od par hiljada tokena za ocenjivačke pozive (zaboravićete na njega — to je poenta);
- [ ] Git repozitorijum sa istorijom promptova (da imate šta da A/B uporedite);
- [ ] sveska/tabela za rezultate — brojevi koje ne zapišete su brojevi koje nemate;
- [ ] četiri fajla radionice: `r05_v1_skup.py` do `r05_v4_ab.py` — rastu iz vežbe u vežbu, `eval-skup.jsonl` i `rezultati/` nastaju uz njih.

## Za voditelja

- Najvažniji trenutak radionice: kada učesniku metrika kaže nešto suprotno od osećaja. Ne rešavati — pustiti grupu da ispita *zašto*; tu se uči najviše.
- Ocenjivač-model kalibrisati javno, na primeru celoj grupi, pre puštanja u samostalan rad.
- Vežba 1 je bez mreže — iskoristiti je da svi imaju `eval-skup.jsonl` pre drugog sata, čak i ako kasne sa pripremom.
- A/B pokretanja traju (15 scenarija × 2 verzije × poziv ili dva): pokrenuti vežbu 3 na projektoru rano, pa pričati kroz tabelu dok se završava — paralelno vreme, ne čekanje.
- Ako grupa zaostaje: sloj 2 svesti na prva dva para kalibracije, A/B na prvih osam scenarija skupa. Ne skraćivati čitanje flipova — ono je srce.
- Poruka za kraj: **izmena bez dif pregleda je vera, ne inženjerstvo** — i zato svaka izmena agenta od sad ide kroz skup.
