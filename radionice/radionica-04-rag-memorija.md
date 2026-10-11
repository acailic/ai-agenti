# Radionica 04 — Memorija i RAG: agent koji zna vaše dokumente

> **Povezani modul:** [modul 04 — Memorija i RAG](../moduli/modul-04-memorija-i-rag.md) (preporučeno pročitati sekcije 1–6 pre radionice)
> **Trajanje:** 4 časa · **Format:** predavanje 25% / vežbe 75% · **Nivo: srednji**

## Cilj radionice

Učesnici grade mini pretraživač nad sopstvenim dokumentima — kompletan RAG cevovod, komad po komad: deljenje teksta na odlomke (eng. *chunking*), ugnežđene reprezentacije (eng. *embeddings*), lokalna vektorska baza (eng. *vector database*), pretraga po sličnosti i odgovor sa navođenjem izvora. Pa onda i granice: šta se desi kada dokumenti nemaju odgovor — i kada se dva dokumenta protivre. Poruka radionice koju ponavljamo do kraja: **RAG nije čarobnjaštvo, cevovod je** — i svaki deo cevovoda se može pogledati, izmeriti i pokvariti (u vežbi 4, namerno).

## Agenda po satima

| Sat | Sadržaj |
|---|---|
| **1. sat** | Zašto „model ne zna" naše stvari: stateless model, kontekst kao novčanik (15 min). Ugnežđene reprezentacije — intuicija: slično značenje = blizu u prostoru brojeva; demo sličnosti na parovima rečenica (30 min). Arhitektura RAG na crtežu: indeksiranje (jednom) vs. upit (svaki put) — zašto se faze ne smeju pomešati (15 min). |
| **2. sat** | Vežba 1: deljenje teksta na odlomke — veličina, preklapanje, granice rečenice; eksperiment sa parametrima (30 min). Vežba 2: ugnežđivanje odlomaka i čuvanje u lokalnu vektorsku bazu (indeks.json); sanity provera sličnosti (30 min). |
| **3. sat** | Vežba 3: pretraga po sličnosti za pitanje korisnika + slaganje prompta sa nađenim odlomcima + odgovor sa izvorom (50 min). Kratko: zašto je izvor obavezan — provera, poverenje, evaluacija (10 min). |
| **4. sat** | Vežba 4: granice — pitanja bez pokrića; pokvareni dokument sa protivrečnim stavkama (30 min). Diskusija: RAG nije rešenje za sve — memorija, sažimanje, klasična baza; najava modula 05 (20 min). Zatvaranje i domaći (10 min). |

## Priprema pre radionice (učesnici)

Odrađene [radionice 01](radionica-01-prvi-koraci.md) i [02](radionica-02-alati-i-tool-use.md) (ili barem moduli 01–02), ključ i dalje samo u environment varijabli `Z_AI_API_KEY`. Zatim:

```bash
pip install openai numpy

# Tri mala dokumenta za indeksiranje (isti set kao u modulu 04)
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

**Važna napomena o planu:** za ovu radionicu treba i pristup modelu za ugnežđivanje (embedding endpoint) — kod z.ai/GLM to je `embedding-3`; ako vaš plan ili provajder koristi drugi naziv, postavite environment varijablu `Z_AI_EMBED_MODEL` (kod čita odatle). Ceo indeks ove radionice košta manje od šoljice kafe — nema razloga za uštedu.

---

## Vežba 1 — Deljenje teksta na odlomke (30 min)

**Zadatak:** napišite funkciju `podeli_na_odlomke(tekst, max_znakova, preklapanje)` koja seče tekst po rečenicama i slaže odlomke do zadate dužine, sa preklapanjem na spoju. Zatim pogledajte šta je dobila na sva tri dokumenta.

**Rešenje** — sačuvajte kao `r04_v1_odlomci.py` (bez mreže — čist Python):

```python
"""Radionica 04, vežba 1 — deljenje dokumenata na odlomke (bez mreže)."""

import re
from pathlib import Path

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
            tekuci = tekuci[-preklapanje:] + " "     # preklapanje na spoju
        tekuci += recenica + " "
    if tekuci.strip():
        odlomci.append(tekuci.strip())
    return odlomci

def main() -> None:
    for fajl in sorted(Path("sandbox").glob("*.md")):
        tekst = fajl.read_text(encoding="utf-8")
        print(f"== {fajl.name} ==")
        for max_znakova in (300, 900, 1500):
            n = len(podeli_na_odlomke(tekst, max_znakova))
            print(f"   max {max_znakova:4d} znakova → {n} odlomaka")
        for i, odlomak in enumerate(podeli_na_odlomke(tekst), 1):
            print(f"   odlomak {i} · {len(odlomak)} znakova · početak: {odlomak[:60]}…")

if __name__ == "__main__":
    main()
```

**Tri tačke koje na ovoj vežbi moraju da „sednu":** (1) manji odlomci = više ih je, i pretraga kasnije gađa uži met, ali se činjenice lakše preseku; (2) preklapanje spašava rečenicu koja padne na spoj — nađite u izlazu odlomak čiji početak ponavlja kraj prethodnog; (3) granice seku po rečenici, jer struktura dokumenta već jeste podela na teme koje je napisao čovek.

## Vežba 2 — Indeks: ugnežđivanje i lokalna vektorska baza (40 min)

**Zadatak:** za svaki odlomak izračunajte ugnežđenu reprezentaciju pozivom API-ja, pa sve (broj, izvor, tekst, vektor) sačuvajte u `indeks.json` — to je vaša vektorska baza. Na kraju, sanity provera: dva srodna teksta moraju imati veću kosinusnu sličnost nego srodan i stran.

**Rešenje** — sačuvajte kao `r04_v2_indeks.py`:

```python
"""Radionica 04, vežba 2 — indeks: odlomci → vektori → indeks.json.

  Z_AI_API_KEY      — obavezno: vaš API ključ
  Z_AI_BASE_URL     — opciono: podrazumevano https://api.z.ai/api/paas/v4
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

def podeli_na_odlomke(tekst: str, max_znakova: int = 900,
                      preklapanje: int = 150) -> list[str]:
    delovi = re.split(r"(?<=[.!?])\s+", tekst.strip())
    recenice = [d.strip() for d in delovi if d.strip()]
    odlomci, tekuci = [], ""
    for recenica in recenice:
        if tekuci and len(tekuci) + len(recenica) + 1 > max_znakova:
            odlomci.append(tekuci.strip())
            tekuci = tekuci[-preklapanje:] + " "
        tekuci += recenica + " "
    if tekuci.strip():
        odlomci.append(tekuci.strip())
    return odlomci

def ugnezdi(client, tekstovi: list[str]) -> list[np.ndarray]:
    """Tekstove prevodi u vektore — jedini poziv ka mreži u ovoj vežbi."""
    odgovor = client.embeddings.create(
        model=os.environ.get("Z_AI_EMBED_MODEL", "embedding-3"),
        input=tekstovi,
    )
    return [np.asarray(stavka.embedding, dtype=float) for stavka in odgovor.data]

def kosinuska_slicnost(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

def main() -> None:
    api_key = os.environ.get("Z_AI_API_KEY", "")
    if not api_key:
        sys.exit("Nema Z_AI_API_KEY. Postavite environment varijablu pa ponovo pokrenite.")
    client = OpenAI(api_key=api_key,
                    base_url=os.environ.get("Z_AI_BASE_URL", "https://api.z.ai/api/paas/v4"))

    fajlovi = sorted(SANDBOX.glob("*.md"))
    if not fajlovi:
        sys.exit("Nema .md fajlova u sandbox-u — pokrenite pripremu iz radionice.")
    zapisi = []
    for fajl in fajlovi:
        for tekst_odlomka in podeli_na_odlomke(fajl.read_text(encoding="utf-8")):
            zapisi.append({"broj": len(zapisi) + 1, "izvor": fajl.name,
                           "tekst": tekst_odlomka})
    for zapis, vektor in zip(zapisi, ugnezdi(client, [z["tekst"] for z in zapisi])):
        zapis["vektor"] = vektor.tolist()
    INDEKS.write_text(json.dumps(zapisi, ensure_ascii=False), encoding="utf-8")
    print(f"Indeks: {len(zapisi)} odlomaka iz {len(fajlovi)} fajlova → indeks.json")

    # sanity provera: srodni par vs. strani par
    [a, b, c] = ugnezdi(client, ["zaposleni radi od kuće",
                                 "rad na daljinu je odobren",
                                 "godišnji odmor traje 20 dana"])
    print(f"sličnost (srodan par):    {kosinuska_slicnost(a, b):.3f}")
    print(f"sličnost (strani par):    {kosinuska_slicnost(a, c):.3f}")

if __name__ == "__main__":
    main()
```

**Provere za voditelja (i učesnike):** otvoriti `indeks.json` i naći jedan zapis — broj, izvor, tekst, i dugačka lista brojeva: *to* je vektorska baza, nema misterije. Sanity provera treba da pokaže srodni par iznad stranog — ali apsolutne vrednosti zavise od modela, pa se „granica pokrivenosti" ne traži na brojevima (odbranu radimo ponašanjem modela, u vežbi 4).

Najčešći kvar na ovom koraku: poruka API-ja „model not found" za embedding — proveriti naziv modela u `Z_AI_EMBED_MODEL`; drugi kvar: pojedinačni pozivi ugnežđivanja u petlji (radi, ali je sporije i skuplje — `input=` prima ceo spisak odjednom).

## Vežba 3 — Upit: pretraga po sličnosti i odgovor sa izvorom (50 min)

**Zadatak:** za pitanje korisnika: ugnjezdite pitanje, nađite tri najbliža odlomka kosinusnom sličnošću, slažite ih u kontekst sa brojevima i izvorima, pa tražite odgovor sa obaveznim navođenjem izvora. Ispišite trag pretrage pre odgovora.

**Rešenje** — sačuvajte kao `r04_v3_rag.py`. Skripta koristi indeks i funkcije iz vežbe 2 (datoteka `r04_v2_indeks.py` mora postojati pored nje — prva prilika da se vidi zašto se cevovod gradi u slojevima):

```python
"""Radionica 04, vežba 3 — upit: pitanje → pretraga → kontekst → odgovor.

  Z_AI_API_KEY      — obavezno: vaš API ključ
  Z_AI_BASE_URL     — opciono: podrazumevano https://api.z.ai/api/paas/v4
  Z_AI_MODEL        — opciono: model za razgovor (podrazumevano glm-4.6)
  Z_AI_EMBED_MODEL  — opciono: model za ugnežđivanje (podrazumevano embedding-3)

Koristi indeks i funkcije iz vežbe 2 (r04_v2_indeks.py).
"""

import json
import os
import sys

import numpy as np

from r04_v2_indeks import INDEKS, OpenAI, ugnezdi, kosinuska_slicnost

K = 3   # koliko najbližih odlomaka ide u kontekst

SYSTEM_PROMPT = (
    "Ti si asistent koji odgovara ISKLJUČIVO iz priloženih odlomaka dokumenata. "
    "Pravila: (1) svaku tvrdnju potkrepljuješ izvorom u zagradi, npr. "
    "(odlomak 3, pravilnik-rad-na-daljinu.md); (2) ako odlomci ne sadrže "
    "odgovor, odgovoriš tačno: 'U dokumentima nema odgovora na to pitanje.' "
    "i ništa ne nagađaš; (3) ne spajaš svoje znanje sa odlomcima."
)

def ucitaj_indeks() -> list[dict]:
    if not INDEKS.exists():
        sys.exit("Nema indeks.json — prvo pokrenite r04_v2_indeks.py")
    zapisi = json.loads(INDEKS.read_text(encoding="utf-8"))
    for zapis in zapisi:
        zapis["vektor"] = np.asarray(zapis["vektor"], dtype=float)
    return zapisi

def trazi(client, pitanje: str, zapisi: list[dict], k: int = K) -> list[tuple]:
    """Vraća k najbližih odlomaka kao spisak (zapis, sličnost), opadajuće."""
    [vektor_pitanja] = ugnezdi(client, [pitanje])
    ocenjeni = [(zapis, kosinuska_slicnost(vektor_pitanja, zapis["vektor"]))
                for zapis in zapisi]
    ocenjeni.sort(key=lambda par: par[1], reverse=True)
    return ocenjeni[:k]

def odgovori(client, pitanje: str) -> None:
    zapisi = ucitaj_indeks()
    nadjeni = trazi(client, pitanje, zapisi)
    for zapis, s in nadjeni:                       # trag pretrage — čita se prvi
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

def main() -> None:
    api_key = os.environ.get("Z_AI_API_KEY", "")
    if not api_key:
        sys.exit("Nema Z_AI_API_KEY. Postavite environment varijablu pa ponovo pokrenite.")
    client = OpenAI(api_key=api_key,
                    base_url=os.environ.get("Z_AI_BASE_URL", "https://api.z.ai/api/paas/v4"))
    pitanje = " ".join(sys.argv[1:]) or "Gde sve zaposleni sme da radi umesto u kancelariji?"
    odgovori(client, pitanje)

if __name__ == "__main__":
    main()
```

**Provere:**

```bash
python r04_v3_rag.py                                # pitanje BEZ zajedničkih reči sa dokumentima
python r04_v3_rag.py "Koliko dana unapred se podnosi zahtev za godišnji odmor?"
python r04_v3_rag.py "Koliki je budžet za obuku tima?"
python r04_v3_rag.py "Ko sve mora da potpiše zahtev za godišnji?"   # nema u dokumentima
```

Prvo pitanje je srce vežbe: nijedna reč se ne poklapa sa pravilnikom („kancelarija", „sme" naspram „rad na daljinu"), a pretraga po smislu ga nalazi. Poslednje pitanje je prva granica — o tome vežba 4. Za svaki odgovor: proveriti izvor ručno, u `indeks.json` — jedan odgovor proveren rukom vredi više od deset pročitanih.

## Vežba 4 — Granice: bez pokrića i protivrečnosti (30 min)

**Zadatak A — pitanja bez pokrića.** Pokrenite rešenje vežbe 3 na pitanjima kojih u dokumentima nema:

```bash
python r04_v3_rag.py "Koja je satnica kantine u objektu?"
python r04_v3_rag.py "Kolika je cena pretplate na teretanu?"
```

Pretraga uvek vraća tri odlomka — nikad ne zna za „nema". Ishod zavisi od pravila u sistemskom promptu: dobar je otvoreno „U dokumentima nema odgovora na to pitanje.", loš je samouvereno nagađanje iz najbližeg odlomka. Ako se desi loše: ojačati pravilo (2), spustiti temperaturu, i pogledati `[pretraga]` redove — da li su sličnosti bile niske?

**Zadatak B — pokvareni dokument (protivrečnosti).** Dodajte u sandbox fajl koji protivreči pravilniku:

```bash
cat > sandbox/dodatak-ispravka.md <<'EOF'
# Ispravka pravilnika (interno, radna verzija)

Odobrenje za rad na daljinu traži se dan unapred, a ne tri dana. Rad na daljinu
se odobrava do tri dana nedeljno, po diskreciji rukovodioca.
EOF
python r04_v2_indeks.py        # ponovna izgradnja indeksa — promena dokumenata!
python r04_v3_rag.py "Koliko dana unapred se traži odobrenje za rad na daljinu?"
```

Posmatrajte šta model radi sa **dve istinite po formi, a protivrečne informacije**: da li je uopšte primetio protivrečnost, koja „pobedjuje", da li navodi oba izvora? Ovo je najvažniji trenutak radionice: RAG ne razrešava protivrečnosti — on ih samo prenosi. Rešenje nije u modelu nego u podacima: verzije, datumi izmena, jasno vlasništvo nad izvorom (a o „kojem dokumentu se sme živeti u kontekstu" — modul 05, trovanje kontekstom).

**Tabela dijagnoze (rešenje za tablu):**

| Simptom | Prvo proveriti | Tipičan lek |
|---|---|---|
| Odgovor bez izvora | sistemski prompt (pravilo 1) | zahtevati „(odlomak N)" uz svaku tvrdnju |
| Izmišlja iako pokrivenost postoji | `[pretraga]` redove | k = 3–5, parafraza pitanja |
| Nađen srodan ali pogrešan odlomak | preklapanje tema u korpusu | manji odlomci, razdvojiti dokumente |
| „Nema odgovora" a odgovor postoji | reči pitanja vs. reči dokumenta | sinonimi, pretraga po ključnim rečima uz RAG |
| Dva izvora se protivre | sadržaj indeksa | verzije/datumi; čistoća korpusa (modul 05) |

## Domaći

- Ugraditi RAG u agenta iz radionice 03 kao alat `trazi_u_dokumentima(pitanje)` — agent sam odlučuje kada da pretražuje; pratiti trag: da li je njegovo interno pitanje pretrage dobro kao korisničko?
- Napraviti `eval.md` sa 10 pitanja (7 sa odgovorom, 3 bez) i upisati ishode: tačan sa izvorom / tačan bez izvora / izmišljen / pogrešno odbijen — prvi evaluacioni skup (najava modula 07).
- Za napredne: ponovo izgraditi indeks sa odlomcima od 300 i 1.200 znakova, proći istih 10 pitanja, uporediti promašaje pretrage; zapisati zaključak u dnevnik vežbi.
- Pripremiti jedno pitanje o granicama RAG-a za početak [radionice 05](radionica-05-evaluacija.md).

## Materijali — checklist za učesnike

- [ ] odrađene radionice 01–02 (ili moduli 01–02: poziv API-ju iz Pythona, environment varijable);
- [ ] pročitan [modul 04](../moduli/modul-04-memorija-i-rag.md), barem sekcije 1–6 (radionica ide istim redom);
- [ ] Python 3.10+, `openai` i `numpy` instalirani, `Z_AI_API_KEY` postavljen;
- [ ] API plan koji podržava ugnežđivanje (embedding endpoint; kod z.ai/GLM podrazumevamo `embedding-3`, drugačiji naziv → `Z_AI_EMBED_MODEL`);
- [ ] tri dokumenta iz sekcije „Priprema" u `sandbox/` (može i sopstveni dokument od 5+ strana ko umesto toga — pravilnik, uputstvo, diplomski 🙂);
- [ ] slobodnih ~200 MB i, kao i uvek, živaca za eksperimentisanje. 🙂

## Za voditelja

- Cilj radionice je *razumevanje cevovoda*, ne brzina: namerno koristimo „glupu" lokalnu bazu (jedan JSON) umesto gotovog servisa, da se svaki korak vidi. Ubrzanje: SQLite/npz za hiljade odlomaka — pomenuti, ne graditi.
- Isplanirati 2. sat pažljivo: prvi poziv ugnežđivanja je trenutak kada svi gledaju poruke o greškama. Najčešći kvarovi: naziv embedding modela ne važi za plan („model not found") i environment varijabla postavljena u drugom terminalu.
- Za vežbu 4B pripremiti „pokvareni" dokument unapred (protivrečne stavke) — granice se najbolje uče na primeru koji pukne načas. Diskusija posle: šta je izvor istine u firmi, i zašto RAG to nije.
- Ako grupa zaostaje: vežbu 1 skratiti na pokretanje i čitanje izlaza (podela je data), vežbu 4 svesti na zadatak A. Ne skraćivati vežbu 3 — ona je srce radionice.
- Poruka koju ponoviti na kraju: **pretraga po smislu menja reči, ne istinu** — izvor ostaje obavezan, i kad je sistem savršen.
