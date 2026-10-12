# Modul 10 — Završni projekat: portfolio agent

> **Vreme:** 8–12 časova rada · **Preduslovi:** [svi moduli 00–09](../MAPA-UCENJA.md) · **Stanje:** prva radna verzija

Deset modula iza vas: tokeni i kontekst, alati, petlja agenta, memorija i RAG, inženjering konteksta, protokoli, evaluacija, multi-agent sistemi, produkcija. Svaki od njih vas je nečemu naučio na malom primeru. Ovaj modul nema novu teoriju — ima jedan veliki zadatak: **da sve to skupite u sopstvenog agenta, od ideje do objavljene isporuke**. Portfolio agent (eng. *portfolio agent*) je agent koji rešava stvaran problem vašeg okruženja, ima evaluaciju koja pada glasno kad nešto ne valja, bezbednosne ograničene alate, logove iz kojih se vidi šta je radio — i dokumentaciju koju drugi razumeju bez vas. Nije demo koji se pokrene jednom pred publikom; to je oruđe koje radi i kad vas nema. Upravo zato, kad ga jednom takvog napravite, on govori o vašim veštinama umesto vas.

Zašto struktura, a ne „slobodan projekat po želji"? Zato što slobodan projekat bez oslonca luta: počne ambiciozno, nabuja od feature-a, pa se nikad ne završi. Ovde je projekat podeljen u **šest delova sa kontrolnim tačkama** (sekcija 4): svaki deo ima jasan cilj, poziva se na tačno određene module i završava se kontrolnom tačkom (eng. *checkpoint*) — spiskom tvrdnji koje moraju biti tačne pre nego što pređete na sledeći deo. Kontrolne tačke su vaš gazda u ovom modulu: drže obim pod kontrolom i projekte koji bi „za par dana" trajali tri meseca vraćaju na zemlju.

Kako raditi ovaj modul: čitavim redom, ali pišući kod od prvog dana. Rezultat na kraju nije samo agent — rezultat je **javni repozitorijum** koji sadrži agenta, evaluacioni skup, dosije projekta i README po kome se sve to čita. Taj repozitorijum je isporuka (eng. *deliverable*), i za njega važe zahtevi iz sekcije 5 i rubrika iz sekcije 7. Na kraju: sami se ocenite — iskreno, po rubrici — i popunite ono što je zakazalo. To je zadnja vežba kursa i, iskreno, ona koja najviše podseća na pravi posao.

---

## 1. Šta završni projekat dokazuje

Počnimo od kraja: šta neko ko pogleda vaš repozitorijum treba da zaključi za pet minuta čitanja. Tri stvari, redom.

**Prvo: da znate da od ideje dodete do isporuke.** Put od „bilo bi korisno da agent radi X" do „X radi, meri se, ograničen je i dokumentovan" je dug, i pun je odluka koje nisu kod: šta ne praviti, koliko memorije dati, gde staviti prag. Projekat koji je prošao kroz sve delove pokazuje da taj put znate — a to je redak dokaz, jer većina eksperimenata umire na pola.

**Drugo: da razlikujete agent koji radi od agenta koji deluje da radi.** Jedan demo ubedi na deset minuta; isporučen agent mora da preživi nedelju dana rada, uključujući dane kad API šteka, kad korisnik pita glupe stvari i kad budžet pripreti da se potroši. Evaluacioni skup sa pragom, logovi sa tragom (eng. *trace*) i kočnice u kodu (moduli 03, 07, 09) su razlika između ta dva — i tačno su ono što će ispitivač na razgovoru, ili kolega na poslu, tražiti prvo.

**Treće: da umejte da dokumentujete.** Dosije projekta i README nisu naknadna dekoracija; oni su deo isporuke koji govori dok vas nema. Agent koga samo vi znate da pokrenete je hobi; agent koga i drugi pokreću je alat.

Odatle i glavno pravilo ovog modula: **sve što pišete, pišete kao da će to čitati neko ko vas ne poznaje** — jer će, ako projekt uspe, baš to i da se desi.

## 2. Izbor ideje: dobar projekat na jednom listu

Ideja određuje pola uspeha projekta — i to pre prvog reda koda. Dobra ideja za završni projekat prolazi pet provera; proverite svaku pre nego što se vežete:

1. **Stvaran problem, stvarni podaci.** Agent rešava nešto što bi vi (ili neko koga poznajete) inače radili ručno — nad podacima koji postoje: vaše beleške, dokumentacija tima, fascikla sa izveštajima. Ako podatke morate izmišljati, i vrednost agenta ćete izmišljati.
2. **Uspeh se meri brojem ili listom.** „Odgovara korisno" je utisak; „na 15 pitanja iz dokumenta odgovara tačno sa izvorom, bar 12 puta" je meri. Ako ne možete da smislite kako da izmerite da li agent radi dobro — ideja (ili njeno razumevanje) još nije zrela.
3. **Uski obim (minimalna održiva verzija).** Jedna vrsta zadatka, jedan korisnik, jedan izvor podataka. Širina dolazi kasnim proširenjima, ne prvom verzijom — sećate se „asistent za sve" iz modula 00: to je najkraći put do agenta koji ništa ne radi dobro.
4. **Alati koje već ume.** Ispod projekta stoje stvari iz modula 02 i 03: čitanje fajlova, pretraga, pisanje izveštaja. Ako ideja traži nove, spoljne servise koje nikad niste dirali (neregistrovana API-ja, platni sistem) — rizik je u pogrešnom sloju.
5. **Bezbedno kad pogreši.** Agent će grešiti; izaberite oblast u kojoj greška košta ponovo urađen posao, a ne nepovratnu štetu. Organizacija beleški: da. Brisanje po tuđem disk: ne.

Ako se neka ideja već roji u glavi — uporedite je s listom. Ako ne, evo šest polaznih tačaka, od najlakših ka najzahtevnijima; svaka kaže i koje module najviše vežbe:

| Ideja (radni naziv) | Šta radi | Najviše vežba |
|---|---|---|
| **Bibliotekar** | Sređuje fasciklu sa beleškama: predlaže imena i strukturu, piše indeks — uz potvrdu čoveka za svaku promenu. | 02, 03, 09 |
| **Pomoćnik za sastanke** | Iz transkripta/beleški sastanka vadi odluke, rokove i vlasnike; piše kratak zapisnik u utvrđenom formatu. | 01, 02, 07 |
| **Knjižničar dokumentacije** | RAG nad dokumentima vašeg tima (pravilnici, uputstva): odgovara sa navođenjem odlomka, odbija kad pokrivenosti nema. | 04, 05, 07 |
| **Putnik** | Za dati raspored i ograničenja (budžet, datumi) pravi nacrt plana puta iz javnih, besplatnih izvora — uvek sa izvorom navoda. | 02, 03, 05 |
| **Registrator tiketa** | Čita novi mejl/tiket, klasifikuje ga, predlaže odgovor po pravilniku — odgovor šalje samo čovek. | 06, 07, 09 |
| **Čuvar promena** | Prati izmene dokumenata u fascikli i piše pregled „šta se promenilo od prošlog puta", sa difom u izlazu. | 03, 05, 07 |

Ništa od ovoga ne impresionira naslovom — i baš zato valja: to su poslovi koji stvarno stoje pred ljudima, i na njima se lepo vide svi delovi gradiva. Kad izaberete (ili smislite svoju), zapišite je u dve rečenice i pokažite je nekome: ako vam sagovornik može ponoviti šta agent radi — ideja je dovoljno jasna. Ako ne — još je samo osećaj, i treba je oštriti.

## 3. Veštine iz modula 00–09 koje projekat koristi

Završni projekat je namerno spoj svega; evo kroz šta sve prolazite, sa pokazivačem gde je u projektu svaka veština vidljiva:

| Modul | Veština koju projekat pokazuje | Gde se vidi |
|---|---|---|
| [00](modul-00-uvod-u-agente.md) | radna definicija agenta; svesno korišćenje alata umesto ćaskanja | dosije: zašto je ovo posao za agenta, a ne skripta ili čovek |
| [01](modul-01-osnove-llm.md) | strukturiran, verzionisan sistemski prompt; ključ u environment varijabli | `agent.py` od prvog reda; `.env` van Gita |
| [02](modul-02-alati-tool-use.md) | šeme alata sa opisima koji rade; provera argumenata na granici; sandbox | svaki alat u `alati.py`, sa opisom i proverom |
| [03](modul-03-agent-od-nule.md) | petlja agenta sa kočnicama; čitanje traga | `agent.py`: petlja, `max_koraka`, ispis koraka |
| [04](modul-04-memorija-i-rag.md) | izbor znanja: RAG, sažimanje, ili ništa od toga — svesno | deo „znanje" projekta + obrazloženje u dosijeu |
| [05](modul-05-inzenjering-konteksta.md) | kontrola onoga što ulazi u prozor: kompaktni formati, prioritet | format poruka, dužine isečaka, redosled u kontekstu |
| [06](modul-06-protokoli-mcp-a2a.md) | razumevanje interfejsa ka spoljnom svetu; bezbednost povezivanja | svaka granica prema spoljnom servisu ili fajl sistemu |
| [07](modul-07-evaluacija-agenata.md) | scenario-skup, provere, prag kao kapija; dif razmišljanje | `eval-skup.json` + pokretač sa izlaznim kodom |
| [08](modul-08-multi-agent-sistemi.md) | odluka *jedan agent ili više* — obično jedan, uz obrazloženje | dosije: odeljak o arhitekturi (i zašto ne više agenata) |
| [09](modul-09-u-produkciju.md) | ograničenja umesto poverenja; logovi sa id traga; budžet; otpornost | `logovi.jsonl`, klasa budžeta, ponovni pokušaji |

Čitajte tabelu unapred kao spisak za potvrdu, a unazad — kad završite — kao kontrolnu listu: ima li u vašoj isporuci po jedna vidljiva stavka iz svakog reda? Ne mora svaki red da bude veliki; mora da se vidi. (Modul 08 je namerno skromno zastupljen: mali projekat treba da argumentuje zašto *nije* multi-agent — a to je, pošteno, najčešće ispravno.)

## 4. Obim projekta: šest delova sa kontrolnim tačkama

Evo cele putanje, od prazne fascikle do objavljenog repozitorijuma. Svaki deo: cilj, šta se gradi (sa pozivom na module), procena vremena — i **kontrolna tačka**: spisak tvrdnji koje moraju važiti pre nego što krenete dalje. Kontrolne tačke nisu savet; one su dogovor s vama samima. Ako neka ne može da se zaokruži, to je znak da je deo ispod nje još sirov — i da se vraća, ne preskače.

### Deo 1 — Dosije projekta (60–90 min)

Pre koda, tekst — jer tekst plaši obim bolje od koda. Dosije projekta (eng. *project brief*) je kratak dokument (jedna strana, šest odeljaka, šablon u vežbi 1) koji fiksira: šta agent radi i za koga; kakvi podaci ulaze; po čemu ćete znati da radi dobro (mera uspeha); šta agent **ne** radi (granice); koji su rizici i ko im je vlasnik; i rok. Zašto prvo dosije, a ne kod? Zato što je jeftinije izmeniti rečenicu nego arhitekturu: dosije je mesto gde se „a možda da još i..." zaustavlja pre nego što postane nedelja dana posla.

> **Kontrolna tačka 1** ☐ Dosije ima svih šest odeljaka. ☐ Mera uspeha je proverljiva (broj ili lista). ☐ Odeljak „ne radi" ima bar tri stavke. ☐ Osoba koja vas nije slušala dok ste pisali, posle čitanja ume da kaže šta agent radi — i šta ne.

### Deo 2 — Alati i šeme: ruke agenta (2–3 časa)

Sada konačno kod — ali ne petlja, već alati. Po najmanjoj dozvoli (moduli 02 i 09): napišite sve funkcije koje agent treba da ume, svaku sa šemom (ime, opis, parametri), proverom argumenata na granici i sandbox-om ako dira fajl sistem. Opisi se pišu kao dokumentacija za model (modul 02); provera se piše kao da model pokušava da pogreši — jer ponekad i hoće. Ovde spada i izvor znanja ako ga ima: pretraga nad vašim dokumentima, u najjednostavnijem obliku koji radi (modul 04). A za sad — samo alati, bez odlučivanja: pozovite svaki ručno iz malog `main` dela i proverite izlaze.

> **Kontrolna tačka 2** ☐ Svaki alat ima šemu i proveru argumenata. ☐ Putanje van sandbox-a vraćaju grešku, ne izuzetak. ☐ Svaki alat je pokrenut ručno bar jednom, na stvarnom (ne izmišljenom) unosu. ☐ Spisak alata je kraći od spiska onoga što bi agent „mogao" — i ume se reći zašto je svaki tu.

### Deo 3 — Petlja agenta: srce (2–3 časa)

Spajate: sistemski prompt (uloga, postupak, format izlaza, pravila odbijanja — modul 01), alate iz dela 2 i petlju iz modula 03, sa kočnicama od početka: `max_koraka`, ispis svakog koraka (mini-trag), i pravilo da greška alata ide modelu kao `tool` poruka, a ne čoveku. Prvo pokretanje gledajte kao autopsiju u živo: čitajte trag korak po korak (modul 03, sekcija 4) i popravljajte najpre opise alata i uputstva, ne kod. Ako vaša ideja traži sažimanje istorije ili stroži izbor konteksta — ovde je taj deo (modul 05), u najkraćem obliku koji rešava stvarni problem prozora koji se puni, ne unapred.

> **Kontrolna tačka 3** ☐ Agent završava zadatak iz dosijea bez vaše pomoći u toku rada. ☐ Isti zadatak pokrenut drugi put daje upotrebljiv (ne nužno identičan) rezultat. ☐ Trag se čita: za svaki korak vidljivo je koji alat, sa kojim argumentima, i šta je vratio. ☐ Kad se prekine kočnicom, poruka kaže koja kočnica i zašto.

### Deo 4 — Evaluacija: kapija pre svake izmene (2–3 časa)

Agent koji radi jednom, pred vama, još ništa ne dokazuje. Pišite scenario-skup (modul 07): 10–15 primera po anatomiji — direktni, parafraza, van domena, pogrešna pretpostavka, granični — svaki sa `ulaz`, `očekivano` i `provere` koje padaju glasno (porukom koja kaže šta je falilo). Uz njih pokretač: prolaz/pad po scenariju, stopa, prag i izlazni kod 0/1 — kapija kroz koju od sad mora da prođe svaka izmena. Prvi prolaz skupa će verovatno pasti; to je dobro: pale provere su vam redosled posla. Sloj sudije-modela dodajte samo za scenario koje pravila ne hvataju (modul 07, sekcija 5) — i kalibrišite ga na primerima koje ste sami ocenili.

> **Kontrolna tačka 4** ☐ Skup ima bar 10 scenarija, sa bar 3 kategorije ponašanja (direktno / parafraza / granica). ☐ Svaka provera, kad padne, kaže šta je falilo — bez otvaranja koda. ☐ Pokretač vraća izlazni kod 1 ispod praga. ☐ Jedna namerna izmena (npr. izbačeno pravilo prompta) pokazuje se u dif pregledu — i vraćanjem pravila, dif se vrati na čisto.

### Deo 5 — Oklop: bezbednost, logovi, budžet (2–3 časa)

Delove 1–4 ste radili na svom računaru; ovaj deo uvodi red produkcije u malom (modul 09), jer će vaš agent raditi i kad vas nema: strukturisani logovi (JSON linije sa id traga kroz ceo zadatak), budžet sa mekim upozorenjem i tvrdim limitom, ponovni pokušaji sa zadrškom za prolazne greške mreže, i pregled spiska alata najmanje dozvole — uz potvrdu čoveka za sve nepovratno (ili bar suvi rad: „evo šta bih uradio"). Ne morate imati server: dovoljno je da agent preživi pokretanje iz `cron`-a ili zakazanog zadatka, nedelju dana, bez vaše intervencije — i da posle tog perioda, iz logova, umejte da odgovorite na pitanje „šta je radio i koliko je koštalo".

> **Kontrolna tačka 5** ☐ Log jedne sesije sadrži id traga, svaki poziv alata i konačan ishod. ☐ Tvrdi limit budžeta prekida zadatak čistom porukom (a meki upozorava pre toga). ☐ Nepovratne akcije traže potvrdu ili rade u suvom režimu. ☐ Jedan „pad mreže" (isključite VPN na 10 sekundi) ne ruši zadatak bez traga.

### Deo 6 — Isporuka i objava (60–90 min)

Poslednji deo je pisanje — i on je deo isporuke, ne epilog. README (šta je, za koga, kako se pokreće, kako se testira, ograničenja, procena troška), dosije u repozitorijumu, `requirements.txt`, `.env.example` sa imenima varijabli (bez vrednosti!), i struktura fascikli koja se čita. Zatim objava: javni repozitorijum (GitHub i sl.), poželjno istorija komitova koja prati delove 1–5 — istorija je i dokumentacija. Na kraju provera sa strane: neka osoba koja nije vi pokrene agenta samo po README-u, bez pitanja. Svako pitanje koje postave je propust dokumentacije; zapišite ga i popravite.

> **Kontrolna tačka 6** ☐ Repozitorijum se klonira i pokreće po README-u, bez pitanja autoru. ☐ Evaluacioni pokretač prolazi kapiju na svežem klonu. ☐ U istoriji komitova vide se faze (ne jedan gigantski komit). ☐ `.env.example` postoji, `.env` je u `.gitignore`-u i u repozitorijumu ga nema.

Šest delova, šest kontrolnih tačaka — i 8–12 časova realnog rada (iskustveno: deo 3 najčešće najduži, deo 4 onaj koji najviše vrati nazad — i to je njegova namena). Redosled je svestan: dosije pre koda, alati pre petlje, evaluacija pre oklopa, objava na kraju. Ako vas mrzi neki deo — to je obično onaj koji vas najviše štiti.

## 5. Zahtevi za isporuku

Šta tačno znači „isporučeno"? Ovaj spisak je ugovor: dok svaka stavka nije zadovoljena, projekat je u radu, ne u isporuci. (I da — on je i tuđi: po njemu će vas drugi meriti, zato je kratak i tvrd.)

**Repozitorijum (javni, na servisu po izboru):**

```text
vas-agent/
├── README.md          # vrata: šta, za koga, kako se pokreće i testira
├── dosije.md          # dosije projekta iz dela 1 (šablon u vežbi 1)
├── agent.py           # petlja agenta sa kočnicama i tragom
├── alati.py           # sve funkcije alata: šeme, provere, sandbox
├── eval-skup.json     # scenario-skup (bar 10 scenarija, 3 kategorije)
├── eval.py            # pokretač: stopa, prag, izlazni kod 0/1
├── logovi.jsonl       # izlaz logovanja (primer u repozitorijumu, ne prazan)
├── requirements.txt   # zavisnosti (openai, numpy — ono što zaista koristite)
├── .env.example       # imena varijabli, BEZ vrednosti
└── .gitignore         # obavezno sadrži .env
```

(Imena fajlova su predlog: struktura je važna, ne boja imena. Ako je projekat veći — npr. RAG indeks — dodajte fasciklu i ažurirajte README; ako je manji, ne prepričavajte strukturu veću od projekta.)

**Kod:**

- ključ i konfiguracija isključivo iz environment varijabli (`Z_AI_API_KEY`, opciono `Z_AI_BASE_URL`, `Z_AI_MODEL` — pravilo iz modula 01, važi zauvek);
- Python 3.10+, standardna biblioteka + najviše dve spoljne zavisnosti, svaka opravdana u README-u;
- svaki alat sa proverom argumenata na granici; sandbox za sve što dira fajl sistem;
- kočnice ugrađene u petlju: `max_koraka`, budžet tokena (meki upozorava, tvrdi prekida);
- bez hardkodovanih putanja van projekta, bez izvršavanja proizvoljnog koda (`eval` je reč koju ne koristimo — modul 02);
- framework dozvoljen samo uz obrazloženje u dosijeu zašto je (najčešće nije — i to je potpuno valjan zaključak).

**Evaluacija:**

- scenario-skup u Git-u (verzionisan), bar 10 scenarija, uključuje granične slučajeve: van domena, pogrešna pretpostavka, nemoguć zahtev;
- provere determinističke gde god je moguće; sudija-model samo gde pravila ne stignu, sa kalibracijom;
- pokretač vraća izlazni kod 1 ispod praga i piše rezultate u fajl (dif pregled moguć).

**Dokumentacija:**

- README odgovara na šest pitanja: šta je · za koga · kako se pokreće · kako se testira · šta ne radi (ograničenja) · koliko košta (procena po zadatku);
- dosije u repozitorijumu, ažuriran ako se projekat tokom rada promenio (dosije koji laže je gori od dosijea koji ga nema);
- istorija komitova prati faze iz sekcije 4 — po jedan značajan komit po delu je sasvim dovoljno;
- licenca: vaša (MIT, CC BY... — izbor je vaš, ali mora biti svesno napisan).

Ugovor deluje dugačko — a svaka rečenica gore je neki deo gradiva koji ste već radili. To je i tajna završnog projekta: on nije nov ispit, nego zbirka već položenih.

## 6. Vežbe

Dve vežbe, obe su alatke koje koristite tokom celog projekta (a ne jednom na kraju): šablon dosijea i program kojim se isporuka proverava. Pravu gradnju vodi sekcija 4 — ove dve su njene ručice.

### 6.1 Dosije projekta: šablon

Napravite u korenu projekta `dosije.md` i popunite ga — šest odeljaka, svaki po par rečenica. Šablon (kopirajte i zamenite napomene u uglastim zagradama):

```markdown
# Dosije projekta: [ime agenta]

## Šta agent radi, za koga
[1–2 rečenice: zadatak + korisnik. Ako ne može u dve rečenice, obim još nije sužen.]

## Podaci i alati
[Šta je ulaz (fascikle, dokumenti, API), koji alati postoje (čitanje, pretraga, pisanje) i gde je sandbox.]

## Mera uspeha
[Proverljiva: „na N primera iz X bar Y tačno sa izvorom"; ili lista stvari koje moraju važiti na kraju pokretanja.]

## Šta agent NE radi
[Bar tri stavke. Ovde se piše obim — sve što svesno ne pravite.]

## Rizici i ograničenja
[Šta može da pođe po zlu (troškovi, privatnost podataka, greške modela) i šta vas čuva od toga: kočnice, potvrde, prag.]

## Arhitektura u kratko
[Jedan agent ili više — i zašto; odakle znanje (RAG/prompt); koji model i zašto. Jedan pasus.]
```

Dosije nije književnost — to je radni dokument: tokom projekta ćete ga menjati (i smete), ali svaku promenu obavezno komitujte sa porukom zašto. Na kraju, dosije koji se razlikuje od projekta samo po verzijama — a ne po sadržaju — znak je da ste gradili planski.

### 6.2 Provera isporuke kao kod

Ako je isporuka ugovor (sekcija 5), neka se ugovor proverava programom — najiskrenije oruđe ovog kursa: ono što se ne proverava automatski, pre ili kasno prestane da se proverava. `10a_provera_isporuke.py` je mala kapija za vaš repozitorijum: struktura, dokumentacija, evaluacioni skup, higijena tajni i kompajliranje — sve iz jednog pokretanja, bez mreže. Sačuvajte ga u korenu projekta (ili gde god držite alatke) i pokrećite pred svaki komit:

```python
"""Vežba 10.2 — provera isporuke: struktura, dokumentacija, skup, tajne, kompajliranje.

Radi bez mreže i bez ključa: sve provere su na fajlovima i tekstu.
Upotreba: python 10a_provera_isporuke.py [direktorijum projekta]
"""

import ast
import json
import re
import sys
from pathlib import Path

OBAVEZNI_FAJLOVI = ["README.md", "dosije.md", "eval-skup.json",
                    "requirements.txt", ".env.example", ".gitignore"]
README_ODLOCI = ["šta", "pokre", "testira"]          # gruba provera: README o njima mora pisati
DOSIJE_ODLOCI = ["podaci", "mera", "rizi", "arhitektur"]
PRAG_SCENARIJA = 10
MUSTRA_KLJUCA = re.compile(r"(sk-[A-Za-z0-9_-]{10,}|api[_-]?key\s*=\s*[\"'][^\"']{12,})",
                            re.IGNORECASE)

def proveri(koren: Path) -> list[str]:
    """Vraća spisak problema; prazan spisak = isporuka prolazi."""
    problemi: list[str] = []
    for ime in OBAVEZNI_FAJLOVI:
        if not (koren / ime).exists():
            problemi.append(f"nedostaje fajl: {ime}")
    readme = koren / "README.md"
    if readme.exists():
        tekst = readme.read_text(encoding="utf-8").lower()
        for rec in README_ODLOCI:
            if rec.lower() not in tekst:
                problemi.append(f"README ne pominje: {rec}")
    dosije = koren / "dosije.md"
    if dosije.exists():
        tekst = dosije.read_text(encoding="utf-8").lower()
        for rec in DOSIJE_ODLOCI:
            if rec.lower() not in tekst:
                problemi.append(f"dosije ne pominje: {rec}")
    skup_fajl = koren / "eval-skup.json"
    if skup_fajl.exists():
        try:
            scenariji = json.loads(skup_fajl.read_text(encoding="utf-8"))
        except json.JSONDecodeError as g:
            problemi.append(f"eval-skup.json nije ispravan JSON: {g}")
            scenariji = []
        if scenariji and len(scenariji) < PRAG_SCENARIJA:
            problemi.append(f"skup ima {len(scenariji)} scenarija, a treba bar {PRAG_SCENARIJA}")
        id_jevi = [sc.get("id") for sc in scenariji if isinstance(sc, dict)]
        if len(id_jevi) != len(set(id_jevi)):
            problemi.append("id-jevi scenarija nisu jedinstveni")
        if any(not sc.get("provere") for sc in scenariji if isinstance(sc, dict)):
            problemi.append("postoje scenariji bez ijedne provere")
    gitignore = koren / ".gitignore"
    if gitignore.exists() and ".env" not in gitignore.read_text(encoding="utf-8"):
        problemi.append(".gitignore ne sadrži .env")
    return problemi

def proveri_tajne_i_kod(koren: Path) -> list[str]:
    """Skenira .py fajlove: curenje ključeva i sintaksa (bez izvršavanja)."""
    problemi: list[str] = []
    for fajl in sorted(koren.rglob("*.py")):
        if any(deo.startswith(".") for deo in fajl.relative_to(koren).parts[:-1]):
            continue
        tekst = fajl.read_text(encoding="utf-8", errors="replace")
        if MUSTRA_KLJUCA.search(tekst):
            problemi.append(f"moguće curenje ključa u: {fajl.name}")
        try:
            ast.parse(tekst)
        except SyntaxError as g:
            problemi.append(f"{fajl.name} se ne kompajlira: {g.msg} (red {g.lineno})")
    return problemi

def main() -> None:
    koren = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path.cwd()
    if not koren.is_dir():
        sys.exit(f"Nije direktorijum: {koren}")
    print(f"provera isporuke: {koren}\n")
    problemi = proveri(koren) + proveri_tajne_i_kod(koren)
    if (koren / ".env").exists():
        print("info: .env postoji na disku — u redu dok je pokriven u "
              ".gitignore-u (provera iznad)")
    for problem in problemi:
        print(f"✘ {problem}")
    if not problemi:
        print("✓ sve provere isporuke prolaze")
    print(f"\n{'PALO' if problemi else 'PROŠLO'}: {len(problemi)} problema")
    sys.exit(1 if problemi else 0)          # kapija: izlazni kod kao u modulu 07

if __name__ == "__main__":
    main()
```

Pokrenite ga na projektu u toku izrade — pasti će (to je poenta), a svaki pad je sledeći zadatak. Pokrenite ga i na fascikli sa vežbama modula 07 (gde već imate `eval-skup.json`): videćete šta treba dopuniti da bi i mala vežbica bila „isporuka". Napomena o namernoj prostoti: mustra ključeva hvata najčešće slučajeve (`sk-...`, `api_key = "..."`), ne sve; pravi skeneri rade isto, temeljitije. Obrazac — ugovor se proverava kodom — vredi i kad skener naraste.

## 7. Rubrika samovrednovanja

Kad kontrolna tačka 6 zaokruži, došlo je vreme za poslednju ocenu — vašu. Rubrika (eng. *rubric*) ispod ima šest dimenzija; svaku ocenite od 0 do 3, iskreno, na osnovu repozitorijuma kakav zaista jeste (ne kakav bi bio „samo da još…"). Ocena po opisima, ne po osećaju: uzmite prvi opis koji stoji u potpunosti.

| Dimenzija | 0 — nema | 1 — počelo | 2 — radi | 3 — radi i brani se |
|---|---|---|---|---|
| **Problem i dosije** | nema dosijea | dosije postoji, ali se projekat od njega udaljio | dosije i projekat se slažu; mera uspeha proverena | dosije čita stranac: on zna šta agent radi i šta ne |
| **Ispravnost i petlja** | agent ne završava zadatak | završava uz pomoć autora | završava sam, sa kočnicama i tragom | ponovna pokretanja daju upotrebljive rezultate; trag objašnjava i padove |
| **Evaluacija** | nema skupa | skup postoji, ocenjivanje ručno | kapija sa pragom pada glasno; rezultati se čuvaju | dif pregled korišćen u stvarnoj izmeni, obrazložen u istoriji |
| **Bezbednost i obim alata** | alati neograničeni | sandbox postoji, provere delimično | svaki alat proverava argumente; nepovratno traži potvrdu | spisak alata obrazložen u dosijeu, uključujući šta je namerno izostavljeno |
| **Logovi i troškovi** | samo `print` | logovi postoje, ali bez traga | strukturisani logovi sa id traga; budžet sa tvrdim limitom | iz logova se odgovara „šta je radio i koliko je koštalo" i za prošlu nedelju dana |
| **Dokumentacija i objava** | bez README-a | README postoji, ali ga strani čitalac ne prati do pokretanja | potpuni README; strani čitalac pokreće agenta bez pitanja | istorija komitova prati faze; README odgovara i na ograničenja i na trošak |

Sabirajte (0–18) i pročitajte opseg:

- **15–18 — isporučeno.** Ovo je portfolio agent: javno ga pokazujte, i u razgovoru za posao vodite kroz njega redom — trag, skup, kapija, logovi.
- **10–14 — radi, ali se ne brani.** Vratite se dimenzijama sa ocenom 1 i 2: to su obično evaluacija i logovi — delovi koji se najlakše odlože „za kad bude vremena", a bez kojih projekat ne može da dokaže ni sebi, ni drugima.
- **5–9 — u izradi.** Srce (deo 3) verovatno radi; okolo ne. Nastavite po kontrolnim tačkama od dela 4.
- **0–4 — početak.** I to je legitimno stanje — samo ne kraj. Vratite se na deo 1.

I još nešto, važnije od broja: rubrika je i plan poboljšanja. Kolona „3" je spisak sledećih koraka, dimenzija po dimenziju — i svaki korak tamo je mali, konkretan posao („dodaj id traga u logove"), a ne „popraviti kvalitet".

## 8. Primeri portfolio prezentacije

Agent je isporučen — sad ga treba i pokazati. Portfolio prezentacija nije slajdovi; to su **tri teksta koja žive uz repozitorijum** i rade za vas kad vas nema: prezentacija u tri rečenice (na vrhu README-a), demo kroz trag (deo istorije ili izlaza), i „odbrana" — odgovori na pitanja koja će sigurno doći. Evo kako to izgleda za tri primer-projekta iz sekcije 2; vaš tekst pišete po istom kalupu.

**Primer 1 — „Bibliotekar" (agent za red u fascikli beleški):**

> Bibliotekar sređuje fasciklu sa beleškama: pročita svaku, predloži jasno ime i mesto u strukturi, i piše indeks fascikle — a svaku promenu izvrši tek posle moje potvrde. Petlja agenta, tri alata sa proverom argumenata i sandbox-om; scenario-skup od 12 primera sa pragom od 80% kao kapija pri svakoj izmeni. Bez frameworka, ~200 linija Pythona: baš zato što sam petlju pisao sam, znam šta bi framework doneo — i šta bi uzeo.

**Primer 2 — „Knjižničar dokumentacije" (RAG nad pravilnicima tima):**

> Knjižničar odgovara na pitanja iz dokumenata našeg tima (pravilnici, uputstva) — uvek sa navođenjem odlomka i izvora, i sa otvorenim odbijanjem kad pokrivenosti nema. RAG cevovod: deljenje na odlomke, ugnežđene reprezentacije, lokalni vektorski indeks, pretraga po sličnosti. Evaluacija: 15 pitanja (10 sa pokrivenošću, 5 bez) — mera je „tačno sa izvorom", a „nagađa umesto da odbije" se broji kao pad, ne kao blizina.

**Primer 3 — „Čuvar promena" (nedeljni pregled izmena):**

> Čuvar jednom nedeljno pregleda izmene u fascikli sa dokumentima i piše kratak pregled „šta se promenilo, šta to znači za nas" — pokreće se zakazano, radi bez mene, i o sebi piše strukturisane logove sa id traga. Zato mu verujem: kad nešto pogreši, iz logova vidim koji korak, koji alat, i koliko je koštalo; budžet sa tvrdim limitom čini da najgore što može da se desi bude — jasan izveštaj o prekidu.

Primetite šta sva tri rade: **prva rečenica — šta radi i za koga; druga — kako (arhitektura imenom); treća — zašto mu verovati (evaluacija, logovi, kočnice).** To je struktura koja se pamti i prepričava — i tačno redosledom kojim će i ispitivač gledati vaš repozitorijum. Uz to, dva kratka dodatka:

- **Demo kroz trag:** u README ubacite isečak stvarnog traga jednog pokretanja (izlaz korak po korak, ili par linija iz `logovi.jsonl`) — čitaocu to govori više od screenshot-a, jer pokazuje da je proces vidljiv, ne samo rezultat.
- **Pripremljena odbrana:** tri pitanja koja sigurno padnu — „šta desi kad padne mreža?", „kako znate da odgovori nisu izmišljeni?", „koliko košta po nedelji?" — i tri kratka odgovora iz vaših logova i evaluacije. Ko je na njih spreman, na sve ostalo će biti.

## 9. Tipične greške — i dijagnoza

| Simptom | Uzrok | Lek |
|---|---|---|
| Projekat „skoro gotov" tri nedelje | preskočena kontrolna tačka; obim bez vlasnika | vratiti se na prvu nezaokruženu KT; sve „još samo" stavke preći u dosije, odeljak „ne radi" |
| Agent radi na vašim, pada na tuđim podacima | alati testirani na izmišljenim primerima | KT2 doslovno: bar jedan pokret na stvarnom unosu, pre petlje |
| Stopa prolaznosti visoka, a agent loš | provere prate format, ne sadržaj; scenariji samo „dobri" | dodati van domena i pogrešne pretpostavke; sudija za ono što pravila ne hvataju |
| README lepo piše, ali niko ne pokreće | dokumentacija pisana iz sećanja, ne iz pokušaja | KT6 doslovno: svež klon, strane ruke, nula pitanja — pa onda pišite |
| Logovi postoje, a „šta se desilo juče" se ne zna | događaji bez id traga; vreme nije u liniji | jedan id po zadatku, vremenska oznaka u svakoj liniji (modul 09) |
| Portfolio izgleda kao zbirka domaćih | šest malih skripti bez veze, umesto jednog prošlog puta | ovaj modul: jedan projekat kroz šest delova — dubina, ne širina |

## 10. Pitanja za samoproveru

1. Zašto se dosije projekta piše pre koda, i šta u njemu čuva obim? Šta znači stavka „šta agent NE radi" sa bar tri stavke?
2. Navesti tri od pet provera dobre ideje iz sekcije 2 — i za svaku objasniti u kojem delu sekcije 4 će kasnije puknuti projekat koji tu proveru nije prošao.
3. Kontrolne tačke su „dogovor s vama samima". Šta je alternativa — i zašto je lošija? Šta kontrolna tačka radi kad padne, a šta ne sme da radi?
4. Zašto se u delu 2 alati prave i testiraju pre petlje? Šta bi se desilo kad biste petlju gradili prvu — i gde bi se to prvo videlo?
5. Rubrika kaže: „ponovna pokretanja daju upotrebljive rezultate". Zašto „upotrebljive", a ne „identične"? Kakav deo isporuke to čini mogućim (a) da se vidi i (b) da se meri?
6. Predstavite svoj projekat u tri rečenice po kalupu iz sekcije 8 — sad, bez gledanja u repozitorijum. Koja rečenica je pukla? To je sledeći zadatak dokumentacije.

## Šta sledi

Ovim modulom kurs se zatvara krug: od „šta je uopšte agent" (modul 00) do agenta koji je isporučen, izmeren, ograničen i objavljen — vašeg. Šta posle? Tri prakse koje drže znanje živim. **Prvo, održavajte agenta:** svaka izmena kroz kapiju evaluacije, svaki pad kroz logove — mesec dana takvog rada vredi više od novog kursa. **Drugo, čitajte izvore:** dokumentaciju provajdera koje koristite, specifikacije poput MCP, i changelog-e alata — oblast se menja brzo, ali vama je sada jezik domaći. **Treće, vratite kursu:** prijavite grešku, predložite vežbu, vodite radionicu — najbolji način da utvrdite gradivo je da ga predate dalje. Ako vam je ovaj kurs pomogao, [REČNIK](../REČNIK.md), [MAPA](../MAPA-UCENJA.md) i [radionice](../radionice/) čekaju sledećeg čitaoca — i doprinos dobrodošao u [CONTRIBUTING](../CONTRIBUTING.md). Srećno — i neka vam agenti rade i kad vas nema. ⚓
