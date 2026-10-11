# Modul 09 — U produkciju: bezbednost, opservabilnost, troškovi

> **Vreme:** 5–7 časova rada · **Preduslovi:** [moduli 03](modul-03-agent-od-nule.md) i [07](modul-07-evaluacija-agenata.md) · **Stanje:** prva radna verzija

Agent koji radi na vašem računaru i agent koji radi kod klijenta — dva su različita sveta. Na vašem računaru, kad nešto pođe naopako, vi ste tamo: vidite izlaz, prekinete petlju, popravite prompt, pokušate ponovo. U produkciji vas nema. Agent radi za druge, po noći i preko vikenda, sa vašim API ključem, nad tuđim podacima, i svaka njegova greška je vaša greška — samo sa zakašnjenjem od nekoliko dana, dok ne stigne mail. Zato produkcija nije „isti agent, veći server"; to je **drugi režim rada**, sa tri stuba na kojima stoji: **ograničenja umesto poverenja** (bezbednost — agentu se ne veruje na reč, nego se ograđuje), **dokazi umesto utiska** (opservabilnost — svaki korak ostavlja trag koji se posle čita) i **budžet umesto improvizacije** (troškovi — koliko agent sme da potroši po koraku, po zadatku i po mesecu). Kraj modula: agent „Arhivar" iz modula 03 u produkcijskom oklopu — bezbedne putanje, potvrde za opasne akcije, strukturisani logovi sa jednim tragom kroz ceo zadatak, i budžet koji prekida pre nego što račun eksplodira.

---

## 1. Dva sveta: vaš računar i tuđi

Počnimo tablicom, jer razlika najbolje stoji u redovima. Isti agent, dva sveta:

| | vaš računar (razvoj) | produkcija (kod klijenta) |
|---|---|---|
| ko gleda izlaz | vi, odmah | korisnik; vi sa zakašnjenjem |
| kad agent pogreši | prekinete, popravite, ponovo | greška je već viđena, mora da se **rekonstruiše** |
| ključ API-ja | vaš, sa vašim limitom | često tuđi, sa tuđim novcem |
| podaci | vaš `sandbox/` sa dva fajla | tuđi fajlovi, možda osetljivi |
| trošak gajbe | koliko ste sami potrošili | koliko je potrošio **svaki korisnik, svakog dana** |
| kad padne mreža | probate ponovo ručno | kod mora sam: sačekati, ponoviti, odustati čisto |

Tri posledice iz tablice vrede da ih izdvojimo, jer objašnjavaju ceo ostatak modula. Prvo: **greška se rekonstruiše** — pošto vas nema kad se desi, jedini svedok je ono što je agent sam zapisao; zato se pišu logovi (sekcija 3). Drugo: **nove su sile koje deluju na agenta** — korisnički fajlovi kao ulaz, kvote provajdera, prekidi mreže; zato se gradi otpornost (sekcija 4). Treće: **novac se množi** — trošak koji vam je kod kuće bio zanemarljiv, u produkciji se množi brojem korisnika i dana; zato se uvodi budžet (sekcija 5). A bezbednost (sekcija 2) je zapravo pretpostavka za sve tri: agent bez ograničenja u tuđem svetu je ne upošljavate — to je poziv na nesreću.

Još jedna stvar, pre nego što krenemo: ništa u ovom modulu nije teško. Svaki obrazac ovde je 10–30 linija običnog Pythona — sanitizacija putanje, jedna `if` granica pre opasne akcije, jedna funkcija `zapisi()` za log, jedna klasa `Budzet`. Ono što je novo nije težina koda nego **disciplina**: obrazac se primenjuje uvek, ne "kad se setimo"; jer upravo onaj dan kad se ne primeni biva dan kad je trebalo. Zato su vežbe ovog modula, više nego ikad, „napravite jednom, koristite zauvek".

## 2. Bezbednost: ograničenja umesto poverenja

Prvo pravilo je staro kao bezbednost sama: **najmanja dozvola** (eng. *least privilege*, modul 02). Alat koji agentu **ne postoji**, agent ne može da zloupotrebi — ni greškom, ni kad ga neko navuče (trovanje kontekstom, modul 05; trovanje alatom, modul 06). Zato se u produkciji počinje od spiska: šta agent **mora** da ume da bi uradio posao — i ništa preko toga. Agent koji sređuje direktorijume treba da ume da lista, čita i preimenuje; ne treba mu brisanje (pa ako baš treba — u zaseban, potvrđen korak), ne treba mu šel, ne treba mu pristup van jednog direktorijuma. Svaki alat koji dodate „jer može zatrebati" je rizik koji ste preuzeli bez potrebe.

Drugo pravilo: **sandbox kako treba**. U modulu 02 napravili smo sandbox — jedan direktorijum i ništa van njega. Sad ga radimo kako se radi u produkciji, jer naivne verzije imaju rupu kroz koju se prolazi na prvi pogled:

```text
naivno:  putanja.startswith("sandbox")     → prolazi „sandbox-zli/../../tajne.txt" ❌
         putanja ne sadrži „.."             → prolazi simbolička veza ❌
redovno: (KOREN / putanja).resolve()       → stvarna putanja, simveze razrešene
         pa proveri .is_relative_to(KOREN)  → van korena? ODBIJ ✓
```

Ključ je u redosledu: **putanja se razreši do kraja, pa se tek onda proverava** da li je unutar dozvoljenog korena. Provera na sirovom unosu („ne sadrži …") je provera onoga što je korisnik **napisao", a ne onoga što sistem **izvršava" — a bezbednost se piše za ovo drugo. Ista disciplina važi za sve argumente alata: šema (modul 02) kaže kakav tip stiže, a kod alata **proverava i ograničava vrednost** — alat je granica poverenja, ne modelovo dobroćudno stajalište.

Treće: **potvrde korisnika** (eng. *human-in-the-loop*) za ono što je skupo ili nepovratno. Ne traži se potvrda za sve (agent koji za svaki korak pita čoveka je čovek sa skupim međukoracima) — traži se za akcije iz gornjih kategorija rizika:

| kategorija | primer akcija | potvrda |
|---|---|---|
| čitanje | listaj, procitaj, pretraga | ne (jeftino, povratno) |
| pisanje | preimenuj, upiši belešku | potvrda, ili prvo suvi rad |
| nepovratno | briši, pošalji mail, plaćanje | potvrda + suvi rad, uvek |

**Suvi rad** (eng. *dry run*) je izveštaj „evo šta bih uradio" bez ijedne izvršene promene — najjeftinija odbrana na svetu: akcija se prvo odigra **na papiru", pa je čovek potvrdi, pa se izvrši. Uz potvrde ide i **dnevnik odluka** (ko je šta odobrio, kada) — ne zato što ne verujemo korisniku, nego zato što se u produkciji svako „a ko je to dozvolio?" odgovara iz zapisa, ne iz sećanja.

Četvrto: **tajni** (eng. *secrets*). Pravila su kratka i bez izuzetaka: ključ se čita iz environment varijable (modul 01), `.env` ide u `.gitignore` (a ne u Git), ključ se **nikad ne loguje** (sekcija 3 će to ponoviti — jer je najčešći slučaj curenja baš log), i ključ agenta nije ključ baze: agent dobija **sopstveni, minimalni ključ** (može samo ono što agent sme), pa se po potrebi **rotira** — promeni — bez ikoga drugog. Kad ključ jednog dana procuri (a to je „kad", ne „ako"), ograničen i rotiran ključ je incident od deset minuta; glavni ključ baze je incident od nedelju dana.

I peto, što nas vraća na početak kursa: **kočnice su bezbednost** (modul 03). Ograničenje koraka, budžet tokena i vremenska granica po zadatku nisu samo zaštita od troška — to su i bezbednosne odbrane: agent u petlji nije samo skup, on je i **nedeterminisan sistem koji radi nešto** dok ga niko ne gleda. Sve što ga zaustavlja, štiti i vas.

## 3. Opservabilnost: videti šta agent radi

Opservabilnost (eng. *observability*) je moć da vidite šta agent radi — ne na vašem ekranu, nego **u radu, bez vas**. Produkcija bez nje je crna kutija: pitanje „zašto je agent juče obrisao pola direktorijuma?" se ne može postaviti, jer odgovor ne postoji nigde. Gradi se od tri sloja, od najsićušnijeg do najapstraktnijeg:

**Sloj 1: beleženje (eng. *logging*).** Svaki događaj — poziv modela, poziv alata, potvrda korisnika, pad — postaje jedna linija u datoteci. U razvoju smo logove pisali sa `print()` (trag iz modula 03); u produkciji se piše **strukturisano** (eng. *structured logging*): svaka linija je samostalan JSON objekat, jer se JSON posle **čita programski** — filtrira po vrsti, broji po danu, pretražuje po id-u. Osnovni događaj nosi šest polja:

```text
vreme      — ISO vreme događaja
trag_id    — identifikator zadatka (o njemu odmah)
dogadjaj   — vrsta: "poziv_modela" | "poziv_alata" | "potvrda" | "pad"
korak      — redni broj koraka u zadatku
sadrzaj    — kratak sažetak ulaza i izlaza (ne sve!)
trajanje_ms, tokeni — koliko je trajalo i šta je koštalo
```

Uz to tri navike koje prave razliku između loga koji pomaže i loga koji smeta. **Loguj nameru pre izvršenja, rezultat posle**: ako agent pukne usred koraka, u logu ostaje zapisano šta je **namerao** da uradi — polomljeni trag bez namere je pola informacije. **Ne loguj tajne ni ceo kontekst**: ključ nikad (sekcija 2), a ceo kontekst ni ne treba — loguje se sažetak, jer log koji sadrži sve skupo stoji i nevaljano miriše po tuđim podacima. **Loguj i srećne slučajeve**: log nije samo za padove; stopa uspeha iz logova je besplatna evaluacija u malom (modul 07).

**Sloj 2: trag (eng. *trace*).** `trag_id` je identifikator **jednog zadatka** — niz znakova koji se stvara na početku (npr. `uuid4().hex[:8]`) i prati svaki događaj do kraja: svaki poziv modela, svaki alat, svaka potvrda. Bez njega su logovi gomila nesortiranih događaja; sa njim je jedan zadatak jedna priča: `grep trag_id` izvuče sve njegove korake redom. U sistemu od više agenata (modul 08) trag se **prosleđuje kroz sve agente** — potpuno isto polje u njihovim logovima — pa pitanje „ko je pogrešio?" prestaje da bude arheologija: jedan id, svi učesnici, jedan pregled.

**Sloj 3: metrike.** Metrika je broj izračunat iz logova, gledan kroz vreme: poziva dnevno, prosečni tokeni po zadatku, procenat zadataka sa padom, prosečno trajanje. Pojedinačni događaj kaže „šta se desilo"; metrika kaže „da li se to dešava **često**" — a razlika između incidenta i obrazaca upravo tu živi. Izvestaj od juče: 312 zadataka, 9 padova (2,9%), od toga 7 po kvoti — to je metrika koja kaže da je vreme za veći plan kvota (sekcija 5), pre nego što korisnici sami kažu, ljutito.

I dijagnostički redosled kad nešto padne, nasleđen iz modula 07 i proširen: **zadatak (trag_id) → događaji traga → zadnji uspešan korak → izlaz koji ga je pokvario → tek onda prompt/model**. Prva tri koraka su čitanje logova; četvrti je čitanje primera; tek peti dira kod. U praksi se skoro sve reši na prvom i drugom — jer je agent, zahvaljujući logovima, sam napisao svoj izveštaj o nesreći.

## 4. Otpornost na greške: padati glasno, ustajati polako

U produkciji agenta čekaju greške koje na vašem računaru nikad niste videli, jer ste vi bili filter: mreža se prekine, provajder vrati 429 (prekoračena kvota — previše zahteva u jedinici vremena), provajder vrati 500, zahtev visi trideset sekundi, model vrati pokvaren JSON. Otpornost (eng. *resilience*) je veština da se preživi **prolazna** greška bez čoveka, i da se **trajna** greška prekine čisto, sa tragom. Deli se na tri navike.

**Ponovi — ali samo prolazno, i sa zadrškom.** Prolazna greška (429, 5xx, prekid mreže, timeout) znači „sad ne može, za trenutak možda može"; nju rešava ponovni pokušaj (eng. *retry*) sa **eksponencijalnom zadrškom** (eng. *exponential backoff*): svaki sledeći pokušaj čeka sve duže — 1s, pa 2s, pa 4s — da provajderu damo vremena da se oporavi, a ne da ga zaturimo još jače. Dve granice su obavezne: **maksimum pokušaja** (posle trećeg odustaje se čisto — petlja koja pokušava beskonačno je samo skuplja inačica pada) i **ne ponavljaj neprolazno**: greška 400 (loš zahtev — recimo loša šema alata) neće proći ni iz trećeg puta; nju treba prijaviti i popraviti, ne pokušavati.

**Budi idempotentan.** Idempotencija (eng. *idempotency*) znači: ako se akcija izvrši **dva puta**, ishod je kao da se izvršila jednom. Zvuči apstraktno, a u praksi je konkretno: preimenovanje fajla koje je prvi put uspelo, drugi put pada („fajl ne postoji") — zato se pre akcije **proverava da li je već urađena**; poziv API-ja koji je možda stigao do provajdera a možda i ne, ponavlja se mirno samo ako je bezbedno ponoviti. Pravilo: retry bez idempotencije pretvara prolaznu grešku u **dvostruku** akciju — plaćanje koje je prošlo, a poruka o grešci nije stigla, pa klijent klikne „plati ponovo". Zato se rizične akcije (sekcija 2: nepovratne) ne ponavljaju automatski nikad.

**Padni glasno.** Poslednja odbrana je i prva lekcija modula 07: kad greška nije prolazna, ili je pokušaja bilo dovoljno — agent **stane**, upiše pad u log sa punim tragom, javi korisniku čisto poruku („zadatak nije završen, pokušajte ponovo ili pišite podršci, id traga: a1b2c3"), i vrati izlazni kod ≠ 0. Šta se **ne** radi: gutati izuzetak i nastaviti (agent koji je izgubio korak, a radi dalje, proizvodi pouzdano loše rezultate — najgora kombinacija: pouzdano i loše), vraćati delimičan posao kao potpun, i skrivati haos od loga dok ga glatko pokazujete korisniku. Korisnik vidi smireno „pokušajte kasnije"; log vidi sve.

Sve tri navike su male funkcije — retry petlja sa tri parametra, `if` provera pre akcije, jedan `except` koji loguje i diže ruke. Njihova snaga je, kao i uvek u ovom modulu, u tome da postoje **pre** dana kad zatrebaju.

## 5. Troškovi: po koraku, po zadatku, po mesecu

Odakle uopšte dolazi cena agenta? Iz dva množenja. Prvo: **tokeni puta cena** — svaki poziv API-ja plaća ulazne tokene (sve što je u kontekstu: sistemski prompt, istorija, rezultati alata) i izlazne (odgovor), po ceni po milon tokena; izlazni su obično nekoliko puta skuplji od ulaznih. Drugo, i u agentima podmuklije: **istorija raste sa koracima** — peti poziv u petlji plaća i prva četiri (modul 05), pa trošak po zadatku raste brže nego broj koraka. Agent sa deset koraka nije deset poziva — to je deset poziva sa sve dužim kontekstom.

Prvi korak kontrole je **merenje**, jer nenadgledan trošak je neograničen trošak. Svaki odgovor API-ja nosi `usage` (modul 07): ulazni, izlazni, ukupno. U produkciji se sabira **po zadatku** (koliko me košta jedan korisnički zahtev, kroz sve korake) i **po danu** (iz logova, sekcija 3), pa se zna prosečan trošak po interakciji. Kad znate da vas jedan zadatak košta 0,015 € i da ih dnevno bude 400, mesečni račun više nije iznenađenje nego aritmetika: **prosečan trošak po interakciji × broj interakcija dnevno × 30**. (Cifre u vežbama su ilustrativne — cenovnici se menjaju i razlikuju po provajderu; uvek proverite važeći cenovnik svog modela.)

Drugi korak je **budžet**: granica koja se **nameće**, ne preporučuje. Dva nivoa: **meki limit** (upozorenje u log: „zadatak je potrošio 80% budžeta") i **tvrdi limit** (izuzetak koji prekida zadatak čisto, sa padom u log i poštenom porukom korisniku). Bez tvrdog limita, budžet je dekoracija: agent u petlji se ne zaustavlja sam — uvo se navikne na upozorenja, a račun ne. Granica po koraku postoji i kao `max_koraka` (modul 03); granica po zadatku je novi sloj: **budžet tokena za ceo zadatak**, sabran kroz sve pozive.

Treći korak je **smanjivanje** — pet poluga, redom po tome koliko su bezazlene:

1. **Sažimanje istorije** (modul 05): svaki korak ne mora da nosi celu prošlost; sažetak starijih koraka košta jednom, štedi na svakom sledećem.
2. **Keširanje odgovora** (eng. *response caching*): identičan poziv (isti model, ista poruka, temperatura 0) vraća spremljen odgovor umesto novi poziv — besplatno za ponovljena pitanja, a njih u radu sa korisnicima uvek ima.
3. **Jeftiniji model za lake korake** (eng. *model routing*): ne mora svaki korak glavni model — klasifikacija pitanja, izdvajanje pojmova, formatiranje — to rade i mali, jeftini modeli; glavni dođe na teški deo.
4. **Manje koraka**: bolji prompt i bolji alati (moduli 02 i 07 — mereno!) skraćuju petlju; svaki izbačen korak štedi i svoj poziv i njegov doprinos istoriji.
5. **Manji kontekst**: samo ono što treba (modul 05) — dokument od 50 stranica u kontekstu „jer možda zatreba" plaća se na svakom koraku.

I četvrta stavka koja se lako zaboravi: **trošak greške**. Pad koji se ne vidi, petlja koja se ne prekida, retry bez granice — sve je to novac. Zato su kočnice iz sekcija 2 i 4 istovremeno i finansijska odbrana: budžet, granica koraka i maksimum pokušaja štite i podatke i novčanik. U produkciji je „koliko košta" uvek **tri odgovora**: po koraku (usage), po zadatku (budžet) i po mesecu (aritmetika) — i sva tri se znaju unapred, ne posle računa.

## 6. Vežbe: „Arhivar" ide u produkciju

Predmet vežbi je agent **„Arhivar"** — sređivač direktorijuma u duhu agenta iz modula 03: prima zadatak („sredi beleške"), poziva alate (listaj, čita, preimenuje). U modulu 03 gradili smo mu pamet; sada mu gradimo **oklop**. Četiri sloja, redom kao sekcije: bezbedne putanje i ograničenja, potvrde i suvi rad, logovi sa tragom, budžet i ponovni pokušaji. Po obrascu iz modula 08: prve tri vežbe rade **bez ijednog poziva API-ju** (model u njima je mok — fiksiran spisak zahteva), jer se oklop testira na najgore moguće unose, a to se radi jeftino i offline; četvrta vežba simulira i provajdera. Kao i uvek: ključ, ako zatreba, samo u `Z_AI_API_KEY` (opciono `Z_AI_BASE_URL`, `Z_AI_MODEL`).

### 6.1 Zadatak 1: oklop — sandbox kako treba

Prvi sloj oklopa su dva pravila iz sekcije 2: **putanja se razreši pa se proveri** i **sve izvršavanje ide kroz jedno mesto**. Sačuvajte kao `09a_oklop.py`:

```python
"""Vežba 9.1 — oklop za „Arhivar": bezbedne putanje i jedno mesto izvršavanja.

Bez ijednog poziva API-ju: oklop se testira na najgore moguće unose.

Upotreba: python 09a_oklop.py
"""

from pathlib import Path

KOREN = (Path(__file__).parent / "sandbox").resolve()

# kategorije rizika iz sekcije 2: svaki alat ima svoju, po nazivu
RIZIK = {"listaj": "citanje", "procitaj": "citanje", "preimenuj": "pisanje"}

def bezbedna_putanja(ime: str) -> Path:
    """Putanja unutar KOREN-a — ili ValueError. Redosled je sve:
    PRVO resolve (…, simboličke veze, apsolutizuje), PA provera granice.
    Provera na sirovom unosu je provera teksta, ne putanje.
    """
    kandidat = (KOREN / ime).resolve()
    if not kandidat.is_relative_to(KOREN):
        raise ValueError(f"putanja izlazi van sandbox-a: {ime!r}")
    return kandidat

def listaj() -> str:
    """Spisak fajlova u sandbox-u."""
    KOREN.mkdir(exist_ok=True)
    imena = sorted(p.name for p in KOREN.iterdir())
    return "\n".join(imena) if imena else "(prazno)"

def procitaj(ime: str) -> str:
    putanja = bezbedna_putanja(ime)
    if not putanja.is_file():
        return f"GREŠKA: fajl '{ime}' ne postoji u sandbox-u."
    return putanja.read_text(encoding="utf-8")

def preimenuj(staro: str, novo: str) -> str:
    """Pisanje — zato prvo provera: novo ime NE SME postojati
    (idempotencija iz sekcije 4: dva poziva = jedan ishod)."""
    stara, nova = bezbedna_putanja(staro), bezbedna_putanja(novo)
    if not stara.is_file():
        return f"GREŠKA: fajl '{staro}' ne postoji."
    if nova.exists():
        return f"GREŠKA: '{novo}' već postoji — ne pišem preko."
    stara.rename(nova)
    return f"OK: '{staro}' → '{novo}'"

ALATI = {"listaj": listaj, "procitaj": procitaj, "preimenuj": preimenuj}

def izvrsi(ime_alata: str, **argumenti) -> str:
    """Jedino mesto kroz koje se bilo koji alat izvršava.

    Model u produkciji samo TRAŽI poziv alata — izvršava ga ovaj kod,
    sa svim ograničenjima na jednom mestu: nepoznat alat ne postoji,
    poznat alat se poziva sa proverenim argumentima, greška se vraća
    kao tekst modelu (a u 09c se loguje).
    """
    if ime_alata not in ALATI:                      # podrazumevano: ne
        return f"GREŠKA: nepoznat alat {ime_alata!r}"
    try:
        return str(ALATI[ime_alata](**argumenti))
    except (ValueError, TypeError) as g:
        return f"GREŠKA: {g}"

if __name__ == "__main__":
    KOREN.mkdir(exist_ok=True)
    (KOREN / "beleska.txt").write_text("beleška sa sastanka", encoding="utf-8")
    napadi = [                                        # najgore što pada na pamet
        ("procitaj", {"ime": "beleska.txt"}),        # normalan poziv
        ("procitaj", {"ime": "../moduli/modul-03-agent-od-nule.md"}),
        ("procitaj", {"ime": "sandbox-zli/../../README.md"}),
        ("izbrisi_sve", {}),                          # alat koji ne postoji
        ("preimenuj", {"staro": "beleska.txt", "novo": "beleska.txt"}),
    ]
    for alat, args in napadi:
        print(f"[{alat} {args}]\n  → {izvrsi(alat, **args)[:70]}")
```

Pokrenite i čitajte izlaz redom:

```bash
python 09a_oklop.py
```

Prvi poziv prolazi; druga dva padaju na istoj proveri — `../` varijanta i „lažni prefiks" varijanta (koja počinje sa `sandbox`, pa bi naivna `startswith` provera pustila) — jer posle `resolve()` obe vode **van korena**, i tu ih čeka odbijanje. Četvrti pokazuje podrazumevano odbijanje: alat koji nije na spisku ne postoji, ma kako dramatično zvučalo njegovo ime. Peti je idempotencija na delu: preimenovanje u postojeće ime se odbija, jer bi drugi poziv istog zahteva (sekcija 4) preko naivne verzije prebrisao sadržaj. Kad završite, dodajte još jedan napad po svom ukusu — na primer apsolutnu putanju (`/etc/passwd` ili `C:\Windows\...`) — i uverite se da provera iz `resolve()` hvata i nju. To je cela poenta ovog zadatka: **pet linija provere, pet klasa napada zatvoreno**.

### 6.2 Zadatak 2: potvrde, suvi rad i dnevnik odluka

Drugi sloj je kapija između kategorija rizika: akcije iz kategorije **pisanje** ne izvršavaju se bez potvrde, a potvrda ima tri režima rada — **suvi rad** (podrazumevan: ništa se ne izvršava, pravi se izveštaj „šta bi bilo urađeno"), **pitaj** (klasično pitanje čoveku) i **automatski** (za testove i povratne akcije, uz zapis u dnevniku). Svaka odluka — odobreno ili odbijeno — ide u **dnevnik odluka** (JSON linije), pa se svako kasnije „a ko je to dozvolio?" odgovara iz zapisa. Sačuvajte kao `09b_potvrde.py`:

```python
"""Vežba 9.2 — potvrde za „Arhivar": kapija za pisanje + dnevnik odluka.

Režim rada se bira environment varijablom ARHIVAR_REZIM:
  suvi-rad   — podrazumevano: pisanje se NE izvršava, samo izveštaj
  pitaj      — za svako pisanje se pita korisnika [d/N]
  automatski — pisanje se izvršava (za testove), uz zapis u dnevniku

Upotreba: python 09b_potvrde.py
"""

import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

# oklop iz 09a — ovde dupliran (imena sa cifrom se ne uvoze; modul 04)
KOREN = (Path(__file__).parent / "sandbox").resolve()
RIZIK = {"listaj": "citanje", "procitaj": "citanje", "preimenuj": "pisanje"}

def bezbedna_putanja(ime: str) -> Path:
    kandidat = (KOREN / ime).resolve()
    if not kandidat.is_relative_to(KOREN):
        raise ValueError(f"putanja izlazi van sandbox-a: {ime!r}")
    return kandidat

def listaj() -> str:
    KOREN.mkdir(exist_ok=True)
    imena = sorted(p.name for p in KOREN.iterdir())
    return "\n".join(imena) if imena else "(prazno)"

def procitaj(ime: str) -> str:
    putanja = bezbedna_putanja(ime)
    if not putanja.is_file():
        return f"GREŠKA: fajl '{ime}' ne postoji."
    return putanja.read_text(encoding="utf-8")

def preimenuj(staro: str, novo: str) -> str:
    stara, nova = bezbedna_putanja(staro), bezbedna_putanja(novo)
    if not stara.is_file():
        return f"GREŠKA: fajl '{staro}' ne postoji."
    if nova.exists():
        return f"GREŠKA: '{novo}' već postoji — ne pišem preko."
    stara.rename(nova)
    return f"OK: preimenovano '{staro}' → '{novo}'"

ALATI = {"listaj": listaj, "procitaj": procitaj, "preimenuj": preimenuj}
DNEVNIK = Path("dnevnik-odluka.jsonl")

# --- kapija: potvrde + dnevnik -----------------------------------------------

REZIM = os.environ.get("ARHIVAR_REZIM", "suvi-rad")

def zapisi_odluku(alat, argumenti, odluka: str, razlog: str) -> None:
    """Dnevnik odluka: ko-šta-kada — bez obzira na ishod."""
    zapis = {"vreme": datetime.now(timezone.utc).isoformat(timespec="seconds"),
             "alat": alat, "argumenti": argumenti,
             "odluka": odluka, "razlog": razlog}
    with DNEVNIK.open("a", encoding="utf-8") as f:
        f.write(json.dumps(zapis, ensure_ascii=False) + "\n")

def trazi_potvrdu(alat: str, argumenti: dict) -> bool:
    """Human-in-the-loop kapija za akcije iz kategorije pisanje."""
    if REZIM == "pitaj":
        odgovor = input(f"  Izvršiti {alat} {argumenti}? [d/N] ").strip().lower()
        odluka = odgovor == "d"
        zapisi_odluku(alat, argumenti, "odobreno" if odluka else "odbijeno",
                      "potvrda korisnika")
        return odluka
    if REZIM == "automatski":
        zapisi_odluku(alat, argumenti, "odobreno", "režim automatski (test)")
        return True
    zapisi_odluku(alat, argumenti, "preskočeno", "suvi rad — ništa se ne menja")
    return False

def izvrsi(ime_alata: str, **argumenti) -> str:
    """Izvršavanje iz 09a + kapija za pisanje."""
    if ime_alata not in ALATI:
        return f"GREŠKA: nepoznat alat {ime_alata!r}"
    if RIZIK[ime_alata] == "pisanje" and not trazi_potvrdu(ime_alata, argumenti):
        return f"PRESKOČENO (potrebna potvrda): {ime_alata} {argumenti}"
    try:
        return str(ALATI[ime_alata](**argumenti))
    except (ValueError, TypeError) as g:
        return f"GREŠKA: {g}"

# --- mok „agent": fiksiran plan zahteva (kao da je model tražio) --------------
PLAN = [
    {"alat": "listaj", "argumenti": {}},
    {"alat": "procitaj", "argumenti": {"ime": "beleska.txt"}},
    {"alat": "preimenuj", "argumenti": {"staro": "beleska.txt",
                                        "novo": "2025-10-beleska.txt"}},
]

if __name__ == "__main__":
    KOREN.mkdir(exist_ok=True)
    (KOREN / "beleska.txt").write_text("beleška sa sastanka", encoding="utf-8")
    print(f"režim rada: {REZIM}")
    for korak, zahtev in enumerate(PLAN, start=1):
        ishod = izvrsi(zahtev["alat"], **zahtev["argumenti"])
        print(f"{korak}. [{zahtev['alat']}] → {ishod[:70]}")
    print(f"\ndnevnik odluka ({DNEVNIK}):")
    if DNEVNIK.exists():
        for linija in DNEVNIK.read_text(encoding="utf-8").splitlines():
            print("  ", linija[:90])
```

Pokrenite prvo u podrazumevanom režimu, pa u ostala dva:

```bash
python 09b_potvrde.py                          # suvi rad: pisanje preskočeno
ARHIVAR_REZIM=automatski python 09b_potvrde.py # pisanje izvršeno + zapis
ARHIVAR_REZIM=pitaj python 09b_potvrde.py      # pitate se sami sebi
```

U prvom pokretanju, fajl `beleska.txt` posle svega **i dalje postoji** pod starim imenom — agent je „radio", ništa nije menjeno, a vi ste dobili izveštaj šta bi promenio. To je suvi rad: pogled na akciju pre akcije. U drugom, preimenovanje je stvarno izvršeno — i ponovnim pokretanjem videćete zašto postoji provera iz 09a: fajl više ne postoji pod starim imenom, pa alat vraća `GREŠKA`, a ne prazan uspeh. I obratite pažnju na treće pokretanje kad odbijete: ništa se ne dešava, ali **dnevnik beleži i odbijanje** — dnevnik odluka je dnevnik odluka, ne dnevnik uspeha.

### 6.3 Zadatak 3: logovi i trag — jedan zadatak, jedna priča

Treći sloj je struktura koja se posle čita programski: svaki događaj jedna JSON linija, svaki događaj nosi `trag_id`, i — najvažnija navika — **namera se loguje pre izvršenja, rezultat posle**, pa agent koji pukne usred koraka u logu ipak ostavlja trag šta je namerao. Sačuvajte kao `09c_trag.py`:

```python
"""Vežba 9.3 — strukturisani logovi sa tragom za „Arhivara".

Svaki događaj = jedna JSON linija u log/agent.jsonl; svi događaji jednog
zadatka dele trag_id. Namere se loguju PRE izvršenja, rezultati POSLE.

Upotreba: python 09c_trag.py
"""

import json
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path

# oklop iz 09a/09b — dupliran (imena sa cifrom se ne uvoze; modul 04)
KOREN = (Path(__file__).parent / "sandbox").resolve()
RIZIK = {"listaj": "citanje", "procitaj": "citanje", "preimenuj": "pisanje"}

def bezbedna_putanja(ime: str) -> Path:
    kandidat = (KOREN / ime).resolve()
    if not kandidat.is_relative_to(KOREN):
        raise ValueError(f"putanja izlazi van sandbox-a: {ime!r}")
    return kandidat

def listaj() -> str:
    KOREN.mkdir(exist_ok=True)
    imena = sorted(p.name for p in KOREN.iterdir())
    return "\n".join(imena) if imena else "(prazno)"

def procitaj(ime: str) -> str:
    putanja = bezbedna_putanja(ime)
    if not putanja.is_file():
        return f"GREŠKA: fajl '{ime}' ne postoji."
    return putanja.read_text(encoding="utf-8")

def preimenuj(staro: str, novo: str) -> str:
    stara, nova = bezbedna_putanja(staro), bezbedna_putanja(novo)
    if not stara.is_file():
        return f"GREŠKA: fajl '{staro}' ne postoji."
    if nova.exists():
        return f"GREŠKA: '{novo}' već postoji — ne pišem preko."
    stara.rename(nova)
    return f"OK: preimenovano"

ALATI = {"listaj": listaj, "procitaj": procitaj, "preimenuj": preimenuj}
LOG = Path("log") / "agent.jsonl"

# --- beleženje: jedna funkcija, jedan oblik -----------------------------------

def zapisi(dogadjaj: str, **polja) -> None:
    """Jedan događaj = jedna JSON linija: vreme, trag_id, događaj, ostalo.

    Zašto JSON a ne print: ovo čita program (filtriranje, brojanje,
    izveštaji u domaćem), a print čita samo čovek — i to danas.
    """
    zapis = {"vreme": datetime.now(timezone.utc).isoformat(timespec="milliseconds"),
             "dogadjaj": dogadjaj, **polja}
    LOG.parent.mkdir(exist_ok=True)
    with LOG.open("a", encoding="utf-8") as f:
        f.write(json.dumps(zapis, ensure_ascii=False) + "\n")

def izvrsi_sa_logom(trag_id: str, korak: int, ime_alata: str,
                     **argumenti) -> str:
    """izvrsi() iz 09a + log: namera PRE, rezultat POSLE, vreme uvek."""
    zapisi("namera_alata", trag_id=trag_id, korak=korak,
           alat=ime_alata, argumenti=argumenti)
    pocetak = time.perf_counter()
    if ime_alata not in ALATI:
        ishod = f"GREŠKA: nepoznat alat {ime_alata!r}"
    else:
        try:
            ishod = str(ALATI[ime_alata](**argumenti))
        except (ValueError, TypeError) as g:
            ishod = f"GREŠKA: {g}"
    zapisi("rezultat_alata", trag_id=trag_id, korak=korak,
           alat=ime_alata, trajanje_ms=round((time.perf_counter() - pocetak) * 1000),
           ishod=ishod[:80])          # sažetak! ne ceo sadržaj fajla
    return ishod

# --- mok „agent" (kao u 09b) + jedan pokvaren zahtev -------------------------
PLAN = [
    {"alat": "listaj", "argumenti": {}},
    {"alat": "procitaj", "argumenti": {"ime": "beleska.txt"}},
    {"alat": "preimenuj", "argumenti": {"staro": "beleska.txt",
                                        "novo": "2025-10-beleska.txt"}},
    {"alat": "izbrisi_sve", "argumenti": {}},        # nepoznat alat
]

if __name__ == "__main__":
    KOREN.mkdir(exist_ok=True)
    (KOREN / "beleska.txt").write_text("beleška sa sastanka", encoding="utf-8")
    trag_id = uuid.uuid4().hex[:8]                     # jedan zadatak, jedan trag
    zapisi("zadatak_pocetak", trag_id=trag_id, koraka=len(PLAN))
    for korak, zahtev in enumerate(PLAN, start=1):
        ishod = izvrsi_sa_logom(trag_id, korak, zahtev["alat"],
                                **zahtev["argumenti"])
        print(f"{korak}. [{zahtev['alat']}] → {ishod[:60]}")
    zapisi("zadatak_kraj", trag_id=trag_id)
    print(f"\ntrag: {trag_id} — log: {LOG}")
    for linija in LOG.read_text(encoding="utf-8").splitlines()[-4:]:
        print("  ", linija[:100])
```

Pokrenite dva puta zaredom i uporedite:

```bash
python 09c_trag.py
python 09c_trag.py
```

Otvorite `log/agent.jsonl` i čitajte ga kao što biste čitali tuđi log (jer jednom hoćete): svaka linija je samostalan JSON; prvo pokretanje ima svoj `trag_id`, drugo svoj — dva zadatka, dve priče, jedna datoteka. U svakoj priči vidite nameru pa rezultat po koraku, sa trajanjem; četvrti korak (nepoznat alat) je odbijen — ali **zabeležen**, i to je razlika između „bacio je grešku" i „evo šta je tražio, kad i zašto". I primetite sažetak: `ishod[:80]` — log pamti šta se desilo, ne celu belešku; kontekst i privatnost (sekcija 3) važe i za logove.

### 6.4 Zadatak 4: budžet, kvote i ponovni pokušaji

Četvrti sloj spaja sekcije 4 i 5: budžet koji se **nameće** (meki upozori, tvrdi prekine), retry sa eksponencijalnom zadrškom za prolazne greške (429, 5xx) — i aritmetiku mesečnog računa. Provajdera simulira lažni klijent, pa sve radi offline. Sačuvajte kao `09d_budzet.py`:

```python
"""Vežba 9.4 — budžet tokena, retry sa zadrškom, mesečni račun.

Lažni klijent simulira provajdera: prva dva poziva padaju na kvoti (429),
treći uspeva — pa se vidi cela mehanika bez ijednog poziva API-ju.

Upotreba: python 09d_budzet.py
"""

import time

class PrekrsenBudzet(Exception):
    """Tvrdi limit: zadatak se prekida čisto — ovo nije greška nego kapija."""

class KvotaGreska(Exception):
    """Prolazna greška: 429 — retry sa zadrškom ima smisla."""

class Budzet:
    """Budžet tokena po zadatku: meki deo upozorava, tvrdi prekida."""

    def __init__(self, max_tokena: int, meki_deo: float = 0.8):
        self.max_tokena, self.meki = max_tokena, int(max_tokena * meki_deo)
        self.potroseno = 0

    def dodaj(self, tokeni: int) -> None:
        self.potroseno += tokeni
        if self.potroseno > self.max_tokena:            # tvrdi limit
            raise PrekrsenBudzet(
                f"potrošeno {self.potroseno} > {self.max_tokena} tokena")
        if self.potroseno > self.meki:                   # meki limit
            print(f"  [budžet] UPOZORENJE: {self.potroseno}/{self.max_tokena} "
                  f"tokena (preko {self.meki})")

class LazniKlijent:
    """Provajder za vežbu: 429, 429, pa uspeh — svaki poziv košta tokene."""

    def __init__(self):
        self.pozivi = 0

    def pozovi(self) -> dict:
        self.pozivi += 1
        if self.pozivi <= 2:
            raise KvotaGreska("429: prekoračena kvota — pokušajte kasnije")
        return {"tekst": "OK", "ulazni": 900, "izlazni": 120}

def pozovi_sa_pokusajima(klijent, budzet, max_pokusaja: int = 3) -> dict:
    """Retry sa eksponencijalnom zadrškom — samo za PROLAZNE greške.

    Zadrška u vežbi je 0,05s/0,1s/… da demo traje sekundu;
    u produkciji: 1s, 2s, 4s — provajderu se daje vremena da odahne.
    """
    for pokusaj in range(1, max_pokusaja + 1):
        try:
            odgovor = klijent.pozovi()
            budzet.dodaj(odgovor["ulazni"] + odgovor["izlazni"])
            return odgovor
        except KvotaGreska as g:
            if pokusaj == max_pokusaja:                  # odustani čisto
                raise KvotaGreska(
                    f"ni iz {max_pokusaja}. pokušaja: {g}") from g
            zadrška = 0.05 * 2 ** (pokusaj - 1)
            print(f"  [retry] {pokusaj}. pokušaj pao ({g}); čekam {zadrška}s")
            time.sleep(zadrška)
    raise AssertionError("nedostižno")                   # radi čitača

# --- aritmetika računa: po koraku → po zadatku → po mesecu --------------------

CENOVNIK = {"glm-4.6": {"ulazni": 0.6, "izlazni": 2.2}}   # € / MILION tokena
# (ilustrativno — uvek proverite važeći cenovnik svog provajdera!)

def mesecni_racun(prosecni_tokeni_po_zadatku: dict, zadataka_dnevno: int,
                   model: str = "glm-4.6") -> float:
    """Prosečan zadatak × broj dnevno × 30 — pre računa, ne posle."""
    cena = CENOVNIK[model]
    po_zadatku = (prosecni_tokeni_po_zadatku["ulazni"] * cena["ulazni"]
                  + prosecni_tokeni_po_zadatku["izlazni"] * cena["izlazni"]) / 1_000_000
    return po_zadatku * zadataka_dnevno * 30

if __name__ == "__main__":
    klijent, budzet = LazniKlijent(), Budzet(max_tokena=1500)
    print("— zadatak A: provajder posrće (429, 429, uspeh) —")
    try:
        odgovor = pozovi_sa_pokusajima(klijent, budzet)
        print(f"  odgovor: {odgovor['tekst']}, potrošeno: {budzet.potroseno}")
    except KvotaGreska as g:
        print(f"  PAD: {g}")

    print("— zadatak B: budžet je pre mali — tvrdi limit prekida —")
    budzet_b = Budzet(max_tokena=500)
    try:
        pozovi_sa_pokusajima(LazniKlijent(), budzet_b)
    except PrekrsenBudzet as g:
        print(f"  PREKINUTO ČISTO: {g} (bolje nego petlja na tuđi račun)")

    print("— račun za tri pretpostavke o saobraćaju —")
    prosek = {"ulazni": 6_000, "izlazni": 700}        # izmeriti na svom agentu!
    for dnevno in (50, 500, 5_000):
        print(f"  {dnevno:>5} zadataka dnevno → "
              f"{mesecni_racun(prosek, dnevno):>8.2f} € / mesec")
```

Pokrenite:

```bash
python 09d_budzet.py
```

Zadatak A pokazuje celu hronologiju iz sekcije 4: pad, zadrška, pad, duža zadrška, uspeh — i cenu uspeha upisanu u budžet. Zadatak B pokazuje zašto meki i tvrdi limit nisu isto: upozorenje je prošlo tiho (500-tokena budžetu je i meki prag već previsok), pa je tvrdi limit prekinuo zadatak **izuzetkom** — što u pravom agentu znači: pad u log (sekcija 3), čista poruka korisniku, izlazni kod ≠ 0 (modul 07). I tabla na kraju je poenta sekcije 5: **isti agent, tri skale** — 50 zadataka dnevno je zanemarljivo, 5.000 je ozbiljan mesečni račun, a razlika je samo množilac; zato se procena radi pre lansiranja, na izmerenoj proseku, a ne na osećaju.

### 6.5 Zadatak 5 (domaći): keš, izveštaj iz logova, i rušenje na miru

1. **Keš odgovora.** Dodajte u `09d_budzet.py` keš (dict sa ključem `(model, poruke, temperatura)`): identičan poziv vraća spremljen odgovor i **ne dodaje tokene u budžet**. Zatim pustite da lažni klijent primi tri ista zahteva u nizu — izmerite uštedu, i odgovorite: za koje pozive u agentu (modul 03/08) keš ima smisla, a za koje je opasan (odgovor koji zavisi od vremena? od stanja fajlova?).
2. **Dnevni izveštaj iz logova.** Napišite `09e_izvestaj.py`: čita `log/agent.jsonl` iz 09c i ispisuje po danu — koliko zadataka, koliko poziva alata, koliko padova (`ishod` počinje sa `GREŠKA`). To su metrike iz sekcije 3, izračunate iz logova koje već imate; ubuduće vam je to jutarnja prva stranica.
3. **Rušenje na miru.** Ubacite u 09c mid-run pad (npr. `raise KeyboardInterrupt` posle drugog koraka) i pročitajte log: da li se vidi **šta je bilo u toku**? Ako nedostaje zapis o prekidu — dodajte `try/finally` oko petlje koja upisuje `zadatak_prekid`, pa opet srušite i proverite da trag sada priča celu priču. Ovo je vežba koju ne možete da uradite „kad bude vremena" — jer onda kad bude trebalo, biće produkcija.
4. **Produkcijski checklist.** Za agenta kojeg planirate u modulu 10, napišite deset linija: pet dijagnoza/obrana iz sekcija 2–5 koje vaš agent **mora** da ima, i po jednu rečenicu kako ćete znati da rade (test? log? budžet?). Lista je kratka zato što je provera za svaku jeftina — po obrascu ovog modula: napravite jednom, koristite zauvek.

## 7. Tipične greške — i dijagnoza

| Simptom | Uzrok | Lek |
|---|---|---|
| Agent u produkciji menja što ne sme | alati bez kategorija rizika i kapije | jedna tabela rizika + potvrde za pisanje (09b) |
| Napad putanjom prošao („../…") | provera na sirovom unosu, ne na razrešenoj putanji | `resolve()` pa `is_relative_to` (09a) |
| „Ne znam šta se desilo juče u 3h" | nema logova, ili su `print` u konzoli koja je nestala | strukturisani JSON log + trag_id (09c) |
| Ključ u logu / u Git-u | loguje se ceo zahtev; `.env` u repozitorijumu | sažeci u log; `.gitignore`; poseban minimalni ključ |
| Retry oluja: stotine poziva u minuti | retry bez zadrške i bez maksimuma | eksponencijalna zadrška + max 3 pokušaja (09d) |
| Prolazna greška postane dvostruka akcija | retry na nepovratnoj akciji | idempotencija: provera pre akcije; rizično se ne ponavlja |
| Račun iznenađujući na kraju meseca | trošak se ne meri po zadatku | usage → budžet (meki+tvrdi) → mesečna aritmetika (09d) |
| Pad se „proguta" i agent radi dalje | izuzeci se guše da ne smetaju korisniku | padati glasno: log + čista poruka + izlazni kod ≠ 0 |
| Agent spor što duže radi | istorija raste sa svakim korakom | sažimanje (modul 05), keš, jeftiniji model za lake korake |

Redosled provere pri padu u produkciji: **trag_id iz poruke korisnika → događaji traga → poslednja namera bez rezultata → izlaz tog koraka → tek onda prompt/model**. Prva tri koraka su čitanje loga — i skoro uvek dovoljna.

## 8. Pitanja za samoproveru

1. Nabrojite tri razlike između „agent na vašem računaru" i „agent u produkciji", i za svaku jednu odbranu iz ovog modula koja je pokriva.
2. Zašto `putanja.startswith("sandbox")` nije provera granice? Šta radi `resolve()` pre provere, i koje klase napada time zatvarate?
3. Šta je suvi rad i zašto je najjeftinija odbrana? Za koje kategorije akcija se traži potvrda korisnika, a za koje ne?
4. Zašto se loguje namera pre izvršenja? Šta sve NE ide u log i zašto (dva razloga)?
5. Koja greška jeste kandidat za retry sa zadrškom, a koja nije? Zašto retry bez idempotencije može da napravi više štete nego sam pad?
6. Objasnite razliku mekog i tvrdog limita budžeta. Šta se dešava sa zadatakom kad pukne tvrdi limit — i zašto je to bolje od beskonačne petlje?
7. Izračunajte: agent prosečno troši 4.000 ulaznih i 500 izlaznih tokena po zadatku, cene su 0,6 €/M ulazno i 2,2 €/M izlazno, a dnevno bude 800 zadataka. Koliki je mesečni račun? (Računajte na papiru — aritmetika je deo posla.)

## Šta sledi

Agent je sada bezbedno ograničen, vidljiv u svakom koraku, otporan na prolazne greške i unutar budžeta — dakle: **spreman za svet**. [**Modul 10 — Završni projekat: portfolio agent**](../MAPA-UCENJA.md) spaja sve module u jednoj samostalnoj izgradnji: agent koji rešava stvaran problem vašeg okruženja, sa evaluacijom (modul 07), oklopom iz ovog modula i kratkim tekstom „šta i kako" — jer portfolio agent dokazuje ono što ste naučili upravo time što radi i kad vas nema. 🚀
