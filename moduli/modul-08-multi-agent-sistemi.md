# Modul 08 — Multi-agent sistemi: kada (i kako) jednog agenta podeliti na više

> **Vreme:** 4–6 časova rada · **Preduslovi:** [moduli 03](modul-03-agent-od-nule.md) i [07](modul-07-evaluacija-agenata.md) · **Stanje:** prva radna verzija

Dosad je svaki agent u ovom kursu bio **jedan**: jedna petlja (modul 03), jedan sistemski prompt, jedan skup alata. Sada prvi put dodajemo drugog. Ali ovaj modul počinje suprotno od onoga što biste očekivali: ne od „kako se pravi multi-agent sistem", nego od „kada jedan agent **zaista** nije dovoljan". Jer sistem od više agenata (eng. *multi-agent system*) nije nadogradnja koja automatski znači bolje — to je tim. A svaki tim, ljudski ili veštački, plaća cenu koordinacije: više poziva, duže čekanje, teže traženje grešaka. Radno pravilo modula: **drugi agent se dodaje kada je dokazano potreban, ne kada je uzbudljiv.** A kada se već dodaje — radimo to kako treba: jasne uloge, jasan ugovor između njih, i orkestracija (ko radi šta i kojim redom) kao deo koda koji se — naravno — evaluira kao i sve ostalo (modul 07). Kraj modula: sopstveni sistem planer + izvršilac, izmeren naspram jednog agenta na istom zadatku, sa argumentom za i protiv koji stoji na brojevima.

---

## 1. Kada jedan agent zaista nije dovoljan

Počnimo od poštenog pitanja: zašto uopšte dodavati drugog agenta? Postoje tačno **pet dijagnoza** — pet konkretnih problema koje jedan agent ima, a koje podela na više agenata leči. Ako ne možete da imenujte koja od njih pet je vaša — nemate simptom, i ovaj modul vam verovatno ne treba (a to je sasvim u redu).

**1. Kontekstni prozor kao zid.** Neki zadaci stvarno traže više teksta nego što staje u prozor (modul 01): recimo, pročitati četrdeset dokumenata i napisati izveštaj. Jedan agent onda bira između dva zla — ili ne staje, ili mora tako agresivno da sažima (modul 05) da gubi detalje. Više agenata znači više **odvojenih** prozora: svako čita svoj deo, a dalje putuje samo sažetak. Ovo je najčvršća dijagnoza od svih pet, jer je merljiva: kad je korpus veći od prozora, matematika odlučuje umesto vas.

**2. Specijalizacija.** Različiti delovi posla traže različito ponašanje: agent za pretragu treba da bude kratak, činjeničan i sumnjičav; agent za pisanje — tečan i čitljiv. Jedan sistemski prompt koji pokuša da bude i jedno i drugo postane konfuzan: model dobija protivrečna uputstva („budi sažet" + „budi detaljan") i radi oba posla osrednje. Dva prompta = dve čiste uloge.

**3. Paralelizam.** Tri međusobno nezavisna pretraživanja mogu da se rade istovremeno; jedan agent radi uzastopno, korak po korak. Ako vaš zadatak prirodno ima oblik „uradi pet nezavisnih stvari, pa saberi" (eng. *fan-out/fan-in*), podela donosi brzinu, ne pamet.

**4. Nezavisna perspektiva.** Onaj koji piše ne vidi sopstvene greške — to zna svako ko je ikad predao tekst bez tuđeg čitanja. Pisac i kriticar (eng. *critic*) su dve uloge upravo zato: kada su razdvojeni, kriticar ne nasleđuje pisčeve pretpostavke, jer mu u kontekst ne ulazi „kako je pisac mislio", nego samo tekst.

**5. Granice prava.** Agent koji pretražuje javne izvore ne treba da ima pristup produkcijskoj bazi ni alat za brisanje fajlova. Podela po pravima pristupa znači da greška jednog agenta (ili napad kroz njega — modul 06) ima malu „blast radius" zonu: može da se desi samo ono što taj agent sme.

Primetite šta ovih pet ima zajedničko: svaka je **dijagnoza** — konkretan, imenljiv problem — a „dodaj agenta" je terapija za nju. To je ceo duh modula u jednoj rečenici: multi-agent sistem se **propisuje**, ne usvaja iz mode. Kad neko kaže „napravimo to multi-agent", prvo pitanje je uvek isto: *koja od pet dijagnoza?* Ako odgovor glasi „pa, deluje moćnije" — to nije dijagnoza, to je marketing.

## 2. Podela uloga: agent je uloga, ne osoba

Šta u ovom kursu znači „jedan agent"? Ne proces, ne instanca, ne antropomorfni lik sa imenom. Agent je **uloga**: sistemski prompt + alati + podaci do kojih sme. Iz toga sledi i pravilo kada je novi agent zaista nov: **tek kada se bar jedno od ta tri promeni.** Agent koji ima isti prompt, iste alate i isti pristup, samo „drugarskiji ton" — nije novi agent, to je isti agent sa drugim šeširom. (Ista logika važi obrnuto: ponekad su tri „agenta" u nekom sistemu zapravo jedan agent pozvan tri puta — i to je često dobar dizajn, samo ne treba da se zove tim.)

Klasične uloge u sistemu od više agenata — imenujte ih po **odgovornosti**, ne po ličnosti:

| Uloga | Odgovornost | Tipičan sistemski prompt počinje sa… |
|---|---|---|
| planer (eng. *planner*) | razlaže cilj na korake | „Ti razlažeš zadatak na najmanje dovoljan broj koraka…" |
| orkestrator (eng. *orchestrator*) | dodeljuje, sabere, odlučuje o kraju | „Ti dodeljuješ korake i sudiš kad je posao gotov…" |
| izvršilac (eng. *worker*, *executor*) | radi jedan korak do kraja | „Ti odgovaraš samo na dodeljeno pitanje, sa izvorima…" |
| kriticar (eng. *critic*) | ocenjuje tuđi rezultat po rubrici | „Ti nalaziš greške u tekstu prema spisku kriterijuma…" |
| sastavljač (eng. *composer*) | spaja delove u konačan oblik | „Ti sastavljaš konačni tekst iz datih delova, bez novih tvrdnji…" |

Uočite dva detalja. Prvo, planer i orkestrator se u malim sistemima **spajaju u jednu ulogu** — onaj koji pravi plan obično i dodeljuje korake; razdvajaju se tek kad sistem poraste. Drugo, izvršilac ne mora biti model **u svakom mestu**: ključna pretraga po korpusu je odličan izvršilac, brz i besplatan — u vežbama ćemo videti oba sveta.

Drugi stub podela uloga je **ugovor** (eng. *contract*) između njih. Kao što dva modula u kodu imaju jasan interfejs — šta funkcija prima, šta vraća — tako i dva agenta imaju: **ulaz** koji agent prima (oblik zadatka i konteksta), **izlaz** koji daje (oblik rezultata), i **granice** — šta sme, a šta ne. Ugovor se piše **pre** koda, jednom rečenicom po strani: „tražilac prima pitanje, vraća izvode sa brojevima izvora ili NEMA; ne piše stilski." Ako ne možete da napišete ugovor u jednoj rečenici — uloga je previše široka, podelite je ili je suzite. Ugaoni kamen dizajna je star koliko i programiranje: **jedna uloga, jedna odgovornost** (eng. *single responsibility*), ista ona po kojoj pišete male funkcije — samo su ovde „funkcije" agenti.

## 3. Komunikacija: šta putuje između agenata

Agenti ne dele mozak. Jedino što dele je **ono što pošalju jedan drugom** — i tu se multi-agent sistemi najčešće pokvare. Klasična bolest zove se **gluvi telefon** (degradacija konteksta, eng. *context degradation*): kao u igri u kojoj se poruka šapuće niz red, svaki prenos je prilika da nešto padne, doda se izmišljotina, ili se izgubi bitno. Što više agenata u nizu, to više „šapata" između cilja i rezultata.

Zato je pravilo komunikacije jedno i strogo: između agenata putuju **tri stvari, ništa više**:

1. **zadatak** (eng. *task*) — šta treba uraditi, rečeno precizno: jedno pitanje, jedna promena, jedan korak plana;
2. **kontekst** — samo ono što je primaocu **potrebno** da razume zadatak (modul 05: kontekst je najskuplji resurs; prepisivanje cele istorije plaćate na svakom koraku i svakom agentu);
3. **rezultat** (artefakt, eng. *artifact*) — ono što je urađeno, u obliku koji sledeći agent može da koristi bez prepričavanja.

Primetite šta **ne** putuje: cela istorija razgovora prvog agenta, njegova „razmišljanja", međukoraci. Ako sastavljač treba izvode, tražilac mu šalje izvode — ne dnevnik svog rada. Ovo je ugovor iz sekcije 2 u pokretu.

Druga odluka: u kom **obliku** putuje poruka. Model priča u slobodnom tekstu, ali orkestrator je **kod** — a kod ne sme da *nagađa* gde u odgovoru stoji rezultat. Zato između agenata idu **strukturisani** odgovori (JSON: `{"status": "ok", "tekst": ..., "izvori": [...]}`), a slobodan tekst ostaje *unutar* jednog agenta. Ovo je ista lekcija kao sa alatima u modulu 02 (šema umesto molbe) i planom u modulu 03 (koraci sa imenima, ne „uradi nešto") — samo jedan nivo više.

I na kraju, veza sa modulom 06: A2A protokol je upravo ovo — agent–agent komunikacija sa agent-karticom (ko sam, šta umem), zadatkom i artefaktima. U vežbama ćemo sve raditi unutar jednog Python procesa (pozivi funkcija umesto mreže), ali oblik poruka biće isti: **zadatak + kontekst → rezultat**. Kad jednog dana takav sistem razdvojite na dva računara, poruke ne menjaju oblik — menjaju samo transport.

## 4. Orkestracija: planer + izvršilac

Najpoznatiji i najkorisniji obrazac višeagentskog sistema ima samo dve uloge: **planer + izvršilac**. Planer primi cilj, razloži ga na korake, dodeljuje ih jednom (ili više) izvršilaca, sabire rezultate i sudi kada je gotovo. Petlja orkestratora izgleda ovako:

```text
(1) primi cilj
(2) napravi plan — spisak koraka, svaki sa imenom i očekivanim ishodom
(3) dodeli korak izvršiocu: zadatak + kontekst (samo potreban!)
(4) primi rezultat i proveri: je li korak stvarno gotov?
(5) nije → replaniraj (novi plan, ne ponavljanje u prazno); jeste → sledeći korak
(6) nema više koraka → sastavi konačan odgovor iz rezultata
```

Pogledajte korake pažljivo — negde ste to već videli. Cilj, plan, akcija, posmatranje, korekcija: to je **petlja agenta iz modula 03**, samo jedan nivo više. Agent iz modula 03 u svom koraku zove **alat**; orkestrator u svom koraku zove **agenta**. To je najdublja rečenica ovog modula: **multi-agent sistem je petlja agenta čiji je alat drugi agent.** Sve što ste dosad naučili o petlji — granica koraka, čuvanje traga, ne ponavljati istu akciju beskonačno — važi i ovde, samo sa „alatom" koji priča.

Iz te sličnosti odmah proizlaze i varijante orkestracije, jer su to u stvari varijante petlje:

- **sekvencijalna** (eng. *pipeline*): korak 1 → 2 → 3, svaki čeka prethodnog; najjednostavnija, dovoljna za većinu zadataka;
- **paralelna** (eng. *fan-out/fan-in*): jedan zadatak podeljen na N nezavisnih delova, svi rade istovremeno, orkestrator sabire (dijagnoza 3 iz sekcije 1);
- **hijerarhijska**: orkestrator dodeljuje cele podzadatke pod-orkestratorima, koji imaju svoje izvršioce — svaka grana je opet isti obrazac; uvodi se tek kad broj koraka preraste jedan pregledan plan;
- **sa kriticarom**: posle izvršioca dolazi kriticar, a orkestrator odlučuje da li se ide na ponovni rad — uz **čvrstu granicu** (npr. najviše jedna popravka), inače pisac i kriticar mogu da se do besvesti šalju tekst jedan drugom.

Jedno upozorenje ugrađeno u korak (5): kada korak padne, orkestrator **replanira** — menja plan saznanjem da je korak pao — umesto da bezumno ponavlja isti korak. Isti princip kao u petlji iz modula 03: posmatranje koje ne promeni sledeću akciju nije posmatranje nego dekoracija.

## 5. Kada multi-agent NIJE rešenje

Ovo je najvažnija sekcija modula, pa je pišimo kao takvu: ravnodučno, bez ustezanja.

**Više agenata ne pravi pamet.** Grupa agenata koja ne zna nešto — ne zna to i grupno; razmena poruka ne dodaje znanje nijednom učesniku. „Emergentna inteligencija" koja se navodno pojavi kad se agenata dovoljno napili — po našem znanju se ne pojavljuje; pojavljuju se računi. Ono što se stvarno dešava u dobro projektovanom višeagentskom sistemu je skromnije i korisnije: **podela posla radi bolje nego jedan preopterećen kontekst** — kad (i samo kad) stoji neka od pet dijagnoza iz sekcije 1.

**Cena se množi.** Svaki agent je poziv API-ju (ili više njih). Tri agenta koji svaki nose isti kontekst = taj kontekst plaćate tri puta; pet koraka u nizu = kašnjenje se sabira; a paralelna varijanta čeka najsporijeg izvršioca. Uz to, debugging postaje arheologija: kada izlaz ne valja, ko je pogrešio — planer koji je los plan napravio, izvršilac koji je pogrešno potražio, sastavljač koji je izgubio deo, ili komunikacija između njih? Jedan agent ima jedan trag (modul 03); sistem od pet ima pet tragova i četiri „šapata" gluvenog telefona između njih. I najzad, evaluacija (modul 07) se komplikuje: scenario-skup se mora pokrenuti protiv **svakog agenta ponaosob** (jer svaki ima svoj posao) i protiv **sistema u celini** (jer celina ima svoje načine da padne koje nijedan pojedinačni agent nema).

Sažmite to u tabelu — ista odluka, dva dizajna:

| | jedan agent | sistem od više agenata |
|---|---|---|
| trošak | kontekst plaćen jednom | isti kontekst često plaćen više puta |
| kašnjenje | svi koraci uzastopno | sabira se u nizu; paralelno čeka najsporijeg |
| traženje grešaka | jedan trag | više tragova + granice između agenata |
| evaluacija | jedan scenario-skup | skup po agentu + skup za celinu |
| gornja granica kvaliteta | kontekstni prozor i jedan prompt | više prozora, specijalizovani promptovi, paralelnost |

Poslednji red je jedini gde više agenata strogo pobeđuje — i zato dijagnoze iz sekcije 1 sve idu u njega: kontekst, specijalizacija, paralelizam, perspektiva, prava.

**Pet pitanja pre nego što dodate drugog agenta** — odgovorite redom, u pisanoj formi (to je vaš „dokaz potrebe" iz uvoda):

1. **Da li jedan agent, sa boljim alatom ili boljim promptom, već rešava zadatak?** — prvo izmerite (A/B na scenario-skupu, modul 07); ako jeste, gotovo je, uštedeli ste nedelju dana i tri kvote;
2. **Koja od pet dijagnoza je u pitanju?** — imenujte je; ako ne možete, vratite se na pitanje 1;
3. **Koji je ugovor između uloga?** — ulaz, izlaz i granice svakog agenta, po jedna rečenica;
4. **Kako ću znati da je **sistem** (ne pojedinačni agent) uspeo?** — provere na scenariju, na nivou celine;
5. **Kako ću naći grešku kad sistem padne?** — trag kroz sve agente, vidljiv u jednom pregledu.

> **Primer iz stvarne prakse: istraživački asistent koji se ugojio.** Jedan mali tim je pravio interni „istraživački asistent": agent koji za zadatu temu pretraži internu biblioteku i napiše kratak pregled. Prva verzija bio je **jedan** agent, sa RAG-om iz modula 04 — i radio je solidno dok je biblioteka bila mala. Kad je narasla, pojavila se dijagnoza 1: kontekst više nije stajao. Podelili su ga na **tražioca** (kratki izvodi sa izvorima) i **pisca** (dosta mu izvodi, ne celi dokumenti) — i stvar se stvarno popravila: pregledi su postali precizniji, a računi niži, jer pisac više nije nosio šum. Onda je krenuo rast broja uloga: „urednik stila", pa „čuvar činjenica", pa „arhivar izvora". Svaka uloga zvučala je razumno ponaosob — ali na prvom merenju (ista pet pitanja odozgo, kasno ali ipak) ispostavilo se da kvalitet nije porastao od treće uloge nadalje, a troškovi i kašnjenje jesu. Tim se vratio na **dve** uloge i tamo stao. Naučena lekcija tima, skoro naša rečenica iz uvoda: drugi agent je bio terapija za dijagnozu; četvrti je bio moda.

Poslednja misao sekcije, i citirajte je sebi svaki put kad sistem postane „zgodan za demonstraciju": **složenost koja se ne plaća u tokenima, plaća se u otklanjanju grešaka.**

## 6. Vežbe: sistem „Jutarnji pregled"

Gradimo kompletan mali sistem, komad po komad, po obrascu iz modula 07: prvo orkestracija sa mok agentima (testira se **bez** API ključa, kao u modulu 06), pa pravi planer, pa ceo sistem, pa A/B merenje jednog agenta naspram sistema — koje je odgovor na pitanje „za i protiv" iz ishoda modula. Domen je izmišljeni tehnički blog **„Zrnast"** sa šest kratkih članaka u korpusu (u kodu): sistem za zadatu temu pravi kratak pregled — planer postavlja potpitanja, tražilac pronalazi izvode sa izvorima, sastavljač piše konačan tekst. Kao i uvek: z.ai/GLM kroz OpenAI-kompatibilan interfejs, ključ samo u `Z_AI_API_KEY` (opciono `Z_AI_BASE_URL`, `Z_AI_MODEL`).

### 6.1 Zadatak 1: ugovor i orkestracija, bez ijednog poziva API-ju

Prvo pravilo višeagentskog sistema ne tiče se modela nego **ugovora**: oblik poruka između agenata. Zato prvi zadatak počinje bez modela — planer i sastavljač su mok (fiksirani), tražilac je obična pretraga po korpusu — a ipak se cela orkestracija već vrti i **testira offline**. Sačuvajte kao `08a_orkestrator.py`:

```python
"""Vežba 8.1 — ugovor i orkestracija sa mok agentima (bez API ključa).

Sistem „Jutarnji pregled" nad korpusom bloga „Zrnast": planer postavlja
potpitanja, tražilac pronalazi izvode, sastavljač spaja. Planer i sastavljač
su ovde mok — cilj je da se orkestracija (petlja!) testira bez mreže.

Upotreba: python 08a_orkestrator.py ["tema pregleda"]
"""

import re
import sys

# --- korpus: šest kratkih članaka fiktivnog bloga „Zrnast" -------------------
# (isti korpus se ponavlja u 08b, 08c i 08d — Python ne uvozi fajlove čija
# imena počinju cifrom, pa se deli po obrascu iz modula 04: duplirati)
CORPUS = [
    {"id": 1, "naslov": "Šta je token", "tekst":
     "Token je komadić teksta koji model obrađuje. Od broja tokena zavise cena "
     "poziva, brzina i koliko staje u kontekstni prozor."},
    {"id": 2, "naslov": "Kako rade alati", "tekst":
     "Alat je funkcija koju model može da pozove. Model traži poziv, kod ga "
     "izvršava i vraća rezultat u razgovor — petlja ide dok model ne odgovori."},
    {"id": 3, "naslov": "Petlja agenta", "tekst":
     "Agent je petlja: cilj, plan, akcija, posmatranje. Posmatranje menja "
     "sledeću akciju; bez posmatranja agent je samo generisanje teksta."},
    {"id": 4, "naslov": "Zašto kontekst košta", "tekst":
     "Kontekst je najskuplji resurs agenta. Svaki poziv nosi celu istoriju, pa "
     "nebitan kontekst plaćate na svakom koraku."},
    {"id": 5, "naslov": "Evaluacija umesto utiska", "tekst":
     "Agent se meri na scenario-skupu: provere po scenariju, stopa prolaznosti "
     "i dif pregled dva pokretanja. Utisak nije mera."},
    {"id": 6, "naslov": "Kad dodati drugog agenta", "tekst":
     "Drugi agent se dodaje kada jedan ima konkretan problem: kontekstni "
     "prozor, specijalizacija, paralelizam ili nezavisna perspektiva."},
]

# --- ugovor: šta putuje između agenata ---------------------------------------
# ZADATAK  = {"id": str, "opis": str}          — jedno pitanje, jedan korak
# REZULTAT = {"id": str, "status": "ok"|"nema", "tekst": str}
# Dva mala tipa, dve velike odluke: agent dobija zadatak, vraća rezultat;
# ništa između nije slobodna forma koju orkestrator pogađa.

def mok_planer(cilj: str) -> list[dict]:
    """Planer u moku: fiksirana dva koraka — dovoljni za probu orkestracije."""
    return [
        {"redni": 1, "pitanje": f"Šta je osnovna ideja: {cilj}?"},
        {"redni": 2, "pitanje": f"Koje su posledice i primena: {cilj}?"},
    ]

# reči koje ne nose pojam — glupe za pretragu („je", „kako", „šta"…)
STOP_RECI = {"šta", "je", "kako", "koje", "su", "se", "to", "i", "ili",
             "za", "iz", "ovo", "ono", "sta"}

def reci_teksta(tekst: str) -> set[str]:
    """Sadržajne reči teksta: mala slova, bez interpunkcije, bez stop-reči."""
    return {r for r in re.findall(r"[a-ž]+", tekst.lower())
            if len(r) >= 4 and r not in STOP_RECI}

def trazilac(zadatak: dict) -> dict:
    """Tražilac u moku pameti, ali pravi radi: pretraga po korpusu.

    Ovo je važna poenta iz sekcije 2: izvršilac ne mora biti model.
    Pretraga je odličan izvršilac — brz, besplatan, odrediv.
    """
    reci = reci_teksta(zadatak["opis"])
    nadjeni = [c for c in CORPUS if reci & reci_teksta(c["naslov"] + " " + c["tekst"])]
    if not nadjeni:
        return {"id": zadatak["id"], "status": "nema",
                "tekst": "NEMA: u korpusu nema ničega o tome."}
    tekst = "\n".join(f'[izvor {c["id"]}] {c["naslov"]}: {c["tekst"]}'
                      for c in nadjeni)
    return {"id": zadatak["id"], "status": "ok", "tekst": tekst}

def mok_sastavljac(cilj: str, rezultati: list[dict]) -> str:
    """Sastavljač u moku: čisto spajanje izvoda, bez ikakvog modela."""
    delovi = [r["tekst"] for r in rezultati if r["status"] == "ok"]
    if not delovi:
        return f"NEMA: o temi {cilj!r} u korpusu nema ničega."
    return f"## Jutarnji pregled: {cilj}\n\n" + "\n\n".join(delovi)

def orkestruj(cilj: str) -> str:
    """Petlja orkestratora iz sekcije 4 — uz mok uloge.

    Prva prilika da vidite čitavu ideju modula u 15 linija: ovo JE petlja
    iz modula 03, samo je „alat" sad drugi agent (ovde: funkcija trazilac).
    """
    plan = mok_planer(cilj)                              # (1)(2) cilj → plan
    print(f"[planer] {len(plan)} koraka")
    rezultati = []
    for korak in plan:                                   # (3) dodela
        zadatak = {"id": f"k{korak['redni']}", "opis": korak["pitanje"]}
        r = trazilac(zadatak)                            # (4) izvršenje
        print(f"  [tražilac {zadatak['id']}] {r['status']}")
        rezultati.append(r)
    return mok_sastavljac(cilj, rezultati)               # (6) sastavljanje

if __name__ == "__main__":
    tema = " ".join(sys.argv[1:]) or "petlja agenta"
    print(orkestruj(tema))
```

Pokrenite bez ijednog ključa:

```bash
python 08a_orkestrator.py            # tema „petlja agenta"
python 08a_orkestrator.py "token"    # druga tema
```

U izlazu pratite redosled: plan, pa dva dodeljena koraka, pa sastavljanje. Zatim probajte temu za koju nema ničega (npr. „kvantno računarstvo"): vidite kako se poruka `NEMA` vraća kroz ugovor do vrha, umesto da se izgubi. I jedno malo domaće pravilo za kraj zadatka: ubacite na kraju `08a_orkestrator.py` proveru ugovora — `assert` da svaki `REZULTAT` ima sva tri ključa (`id`, `status`, `tekst`) — pa namerno izbacite jedan ključ iz `trazilac` i pogledajte kako ugovor **pada glasno** umesto da tiho proizvede polomljen pregled. Ugovor koji se ne proverava je dogovor na reč, a mi se dogovaramo kodom (modul 07).

### 6.2 Zadatak 2: pravi planer — model pravi plan, kod ga proverava

Sada jednu ulogu menjamo pravom: planer postaje model. Ključna lekcija zadatka nije kako se traži plan (to je jedan običan poziv) nego šta se radi sa **izlazom** modela kad je taj izlaz ulaz za kod: proverava se oblik, seče na maksimum koraka, i **ponavlja jednom** sa objašnjenjem greške ako format ne valja. Isti obrazac kao sa šemama alata u modulu 02 — samo sad na nivou plana. Sačuvajte kao `08b_planer.py`:

```python
"""Vežba 8.2 — pravi planer: model pravi plan u JSON-u, kod ga proverava.

Orkestracija je ista kao u 08a (duplirana — imena sa cifrom se ne uvoze,
vidi modul 04), ali je planer sada model: z.ai/GLM preko OpenAI-kompatibilnog
klijenta. Tražilac ostaje mok — cilj je da se planer izoluje.

  Z_AI_API_KEY   — obavezno: vaš API ključ
  Z_AI_BASE_URL  — opciono: podrazumevano https://api.z.ai/api/paas/v4
  Z_AI_MODEL     — opciono: model za razgovor (podrazumevano glm-4.6)

Upotreba: python 08b_planer.py "tema pregleda"
"""

import json
import os
import sys

from openai import OpenAI

# --- korpus i mok tražilac: isti kao u 08a (duplirani) -----------------------
CORPUS = []  # ovde nalepite CORPUS i trazilac iz 08a_orkestrator.py

# --- planer: model sa strogo definisanim poslom ------------------------------

SYSTEM_PLANER = (
    "Ti si planer sistema za kratke preglede nad malim korpusom članaka. "
    "Zadatak: za datu temu predloži 2 do 4 potpitanja koje pokrivaju ključne "
    "delove teme (pojam, kako radi, kako se meri/evaluira). Odgovori SAMO "
    "JSON-om tačno ovog oblika, bez uvoda i objašnjenja: "
    '{"koraci": [{"redni": 1, "pitanje": "..."}, ...]}'
)

def izvuci_json(tekst: str) -> dict:
    """Parsira JSON iz odgovora modela; podnosi uvodne reči oko bloka."""
    try:
        return json.loads(tekst)
    except json.JSONDecodeError:
        poc, kraj = tekst.find("{"), tekst.rfind("}") + 1
        if poc < 0 or kraj <= poc:
            raise ValueError(f"nema JSON bloka u odgovoru: {tekst[:80]!r}")
        return json.loads(tekst[poc:kraj])

def proveri_plan(odgovor: dict) -> list[dict]:
    """Ugovor za plan: lista koraka sa redni i pitanje; max 4 koraka."""
    koraci = odgovor.get("koraci")
    if not isinstance(koraci, list) or not koraci:
        raise ValueError("plan mora biti lista 'koraci' sa bar jednim korakom")
    cist = []
    for i, k in enumerate(koraci[:4], start=1):        # sečemo na max 4
        pitanje = str(k.get("pitanje", "")).strip()
        if not pitanje:
            raise ValueError(f"korak {i} nema 'pitanje'")
        cist.append({"redni": i, "pitanje": pitanje})
    return cist

def planer(client, model, cilj: str) -> list[dict]:
    """Poziva model i proverava plan; jedan pokušaj popravke formata."""
    poruke = [{"role": "system", "content": SYSTEM_PLANER},
              {"role": "user", "content": f"Tema pregleda: {cilj}"}]
    for pokusaj in range(2):                            # max jedan retry
        odg = client.chat.completions.create(
            model=model, messages=poruke, temperature=0.2)
        tekst = odg.choices[0].message.content or ""
        try:
            return proveri_plan(izvuci_json(tekst))
        except (ValueError, json.JSONDecodeError) as g:
            print(f"[planer] pokušaj {pokusaj + 1}: loš format ({g})")
            poruke.append({"role": "assistant", "content": tekst})
            poruke.append({"role": "user", "content":
                           "Prethodni odgovor nije prošao proveru oblika. "
                           "Vrati SAMO JSON oblika "
                           '{"koraci": [{"redni": 1, "pitanje": "..."}]} '
                           f"— greška je bila: {g}"})
    raise SystemExit("planer nije dao ispravan plan ni iz drugog pokušaja")

def main() -> None:
    api_key = os.environ.get("Z_AI_API_KEY", "")
    if not api_key:
        sys.exit("Nema Z_AI_API_KEY. Postavite environment varijablu pa ponovo "
                 "pokrenite.")
    client = OpenAI(api_key=api_key,
                    base_url=os.environ.get("Z_AI_BASE_URL",
                                            "https://api.z.ai/api/paas/v4"))
    model = os.environ.get("Z_AI_MODEL", "glm-4.6")
    cilj = " ".join(sys.argv[1:]) or "petlja agenta"

    plan = planer(client, model, cilj)
    print(f"[planer] plan od {len(plan)} koraka:")
    for k in plan:
        print(f"  {k['redni']}. {k['pitanje']}")
    for k in plan:                                      # tražilac iz 08a
        r = trazilac({"id": f"k{k['redni']}", "opis": k["pitanje"]})
        print(f"  [tražilac {r['id']}] {r['status']}")

if __name__ == "__main__":
    main()
```

(`CORPUS = []` je namerno: nalepite ga iz `08a_orkestrator.py` — podsetnik da se ovde sve deli dupliranjem, po obrascu iz modula 04.)

Pokrenite nekoliko puta, sa različitim temama:

```bash
python 08b_planer.py "token i kontekst"
python 08b_planer.py "kako se agenti evaluiraju"
python 08b_planer.py "tema o kojoj korpus ćuti"
```

Dve stvari da primetite. Prvo: temperatura 0.2 i JSON format — plan je **podatak za kod**, pa ga i tretiramo kao takav (sečenje na 4 koraka u `proveri_plan` nije dekoracija: neograničen plan za korpus od šest članaka je besmislica, a ograničenje je deo ugovora). Drugo: retry petlja sa objašnjenjem greške — kad model pogreši format, kaže mu se **šta** je pogrešno, i data mu se druga šansa; ako ni tada ne valja, pada glasno (izlazni kod ≠ 0), tiho ne prolazi. To je ponašanje koje želite od svakog agenta u sistemu, uključujući i orkestrator.

### 6.3 Zadatak 3: ceo sistem — tri prave uloge i njihovi troškovi

Sada sve tri uloge postaju model, i to tri **različita** posla (sekcija 2: uloga = prompt + alati + podaci): planer pravi plan (isti kao u 08b), tražilac je mali agent sa jednim alatom — pretragom po korpusu — i petljom iz modula 03/07, a sastavljač dobija **samo izvode** kao kontekst i piše pregled. Uz to brojimo tokene po ulozi: prvi put vidimo trošak svakog agenta ponaosob. Sačuvajte kao `08c_sistem.py` (korpus i `trazi_u_korpusu` su isti kao u 08a — duplirajte ih ispod, po obrascu iz modula 04):

```python
"""Vežba 8.3 — sistem „Jutarnji pregled": planer + tražilac + sastavljač.

Tri prave uloge (svaka svoj sistemski prompt, tražilac ima i alat),
orkestracija spaja, a trag pamti koliko je ko koštao po tokenima.

  Z_AI_API_KEY   — obavezno: vaš API ključ
  Z_AI_BASE_URL  — opciono: podrazumevano https://api.z.ai/api/paas/v4
  Z_AI_MODEL     — opciono: model za razgovor (podrazumevano glm-4.6)

Upotreba: python 08c_sistem.py "tema pregleda"
"""

import json
import os
import sys

from openai import OpenAI

# --- korpus i pretraga: isti kao u 08a (duplirani) ---------------------------
CORPUS = []  # nalepite CORPUS iz 08a

def trazi_u_korpusu(pojam: str) -> str:
    """Alat tražioca: pretraga po korpusu, sa brojevima izvora."""
    # nalepite telo pretrage iz 08a (mok tražilac) — alat je isti,
    # samo ga sada zove model, ne orkestrator
    ...

SH_ALAT = {"type": "function", "function": {
    "name": "trazi_u_korpusu",
    "description": "Pretražuje članke bloga Zrnast (tokeni, alati, petlja, "
                   "kontekst, evaluacija, multi-agent). Vraća izvode sa "
                   "[izvor N] ili NEMA. Za svako potpitanje — prvo ovaj alat.",
    "parameters": {"type": "object", "properties": {
        "pojam": {"type": "string",
                  "description": "Pojam ili potpitanje, npr. 'petlja agenta'."},
    }, "required": ["pojam"]},
}}

SYSTEM_PLANER = (  # isti kao u 08b — nalepite ga
    "...")
SYSTEM_TRAZILAC = (
    "Ti si tražilac u sistemu za preglede. Dobijaš JEDNO potpitanje i "
    "odgovaraš samo iz alata trazi_u_korpusu: izvodi članaka sa [izvor N], "
    "ništa iz glave. Ako alat vrati NEMA, odgovoriš samo: NEMA. Ne pišeš "
    "stilski, ne objašnjavaš, ne komentarišeš — samo izvodi ili NEMA."
)
SYSTEM_SASTAVLJAC = (
    "Ti si sastavljač kratkih pregleda. Dobijaš temu i izvode sa [izvor N] "
    "iz korpusa. Pišeš kratak pregled (najviše 5 rečenica) koji citira "
    "izvore u uglastim zagradama, npr. [izvor 3]. Ne izmišljaš ništa što u "
    "izvodima ne postoji; ako izvoda nema, odgovoriš samo: NEMA."
)

def pozovi(client, model, poruke, tools=None, temperatura=0.2):
    """Jedan poziv modela + vraća (poruka, potrošeni tokeni) — radi traga."""
    odg = client.chat.completions.create(
        model=model, messages=poruke, tools=tools, temperature=temperatura)
    poruka = odg.choices[0].message
    potroseno = odg.usage.total_tokens if odg.usage else 0
    return poruka, potroseno

def planer(client, model, cilj, trag):
    """Isti ugovor kao u 08b — plan je JSON podatak koji se proverava."""
    poruke = [{"role": "system", "content": SYSTEM_PLANER},
              {"role": "user", "content": f"Tema pregleda: {cilj}"}]
    poruka, t = pozovi(client, model, poruke)
    trag["planer"] += t
    odgovor = json.loads(poruka.content or "{}")
    koraci = odgovor.get("koraci", [])[:4]
    return [{"redni": i, "pitanje": str(k.get("pitanje", "")).strip()}
            for i, k in enumerate(koraci, start=1) if k.get("pitanje")]

def trazilac(client, model, pitanje, trag, max_koraka: int = 3) -> str:
    """Izvršilac: mini-petlja iz modula 07 — alat, pa odgovor."""
    poruke = [{"role": "system", "content": SYSTEM_TRAZILAC},
              {"role": "user", "content": pitanje}]
    for _ in range(max_koraka):
        poruka, t = pozovi(client, model, poruke, tools=[SH_ALAT])
        trag["tražilac"] += t
        if not poruka.tool_calls:
            return poruka.content or ""
        poruke.append(poruka)
        for poziv in poruka.tool_calls:
            argumenti = json.loads(poziv.function.arguments or "{}")
            rezultat = str(trazi_u_korpusu(**argumenti))
            print(f"    [alat] trazi_u_korpusu({argumenti['pojam']!r})")
            poruke.append({"role": "tool", "tool_call_id": poziv.id,
                           "content": rezultat})
    return "GREŠKA: tražilac nije završio (max_koraka)."

def sastavljac(client, model, cilj, izvodi, trag) -> str:
    """Kontekst za sastavljača: SAMO izvodi — ne cela istorija tražioca.

    Ovo je sekcija 3 u jednoj liniji: između agenata putuje zadatak,
    kontekst (izvodi) i rezultat — ne dnevnik rada prethodnika.
    """
    poruke = [{"role": "system", "content": SYSTEM_SASTAVLJAC},
              {"role": "user", "content":
               f"Tema: {cilj}\n\nIzvodi iz korpusa:\n{izvodi}"}]
    poruka, t = pozovi(client, model, poruke)
    trag["sastavljač"] += t
    return poruka.content or ""

def orkestruj(client, model, cilj: str) -> str:
    """Petlja orkestratora: plan → dodela → izvodi → sastavljanje."""
    trag = {"planer": 0, "tražilac": 0, "sastavljač": 0}
    plan = planer(client, model, cilj, trag)
    print(f"[planer] {len(plan)} koraka, {trag['planer']} tokena")
    izvodi = []
    for k in plan:
        r = trazilac(client, model, k["pitanje"], trag)
        print(f"  [tražilac {k['redni']}] {r.splitlines()[0][:60]}")
        if not r.startswith("NEMA"):
            izvodi.append(r)
    pregled = (sastavljac(client, model, cilj, "\n\n".join(izvodi), trag)
               if izvodi else f"NEMA: o temi {cilj!r} u korpusu nema ničega.")
    print(f"[trag] tokeni po ulozi: {trag} (ukupno {sum(trag.values())})")
    return pregled

def main() -> None:
    api_key = os.environ.get("Z_AI_API_KEY", "")
    if not api_key:
        sys.exit("Nema Z_AI_API_KEY. Postavite environment varijablu pa ponovo "
                 "pokrenite.")
    client = OpenAI(api_key=api_key,
                    base_url=os.environ.get("Z_AI_BASE_URL",
                                            "https://api.z.ai/api/paas/v4"))
    model = os.environ.get("Z_AI_MODEL", "glm-4.6")
    cilj = " ".join(sys.argv[1:]) or "petlja agenta"
    print(orkestruj(client, model, cilj))

if __name__ == "__main__":
    main()
```

Pokrenite (uz ključ):

```bash
python 08c_sistem.py "kako agenti koriste alate"
python 08c_sistem.py "kontekst i tokeni"
```

U izlazu čitajte trag: koliko je koraka planer napravio, šta je tražilac potražio (linije `[alat]` su pozivi alata unutar tražiočeve petlje), i koliko je ko koštao. Dve stvari da proverite: (1) da li sastavljač citira izvore `[izvor N]` — ako ne, prompt mu je previše mekan; (2) da li je neka uloga jasno previše skupa za ono što pravi — na šest članaka tražilac ne bi trebalo da troši više od planera, a dešava se: njegova petlja (alat → odgovor → alat…) nosi celu istoriju svog koraka. Tu se vidi celokupna poenta sekcije 5 — na malom korpusu, mereno.

### 6.4 Zadatak 4: jedan protiv sistema — mereno, ne osećajski

Ovaj zadatak je razlog što modul ima modul 07 kao preduslov. Pitanje „da li mi treba više agenata" ne odgovara se mišljenjem nego A/B merenjem na istom scenario-skupu: strana A je **jedan agent** kojem se ceo korpus ubaci u jedan prompt; strana B je **sistem iz 08c**. Provere su determinističke (modul 07): navođenje izvora, pokrivenost pojmova, odbijanje kad nema ničega. Sačuvajte kao `08d_ab.py` (korpus, pretragu i tri uloge duplirate iz 08a/08c — obrazac iz modula 04):

```python
"""Vežba 8.4 — A/B: jedan agent naspram sistema planer+tražilac+sastavljač.

Isti scenario-skup, iste provere, dva dizajna — pa tabela: stopa,
tokeni, pozivi, vreme. Odgovor na „za i protiv" iz ishoda modula.

  Z_AI_API_KEY   — obavezno: vaš API ključ
  Z_AI_BASE_URL  — opciono: podrazumevano https://api.z.ai/api/paas/v4
  Z_AI_MODEL     — opciono: model za razgovor (podrazumevano glm-4.6)

Upotreba: python 08d_ab.py
"""

import json
import os
import sys
import time

from openai import OpenAI

# --- iz 08a/08c (duplirano): CORPUS, trazi_u_korpusu, SH_ALAT,
# --- SYSTEM_PLANER, SYSTEM_TRAZILAC, SYSTEM_SASTAVLJAC ---------------------
CORPUS = []  # nalepite iz 08a; zatim funkcije i prompte iz 08c

# --- scenario-skup: tri scenarija, determinističke provere -------------------
SCENARIJI = [
    {"id": "dva-pojma", "cilj": "token i kontekstni prozor",
     "provere": {"citira izvor": lambda o: "[izvor" in o,
                 "spominje tokene": lambda o: "token" in o.lower(),
                 "spominje kontekst": lambda o: "kontekst" in o.lower()}},
    {"id": "sinteza", "cilj": "kako se agent pravi i kako se meri",
     "provere": {"citira izvor": lambda o: "[izvor" in o,
                 "petlja": lambda o: "petlj" in o.lower(),
                 "evaluacija": lambda o: "evaluac" in o.lower()}},
    {"id": "van-korpusa", "cilj": "kvantno računarstvo",
     "provere": {"odbija": lambda o: o.strip().startswith("NEMA")}},
]

def korpus_u_prompt() -> str:
    """Ceo korpus kao tekst — za stranu A (jedan agent)."""
    return "\n".join(f'[izvor {c["id"]}] {c["naslov"]}: {c["tekst"]}'
                     for c in CORPUS)

def strana_a_jedan(client, model, cilj: str) -> tuple[str, dict]:
    """Jedan agent: ceo korpus u promptu, model sam planira i piše."""
    poruke = [{"role": "system", "content":
               "Pišeš kratke preglede (do 5 rečenica) na osnovu datih izvoda "
               "iz korpusa, sa citatima [izvor N]. Ako u izvodima nema ničega "
               "o temi, odgovoriš samo: NEMA. Ne izmišljaš."},
              {"role": "user", "content":
               f"Tema: {cilj}\n\nIzvodi:\n{korpus_u_prompt()}"}]
    poc = time.perf_counter()
    odg = client.chat.completions.create(
        model=model, messages=poruke, temperature=0.2)
    t = odg.usage.total_tokens if odg.usage else 0
    return (odg.choices[0].message.content or "",
            {"tokeni": t, "pozivi": 1, "sekundi": time.perf_counter() - poc})

def strana_b_sistem(client, model, cilj: str) -> tuple[str, dict]:
    """Sistem iz 08c, sažeto orkestriran: plan → tražilac → sastavljač."""
    poc = time.perf_counter()
    mera = {"tokeni": 0, "pozivi": 0}

    def pozovi(poruke, tools=None):
        odg = client.chat.completions.create(
            model=model, messages=poruke, tools=tools, temperature=0.2)
        mera["pozivi"] += 1
        mera["tokeni"] += odg.usage.total_tokens if odg.usage else 0
        return odg.choices[0].message

    poruka = pozovi([{"role": "system", "content": SYSTEM_PLANER},
                     {"role": "user", "content": f"Tema pregleda: {cilj}"}])
    koraci = json.loads(poruka.content or "{}").get("koraci", [])[:4]
    izvodi, odbio = [], True
    for k in koraci:
        poruke = [{"role": "system", "content": SYSTEM_TRAZILAC},
                  {"role": "user", "content": str(k.get("pitanje", ""))}]
        for _ in range(3):
            poruka = pozovi(poruke, tools=[SH_ALAT])
            if not poruka.tool_calls:
                break
            poruke.append(poruka)
            for poziv in poruka.tool_calls:
                argumenti = json.loads(poziv.function.arguments or "{}")
                poruke.append({"role": "tool", "tool_call_id": poziv.id,
                               "content": str(trazi_u_korpusu(**argumenti))})
        tekst = poruka.content or ""
        if not tekst.startswith("NEMA"):
            izvodi.append(tekst)
            odbio = False
    if odbio:
        return ("NEMA: u korpusu nema ničega o temi.",
                {**mera, "sekundi": time.perf_counter() - poc})
    poruka = pozovi([{"role": "system", "content": SYSTEM_SASTAVLJAC},
                      {"role": "user", "content":
                       f"Tema: {cilj}\n\nIzvodi:\n" + "\n\n".join(izvodi)}])
    return poruka.content or "", {**mera, "sekundi": time.perf_counter() - poc}

def main() -> None:
    api_key = os.environ.get("Z_AI_API_KEY", "")
    if not api_key:
        sys.exit("Nema Z_AI_API_KEY. Postavite environment varijablu pa ponovo "
                 "pokrenite.")
    client = OpenAI(api_key=api_key,
                    base_url=os.environ.get("Z_AI_BASE_URL",
                                            "https://api.z.ai/api/paas/v4"))
    model = os.environ.get("Z_AI_MODEL", "glm-4.6")

    print(f"{'scenario':14s} {'A':>4s} {'B':>4s}   tokeni A/B    pozivi A/B   sekundi A/B")
    stopa = {"A": 0, "B": 0}
    for sc in SCENARIJI:
        red = {"A": strana_a_jedan(client, model, sc["cilj"]),
               "B": strana_b_sistem(client, model, sc["cilj"])}
        prolaz = {}
        for strana in "AB":
            odgovor, mera = red[strana]
            prosao = all(p(odgovor) for p in sc["provere"].values())
            prolaz[strana] = prosao
            stopa[strana] += prosao
            if not prosao:
                print(f"  [{strana}] pao {sc['id']}: {odgovor[:80]!r}")
        a, b = red["A"][1], red["B"][1]
        print(f"{sc['id']:14s} {'✔' if prolaz['A'] else '✘':>4s}"
              f" {'✔' if prolaz['B'] else '✘':>4s}"
              f"   {a['tokeni']:>6}/{b['tokeni']:<6} {a['pozivi']:>6}/{b['pozivi']:<6}"
              f" {a['sekundi']:>7.1f}/{b['sekundi']:<5.1f}")
    print(f"\nstopa: A {stopa['A']}/{len(SCENARIJI)} · B {stopa['B']}/{len(SCENARIJI)}")
    print("Čitaj kao u modulu 07: agregat odlučuje, primeri objašnjavaju.")

if __name__ == "__main__":
    main()
```

(Napomena o poštenju eksperimenta: u `strana_b_sistem` plan se ne proverava sa retry-em kao u 08b/08c — prenesite tu proveru kad budete pokretali ozbiljno; ovde je skraćeno da tabela ostane čitljiva. I jedna sitnica iz 08c koja je ovde namerno izostavljena: trag po ulogama — dodajte ga u domaćem.)

Pokrenite dva-tri puta (nedeterminizam! — modul 07):

```bash
python 08d_ab.py
```

I sada pravi posao zadatka — čitanje rezultata. Očekivano (ali proverite na svojim pokretanjima): strana **B** troši više tokena i više poziva — planer i sastavljač su dva poziva kojih A nema — a stopa uspeha je **slična**, jer korpus od šest članaka staje u jedan prozor, pa je dijagnoza 1 iz sekcije 1 odsutna i podela nema šta da izleči. To je pouka: **na ovom korpusu, jedan agent je pravi izbor — i sada to znate iz merenja, ne iz ukusa.** Zatim promenite uslove i ponovite argument: u domaćem se traži da procenite šta se dešava kad korpus poraste sto puta (pogotovo: koja strana puca prva, i kroz koji zid — tokeni, prozor, ili cenu) — tada dijagnoza 1 stupa na scenu i tabela se okreće.

### 6.5 Zadatak 5 (domaći): kriticar sa granicom, paralelna pretraga, i cena pete uloge

1. **Kriticar — do jedne popravke.** Dodajte u sistem iz 08c četvrtu ulogu: kriticar koji dobija sastavljačev pregled i rubriku („citira li izvore? izmišlja li nešto? je li preko 5 rečenica?") i vraća `{"prolaz": true/false, "razlog": "..."}`. Orkestrator na `false` traži jednu (i samo jednu!) popravku od sastavljača, sa kriticarevim razlogom kao kontekstom — pa prihvata šta god da je izašlo. Granica je deo zadatka, ne dekor: proverite šta se dešava sa stopom i troškom kad je granica 2 ili 3 popravke, i zapišite nalaz.
2. **Paralelna pretraga.** Potpitanja iz plana su međusobno nezavisna (dijagnoza 3 iz sekcije 1), pa ih tražilac može raditi istovremeno — `concurrent.futures.ThreadPoolExecutor` sa 3-4 niti je dovoljan za vežbu. Izmerite razliku u vremenu naspram sekvencijalne verzije iz 08c. (Napomena iz prakse: API kvote (modul 09 to obrađuje detaljno) paralelnost ne prašta — krenite od malog broja niti.)
3. **Trag celog sistema u jednom pregledu.** Dovršite ono što je 08d izbacio: svaki agent upisuje u jedan spisak (ko, zadatak, ulaz u kratko, izlaz u kratko, tokeni). Kad sistem padne — a padaće — spisak mora da pokaže **ko je pogrešio** bez ponovnog pokretanja. To je pitanje 5 iz sekcije 5, sada u kodu.
4. **Peta uloga — po meri, s dokazom.** Dodajte ulogu po svom nahođenju (prevodilac? proveravač činjenica? arhivar izvora?) — i dokazite merenjem iz 08d (stopa, tokeni, vreme pre i posle) da je **vredela**… ili da **nije**. Oba odgovora vrede pun poen: ovo je jedini zadatak kursa u kome je „dokazao sam da ne treba" potpuno uspešan ishod.

## 7. Tipične greške — i dijagnoza

| Simptom | Uzrok | Lek |
|---|---|---|
| Agenti se šalju u krug beskonačno | nema uslova za kraj; kriticar uvek nađe grešku | čvrsta granica iteracija (1 popravka); eksplicitan uslov „kraj" |
| Izlaz sve lošiji nizom koraka (gluvi telefon) | prepisuje se istorija umesto rezultata | ugovor: artefakt + samo potreban kontekst (sekcija 3) |
| Orkestrator radi posao izvršioca | uloge bez odgovornosti | orkestrator odlučuje i dodeljuje; ako piše sam — nije mu mesto |
| „Multi-agent" sistem, a kvalitet kao kod jednog | podela bez dijagnoze (moda, ne terapija) | A/B iz 08d; vratiti se na pitanje 1 iz sekcije 5 |
| Ne zna se ko je pogrešio | trag se ne vodi kroz agente | jedan spisak: ko, zadatak, ulaz, izlaz, tokeni (domaći 3) |
| Plan od 20 koraka za zadatak od 2 | planer bez osećaja cene | ograničiti plan u ugovoru (max N koraka) i proveriti |
| Trošak posle podele skočio 4× | svaki agent nosi kontekst svih prethodnih | modul 05: sledećem agentu samo ono što treba |
| Retry petlja na lošem planu ne pomaže | replan, ne ponavljanje | korak (5) iz sekcije 4: novi plan sa saznanjem pada |

Redosled provere pri dijagnostici pada: **koji je scenario pao (id) → trag sistema (ko je poslednji radio) → izlaz tog agenta reč po reč → tek onda prompt/model**. Isti redosled kao u modulu 07, samo je trag sad duži — i još važniji.

## 8. Pitanja za samoproveru

1. Nabrojite pet dijagnoza iz sekcije 1. Zašto „dodaj agenta" bez imenovane dijagnoze nije terapija nego moda?
2. Uloga je sistemski prompt + alati + podaci do kojih se sme. Zašto „novi agent" koji menja samo ton nije nov agent? Kada je razdvajanje na dva poziva istog agenta dobar dizajn?
3. Šta sve putuje između agenata, a šta se namerno ne šalje? Objasnite „gluvi telefon" i zašto se kontekst ne prepisuje ceo.
4. „Multi-agent sistem je petlja agenta čiji je alat drugi agent." Raščlanite tu rečenicu kroz petlju iz modula 03: šta je cilj, šta akcija, šta posmatranje, i gde je replaniranje?
5. Vaš sistem od tri agenta troši 4× više tokena od jednog agenta, a stopa uspeha je ista. Nabrojite tri moguća uzroka i lek za svaki.
6. Koja su pet pitanja pre dodavanja drugog agenta? Zašto je prvo pitanje uvek „može li jedan" i kojim merenjem se na njega odgovara?
7. U zadatku 4: zašto na korpusu od šest članaka jedan agent pobeđuje, a na šest stotina gubi? Koja dijagnoza iz sekcije 1 menja stranu?

## Šta sledi

Sistem je sada podeljen, orkestriran i izmeren — ali sve je to i dalje na vašem računaru, sa vašim ključem i vašim logovima. [**Modul 09 — U produkciju: bezbednost, opservabilnost, troškovi**](modul-09-u-produkciju.md) vodi agenta u svet u kome radi za druge: ograničenja i potvrde umesto poverenja, beleženje i praćenje umesto gledanja preko ramena, i troškovi koji se mere po koraku, po zadatku i po mesecu. 🚀
