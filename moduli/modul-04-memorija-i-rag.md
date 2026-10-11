# Modul 04 — Memorija i RAG: agent koji zna vaše dokumente

> **Vreme:** 6–8 časova rada · **Preduslovi:** [moduli 01](modul-01-osnove-llm.md) i [03](modul-03-agent-od-nule.md) · **Stanje:** prva radna verzija

Agent iz modula 03 je sposoban, ali zaboravljan: zatvorite terminal i sve je nestalo — šta je pročitao, šta je zaključio, koga je pitao. A pitajte ga nešto iz vaših pravilnika, beleški ili uputstava — ne zna ni da počne, jer ti dokumenti nikad nisu ušli u kontekst. U ovom modulu rešavamo oba problema, a zajedničko ime za prvi je **memorija** (eng. *memory*): kako agent pamti kroz vreme i preko sesija. Drugi problem rešava generisanje podržano pretragom (eng. *retrieval-augmented generation*, RAG) — obrazac koji je danas najčešća pojedinačna primena velikih modela u firmama: asistent koji odgovara iz *vaših* dokumenata, sa navedenim izvorom, umesto iz pamćenja sa obuke. Kraj modula: vaš mini pretraživač nad sopstvenim dokumentima — kompletan RAG cevovod (eng. *pipeline*) u nekoliko desetina linija Pythona, i jasan sud kada RAG pomaže, a kada samo dodaje sloj koji pravi nove greške.

---

## 1. Zašto agent zaboravlja: tri vrste memorije

Podsetimo se iz modula 01: model je bez stanja (eng. *stateless*) — između dva poziva ne pamti ništa. Sve što „zna" u trenutku odluke mora biti u kontekstu tog poziva. Iz toga proizlazi cela nauka o memoriji agenata, a ona počinje pitanjem: **gde živi šta agent zna?**

| Vrsta memorije | Gde živi | Koliko traje | Ograničenje |
|---|---|---|---|
| **radna memorija** (eng. *short-term memory*) | istorija poruka u kontekstu | tokom jednog zadatka | kontekstni prozor i cena tokena |
| **sažeta memorija** (eng. *summarized memory*) | sažetak starije istorije, u kontekstu | tokom zadatka, duže | gubi detalje |
| **trajna memorija** (eng. *long-term memory*) | van konteksta: fajlovi, baze, vektorska baza | preko sesija, po volji dugo | mora se naći način da se *vrati* u kontekst |

Radna memorija je istorija koju već imate iz modula 03: lista poruka koja raste sa svakim korakom. Sažeta memorija nastaje kada radnu sabijemo sažimanjem (eng. *summarization*) — o tome sekcija 2. Trajna memorija je sve ostalo: zapisnik u fajlu, baza podataka, indeks dokumenata za pretragu — i njen ključni problem nije čuvanje (fajlovi su jeftini), nego **povraćaj** (eng. *retrieval*): kako, u trenutku potrebe, iz ogromne količine sačuvanog izdvojiti upravo onih nekoliko stotina tokena koji trebaju modelu. Taj problem rešavaju sekcije 3–6, a rešenje se zove RAG.

Usvojimo odmah jednu disciplinu mišljenja koja važi do kraja kursa: **memorija nije osobina koju model „ima", već dizajn koji vi pravite.** Pitanje nije „da li agent pamti", nego „šta tačno ulazi u kontekst u svakom koraku". Na tom pitanju se u modulu 05 gradi cela disciplina — inženjering konteksta.

## 2. Radna memorija: istorija i njena cena

U petlji agenta istorija poruka raste: korisnički zahtev, plan modela, pozivi alata, rezultati, korekcije... Sve to, podsetimo se iz modula 01, plaća se **na svakom pozivu iznova** — kontekst je jedina „radna memorija" koju model ima, i svaki je korak plaća iznova: agent koji radi 30 koraka sa punom istorijom platio je istu staru istoriju trideset puta.

Prvo utešna vest, pa pravo rešenje:

1. **Ponekad istorija nije problem.** Za zadatke od 5–10 koraka, cena istorije je mala prema ceni razmišljanja. Ne optimizujte unapred — merite (modul 07), pa secite.
2. **Sažimanje (eng. *summarization*).** Kada istorija pređe dogovorenu granicu, starije poruke zamenite jednim sažetkom: šta je cilj, šta je urađeno, ključni podaci, šta je ostalo. Modelu, uz sažetak i poslednjih nekoliko poruka, obično treba manje nego što mislite.

Funkcija koja stariju istoriju sabija u sažetak — ista ideja koju traži i domaći iz modula 03:

```python
def sazetak_istorije(client, model, starije_poruke: list) -> str:
    """Stariju istoriju agenta pretvara u kratak sažetak — oslobađa kontekstni prozor."""
    za_sazimanje = "\n".join(f"{p['role']}: {p['content']}" for p in starije_poruke)
    odgovor = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system",
             "content": "Sažmi rad agenta u najviše 150 reči. Zadrži: cilj zadatka, "
                        "urađene korake, ključne podatke i rezultate, otvorena pitanja. "
                        "Ne dodaješ ništa što nije u tekstu."},
            {"role": "user", "content": za_sazimanje},
        ],
        temperature=0.0,
    )
    return odgovor.choices[0].message.content
```

Zamena „starije poruke → sažetak" je najjeftinija štednja konteksta unutar jednog zadatka, ali ona gubi detalje: broj fajla, tačan iznos, ime kolege. Zato je pravilo: **sažimajte ono što je obrađeno, čuvajte sveže ono što je u toku** (poslednjih N poruka ide u originalu). U modulu 05 ovo postaje sistem — sa budžetom, redosledom i formatima; ovde nam treba samo pojam.

## 3. Trajna memorija: od ključnih reči do značenja

Sada drugi problem, ozbiljniji. Recimo da agent treba da odgovara iz vaše interne dokumentacije: pravilnici, beleške sa sastanaka, uputstva — zajedno stotine stranica. Kontekstni prozor je veliki, ali ne toliko, a i kad bi stalo — plaćali biste sve te tokene na svakom pozivu, i model bi se davio u šumu (sećate se „izgubljenog usred konteksta": relevantna činjenica usred gomile podataka se lakše ignoriše). Znači: u kontekst ide **samo ono što je relevantno za trenutno pitanje**. Kako naći baš to?

Prvi odgovor koji svakom padne na pamet jeste pretraga po ključnim rečima (eng. *keyword search*) — `grep`, `LIKE` u SQL-u, tražilica fajlova. Ona je brza, jeftina, razumljiva... i puca na najzanimljivijim pitanjima. Tražite „gde sme da radi izvan kancelarije", a dokument kaže „rad na daljinu se odobrava dva dana nedeljno". Nijedna reč se ne poklapa — a smisao je isti. Obrnuto: pitanje „kolika je kvota" nađe reč „kvota" u deset odlomaka gde se misli na deset različitih stvari. Ključne reči pogađaju **oblik** teksta, ne **značenje**.

Rešenje je ugnežđena reprezentacija (eng. *embedding*): poseban model prevodi svaki tekst u **niz brojeva** fiksne dužine — vektor (eng. *vector*) — sa ključnim svojstvom: tekstovi **sličnog značenja** dobijaju **geometrijski bliske** vektore, i pored različitih reči. „Radi od kuće" i „rad na daljinu" nemaju zajedničku reč, ali njihovi vektori su susedi; vektor rečenice o godišnjem odmoru je daleko. Pretraga po smislu (eng. *semantic search*) onda glasi: pretvori pitanje u vektor, nađi najbliže vektore dokumenata — i dobiješ odlomke po značenju, a ne po obliku reči.

Dva upozorenja pre prve vežbe:

1. **Ugnežđivanje je vezano za model.** Vektor iz jednog modela i vektor iz drugog ne žive u istom prostoru — upoređivati ih je kao meriti udaljenost Beograd–Novi Sad jednom u kilometrima, jednom u miljama. Jednom izabran model za indeks važi i za sva pitanja; promena modela = ponovna izgradnja indeksa.
2. **Brojevi sami po sebi ne znače ništa ljudima.** Niz od 1.536 decimala ne možete da „pročitate". Ugnežđivanje je alat za mašinsko poređenje, ne za ljudsku intuiciju — zato mu verujemo kroz testove, ne kroz pogled.

## 4. Deljenje na odlomke

Ne ugnježđujemo ceo dokument odjednom. Zamislite zašto: ugnežđivanje celog pravilnika od 10 strana daje **prosek** svih tema u njemu — i taj prosek nije blizu ničemu konkretnom. Pitanje o godišnjem odmoru traži vektor koji je blizu baš tom pasusu, a prosek celog dokumenta je „negde u sredini svega". Zato dokument delimo na odlomke (eng. *chunking*): komade koji su dovoljno mali da budu **o jednoj temi**, a dovoljno veliki da imaju **svoje značenje**.

Tri parametra se biraju, i sva tri imaju posledice:

- **Veličina.** Radna okvirna vrednost: 200–400 tokena (za srpski ~600–1.200 znakova, po aritmetici iz modula 01). Manji odlomci → preciznija pretraga, ali kontekst se cepa na pola činjenice; veći → celovitije, ali razblažen signal i skuplji kontekst.
- **Preklapanje (eng. *overlap*).** Susedni odlomci se preklapaju za ~15–20%: ako se činjenica desi baš na spoju, postoji u oba, pa je presek ne ubija. Više preklapanja = veća sigurnost, po ceni ponavljanja (isti tekst se može vratiti dva puta u kontekst).
- **Granice.** Sečemo po rečenici ili pasusu, ne nasumično usred reči. Pravilo: poštuje se struktura dokumenta (naslovi, pasusi), jer je ona već podela na teme koju je napisao čovek.

```text
  ┌────────────────────────────────────────────┐
  │ dokument                                   │
  │ ┌───────────────┐                          │
  │ │   odlomak 1   │                          │   sečenje po rečenici,
  │ └───────┬───────┘                          │   slaganje do ~900 znakova,
  │         │ overlap                          │   preklapanje ~150 znakova
  │ ┌───────┴────────────┐                     │
  │ │   odlomak 2        │                     │
  │ └─────────┬──────────┘                     │
  │           │ overlap                        │
  │ ┌─────────┴──────────┐                     │
  │ │   odlomak 3        │                     │
  └─┴────────────────────┴─────────────────────┘
```

Uz svaki odlomak čuva se i **metapodatak** (eng. *metadata*): iz kog fajla je, redni broj, eventualno naslov poglavlja. Bez izvora ni najtačniji odgovor ne vredi — navođenje izvora (eng. *citation*) je ono što RAG odgovor čini proverljivim, a to ćemo u vežbama učiniti obaveznim.

## 5. Vektorska baza i pretraga po sličnosti

Gde čuvamo vektore odlomaka? U vektorskoj bazi (eng. *vector database*) — što zvuči velelepno, a u osnovi je skromno: **skladište vektora koje ume da nađe k najbližih suseda** (eng. *k-nearest neighbours*) zadatom vektoru. Za kurs pravimo najjednostavniju moguću: jedan JSON fajl sa odlomcima i njihovim vektorima, i pretragu kroz `numpy`. Namerno „glupa" — da se svaki korak vidi; kada baza postane velika (desetine hiljada odlomaka), istu ulogu preuzimaju prava rešenja (Faiss, Chroma, pgvector, Qdrant...), a princip ostaje isti.

Kako se meri blizina dva vektora? Kosinusnom sličnošću (eng. *cosine similarity*): kosinus ugla između vektora:

```text
              a⃗ · b⃗                 zbir po komponentama
kos(a, b) = ────────────  =  ─────────────────────────────────
             |a⃗| · |b⃗|          proizvod dužina vektora
```

Vrednost 1 = isti smer (maksimalna sličnost), 0 = ortogonalno (nikakve veze), −1 = suprotno. Mali zamišljeni primer sa vektorima od 4 broja (pravi imaju 1.000+; brojevi su izmišljeni da biste mogli da računate u glavi):

```text
A: "Zaposleni radi od kuće."        → [0.9, 0.1, 0.3, 0.0]
B: "Rad na daljinu je odobren."     → [0.8, 0.2, 0.4, 0.1]
C: "Godišnji odmor traje 20 dana."  → [0.1, 0.9, 0.0, 0.7]

kos(A, B) = (0.9·0.8 + 0.1·0.2 + 0.3·0.4 + 0) / (|A|·|B|) ≈ 0,98   → isto značenje
kos(A, C) = (0.9·0.1 + 0.1·0.9 + 0 + 0)      / (|A|·|C|) ≈ 0,16   → nema veze
```

Slično značenje, veliki broj; različito, mali. Cela pretraga po sličnosti (eng. *similarity search*) je onda tri koraka: (1) ugnježdi pitanje, (2) izračunaj kosinus sa svakim odlomkom u bazi, (3) vrati k najbližih, po opadajućoj sličnosti. To je sve — i baš to radimo u vežbi.

Još jedna stvar koja se ne vidi iz formule, a važi: **apsolutne vrednosti sličnosti zavise od modela** i ne postoji univerzalna granica „iznad ove sličnosti je pokriveno". Zato ćemo posle, za pitanja bez pokrića, oslanjati se ne na prag (eng. *threshold*), nego na pravilo modelu: „ako odlomci ne sadrže odgovor — reci to otvoreno". Pragovi su korisni kao alarm, ali kao jedina odbrana su krti.


## 6. RAG: cevovod od pitanja do odgovora sa izvorom

Sada sve delove spojimo u obrazac. RAG ima dve faze koje se **ne smeju pomešati** — indeksiranje se radi jednom (ili povremeno, po promeni dokumenata), upit se radi za svako pitanje:

```text
FAZA A — INDEKSIRANJE (jednom, ili posle promene dokumenata):
  dokumenti ──► deljenje na odlomke ──► ugnežđivanje svakog ──► vektorska baza
                                                                     │
FAZA B — UPIT (za svako pitanje):                                    ▼
  pitanje ──► ugnežđivanje pitanja ──► k najbližih odlomaka ──► kontekst: [odlomci]
                                                              + pitanje ──► MODEL
                                                                              │
                                                          odgovor ◄── sa izvorom (odlomak N)
```

Tri odluke na koje ovaj crtež ne odgovara, a koje čine razliku između RAG-a koji radi i RAG-a koji oduzima veru u RAG:

1. **Koliko odlomaka u kontekst?** Radna vrednost k = 3–5. Premalo — promašiš odgovor; previše — praviš buku, pa relevantan odlomak biva „izgubljen usred konteksta" (eng. *lost in the middle*) i model ga ignoriše.
2. **Šta ide u sistemski prompt?** Pravila ponašanja sa izvorima: odgovaraj **samo** iz priloženih odlomaka; svaku tvrdnju potkrepiti navođenjem izvora; ako nema odgovora u odlomcima — reći to otvoreno. Bez ovoga, model rado „pomogne" znanjem izvan izvora, i to je najtiši način da RAG počne da izmišlja.
3. **Kako izgleda izlaz?** Odgovor + izvori („prema odlomku 3, pravilnik-rad-na-daljinu.md"). Izvor nije dekoracija: njime korisnik proverava, a vi u modulu 07 merite.

I poslednje, da ne ostane utisak da je RAG magično rešenje za sve. **Kada RAG pomaže:** znanje pisano prirodno na jeziku (pravilnici, uputstva, beleške, dokumentacija), korpus veći od kontekstnog prozora, promene retke (indeks se ne gradi za svaki poziv). **Kada RAG pravi nove probleme:** podaci zapravo struktuirani (cene, stanje zaliha — za to je SQL, ne pretraga po smislu); korpus mali (jedan dokument staje ceo u kontekst — samo ga ubacite); pretraga promašuje temeljno jer se u dokumentima piše sasvim drugačije nego što se pita (tada pomažu bolja pitanja, sinonimi u dokumentaciji, ili klasična pretraga uz RAG); i trovanje kontekstom (eng. *context poisoning*): ako u indeks uđe dokument sa pogrešnim ili protivrečnim sadržajem, agent će ga citirati sa istom sigurnošću — RAG ne razlikuje istinito od dobro napisanog (o tome moduli 05 i 09). RAG, ukratko, **ne uklanja halucinacije — preseli ih**: od „model je izmislio" do „model je verovao pogrešnom odlomku". Zato izvor i provera ostaju obavezni.

## 7. Vežbe sa pravim API-jem

Kao i u modulima 01–03: z.ai/GLM kroz OpenAI-kompatibilan interfejs, ključ samo u environment varijabli (`Z_AI_API_KEY`; opciono `Z_AI_BASE_URL`, `Z_AI_MODEL`). Za ugnežđivanje koristimo poseban model (`Z_AI_EMBED_MODEL`, podrazumevano `embedding-3`) — naziv proverite u dokumentaciji svog provajdera; kod je isti, menja se string. I dalje važi: sav kod radi sa bilo kojim provajderom koji podržava isti interfejs.

### 7.1 Priprema

```bash
# Biblioteke: klijent za API + numpy za računanje sa vektorima
pip install openai numpy

# Tri mala dokumenta za indeksiranje (namerno: pravilnici + beleške, kao u firmi)
mkdir -p sandbox
cat > sandbox/pravilnik-godisnji.md <<'EOF'
# Pravilnik o godišnjim odmorima

Zaposleni stiče pravo na godišnji odmor posle mesec dana rada. Osnovni godišnji
odmor traje najmanje 20 radnih dana. Za svaku punu godinu staža preko deset
godina dodaje se jedan dan, najviše do osam dana ukupno.

Zahtev za godišnji odmor podnosi se najmanje 30 dana unapred, preko portala
zahtevi. Zahtev mora da sadrži: ime zaposlenog, deo godišnjeg (prvi ili drugi),
broj dana i ime kolege koji preuzima obaveze za vreme odsustva.

Prvi deo godišnjeg odmora koristi se do 30. juna tekuće godine, osim uz pisanu
saglasnost rukovodioca. Neiskorišćeni dani se prenose samo na prvi kvartal
naredne godine.
EOF
cat > sandbox/pravilnik-rad-na-daljinu.md <<'EOF'
# Pravilnik o radu na daljinu

Zaposleni može da radi od kuće najviše dva dana nedeljno, uz prethodno
odobrenje neposrednog rukovodioca. Odobrenje se traži mejlom najmanje tri dana
unapred i važi jednu nedelju.

Za vreme rada na daljinu zaposleni je obavezan da odgovara na poruke u radnom
vremenu i da bude dostupan za sastanke najkasnije sat vremena po pozivu. Opremu
(laptop i monitor) obezbeđuje kompanija i vraća se po prestanku radnog odnosa.

Rad na daljinu se ne odobrava u prva tri meseca radnog odnosa i tokom
kvalifikacionog ispita.
EOF
cat > sandbox/beleske-sastanaka.md <<'EOF'
# Beleške sa sastanaka

Sastanak 14.02: dogovorena migracija baze u aprilu; novi endpoint /izvestaji
izlazi do kraja marta; Ivana vodi dokumentaciju. Rok za prvi nacrt plana
migracije je 28. februar.

Sastanak 21.02: prihvaćen predlog da se kancelarije presele u novi objekat od
juna. Budžet za obuku tima: 2000 evra po osobi za prvo polugodište. Odlučeno je
da se uvodi programerski dan — četvrtak bez sastanaka.

Sastanak 28.02: nacrt plana migracije odobren uz primedbu da nedostaje procena
rizika po korisnike. Sledeći korak: Ivana piše procenu do 7. marta.
EOF
```

Tri dokumenta, ukupno manje od dve strane — ugnežđivanje celog indeksa košta manje od jedne šoljice kafe, a mala veličina nam omogućava da **svaki** rezultat pretrage proverimo rukom.

### 7.2 Zadatak 1: deljenje na odlomke (bez mreže)

Prvi deo cevovoda je čist Python, bez ijednog poziva API-ju — namerno, da biste mogli da menjate parametre i gledate posledice odmah. Sačuvajte kao `04a_odlomci.py`:

```python
"""Vežba 4.1 — deljenje dokumenata na odlomke (chunking), bez mreže.

Ista podela radi i u velikom RAG sistemu; ovde je izdvojena u zasebnu skriptu
da biste parametre menjali i videli posledice bez poziva API-ju.
"""

import re
from pathlib import Path

MAX_ZNAKOVA = 900    # ~300-450 tokena za srpski (modul 01: ~2-3 znaka po tokenu)
PREKLAPANJE = 150    # ~17%: deo koji se ponavlja na spoju susednih odlomaka

def podeli_na_recenice(tekst: str) -> list[str]:
    """Grubo deljenje na rečenice — za vežbu sasvim dovoljno."""
    delovi = re.split(r"(?<=[.!?])\s+", tekst.strip())
    return [d.strip() for d in delovi if d.strip()]

def podeli_na_odlomke(tekst: str, max_znakova: int = MAX_ZNAKOVA,
                      preklapanje: int = PREKLAPANJE) -> list[str]:
    """Rečenice slaže u odlomke do max_znakova, sa preklapanjem na spoju."""
    odlomci: list[str] = []
    tekuci = ""
    for recenica in podeli_na_recenice(tekst):
        if tekuci and len(tekuci) + len(recenica) + 1 > max_znakova:
            odlomci.append(tekuci.strip())
            # preklapanje: poslednjih ~preklapanje znakova ide u novi odlomak
            tekuci = tekuci[-preklapanje:] + " "
        tekuci += recenica + " "
    if tekuci.strip():
        odlomci.append(tekuci.strip())
    return odlomci

def main() -> None:
    for fajl in sorted(Path("sandbox").glob("*.md")):
        tekst = fajl.read_text(encoding="utf-8")
        for i, odlomak in enumerate(podeli_na_odlomke(tekst), 1):
            print(f"{fajl.name} · odlomak {i} · {len(odlomak)} znakova")
            print(f"   početak: {odlomak[:70]}…")
            print(f"   kraj:    …{odlomak[-70:]}")
        print()

if __name__ == "__main__":
    main()
```

Pokrenite `python 04a_odlomci.py` i pročitajte izlaz: koliko odlomaka po dokumentu, gde su granice, da li je neka rečenica presečena. Zatim eksperimentišite: `MAX_ZNAKOVA = 300` (više odlomaka, cepanje činjenica), `PREKLAPANJE = 0` (šta se dešava sa rečenicom na spoju?). Ovih nekoliko minuta sa parametrima je najjeftinija lekcija o deljenju na odlomke koju ćete ikad dobiti.

### 7.3 Zadatak 2: indeks — ugnežđivanje i lokalna vektorska baza

Sada gradimo indeks: svaki odlomak → vektor, sve zajedno → `indeks.json`. Sačuvajte kao `04b_rag.py` — prvo pola (indeks), upitnu stranu dodajemo u zadatku 3:

```python
"""Vežba 4.2 — mini pretraživač nad sopstvenim dokumentima (RAG).

Korišćenje:
  python 04b_rag.py indeks                          # gradi indeks.json iz sandbox/*.md
  python 04b_rag.py pitaj "vaše pitanje"            # pretraga + odgovor sa izvorima
  python 04b_rag.py slicnost "tekst 1" "tekst 2"    # sličnost dva teksta (demo)

Environment varijable:
  Z_AI_API_KEY      — obavezno: vaš API ključ
  Z_AI_BASE_URL     — opciono: podrazumevano https://api.z.ai/api/paas/v4
  Z_AI_MODEL        — opciono: model za razgovor (podrazumevano glm-4.6)
  Z_AI_EMBED_MODEL  — opciono: model za ugnežđivanje (podrazumevano embedding-3)
"""

import json
import os
import re
import sys
from pathlib import Path

import numpy as np
from openai import OpenAI

SANDBOX = Path(__file__).parent / "sandbox"
INDEKS = Path(__file__).parent / "indeks.json"
K = 3   # koliko najbližih odlomaka ide u kontekst

# --- 1. Priprema teksta (isto kao 04a_odlomci.py) ----------------------------

def podeli_na_recenice(tekst: str) -> list[str]:
    delovi = re.split(r"(?<=[.!?])\s+", tekst.strip())
    return [d.strip() for d in delovi if d.strip()]

def podeli_na_odlomke(tekst: str, max_znakova: int = 900,
                      preklapanje: int = 150) -> list[str]:
    odlomci: list[str] = []
    tekuci = ""
    for recenica in podeli_na_recenice(tekst):
        if tekuci and len(tekuci) + len(recenica) + 1 > max_znakova:
            odlomci.append(tekuci.strip())
            tekuci = tekuci[-preklapanje:] + " "
        tekuci += recenica + " "
    if tekuci.strip():
        odlomci.append(tekuci.strip())
    return odlomci

# --- 2. Ugnežđivanje: jedini deo koji ide na mrežu ----------------------------

def ugnezdi(client, tekstovi: list[str]) -> list[np.ndarray]:
    """Tekstove prevodi u vektore (jedan poziv, ceo spisak odjednom)."""
    odgovor = client.embeddings.create(
        model=os.environ.get("Z_AI_EMBED_MODEL", "embedding-3"),
        input=tekstovi,
    )
    return [np.asarray(stavka.embedding, dtype=float) for stavka in odgovor.data]

# --- 3. Lokalna vektorska baza: jedan JSON fajl --------------------------------

def izgradi_indeks(client) -> None:
    """Faza A: dokumenti → odlomci → vektori → indeks.json."""
    fajlovi = sorted(SANDBOX.glob("*.md"))
    if not fajlovi:
        sys.exit("Nema .md fajlova u sandbox-u — pokrenite pripremu iz sekcije 7.1.")
    zapisi = []
    for fajl in fajlovi:
        for tekst_odlomka in podeli_na_odlomke(fajl.read_text(encoding="utf-8")):
            zapisi.append({"broj": len(zapisi) + 1, "izvor": fajl.name,
                           "tekst": tekst_odlomka})
    for zapis, vektor in zip(zapisi, ugnezdi(client, [z["tekst"] for z in zapisi])):
        zapis["vektor"] = vektor.tolist()
    INDEKS.write_text(json.dumps(zapisi, ensure_ascii=False), encoding="utf-8")
    print(f"Indeks: {len(zapisi)} odlomaka iz {len(fajlovi)} fajlova → {INDEKS.name}")

def ucitaj_indeks() -> list[dict]:
    if not INDEKS.exists():
        sys.exit("Nema indeks.json — prvo pokrenite: python 04b_rag.py indeks")
    zapisi = json.loads(INDEKS.read_text(encoding="utf-8"))
    for zapis in zapisi:
        zapis["vektor"] = np.asarray(zapis["vektor"], dtype=float)
    return zapisi

def main() -> None:
    if len(sys.argv) < 2 or sys.argv[1] != "indeks":
        sys.exit("Korišćenje: python 04b_rag.py indeks")
    api_key = os.environ.get("Z_AI_API_KEY", "")
    if not api_key:
        sys.exit("Nema Z_AI_API_KEY. Postavite environment varijablu pa ponovo pokrenite.")
    client = OpenAI(api_key=api_key,
                    base_url=os.environ.get("Z_AI_BASE_URL", "https://api.z.ai/api/paas/v4"))
    if sys.argv[1] == "indeks":
        izgradi_indeks(client)

if __name__ == "__main__":
    main()
```

Pokrenite `python 04b_rag.py indeks`, pa otvorite `indeks.json`: svaki zapis ima broj, izvor, tekst i — dugačku listu brojeva. To je vaša vektorska baza: nekoliko odlomaka i njihovi vektori, čitljivi i pokvareni po želji. (Za nekoliko hiljada odlomaka prešli biste na SQLite ili pravi vektorski servis — ali arhitektura ostaje ista.)

**Sanity provera (2 min):** pre upita proverite sami sebe — ugnezdite dva srodna i jedan strani par tekstova i uporedite sličnosti:

```python
# u Python konzoli (klijent i ugnezdi prekopirani iz 04b_rag.py)
import numpy as np

def slicnost(a: str, b: str) -> float:
    [va, vb] = ugnezdi(client, [a, b])
    return float(np.dot(va, vb) / (np.linalg.norm(va) * np.linalg.norm(vb)))

print(slicnost("zaposleni radi od kuće", "rad na daljinu je odobren"))    # očekujte: visoko
print(slicnost("zaposleni radi od kuće", "godišnji odmor traje 20 dana"))  # očekujte: niže
```

Napomena o vrednostima: apsolutne vrednosti zavise od modela i dužine teksta, pa **ne tražite univerzalnu granicu** — zato se za „nema pokrića" oslanjamo na ponašanje modela, a ne na prag. Ovo je sanity provera, ne test.

### 7.4 Zadatak 3: upit — pretraga i odgovor sa izvorom

Dopunite `04b_rag.py` pretragom i odgovaranjem (faza B). Dodajte pre `main()`:

```python
# --- 4. Pretraga po sličnosti --------------------------------------------------

def kosinuska_slicnost(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def trazi(client, pitanje: str, zapisi: list[dict], k: int = K) -> list[tuple]:
    """Vraća k najbližih odlomaka kao spisak (zapis, sličnost), opadajuće."""
    [vektor_pitanja] = ugnezdi(client, [pitanje])
    ocenjeni = [(zapis, kosinuska_slicnost(vektor_pitanja, zapis["vektor"]))
                for zapis in zapisi]
    ocenjeni.sort(key=lambda par: par[1], reverse=True)
    return ocenjeni[:k]

# --- 5. Odgovor sa izvorom -------------------------------------------------------

SYSTEM_PROMPT = (
    "Ti si asistent koji odgovara ISKLJUČIVO iz priloženih odlomaka dokumenata. "
    "Pravila: (1) svaku tvrdnju potkrepljuješ izvorom u zagradi, npr. "
    "(odlomak 3, pravilnik-rad-na-daljinu.md); (2) ako odlomci ne sadrže "
    "odgovor, odgovoriš tačno: 'U dokumentima nema odgovora na to pitanje.' "
    "i ništa ne nagađaš; (3) ne spajaš svoje znanje sa odlomcima."
)

def odgovori(client, pitanje: str) -> None:
    zapisi = ucitaj_indeks()
    nadjeni = trazi(client, pitanje, zapisi)
    for zapis, s in nadjeni:                      # trag pretrage: vidimo šta je nađeno
        print(f"[pretraga] {s:.3f} · odlomak {zapis['broj']} ({zapis['izvor']})")
    kontekst = "\n\n".join(f"[odlomak {z['broj']}] ({z['izvor']})\n{z['tekst']}"
                           for z, _ in nadjeni)
    poruke = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user",
         "content": f"Odlomci dokumenata:\n\n{kontekst}\n\nPitanje: {pitanje}"},
    ]
    odgovor = client.chat.completions.create(
        model=os.environ.get("Z_AI_MODEL", "glm-4.6"),
        messages=poruke, temperature=0.1,
    )
    print("\n" + (odgovor.choices[0].message.content or ""))

def slicnost_demo(client, tekst1: str, tekst2: str) -> None:
    [a, b] = ugnezdi(client, [tekst1, tekst2])
    print(f"kosinusna sličnost: {kosinuska_slicnost(a, b):.3f}")
```

I zamenite `main()` kompletno (sada nosi sve tri komande):

```python
def main() -> None:
    if len(sys.argv) < 2 or sys.argv[1] not in {"indeks", "pitaj", "slicnost"}:
        sys.exit('Korišćenje: python 04b_rag.py indeks | pitaj "pitanje" | slicnost "t1" "t2"')
    api_key = os.environ.get("Z_AI_API_KEY", "")
    if not api_key:
        sys.exit("Nema Z_AI_API_KEY. Postavite environment varijablu pa ponovo pokrenite.")
    client = OpenAI(api_key=api_key,
                    base_url=os.environ.get("Z_AI_BASE_URL", "https://api.z.ai/api/paas/v4"))

    if sys.argv[1] == "indeks":
        izgradi_indeks(client)
    elif sys.argv[1] == "pitaj":
        if len(sys.argv) < 3:
            sys.exit('Oblik: python 04b_rag.py pitaj "vaše pitanje"')
        odgovori(client, " ".join(sys.argv[2:]))
    else:
        if len(sys.argv) < 4:
            sys.exit('Oblik: python 04b_rag.py slicnost "tekst 1" "tekst 2"')
        slicnost_demo(client, sys.argv[2], sys.argv[3])
```

Probajte — počnite od pitanja koje koristi **druge reči nego dokument**:

```bash
python 04b_rag.py pitaj "Gde sve zaposleni sme da radi umesto u kancelariji?"
python 04b_rag.py pitaj "Koliko dana unapred se podnosi zahtev za godišnji odmor?"
python 04b_rag.py pitaj "Koliki je budžet za obuku tima?"
```

Šta da primetite:

- prvo pitanje nema zajedničkih reči sa dokumentom („kancelarija", „sme" vs „rad na daljinu") — a pretraga po smislu ga je našla. To je cela poenta ugnežđivanja, uživo;
- svaki odgovor nosi izvor — proverite ga: otvorite `indeks.json`, nađite odlomak pod tim brojem i pročitajte. Jedan odgovor proveren rukom vredi više od deset pročitanih;
- redovi `[pretraga] ... s .3f ...` su vaš prozor u fazu B: vidite šta je nađeno i sa kojom sličnošću, **pre** nego što model odgovori. Kada RAG kasnije „laže", prvo mesto provere je ovde.

### 7.5 Zadatak 4: stres test — pitanja bez pokrića

Sada namerno pitajte ono što u dokumentima **nema**:

```bash
python 04b_rag.py pitaj "Koja je satnica kantine u objektu?"
python 04b_rag.py pitaj "Kolika je cena pretplate na teretanu?"
```

Pretraga će i dalje vratiti tri „najbliža" odlomka — uvek vraća tri, jer ne zna za „nema". Odatle sve zavisi od pravila u sistemskom promptu: dobar ishod je otvoreno „U dokumentima nema odgovora na to pitanje." Loš ishod je samouvereno nagađanje iz najbližeg odlomka („kantina se pominje uz sastanke, radi..."). Ako se to desi: (1) pogledajte `[pretraga]` redove — je li sličnost bila niska? (2) ojačajte pravilo 2 u promptu; (3) probajte `temperature=0.0`. Zapišite kakav je bio prvi ishod — to je vaš prvi podatak o granicama sopstvenog sistema.

A onda jedan pogled na grešku dizajna: pitajte „Šta sve mora da stoji u zahtevu za godišnji odmor?" i pronađite odlomak koji sadrži odgovor. Da li je rečenica o sadržaju zahteva cela u jednom odlomku, ili je pala na spoj? Ako jeste na spoju — preklapanje je tu da je spasi; proverite da li postoji u dva susedna odlomka.

### 7.6 Zadatak 5 (domaći): RAG kao alat agenta, i prvi evaluacioni skup

1. **Vratite agenta.** U petlju agenta iz modula 03 dodajte alat `trazi_u_dokumentima(pitanje)` koji poziva `trazi(...)` iz ovog modula i vraća odlomke kao tekst. Agent sada sam odlučuje kada da pretražuje — pitanje korisnika ne mora direktno da bude upit pretrage. Posmatrajte trag: da li agent pretražuje jednom, više puta, sa dobrim pitanjem?
2. **Prvi evaluacioni skup.** Napravite fajl `eval.md` sa 10 pitanja o vaša tri dokumenta: 7 sa odgovorom u dokumentima, 3 bez. Za svako zapišite ishod: tačan sa ispravnim izvorom / tačan bez izvora / izmišljen / odbijen („nema odgovora") a trebalo je odgovoriti. To je najava modula 07 — prvi put merimo sistem, ne osećaj.
3. **Eksperiment sa veličinom odlomaka:** ponovo izgradite indeks sa `max_znakova=300` i `max_znakova=1200` i prođite kroz istih 10 pitanja. Da li se promenio broj promašaja pretrage? Napravite malu tabelu: veličina odlomka × ishodi. Zaključak upišite u svoj dnevnik vežbi.
4. **Za napredne:** dodajte `slicnost` prag kao *upozorenje* korisniku („pretraga nije sigurna: najbolja sličnost 0,21") — ali ne kao jedinu odbranu. Zašto je upozorenje bolje od automatskog odbijanja?

## 8. Tipične greške u RAG-u — i dijagnoza

Kada asistent sa RAG-om pogreši, uzrok je skoro uvek jedan od ovih pet:

| Simptom | Uzrok | Lek |
|---|---|---|
| Odgovor tačan, ali bez izvora | sistemski prompt ne zahteva izvor | pravilo 1: „svaka tvrdnja sa (odlomak N)" |
| Model izmišlja iako pokrivenost postoji | pretraga vratila pogrešne odlomke | proverite `[pretraga]` redove; povećajte k; parafrazirajte pitanje |
| Nađen srodan ali pogrešan odlomak (tema ista, odgovora nema) | preklapanje tema u korpusu | manji odlomci; izdvojite pravila u zasebne dokumente |
| „Nema odgovora" iako odgovor postoji | pitanje i dokument govore različitim rečima o istom | sinonimi u dokumentima; kombinujte sa pretragom po ključnim rečima |
| Odgovor navodi pola činjenice | granica odlomka presekla rečenicu | preklapanje; sečenje po rečenici/pasusu |

Redosled provere pri dijagnostici: **pretraga (šta je nađeno) → sistemski prompt (kako se ponaša sa nađenim) → indeks (da li je još uvek aktuelan) → tek onda model.** Najskuplja greška je pretpostavka „model glupi", kad je zapravo pretraga donela pogrešne odlomke.

## 9. Pitanja za samoproveru

1. Nabrojite tri vrste memorije agenta, gde svaka „živi" i koje je ograničenje svake.
2. Zašto istorija razgovora košta sve više kako agent radi duže, i šta tačno sažimanje menja u toj računici? Šta se time gubi?
3. Zašto pretraga po ključnim rečima pada na pitanju „gde sme da radi izvan kancelarije" nad dokumentom o „radu na daljinu"? Šta ugnežđivanje reprezentacija menja?
4. Šta meri kosinusna sličnost i zašto se vektori iz dva različita modela ne smeju mešati?
5. Zašto se dokumenti dele na odlomke pre ugnežđivanja? Šta određuje koliko preklapanja treba?
6. Nacrtajte obe faze RAG cevovoda iz sekcije 6 i objasnite zašto se indeks gradi odvojeno od upita.
7. Nabrojite tri situacije u kojima RAG nije pravo rešenje, i šta je umesto njega. Zašto kažemo da RAG „preseli" halucinacije umesto da ih ukloni?

## Šta sledi

Indeks je sagrađen — ali sada imate novi resurs za trošenje: kontekst u koji se nađeni odlomci ubacuju. [**Modul 05 — Inženjering konteksta**](modul-05-inzenjering-konteksta.md) preuzima gde smo stali: kontekst kao najskuplji resurs agenta — šta ulazi u prozor, šta se sažima i kada, kompaktni formati, prioritet informacija i prepoznavanje trovanja kontekstom. Uživo, materijal ovog modula možete odrađivati na [radionici 04](../radionice/radionica-04-rag-memorija.md). 🚀
