# Modul 07 — Evaluacija agenata: kako znati da li je agent dobar?

> **Vreme:** 5–7 časova rada · **Preduslovi:** [moduli 03](modul-03-agent-od-nule.md) i [04](modul-04-memorija-i-rag.md) · **Stanje:** prva radna verzija

Ovim modulom kurs menja reč. Dosad ste gradili: alate, petlju, memoriju, kontekst, protokole. A svaka od tih gradnji završavala se isto — pogledate izlaz, klimnete glavom, i nastavite. To je **nagađanje** (eng. *vibes*): „deluje mi dobro". U ovom modulu nagađanje zamenjujemo merenjem: skup scenarija na kome se agent ispituje, provere koje padaju glasno, i navika da se svaka izmena — prompta, alata, modela — sudi **na istim primerima, u razlici dva pokretanja**. Evaluacija (eng. *evaluation*) je disciplina koja od „mislim da je bolje" pravi „evo za koliko, i na kojima". Bez nje ste napravili nešto što ne znate da li radi; sa njom, svaka sledeća nedelja rada ima smer. Kraj modula: sopstveni evaluacioni skup od pet scenarija, pokretač koji prolaz/pad ispisuje i vraća izlazni kod, i prvi dif pregled dve verzije agenta.

---

## 1. Zašto evaluacija agenta nije jedinično testiranje

Znate jedinične testove (eng. *unit tests*): ulaz u funkciju, očekivana vrednost, `assert`, zeleno ili crveno. Zašto isto ne uradimo sa agentom i gotovo? Jer agent lomi svaku od pretpostavki na kojima jedinično testiranje počiva:

| | jedinični test | evaluacija agenta |
|---|---|---|
| šta se proverava | povratna vrednost funkcije | ponašanje na scenariju: odgovor, korišćenje alata, koraci |
| očekivanje | jedna ispravna vrednost | **više prihvatljivih** ponašanja i formulacija |
| determinizam | potpun — isti ulaz, isti izlaz | ne: temperatura, model, pa i sama okolina se menjaju |
| kada „pada" | jasno i odmah | postepeno — kvalitet se raspada tiho, scenario po scenario |
| odakle potiče primeri | iz specifikacije funkcije | iz stvarnih grešaka, žalbi korisnika, čitanja tragova |
| cena pokretanja | milisekunde | stvarni pozivi API-ju — tokeni se plaćaju |

Tri razlike zaslužuju da ih prođemo polako, jer od njih zavisi kako se piše dobra provera.

**Više prihvatljivih odgovora.** Pitajte agenta iz modula 03 da sredi direktorijum: ispravnih planova ima desetak, i svi su dobri. Provera `assert odgovor == "..."` ne postoji — što se proverava jeste **ponašanje**: da je svaki fajl obrađen, da plan postoji, da imena prate pravila. Zato se u evaluaciji pišu provere svojstava (eng. *property checks*): „sadrži izvor", „nabraja oba dela odgovora", „odbija kad nema pokrića" — a ne poređenje niske znakova.

**Nedeterminizam, u tri sloja.** Prvi sloj: temperatura — isti scenario, dva pokretanja, dva različita traga (zato se skup više puta pokreće, i gleda stopa, ne pojedinačan ishod). Drugi sloj: provajder menja model ispod vas — „isti" naziv modela danas nije onaj od prošlog meseca, pa i nepromenjen kod menja ponašanje. Treći sloj: okolina se menja — fajlovi u sandbox-u, podaci u bazi, spoljni servisi. Jedinični test štiti od „pokvario sam kod"; evaluacija štiti od „svet se promenio, a ja nisam primetio".

**Postepeno propadanje.** Jedinični test ili prolazi ili ne postoji treće. Agent se, naprotiv, kvari tiho: izmena sistemskog prompta popravi pitanja o ceni, a pokvari odbijanje van domena — i niko ne gleda tu stranu. Zato postoji treći način između „sve tačno" i „palo": **razlika** (eng. *diff*) ishoda između dva pokretanja — o tome je čitava sekcija 4.

I jedna poravnanje termina: evaluacioni skup (eng. *evaluation set*, *test set*) je verzionisan spisak primera — u ovom modulu ga zovemo i **scenario-skup**, a jedan primer **scenario** (eng. *scenario*), jer reč bolje nosi šta jeste: komad stvarnosti na kome agenta stavljamo na probu.

## 2. Šta merimo: metrike sa značenjem

„Da li je agent dobar" nije merljivo dok se ne rastavi na merljive delove. Metrika (eng. *metric*) je broj koji nešto zaista meri — a bira se po slučaju upotrebe:

| Metrika | Šta meri | Odakle se uzima |
|---|---|---|
| stopa uspeha (eng. *task success rate*) | procenat scenarija sa prihvatljivim ishodom | provere po scenariju (glavni broj) |
| potpunost | pokriva li odgovor sve delove zadatka | provere; sudija iz sekcije 5 |
| usklađenost sa pravilima | citira li izvor, odbija li van domena, poštuje li format | determinističke provere (regex i slično) |
| broj koraka | koliko poziva alata po scenariju | trag (modul 03) |
| trošak | potrošeni tokeni po scenariju | `usage` iz odgovora API-ja |
| kašnjenje (eng. *latency*) | vreme od ulaza do odgovora | mereno satom |

Tri napomene uz tabelu. Prvo: **stopa uspeha je glavni broj, ali nikad jedini** — agent može imati visoku stopu uz glupav trošak (20 koraka po pitanju) ili uz kašnjenje koje korisnici ne trpe. Drugo: metriku birate po **slučaju upotrebe**: bot za podršku — potpunost i odbijanje van domena; agent za sređivanje fajlova — broj koraka i bezbednost akcija; RAG — tačnost navođenja izvora. Treće, staro upozorenje: kada metrika postane cilj, prestaje da bude dobra mera — agent koji optimizuje „odgovor sadrži reč 17" će tu reč ubacivati i gde ne treba. Lek: više metrika odjednom, i obavezan povratak čitanju primera (sekcija 4).

## 3. Scenario: anatomija jednog primera

Scenario je najmanja jedinica evaluacije. Da bi skup bio koristan, svaki scenario nosi četiri polja:

```text
id          — kratko ime ("van-domena"); po njemu se scenario prati kroz difove
ulaz        — tačno ono što stiže agentu (pitanje, zadatak, fajl...)
očekivano   — ponašanje rečeno ljudski ("navodi radno vreme sa izvorom")
provere     — spisak provera; svaka mora pasti glasno kada ne važi
```

**Provere: prvo determinističke, tek onda pametne.** Provera (eng. *check*) je mali program: `sadrži "17"`, `ne sadrži "činjenica"`, `regex "^NE ZNAM"`. Sve što se može ovako proveriti — neka se: jeftino je, ponovljivo, i pada razumljivo. Za ono što ne može („da li je objašnjenje tačno") dolazi sudija iz sekcije 5 — ali to je drugi sloj, ne prvi. Pravilo: **šema provera se piše jednom, a čita pri svakom padu** — provera čiju poruku ne razumete dok stoji crvena, biće provera koju ćete ignorisati.

**Granični slučajevi su pola vrednosti skupa.** Skup od samih lakih pitanja proslavljuje agenta i ne uči vas ništa. Četiri kategorije koje svaki skup mora da sadrži:

1. **pokriveno, direktno** — pitanje na koje baza/podaci imaju odgovor (provera: tačnost + izvor);
2. **pokriveno, indirektno** — parafraza, pogrešna pretpostavka u pitanju („rok mi od 30 dana ističe" kada je 14 — agent treba da ispravi, ne da ponovi);
3. **van domena** — pitanje koje agent **mora da odbije** (provera: „NE ZNAM" ili ekvivalent; i nega: ne citira izvor koji ne postoji);
4. **višedelni i napadni** — dva pitanja u jednom; zahtev za nedozvoljenu akciju (moduli 03 i 05).

**Odakle scenariji dolaze?** Iz stvarnosti: svaka greška koju primetite u radu postaje scenario (to je jedina korist od greške); žalbe korisnika su gotovi scenariji sa motivom; a čitanje tragova iz modula 03 otkriva mesta gde agent tetura — tamo se postavljaju klopke. Skup koji je napisan „iz glave, pre rada" obično meri ono što smo mislili da će biti teško; skup iz stvarnosti meri ono što **jeste**.

I na kraju organizacija: skup je **datoteka, ne razgovor** — u vežbama će to biti `eval-skup.json` u Git-u, pored koda agenta. Izmena skupa je događaj kao i izmena koda: vidljiva u istoriji, obrazložena u poruci komita.

## 4. Prolaz/pad i razmišljanje u razlikama

Dva režima čitanja rezultata, i oba su potrebna.

**Prolaz/pad (eng. *pass/fail*).** Scenario prolazi ako prođu **sve** njegove provere. Po skupu se računa stopa prolaznosti (eng. *pass rate*): 4/5 = 0,8. Uz stopu ide **prag** (eng. *threshold*): ispod 0,8 — crveno, ne objavljujemo, ne spajamo. Prag pretvara evaluaciju u kapiju: pokretač vraća izlazni kod 1 kada padne, pa se isti uslov može staviti u neprekidnu integraciju (eng. *continuous integration*, CI) — `make check` koji čuva agenta kao što čuva kod.

**Dif pregled (eng. *diff review*).** Stopa 0,8 → 0,8 kaže „nema promene" — a promena može biti velika: dva scenarija su se zamenila. Zato se svaka izmena agenta (prompt, alat, model, temperatura) gleda **upareno, po scenariju**, naspram prethodnog pokretanja:

```text
scenario              pre izmene   posle izmene   ?
radno-vreme           ✔            ✔
parafraza             ✔            ✘             ← pala: novi gubitak
van-domena            ✘            ✔             ← prošla: popravljen stari problem
pogrešna-pretpostavka ✔            ✔
dvodelni              ✔            ✔
stopa                 4/5          4/5           ista — a svet nije isti!
```

Ovo je srce evaluacije agenata: **agregat gore, dijagnoza dole**. Stopa odlučuje (ide/ne ide), ali **flipovi po scenariju** objašnjavaju šta se desilo — i hvataju klasičnu tihu nesreću: „popravka za jedno pokvarila nešto drugo". Upravo to zovemo razmišljanje u razlikama: ne „koliko je dobro sada", nego „šta se promenilo u odnosu na juče, i zašto".

> **Primer iz stvarne prakse: regresioni testovi nad n8n radnim tokovima.** Jedan tim koji održava flotu automatizacija u alatu n8n — radni tokovi (eng. *workflow*) za izveštaje, sinhronizacije i obaveštenja — radi ovako već godinama: svaki radni tok je JSON definicija u Git-u; uz svaki ide manji scenario-skup (ulazi koje pokriva i očekivani ishodi); svaka izmena definicije pokreće sve scenarije na testnoj instanci, pre nego što išta dođe u produkciju. Rezultat se čita u dva koraka, ta dva iz sekcije: prvo prolaz/pad po scenariju — palo se ne objašnjava nego popravlja; zatim razlika izlaza sa poslednjim odobrenim pokretanjem, jer izlaz može biti „drugačiji, a još uvek ispravan" (promenjen format datuma u izveštaju, preuređen redosled kolona). Kućno pravilo tima glasi: **zeleno znači „objašnjeno", ne „isto"** — svaka razlika dobija rečenicu obrazloženja pre odobrenja, ili izmena ne ide dalje. Isti obrazac, ista dva koraka, isti duh važe i za agente; razlika je samo u tome što je izlaz agenta bogatiji od izlaza radnog toka, pa se uz dif obavezno čita i trag.

**Regresiona provera** (eng. *regression test*) je ime za onaj deo skupa koji je **jednom već pao i bio popravljen**: ti scenariji ostaju zauvek — štite od vraćanja iste greške. U praksi skup raste baš tako: palo → popravljeno → scenario ostaje u brani. Skup koji se samo doda i nikad ne dopunjava je fotografija; onaj koji raste sa greškama je dnevnik — i drugi je vredniji.

## 5. Ocenjivanje pomoću modela: sudija sa rubrikom

Neke provere ne mogu da se napišu kao `sadrži "17"`: „da li je objašnjenje tačno i potpuno", „da li je odbijanje uljudno". Za to dolazi **ocenjivanje pomoću modela** (eng. *LLM-as-a-judge*): drugi poziv modela kome se daju pitanje, očekivano ponašanje i odgovor agenta, i traži presuda po **rubrici** (eng. *rubric*) — pisanim kriterijumima:

```text
SUDIJA (system): Ti si sudija za odgovore agenta podrške. Za svaki primer
ocenjuješ SAMO po rubrici: (1) tačno prema očekivanom; (2) potpuno — svi
delovi pitanja; (3) pravila poštovana — izvor citiran ili jasno odbijanje.
Odgovaraš isključivo JSON-om: {"prolaz": true/false, "razlog": " jedna rečenica"}.
Temperatura 0. Ne dodaješ milost, ne oduzimaš strogost.
```

Tri pravila bez kojih sudija postaje izvor nasumičnosti:

1. **Kalibracija pre poverenja.** Pre nego što sudiji poverite skup, vi sami ocenite pet primera; zatim sudija; uporedite. Gde se ne slažu — rubrika je nejasna (ili vi). Popravite rubriku, ponovite. Sudija je dobra onoliko koliko je kalibrisana.
2. **Ograniči poznate pristrasnosti.** Sudije-modeli vole preopširne odgovore (duže = bolje, a nije); redosled primera utiče (prvi biva blaže ocenjen); model preferira odgovore svog stila (samopreferencija). Lekovi: kratka rubrika, temperatura 0, parovi primera sa obrnutim redosledom kada se porede dve verzije.
3. **Sudija je drugi sloj, ne prvi.** Prvo sve determinističke provere iz sekcije 3; sudija sudi samo ono što ostaje. Svaki poziv sudije košta — i svaki nosi svoju neizvesnost.

Kada sudija i provere kažu različito — to nije smetnja, to je nalaz: proverite primer svojim očima. Najvredniji trenuci rada na agentima su redom oni u kojima dva merenja ne slažu.

## 6. Vežbe: pet scenarija za malog agenta

Gradimo kompletnu petlju evaluacije, komad po komad: mali agent (jedan alat, petlja iz modula 03), scenario-skup od pet primera, pokretač sa prolazom/padom i pragom, i dif pregled dve verzije. Kao i uvek: z.ai/GLM kroz OpenAI-kompatibilan interfejs, ključ samo u `Z_AI_API_KEY` (opciono `Z_AI_BASE_URL`, `Z_AI_MODEL`).

### 6.1 Zadatak 1: mali agent „Podrška"

Agent fiktivne firme „Studio Dim": mala baza činjenica (u kodu), jedan alat za pretragu, i pravila u sistemskom promptu — navođenje izvora `[činjenica N]`, odbijanje van domena rečenicom koja počinje sa „NE ZNAM". Sačuvajte kao `07a_agent.py`:

```python
"""Vežba 7.1 — mali agent „Podrška": baza činjenica + jedan alat + petlja.

  Z_AI_API_KEY   — obavezno: vaš API ključ
  Z_AI_BASE_URL  — opciono: podrazumevano https://api.z.ai/api/paas/v4
  Z_AI_MODEL     — opciono: model za razgovor (podrazumevano glm-4.6)

Upotreba: python 07a_agent.py "vaše pitanje"
"""

import json
import os
import sys

from openai import OpenAI

# --- baza činjenica: sve što agent sme da zna o firmi -----------------------

CINJENICE = {
    1: "Podrška radi radnim danima od 9 do 17 časova.",
    2: "Na tiket odgovaramo u roku od 24 časa radnim danima.",
    3: "Licencu možete vratiti u roku od 14 dana od kupovine.",
    4: "Pretplata se obnavlja automatski svakog 1. u mesecu; otkaz se daje "
       "najkasnije do 25. u mesecu.",
}

KLJUCNE_RECI = {
    "radno vreme": 1, "podrška": 1, "podrsk": 1, "zovem": 1,
    "tiket": 2, "odgovar": 2, "rok": 2,
    "licenc": 3, "vrać": 3, "vratit": 3,
    "pretplat": 4, "otkaz": 4, "obnavlj": 4,
}

def trazi_u_bazi(pojam: str) -> str:
    """Vraća činjenice koje se poklapaju sa pojmom, sa brojevima — ili NEMA."""
    pojam = pojam.strip().lower()
    nadjeni = {broj for rec, broj in KLJUCNE_RECI.items() if rec in pojam}
    if not nadjeni:                        # probaj i reči iz samog pitanja
        nadjeni = {broj for broj, tekst in CINJENICE.items()
                   if any(rec in pojam for rec in tekst.lower().split()[:3])}
    if not nadjeni:
        return "NEMA: u bazi podrške nema ničega o tome."
    return "\n".join(f"[činjenica {b}] {CINJENICE[b]}" for b in sorted(nadjeni))

FUNKCIJE = {"trazi_u_bazi": trazi_u_bazi}

SH_ALAT = {"type": "function", "function": {
    "name": "trazi_u_bazi",
    "description": "Pretražuje bazu činjenica firme Studio Dim (radno vreme, "
                   "rokovi, licence, pretplata). Vraća činjenice sa brojevima "
                   "ili NEMA. Za svako pitanje o firmi — prvo ovaj alat.",
    "parameters": {"type": "object", "properties": {
        "pojam": {"type": "string",
                  "description": "Tema ili pojam iz pitanja, npr. 'radno vreme'."},
    }, "required": ["pojam"]},
}}

SYSTEM_PROMPT = (
    "Ti si agent korisničke podrške firme Studio Dim. Pravila: (1) odgovaraš "
    "SAMO na osnovu alata trazi_u_bazi — svaku tvrdnju potkrepljuješ brojem "
    "činjenice u uglatestima zagradama, npr. [činjenica 2]; (2) ako alat vrati "
    "NEMA, odgovor počinje rečenicom 'NE ZNAM — to nije u bazi podrške.' i ne "
    "nagađaš; (3) ako pitanje sadrži pogrešnu pretpostavku, ispravljaš je "
    "uljudno i navodiš pravu vrednost; (4) odgovaraš u najviše tri kratka "
    "stava. Ništa van ovih pravila."
)

def agent(client, model, pitanje: str, max_koraka: int = 4) -> str:
    """Mini-petlja iz modula 03: isti obrazac, manji zadatak."""
    poruke = [{"role": "system", "content": SYSTEM_PROMPT},
              {"role": "user", "content": pitanje}]
    for _ in range(max_koraka):
        odgovor = client.chat.completions.create(
            model=model, messages=poruke, tools=[SH_ALAT], temperature=0.2,
        )
        poruka = odgovor.choices[0].message
        if not poruka.tool_calls:
            return poruka.content or ""
        poruke.append(poruka)
        for poziv in poruka.tool_calls:
            try:
                argumenti = json.loads(poziv.function.arguments or "{}")
                rezultat = str(FUNKCIJE[poziv.function.name](**argumenti))
            except Exception as g:
                rezultat = f"GREŠKA: {g}"
            print(f"[alat] {poziv.function.name}({argumenti}) → {rezultat[:50]}…")
            poruke.append({"role": "tool", "tool_call_id": poziv.id,
                           "content": rezultat})
    return "GREŠKA: agent nije završio odgovor (max_koraka)."

def main() -> None:
    api_key = os.environ.get("Z_AI_API_KEY", "")
    if not api_key:
        sys.exit("Nema Z_AI_API_KEY. Postavite environment varijablu pa ponovo pokrenite.")
    client = OpenAI(api_key=api_key,
                    base_url=os.environ.get("Z_AI_BASE_URL",
                                            "https://api.z.ai/api/paas/v4"))
    model = os.environ.get("Z_AI_MODEL", "glm-4.6")
    pitanje = " ".join(sys.argv[1:]) or "Do kada mogu da zovem vašu podršku?"
    print(agent(client, model, pitanje))

if __name__ == "__main__":
    main()
```

Probajte ga ručno, uz zvuk (izlazni kod — poslednja linija):

```bash
python 07a_agent.py; echo "izlaz: $?"
```

Primetite dva detalja: „NE ZNAM" i `[činjenica N]` nisu slučajne reči — one su **ugovor formata** koji će provere u sledećem zadatku tretirati doslovno; i sistemski prompt je pisan posle skice provera, ne pre (format odgovora se bira po tome šta se meri).

### 6.2 Zadatak 2: scenario-skup od pet primera

Pet scenarija po anatomiji iz sekcije 3 — pokriveno direktno, parafraza, van domena, pogrešna pretpostavka, dvodelno. Sačuvajte kao `eval-skup.json`:

```json
[
  {"id": "radno-vreme",
   "ulaz": "Do kada mogu da zovem vašu podršku?",
   "ocekivano": "Navodi radno vreme podrške (radnim danima, do 17) sa izvorom [činjenica 1].",
   "provere": [
     {"tip": "sadrzi", "vrednost": "17"},
     {"tip": "regex", "vrednost": "činjenica\\s*1"}
   ]},
  {"id": "parafraza",
   "ulaz": "Zvao sam u subotu u podne i niko se nije javio. Je l' to normalno?",
   "ocekivano": "Objašnjava da podrška radi radnim danima (do 17), bez izmišljanja.",
   "provere": [
     {"tip": "sadrzi", "vrednost": "17"},
     {"tip": "sadrzi", "vrednost": "radn"}
   ]},
  {"id": "van-domena",
   "ulaz": "Koja je danas kursna lista evra?",
   "ocekivano": "Odbija: NE ZNAM, bez navođenja ikakve činjenice.",
   "provere": [
     {"tip": "sadrzi", "vrednost": "NE ZNAM"},
     {"tip": "ne_sadrzi", "vrednost": "činjenica"}
   ]},
  {"id": "pogresna-pretpostavka",
   "ulaz": "Kupio sam licencu prošle nedelje; rok za vraćanje mi od 30 dana ističe — gde da je prijavim?",
   "ocekivano": "Ispravlja pretpostavku: rok je 14 dana, ne 30; navodi [činjenica 3].",
   "provere": [
     {"tip": "sadrzi", "vrednost": "14"},
     {"tip": "regex", "vrednost": "činjenica\\s*3"}
   ]},
  {"id": "dvodelni",
   "ulaz": "Koliko brzo odgovarate na tiket i do kog datuma mogu da otkažem pretplatu?",
   "ocekivano": "Odgovara na oba dela: rok 24 časa; otkaz do 25. u mesecu.",
   "provere": [
     {"tip": "sadrzi", "vrednost": "24"},
     {"tip": "sadrzi", "vrednost": "25"}
   ]}
]
```

Pročitajte skup još jednom kao listač, ne kao pisac: da li biste **vi** znali šta je palo kada padne? Provera `sadrzi "radn"` izgleda čudno dok ne padne — a padne sa porukom „odgovor ne pominje radne dane", koja odmah kaže kuda. Tako treba da izgleda svaka provera.

### 6.3 Zadatak 3: pokretač — prolaz/pad, stopa, prag

Pokretač (eng. *harness*) je skripta koja sve spaja: čita skup, pokreće agenta, primenjuje provere, ispisuje tabelu, upisuje rezultat i vraća izlazni kod po pragu. Sačuvajte kao `07b_eval.py`:

```python
"""Vežba 7.3 — pokretač evaluacije: scenario-skup → prolaz/pad → stopa → prag.

  Z_AI_API_KEY   — obavezno: vaš API ključ (opciono Z_AI_BASE_URL, Z_AI_MODEL)

Upotreba:
  python 07b_eval.py                          # pokreće skup, prag 0.8
  python 07b_eval.py --oznaka pre            # isto, rezultat u rezultati/pre.json
  python 07b_eval.py --diff rezultati/pre.json rezultati/posle.json
"""

import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path

REZULTATI = Path(__file__).parent / "rezultati"

def pokreni_proveru(provera: dict, odgovor: str) -> tuple[bool, str]:
    """Jedna deterministička provera; vraća (prolaz, opis za tabelu)."""
    tip, vrednost = provera["tip"], provera["vrednost"]
    if tip == "sadrzi":
        return vrednost.lower() in odgovor.lower(), f"sadrži '{vrednost}'"
    if tip == "ne_sadrzi":
        return vrednost.lower() not in odgovor.lower(), f"ne sadrži '{vrednost}'"
    if tip == "regex":
        return re.search(vrednost, odgovor, re.IGNORECASE) is not None, \
               f"regex /{vrednost}/"
    return False, f"nepoznat tip provere '{tip}'"

def main() -> None:
    if len(sys.argv) > 2 and sys.argv[1] == "--diff":
        return diff(Path(sys.argv[2]), Path(sys.argv[3]))

    api_key = os.environ.get("Z_AI_API_KEY", "")
    if not api_key:
        sys.exit("Nema Z_AI_API_KEY. Postavite environment varijablu pa ponovo pokrenite.")

    from openai import OpenAI
    from importlib import import_module
    ag = import_module("07a_agent")   # fajl počinje cifrom → importlib (import naredba to ne može)
    client = OpenAI(api_key=api_key,
                    base_url=os.environ.get("Z_AI_BASE_URL",
                                            "https://api.z.ai/api/paas/v4"))
    model = os.environ.get("Z_AI_MODEL", "glm-4.6")

    scenariji = json.loads(Path("eval-skup.json").read_text(encoding="utf-8"))
    ishodi = []
    for sc in scenariji:
        print(f"\n—— scenario: {sc['id']} ——")
        odgovor = ag.agent(client, model, sc["ulaz"])
        print(f"odgovor: {odgovor[:120]}…")
        provere = [{"opis": opis, "prolaz": prolaz}
                   for prolaz, opis in (pokreni_proveru(p, odgovor)
                                        for p in sc["provere"])]
        ishodi.append({"id": sc["id"], "prolaz": all(p["prolaz"] for p in provere),
                       "provere": provere, "odgovor": odgovor})

    stopa = sum(1 for i in ishodi if i["prolaz"]) / len(ishodi)
    print("\n== rezultat ==")
    for i in ishodi:
        znak = "✔" if i["prolaz"] else "✘"
        neuspelo = "; ".join(p["opis"] for p in i["provere"] if not p["prolaz"])
        print(f"{znak} {i['id']:24s} {neuspelo or ''}")
    print(f"stopa prolaznosti: {stopa:.0%} (prag 80%)")

    REZULTATI.mkdir(exist_ok=True)
    oznaka = "poslednje"
    if "--oznaka" in sys.argv:
        oznaka = sys.argv[sys.argv.index("--oznaka") + 1]
    fajl = REZULTATI / f"{oznaka}.json"
    fajl.write_text(json.dumps({"vreme": datetime.now().isoformat(timespec="minutes"),
                                "model": model, "stopa": stopa,
                                "scenariji": ishodi}, ensure_ascii=False, indent=2),
                    encoding="utf-8")
    print(f"zapisano: {fajl}")
    sys.exit(0 if stopa >= 0.8 else 1)          # prag kao izlazni kod (kapija)

def diff(stari: Path, novi: Path) -> None:
    """Upareni pregled po scenariju — srce razmišljanja u razlikama."""
    a = {s["id"]: s["prolaz"] for s in json.loads(stari.read_text(encoding="utf-8"))["scenariji"]}
    b = {s["id"]: s["prolaz"] for s in json.loads(novi.read_text(encoding="utf-8"))["scenariji"]}
    print(f"{'scenario':26s} {stari.stem:12s} {novi.stem:12s} ?")
    for sid in a:
        pre, posle = a[sid], b.get(sid)
        strelica = "" if pre == posle else ("  ← novi gubitak" if pre else "  ← popravljen")
        print(f"{sid:26s} {'✔' if pre else '✘':^12s} {'✔' if posle else '✘':^12s}{strelica}")
    print(f"stopa: {sum(a.values())}/{len(a)} → {sum(b.values())}/{len(b)}")
    print("Pravilo: agregat odlučuje, flipovi objašnjavaju — svaki flip pročitati na primeru.")

if __name__ == "__main__":
    main()
```

Pokrenite (uz ključ u environment varijabli):

```bash
python 07b_eval.py --oznaka v1; echo "izlazni kod: $?"
```

Ako je stopa ispod praga — izlazni kod je 1: to nije neuspeh skripte, to je kapija kako treba da radi. Otvorite `rezultati/v1.json`: pored stope stoje odgovori agenta **reč po reč** — dif bez odgovora je broj bez značenja.

### 6.4 Zadatak 4: izmena, ponovno pokretanje, dif

Sada prvo pravo korišćenje svega. Napravite jednu promenu u agentu — u `07a_agent.py` izbacite iz sistemskog prompta pravilo (2) (ono o „NE ZNAM"). Pokrenite ponovo sa oznakom:

```bash
python 07b_eval.py --oznaka bez-odbijanja; echo "izlazni kod: $?"
python 07b_eval.py --diff rezultati/v1.json rezultati/bez-odbijanja.json
```

Čitajte dif po scenariju: očekivano, `van-domena` je pala (agent više ne odbija doslovno). Ali pogledajte ostale — da li je promena pokvarila još nešto? Ovo je trenutak modula: **izmena koja je „mala" i lokalna na papiru, a u difu vidite njen pravi doseg**. Vratite pravilo (2), pokrenite treći put, uverite se difom da ste se vratili na početak — i da sada imate tri zapisana pokretanja u Git-u (dodajte `rezultati/` u `.gitignore` samo ako vam je draže čisto — mi preporučujemo da ipak ide u repozitorijum: to je dnevnik).

### 6.5 Zadatak 5 (domaći): sudija, rast skupa, i cena

1. **Sloj sudije.** Dodajte u `07b_eval.py` ocenjivanje pomoću modela za scenario `parafraza` (za koji determinističke provere slabo vezuju): sudija po rubrici iz sekcije 5, temperatura 0, izlaz `{"prolaz": ..., "razlog": ...}`. Kalibrišite: ocenite primer sami, pa sudijom; gde se ne slažu — popravite rubriku, ne primer.
2. **Skup na deset.** Dodajte pet scenarija: još jedan van domena (bliži temi — da kuša granicu), jedan sa zahtevom za nedozvoljenu akciju („obrišite moj nalog odmah" — agent nema alat za to; šta treba da kaže?), jedan dvodelni preko dve činjenice, jedan sa pitanjem na engleskom (ako firma prodaje inostranstvu), i jedan regresioni — scenario koji je pao u vašim pokretanjima iz 6.3/6.4.
3. **Koliko košta tačnost.** Dodajte metriku troška: u `agent()` sabirajte `usage.total_tokens` i vraćajte uz odgovor; ispisujte prosečan trošak po scenariju u tabeli. Zatim A/B: isti skup na dva modela (npr. `glm-4.6` i neki jeftiniji po planu), dif + tabela cena, i odgovor na pitanje: „koliko košta onih nekoliko procenata stope?"

## 7. Tipične greške — i dijagnoza

| Simptom | Uzrok | Lek |
|---|---|---|
| Skup uvek zelen, a agent u radu loš | samo laki scenariji, bez graničnih | četiri kategorije iz sekcije 3; scenario iz svake stvarne greške |
| Scenario pada „nekad" (treperi) | provera previše uska za nedeterminizam (tačna formulacija) | proveriti svojstvo, ne tekst; više pokretanja i stopa |
| Dva pokretanja, iste stope — a ponašanje drugo | gleda se samo agregat | dif po scenariju: flipovi su priča |
| Popravka jednog pokvari drugo (tiho) | nema uparenog pregleda ni kapije | dif + prag kao izlazni kod u CI |
| Sudija i provere se ne slažu, ne zna se kome verovati | nekallibrisana rubrika | kalibracija na 5 primera; gde se ne slažu — čitati primer |
| Skup naučen napamet (agent „pamuje" odgovore) | optimizacija direktno na evaluacionom skupu | odvojiti razvojni skup od završnog; novi scenariji iz stvarnosti |

Redosled provere pri dijagnostici: **koji je scenario pao (id!) → odgovor u rezultatima (reč po reč) → trag agenta (koje je pozive alata napravio) → tek onda prompt/model**. Skoro uvek stane na prvom koraku — scenario koji pada jeste dijagnoza.

## 8. Pitanja za samoproveru

1. Nabrojite tri pretpostavke jediničnog testiranja koje agent lomi, i za svaku jednu posledicu za pisanje provera.
2. Zašto se ponašanje proverava svojstvima („sadrži izvor", „odbija van domena") umesto poređenjem tačnog teksta? Šta se dešava sa prostoru „tačno" kada temperatura nije 0?
3. Koja četiri polja nosi scenario, i koje četiri kategorije scenarija mora da sadrži skup? Odakle u praksi dolaze najvredniji scenariji?
4. Objasnite razliku između stope prolaznosti i dif pregleda. Zašto „ista stopa" ne znači „nema promene"? Šta je regresioni scenario?
5. U primeru n8n flote iz sekcije 4: zašto se posle prolaza/pada gleda još i razlika izlaza? Šta znači pravilo „zeleno znači objašnjeno"?
6. Nabrojite tri pristrasnosti sudije-modela i po jedan lek za svaku. Zašto sudija mora biti drugi sloj, a ne prvi?
7. Vaš dif pokazuje: jedan scenario pao, jedan popravljen, stopa nepromenjena. Napišite tri koraka kojima biste odlučili da li izmena ide u produkciju.

## Šta sledi

Agent je sada i izmeren: scenario-skup u Git-u, kapija koja pada glasno, i dif koji svaku izmenu pretvara u odluku sa objašnjenjem. [**Modul 08 — Multi-agent sistemi**](../MAPA-UCENJA.md) otvara poslednje veliko proširenje: kada jednog agenta zaista nije dovoljno — podele uloga, komunikacija, orkestracija — i, najvažnije, kada multi-agent sistem *nije* rešenje. Uživo ovaj modul možete da odrađujete na [radionici 05](../radionice/radionica-05-evaluacija.md). 🚀
