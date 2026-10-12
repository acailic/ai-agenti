# Kanali za objavu kursa — istraživanje

> Podaci u ovom fajlu su provereni direktnim pristupom (HTTP status ili indeksirani sadržaj pravila) u vreme pisanja. Svaki kanal ima link, pravilo objave i napomenu kako ga koristiti. Placeholdere (`[...]`) popunjava autor pre objave.

Repozitorijum kursa: https://github.com/acailic/ai-agenti-srb · Sajt kursa (kada bude objavljen): `[sajt kursa]` · Kontakt: `[ime i prezime] · [email] · [telefon] · [LinkedIn]`

## Sažetak: gde objaviti, a gde ne

| Kanal | Tip | Da li objaviti | Zašto |
|---|---|---|---|
| [LinkedIn (lični profil)](#linkedin) | profesionalna mreža | **da — glavni kanal** | objava sa ličnog profila; politika dozvoljava originalan, relevantan sadržaj |
| [r/AskSerbia](#raskserbia) | Reddit | **da** | namenjen pitanjima; question-first stil prirodno leži |
| [r/serbia](#rserbia) | Reddit | pažljivo | pitanja se preusmeravaju na r/AskSerbia; čitati pravila pre objave |
| [r/AskBalkans](#raskbalkans) | Reddit | da | regionalna zajednica, sličan question-first pristup |
| [Startit](#startit) | medijski portal | pitch redakciji | pokrivaju AI teme; nema otvorenog formulara — kontakt preko redakcije |
| [JS Belgrade, DevOps Belgrade, PyData/Python Beograd](#meetup-zajednice) | meetup zajednice | preko događaja | najbolje kao kratko predstavljanje (lightning talk), ne kao „objava" |
| [elitesecurity.org](#elitesecurityorg) | forum | **ne za objavu** | član 15 pravilnika izričito zabranjuje reklamiranje |
| devops.rs, heapspace.net | — | **ne** | provereno: prazan/parking domen, odnosno nedostupan sajt |

## Kanali

### LinkedIn

- **Link:** https://www.linkedin.com/ (objava sa ličnog profila autora)
- **Pravilo objave:** LinkedIn „Professional Community Policies" (https://www.linkedin.com/legal/professional-community-policies) zabranjuju „untargeted, irrelevant, obviously unwanted, unauthorized, inappropriate commercial or promotional" poruke i traže „original, professional, relevant, and interesting" sadržaj. Objava koja priča ličnu priču autora i deli besplatan, javno licenciran materijal je unutar politike; čista prodaja radionice kao plaćeni oglas ide odvojeno (LinkedIn ads), ne kao organska objava.
- **Kako koristiti:** objava sa ličnog profila (ne sa stranice kompanije — lični profili imaju veći organski doseg), 5–8 rečenica, link na repozitorijum i `[sajt kursa]`. Radionica se pominje kao jedna rečenica na kraju, bez cene. Draft: [objava-linkedin.md](objava-linkedin.md).

### r/AskSerbia

- **Link:** https://www.reddit.com/r/AskSerbia/ (HTTP 200 u vreme provere)
- **Pravilo objave:** podredit je otvoren za pitanja; pitanja o drugim podreditima r/serbia preusmeravaju ovamo (najava moderatora r/serbia: „preusmeravanje istih na novootvorenu zajednicu /r/AskSerbia"). Reddit-ova opšta kultura: samopromocija bez učešća u diskusiji se loše prima — objava mora da otvori diskusiju, ne samo da izbaci link.
- **Kako koristiti:** question-first objava — pravo pitanje zajednici, pa repozitorijum kao kontekst odgovora. Draft: [objava-reddit.md](objava-reddit.md).

### r/serbia

- **Link:** https://www.reddit.com/r/serbia/ — najveća srpska zajednica na Redditu; pravila su u wikiju: https://www.reddit.com/r/serbia/wiki/rules-srp/ (srpski) i https://www.reddit.com/r/serbia/wiki/rules-eng/ (engleski)
- **Pravilo objave:** wik pravila postoje i važe („moderatori zadržavaju pravo da intervenišu izvan njih"); kraća i često postavljana pitanja se preusmeravaju na r/AskSerbia; brigadiranje i meta-komentarisanje o drugim podreditima je zabranjeno. Pre objave obavezno pročitati aktuelni wik — pravila se menjaju (postoji i arhiva starih pravila: `/wiki/rules-srp/oldrules`).
- **Kako koristiti:** samo ako tema prirodno otvara diskusiju („kako učite o AI agentima na srpskom?"), i po mogućstvu prvo proći kroz r/AskSerbia varijantu. Bez „objavio sam kurs" tona.

### r/AskBalkans

- **Link:** https://www.reddit.com/r/AskBalkans/ (HTTP 200 u vreme provere)
- **Pravilo objave:** regionalni podredit za pitanja; engleski je uobičajen, ali srpski/hrvatski/bosanski nisu retkost. Isti princip: pitanje prvo, resurs drugi.
- **Kako koristiti:** varijanta istog question-first drafta, na engleskom ili srpskom; naglasiti da je materijal na srpskom — to je upravo ono što pitanje čini zanimljivim za region.

### Startit

- **Link:** https://startit.rs/ (HTTP 200; portal „Preduzetništvo i tehnologija")
- **Pravilo objave:** nema otvorenog formulara za objave — Startit je redakcija koja pokriva tehnološke vesti i konkretno ima aktivno AI izveštavanje (rubrika AI Hub, besplatni AI događaji za IT zajednicu). Put je predlog priče redakciji (kontakt na sajtu), ne samoobjava.
- **Kako koristiti:** kratki pitch: „srpski developer je napisao kompletan kurs o AI agentima na srpskom, CC BY, besplatan" — priča o projektu, ne oglas. Poslati kad kurs već ima par zvezdica/doprinositelja (dokaz da je živ).

### Meetup zajednice

- **Linkovi:** JS Belgrade — https://www.meetup.com/jsbelgrade/ i https://jsbelgrade.org/ · DevOps Belgrade — https://www.meetup.com/devops-belgrade/ · PyData Belgrade — https://www.meetup.com/PyData-Belgrade/ · Belgrade Python Meetup — https://www.meetup.com/belgrade-python-meetup/ (svi HTTP 200 u vreme provere)
- **Pravilo objave:** to su zajednice okupljene oko događaja, ne oglasne table. Kratko predstavljanje materijala ima smisla u okviru događaja (lightning talk od 5 minuta o „agentu od nule") ili u prepisci sa organizatorima oko predloga teme.
- **Kako koristiti:** poslati predlog teme organizatorima (radionice 03 i 05 kursa su spremne kao materijal za predavanje); materijal je CC BY 4.0 pa ga zajednice mogu slobodno koristiti.

### elitesecurity.org

- **Link:** https://www.elitesecurity.org/ (HTTP 200; dugogodišnji srpski IT forum)
- **Pravilo objave:** član 15 pravilnika (https://www.elitesecurity.org/o/pravilnik/korisnici): „Reklamiranje je zabranjeno. Forum nije mesto za besplatno reklamiranje Vašeg posla, sajta, firme, ili bilo čega što moderatori ocene kao očiglednu zloupotrebu foruma za besplatno oglašavanje."
- **Kako koristiti:** **ne objavljivati lansirnu objavu.** Jedina prihvatljiva upotreba: ako neko u postojećoj temi traži materijal za učenje na srpskom, odgovoriti sa linkom kao deo normalnog odgovora — i to samo ako je odgovor stvarno koristan u kontekstu teme.

## Provereno a nedostupno (ne gubiti vreme)

- **devops.rs** — domen postoji, ali sadrži samo prazan direktorijum (parking). Nije zajednica.
- **heapspace.net** — sajt nedostupan u vreme provere. Preskočiti.

## Redosled objave (predlog)

1. LinkedIn objava — istog dana kad i `[sajt kursa]` (objava linkuje oba).
2. r/AskSerbia pitanje — dan–dva kasnije, da LinkedIn objava bude dokaz da materijal živi.
3. r/AskBalkans i r/serbia (ako pravila dozvole) — po reakcijama na prethodne.
4. Kratka verzija u kanale gde autor već učestvuje (discord serveri, privatne grupe) — samo tamo gde je poznat kao učesnik, ne kao prva poruka.
5. Pitch Startitu kad kurs ima prve signale (zvezdice, issue-i, doprinosi).
