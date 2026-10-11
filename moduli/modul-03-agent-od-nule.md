# Modul 03 — Agent od nule: petlja odlučivanja bez frameworka

> **Vreme:** 6–8 časova rada · **Preduslovi:** [moduli 01](modul-01-osnove-llm.md) i [02](modul-02-alati-tool-use.md) · **Stanje:** prva radna verzija

Ovo je srce puta. U modulu 02 napisali ste mini-petlju `pokreni(...)` koja odgovara na pitanja uz pomoć alata — mehaniku. Sada iz nje pravimo **agenta**: sistem kome se ne postavlja pitanje, nego **zadatak** („sredi ovaj direktorijum"), koji sam planira redosled koraka, sam se koriguje kada nešto krene naopako, i ume da stane. Bez frameworka, bez biblioteka — **oko 100 linija Pythona** koje ćete razumeti liniju po liniju. Nakon ovog modula, frameworki za agente prestaju da budu magija: postaju izbor.

---

## 1. Od pitanja ka zadatku

Podsetimo radnu definiciju iz modula 00: agent je sistem u kome model **odlučuje i deluje** — koristi alate, pravi korake ka cilju, koriguje sebe. Šta to, tehnički, razlikuje bota iz modula 02 od agenta?

| | Bot iz modula 02 | Agent iz ovog modula |
|---|---|---|
| Ulaz | pitanje (jedan odgovor) | zadatak sa ciljem („uradi ovo") |
| Broj koraka | 1–3 runde, obično po jednom alatu | desetine koraka, sam bira redosled |
| Plan | ne postoji — odgovara onim redom kako pita | eksplicitno planira, pa izvršava (i preplanira) |
| Korekcija | ponekad, slučajno | sistematski: greška alata → novi zahtev → novi pokušaj |
| Zaštita | `max_rundi` kao tehnički detalj | kočnice su deo dizajna: koraci, budžet, dozvole |

Mehanika je ista (poruke + alati + petlja). Ono što se menja je **obim odgovornosti**: botu verujemo jedno pitanje, agentu posao. Zato agentu moramo dati i **cilj** (jasno rečen zadatak), i **kočnice** (šta sme, dokle sme, koliko sme da košta), i **trag** (zapis svakog koraka, da bismo posle razumeli šta se desilo).

Ciklus po kome agent radi je star koliko i oblast veštačke inteligencije — **opažaj → razmišljaj → deluj** (eng. *perceive–think–act*):

- **opažaj** (perceive): agent prikuplja stanje sveta — kroz alate koji *čitaju* (`listaj_fajlove`, `procitaj_fajl`), poruku korisnika, rezultate prethodnih koraka;
- **razmišljaj** (think): model, gledajući cilj i sve dosad opaženo, bira sledeću akciju (i argumente) ili zaključuje da je gotovo;
- **deluj** (act): naš kod izvršava traženi alat i svet (ili naš uvid u svet) se menja — rezultat ide nazad u kontekst, i ciklus se ponavlja.

Uz to ide i **korekcija**: kada akcija vrati grešku, agent ne staje nego menja pristup — to je peti element petlje agenta (eng. *agent loop*).

## 2. Anatomija petlje

Petlja agenta, u pseudokodu — zapamtite je, jer je to ceo modul:

```text
zadatak = jasan cilj + uspeh izražen merljivo
ponavljaj dok ne sledi jedan od tri izlaza:
    1. FINALNI ODGOVOR — model kaže "gotovo je" (uspeh ili iskreno "ne može")
    2. KOČNICA         — prekoračen broj koraka, budžet tokena ili zabranjena akcija
    3. AKCIJA          — model traži alat → izvrši → rezultat u kontekst → nastavi
```

Tri izlaza menjaju sve. Bez kočnica, agent koji se pogrešno razume sa sobom može da vrti u krug dok ne potroši račun; bez jasnog merljivog cilja, „gotovo" je stvar ukusa modela. Kada kasnije budete čitali dokumentaciju frameworka, naći ćete u njemu upravo ove delove — samo lepše zapakovane.

## 3. Vežba: agent „Arhivista", od nule

Zadatak agenta: **srediti neuredan direktorijum.** Pregleda fajlove, pročita svaki, predloži uređena imena — i upiše plan u fajl. Namerno je dizajniran da bude moćan a bezopasan: najveća „akcija" koju sme je da *upiše jedan novi fajl sa predlozima*. Pravi agent bi preimenovao fajlove — to ostavljamo za domaći, uz potvrdu čoveka.

### 3.1 Priprema sandbox-a

```bash
mkdir -p sandbox
cat > "sandbox/DOKUMENTACIJA-final-FINAL2.md" <<'KRAJ'
# API vodič — verzija 2.3 (mart 2025)
Sve krajnje tačke servisa koriste JSON. Autentifikacija: zaglavlje `Authorization`.
Kvote: 100 zahteva po minutu. Promene od 2.2: novi endpoint /izvestaji.
KRAJ
cat > "sandbox/beleške sa sastanka 3.txt" <<'KRAJ'
Sastanak 14.02.2025. — prisutni ceo tim.
Odluke: (1) migracija baze u aprilu; (2) novi endpoint /izvestaji do kraja marta;
(3) Ivana vodi dokumentaciju. Rok za prvu verziju plana: 28. februar 2025.
KRAJ
cat > "sandbox/cene_2024.csv" <<'KRAJ'
mesec,plan,cena_rsd
januar,basic,1200
februar,basic,1200
mart,pro,2400
KRAJ
```

### 3.2 Kompletan agent

Sačuvajte kao `03_agent_od_nule.py` — i pročitajte ga pre nego što pokrenete; svaki deo je objašnjen u komentarima:

```python
"""Vežba 3.1 — agent „Arhivista": sređuje direktorijum, u ~100 linija, bez frameworka.

Ključ i konfiguracija dolaze isključivo iz environment varijabli:
  Z_AI_API_KEY   — obavezno: vaš API ključ
  Z_AI_BASE_URL  — opciono: podrazumevano https://api.z.ai/api/paas/v4
  Z_AI_MODEL     — opciono: naziv modela po vašem planu
"""

import json
import os
import sys
from pathlib import Path

from openai import OpenAI

SANDBOX = Path(__file__).parent / "sandbox"

# --- 1. ALATI: šta agent SME (sve ostalo naš kod odbija) --------------------

def listaj_fajlove() -> str:
    """Opažaj: spisak fajlova u sandbox-u (bez samog plana)."""
    imena = sorted(p.name for p in SANDBOX.iterdir()
                   if p.is_file() and p.name != "plan-sredjivanja.md")
    return "\n".join(imena) or "(direktorijum je prazan)"

def procitaj_fajl(ime: str) -> str:
    """Opažaj: sadržaj jednog fajla, ograničen na sandbox."""
    fajl = (SANDBOX / ime).resolve()
    if not fajl.is_relative_to(SANDBOX.resolve()):
        return "GREŠKA: putanja izlazi van sandbox direktorijuma."
    try:
        return fajl.read_text(encoding="utf-8")[:2000]
    except FileNotFoundError:
        return f"GREŠKA: fajl '{ime}' ne postoji."

def upisi_plan(sadrzaj: str) -> str:
    """Deluj: JEDINA akcija koja menja svet — novi fajl sa predlozima."""
    (SANDBOX / "plan-sredjivanja.md").write_text(sadrzaj, encoding="utf-8")
    return "Plan je upisan u plan-sredjivanja.md."

FUNKCIJE = {
    "listaj_fajlove": listaj_fajlove,
    "procitaj_fajl": procitaj_fajl,
    "upisi_plan": upisi_plan,
}

SH_ALATI = [
    {"type": "function", "function": {
        "name": "listaj_fajlove",
        "description": "Vraća imena svih fajlova u radnom direktorijumu, po jedan u redu. "
                       "Prvi korak svakog pregleda.",
        "parameters": {"type": "object", "properties": {}, "required": []},
    }},
    {"type": "function", "function": {
        "name": "procitaj_fajl",
        "description": "Čita sadržaj fajla iz radnog direktorijuma (najviše 2000 znakova). "
                       "Ime mora biti tačno onako kako ga je vratio listaj_fajlove.",
        "parameters": {"type": "object", "properties": {
            "ime": {"type": "string", "description": "Ime fajla iz spiska."},
        }, "required": ["ime"]},
    }},
    {"type": "function", "function": {
        "name": "upisi_plan",
        "description": "Upisuje konačan plan sređivanja u fajl plan-sredjivanja.md. "
                       "Koristi TEK kada si pregledao sve fajlove — ne pre.",
        "parameters": {"type": "object", "properties": {
            "sadrzaj": {"type": "string",
                        "description": "Kompletan plan u markdown-u: tabela staro ime → "
                                       "predloženo novo ime + po jedna rečenica obrazloženja."},
        }, "required": ["sadrzaj"]},
    }},
]

# --- 2. PETLJA AGENTA: opažaj → razmišljaj → deluj, sa kočnicama -------------

SYSTEM_PROMPT = (
    "Ti si 'Arhivista', agent za sređivanje direktorijuma. Radiš SAMO kroz alate. "
    "Postupak: (1) izlistaj fajlove; (2) pročitaj svaki; (3) za svaki predloži novo "
    "ime — mala slova, reči spojene crticom, bez sufiksa 'final', sa godinom iz "
    "sadržaja ako se vidi; (4) upiši plan. Ako alat vrati GREŠKA, promeni zahtev. "
    "Kada je plan upisan, odgovori kratkim rezimeom i završi."
)

def agent(client, model, zadatak: str, max_koraka: int = 15) -> str:
    poruke = [{"role": "system", "content": SYSTEM_PROMPT},
              {"role": "user", "content": zadatak}]
    potroseno = 0
    for korak in range(1, max_koraka + 1):            # kočnica 1: broj koraka
        odgovor = client.chat.completions.create(
            model=model, messages=poruke, tools=SH_ALATI, temperature=0.2,
        )
        potroseno += getattr(odgovor.usage, "total_tokens", 0)
        poruka = odgovor.choices[0].message

        if not poruka.tool_calls:                     # izlaz 1: finalni odgovor
            print(f"—— gotovo u koraku {korak} · ukupno {potroseno} tokena ——")
            return poruka.content or ""

        poruke.append(poruka)                         # model razmišlja → traži akciju
        for poziv in poruka.tool_calls:
            try:
                argumenti = json.loads(poziv.function.arguments or "{}")
                rezultat = str(FUNKCIJE[poziv.function.name](**argumenti))
            except KeyError:
                rezultat = f"GREŠKA: nepoznat alat '{poziv.function.name}'."
            except Exception as g:                    # greška ide modelu (korekcija)
                rezultat = f"GREŠKA: {g}"
            print(f"[korak {korak}] {poziv.function.name}({argumenti}) "
                  f"→ {rezultat[:60]}...")            # trag: vidimo svaki korak
            poruke.append({"role": "tool", "tool_call_id": poziv.id,
                           "content": rezultat})
    return f"Zaustavljen: dostignut max_koraka ({max_koraka})."   # izlaz 2: kočnica

# --- 3. Pokretanje -----------------------------------------------------------

def main() -> None:
    api_key = os.environ.get("Z_AI_API_KEY", "")
    if not api_key:
        sys.exit("Nema Z_AI_API_KEY. Postavite environment varijablu pa ponovo pokrenite.")

    client = OpenAI(
        api_key=api_key,
        base_url=os.environ.get("Z_AI_BASE_URL", "https://api.z.ai/api/paas/v4"),
    )
    model = os.environ.get("Z_AI_MODEL", "glm-4.6")

    zadatak = ("Pregledaj sve fajlove u direktorijumu i sredi imena: za svaki fajl "
               "odredi šta sadrži, pa upiši plan novih imena preko alata upisi_plan. "
               "Uspeh je: svaki fajl obrađen, plan upisan, rezime dat.")
    print(agent(client, model, zadatak))

if __name__ == "__main__":
    main()
```

Pokrenite: `python 03_agent_od_nule.py`, pa otvorite `sandbox/plan-sredjivanja.md`. Zatim pogledajte terminal još jednom — tu je najvredniji deo.

### 3.3 Šta ste upravo napravili

Prođimo mapiranje petlje na kod, korak po korak:

- **zadatak** → prva `user` poruka, sa uspehom izraženim merljivo („svaki fajl obrađen, plan upisan");
- **opažaj** → alati `listaj_fajlove` i `procitaj_fajl` (samo čitaju svet);
- **razmišljaj** → model bira sledeći alat i argumente (to je ceo njegov posao u petlji);
- **deluj** → naš kod izvršava funkciju i rezultat ide u kontekst kao `tool` poruka;
- **korekcija** → `except` grana: greška se vraća modelu kao tekst, i on menja zahtev;
- **kočnice** → `max_koraka` (proširite budžetom tokena u domaćem);
- **trag** → `print` po koraku: broj, alat, argumenti, rezultat.

Ukoliko agent zapne, simptom ćete videti u trag: isto ime fajla traži više puta? Opis alata mu ne kaže da imena dolaze iz `listaj_fajlove`. Piše plan pre čitanja? Sistemski prompt je previše mek — podvucite „TEK kada si pregledao sve".

### 3.4 Zadatak 2: tri promene, tri lekcije

1. **Lekcija planiranja:** promenite zadatak u „preimenuj fajlove" (ne postoji takav alat). Posmatrajte trag: agent traži nepostojeći alat, dobija grešku — i šta radi? Dobar agent će predložiti najbliže što može (upisati plan). Loš će se vrteti. Oba ishoda su poučna.
2. **Lekcija kočnica:** postavite `max_koraka=3` i pokrenite originalni zadatak. Kočnica je radila — ali je li rezultat upotrebljiv? Kočnica koja preseca pre cilja je bug, ne bezbednost: usklađite je sa zadatkom.
3. **Lekcija cilja:** izbacite iz zadatka poslednju rečenicu („Uspeh je..."). Pokrenite par puta. Razlikuje li se ponašanje? Merljiv kriterijum uspeha najjeftinija je „evaluacija" koju imate — piše se jednom, a štedi rundu svaki put.

### 3.5 Zadatak 3 (domaći): pravo preimenovanje, uz čoveka u petlji

Dodajte alat `preimenuj(staro_ime, novo_ime)` koji zaista menja ime fajla — ali uz **potvrdu čoveka u petlji** (eng. *human in the loop*): funkcija prvo `input()`-om pita „preimenovati X u Y? [d/N]" i vraća modelu „korisnik odbio" ako je ne. Pravila: samo unutar sandbox-a, nikad preko postojećeg fajla, nikad brisanje. Zatim:

1. pokrenite agenta koji prvo piše plan, pa onda, korak po korak, traži preimenovanja iz plana — sa vašom potvrdom na svakom;
2. pokrenite ga na tri različita direktorijuma (napravite „neuredne" podatke po uzoru na 3.1) i zapišite gde je odstupio od plana i zašto;
3. napredni: dodajte „budžet tokena" — ukupni `potroseno` iznad praga (npr. 20.000) prekida petlju pre novog poziva; i prvi susret sa modulom 05: kada istorija pređe ~30.000 tokena, zamenite starije `tool` poruke jednim sažetkom.

## 4. Čitanje traga: autopsija jednog trajekta

Trag (eng. *trace*) — ispisan niz koraka, odluka i rezultata — je vaš crni sanduk. Veština koja se ne preskače: posle svakog pokretanja, pročitajte trag i pitajte tri pitanja:

1. **Je li svaki korak bio potreban?** Agent je ponekad pročitao fajl koji je već pročitao, ili listao dva puta. Svaki suvišni korak = tokeni, vreme i šansa za grešku.
2. **Jesu li argumenti bili tačni — i odakle su došli?** Ime fajla iz spiska (dobro) ili izmišljeno (loše → opis alata).
3. **Gde je doneta ključna odluka?** Kada je agent „shvatio" šta je u direktorijumu — i je li to tačno?

Primer jednog realnog traga (skraćeno), sa zapažanjima u zagradi:

```text
[korak 1] listaj_fajlove({}) → DOKUMENTACIJA-final-FINAL2.md... (opažaj: dobro prvo kretanje)
[korak 2] procitaj_fajl({'ime': 'DOKUMENTACIJA-final-FINAL2.md'}) → # API vodič... (argument iz spiska: tačno)
[korak 3] procitaj_fajl({'ime': 'beleške sa sastanka 3.txt'}) → Sastanak 14.02.2025... (tačno)
[korak 4] procitaj_fajl({'ime': 'cene_2024.csv'}) → mesec,plan,cena_rsd... (tačno)
[korak 5] upisi_plan({'sadrzaj': '# Plan sređivanja...'}) → Plan je upisan... (akcija tek posle pregleda: po proceduri)
—— gotovo u koraku 6 · ukupno 3147 tokena ——
```

Pet koraka, bez ponavljanja, ~3.000 tokena — to je dobar trajekat. Kada vidite trag sa 15 koraka od kojih je 8 suvišnih, znate *tačno* gde se traži štednja — i to je najava modula 05 (inženjering konteksta) i 07 (merenje). U produkciji (modul 09) trag postaje struktuiran log — ali čita se isto.

## 5. Kočnice: bezbednost i budžet kao deo dizajna

Petlja koja sama sebi bira akcije je moćna baš zato što je i rizična. Kočnice koje smo ugradili, i još koje treba:

1. **`max_koraka`** — najgrublja: štiti od beskonačnog vrtenja („izgubljeno u petlji" je najčešći način da agent zaprvo ne uspe).
2. **Budžet tokena** — koraka može biti malo, a svaki skup: ukupan zbir tokena preko praga prekida rad pre novog poziva.
3. **Allow-lista akcija** — model sme da traži samo alate iz `FUNKCIJE`; sve ostalo vraćamo kao grešku. To važi i za tip operacije: naš Arhivista ima *jednu* akciju koja menja svet, i to najbezopasniju moguću (novi fajl).
4. **Čovek u petlji** za destruktivno — preimenovanje, brisanje, slanje: potvrda `input()`-om pre izvršenja (domaći 3.5).
5. **Dry-run prvo** — agent prvo piše *plan*, čovek odobrava, pa se izvršava. Za skupocene ili nepovratne operacije ovaj obrazac vredi i kada vam se ne sviđa.

Pravilo koje pamti celi kurs: **agent predlaže, kočnice raspolažu.** Svaka linija koda koju niste sami napisali — u frameworku ili u tuđem primeru — zaslužuje pitanje: „a ko ga zaustavlja?"

## 6. Petlja ili framework?

Napisali ste agenta; sada možete pošteno da odgovorite na pitanje iz modula 00: šta framework stvarno radi?

Framework (biblioteka tipa onih za orkestraciju agenata) daje: gotove petlje i strukturu poruka, integracije (veze ka bazama, pretragama, MCP serverima iz modula 06), obezbeđeno izvršavanje alata, praćenje i logovanje, ponekad i evaluaciju. Sve to je ~100 linija kod vas — plus još sto, i još sto.

| Kada je čist kod bolji | Kada framework ima smisla |
|---|---|
| učite oblast (kao sad) | tim gradi više agenata i traži zajedničke delove |
| jedan do tri agenta, poznati zadatak | desetine integracija i alata koje treba „utaknuti" |
| dijagnoza do poslednjeg tokena mora biti vaša | brzina integracije vredi više od dubine kontrole |
| mala ekipa, kratak život prototipa | dugotrajni proizvod, mnogo ljudi, standardi |

Iskustveno pravilo: **prvi prototip agenta uvek u čistom kodu** — da biste osetili gde model pomaže, a gde buni. Framework uvodite kada ponavljate isti kod treći put, ne ranije. A kada ga uvedete, bićete korisnik koji čita dokumentaciju sa poverenjem proizvođača: jer ispod svake biblioteke je petlja koju ste sami napisali.

## 7. Pitanja za samoproveru

1. Nacrtajte petlju agenta iz sekcije 2 i označite gde u kodu iz 3.2 stoji svaki od tri izlaza.
2. Preslikajte „opažaj → razmišljaj → deluj" na konkretne linije koda agenta. Koja dva alata su „opažaji", a koja akcija? Zašto ta podela ima bezbednosni značaj?
3. Zašto grešku vraćamo modelu kao `tool` poruku, a ne prekidamo program? Šta bi se desilo sa `max_koraka` kada bismo prekidali na prvoj grešci?
4. Agent se zaustavio sa porukom „dostignut max_koraka". Nabrojite tri moguća uzroka i za svaki promenu koja bi pomogla (u zadatku, promptu, kočnici).
5. Šta je trag (trace) i zašto ga čitamo i kada je agent *uspeo*? Koja tri pitanja postavljamo pri čitanju?
6. Kada biste sutra izabrali framework za agenta, koja tri pitanja biste mu prva postavili — a da odgovore znate iz sopstvenog koda?

## Šta sledi

Agent vidi samo ono što stane u kontekst — a kontekst je novčanik. [**Modul 04 — Memorija i RAG**](../MAPA-UCENJA.md) daje agentu dugoročno pamćenje: ugnežđene reprezentacije (eng. *embeddings*), vektorsku bazu i pretragu po smislu nad vašim dokumentima. Uživo ovaj modul možete odrađivati na [radionici 03](../radionice/radionica-03-agent-od-nule.md). 🚀
