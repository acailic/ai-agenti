# Modul 00 — Uvod u agente: šta je agent, zašto sad, kako se uči

> **Vreme:** 2–3 časa · **Preduslovi:** nema (samo radoznalost) · **Stanje:** prva radna verzija

Dobro došli! Ovim modulom počinje put koji vodi od prvog poziva API-ju do sopstvenog agenta koji radi stvarne poslove. Pre nego što sledeći put napišete red koda, ovde ćemo odgovoriti na tri pitanja: **šta** je agent, **zašto** je ova oblast upravo sada toliko bitna i **kako** ćete je najbrže naučiti. Pripremite kafu — krećemo.

---

## 1. Šta je AI agent?

Započnimo sa radnom definicijom koju ćemo koristiti kroz ceo kurs:

> **AI agent je softverski sistem u kome veliki jezički model (eng. *large language model*, LLM) ne samo odgovara na pitanja, već odlučuje i deluje — koristi alate, pravi korake ka cilju i koriguje sebe na osnovu rezultata.**

Rastavimo tu definiciju na delove:

1. **Cilj.** Agentu ne kažete „odgovori mi", nego „uradi ovo": pronađi, sredi, napiši, proveri, rezerviši.
2. **Alati (eng. *tools*).** Model sam ne može da otvori fajl, pozove API ili upiše u bazu. Zato mu date alate — funkcije koje vaš kod izvršava na zahtev modela.
3. **Petlja (eng. *agent loop*).** Agent radi u ciklusu: razmišlja šta je sledeći korak → zatraži izvršavanje alata → vidi rezultat → odluči šta dalje. Ponavlja dok zadatak nije gotov (ili dok ne zaključi da ne može).
4. **Korekcija.** Ako alat vrati grešku, agent ne staje — menja pristup i pokušava drugačije. Ta sposobnost oporavka je ono što ga izdvaja od obične skripte.

### Chatbot ili agent?

Najlakše je razumeti razliku kroz poređenje:

| | Chatbot | Agent |
|---|---|---|
| Šta radi | odgovara na poruke | izvršava zadatke do cilja |
| Inicijativa | čeka pitanje | sam bira sledeći korak |
| Alati | nema (ili veoma ograničeni) | ima, i sam odlučuje kada ih koristi |
| Trajanje | jedan odgovor | više koraka, čak i minuti rada |
| Primer | čet za podršku koji daje savete | sistem koji sam pregleda tikete, nađe uzrok i pripremi odgovor |

Granicu ne treba precrtavati nožem: mnogi proizvodi su negde između. Ali kada čujete „agent", u pozadini je gotovo uvek petlja odlučivanja sa alatima — a to je tačno ono što ćemo sami izgraditi u [modulu 03](modul-03-agent-od-nule.md).

### Model je motor, ne auto

Česta zabluda: „agent = veliki model". Nije. Model je **motor zaključivanja** — odlično predviđa šta ima smisla reći ili urati sledeće. Auto je ceo sistem: motor, ali i točkovi (alati), putokazi (prompt i kontekst), instrument tabla (praćenje i evaluacija). Dobar auto sa slabim motorom ne ide daleko — ali ni najjači motor sam od sebe ne vozi. Zato ćemo jednaku pažnju posvetiti i jednom i drugom.

---

## 2. Zašto baš sada?

Oblast „agenata" nije nova ideja — nova je kombinacija okolnosti koja je čini izvodljivom:

1. **Modeli su postali dovoljno sposobni.** Današnji veliki modeli umeju pouzdano da prate složena uputstva, koriste alate po definiciji (takozvana funkcionalnost *tool use* / *function calling*) i drže se formata. Pre nekoliko godina to je bio istraživački luksuz.
2. **Cene su pale.** Poziv koji je pre par godina kočio eksperimente danas koči koliko šoljica kafe. Agent sa nekoliko stotina poziva mesečno je budžet koji pokriva i pojedinac.
3. **Standardizacija alata.** Pojavili su se otvoreni protokoli (najpoznatiji je MCP — protokol konteksta modela, eng. *Model Context Protocol*, o njemu u [modulu 06](../MAPA-UCENJA.md)) zahvaljujući kojima jedan agent može da „utakne" desetine alata bez posebnog programiranja za svaki.
4. **Traži se znanje.** Kompanije svuda (i u Srbiji i u regionu) eksperimentišu, a nedostaju ljudi koji razumeju i teoriju i praksu — od sigurnosnih implikacija do cene po zahtevu. Razmak između „znam da koristim ChatGPT" i „mogu da napravim i odgovaram za agenta" je upravo ono što tržište plaća.

I još nešto, konkretno za nas: **na srpskom jeziku gotovo da i ne postoji sistematski materijal o ovoj oblasti.** Zato ovaj kurs postoji.

---

## 3. Kako se ova oblast najbolje uči

Iskreno: ovo nije oblast koja se uči čitanjem. Tri načela koja ćemo poštovati od prve nedelje:

1. **Ruke na tastaturi.** Svaki modalitet ima vežbe sa pravim API-jem. Neće biti „lažnih" poziva ni simulacija — od prve vežbe pričate sa stvarnim modelom, sa stvarnim (malim!) računom.
2. **Prompt je program.** Prompt (eng. *prompt*) — tekst koji šaljete modelu — tretiraćemo kao izvorni kod: piše se pažljivo, verzionira u Git-u, testira i meri. Ko to usvoji, prestaje da „moli" model i počinje da *gradi* sa modelom.
3. **Razumevanje pre frameworka.** Postoje biblioteke koje agenta sklope umesto vas. Mi prvo pišemo petlju sami (modul 03), pa tek onda koristimo gotove alate — jer kada nešto krene naopako (a hoće), morate znati šta je ispod haube.

**Kako je kurs organizovan.** [Mapa učenja](../MAPA-UCENJA.md) ima 11 modula (00–10). Svaki modul donosi: objašnjenje, vežbe i domaći. Pored modula postoje i [radionice](../radionice/) — uživo vođena prolaza kroz ključne module, po sat vremena. Predlažem tempo: jedan modul nedeljno, sa radionicom kao „teretanom sa trenerom" usput.

**Šta vam treba za početak:**
- osnovni Python (promenljive, funkcije, `pip install`, pokretanje skripte) — dovoljno za modul 01, a ponovićemo što zatreba;
- pristup jednom API-ju velikog modela (najjeftiniji plan je dovoljan; u vežbama koristimo z.ai/GLM, ali principi su isti za bilo kog provajdera sa OpenAI-kompatibilnim interfejsom, eng. *OpenAI-compatible interface*);
- Git nalog — od prvog dana ćete svoje vežbe slati u sopstveni repozitorijum. Na kraju puta to je vaš portfolio.

---

## 4. Kratki rečnik za početak

Ovi termini vraćaće se stalno; evo ih na jednom mestu. Detaljno se obrađuju u svojim modulima, a kompletan rečnik celog kursa (preko pedeset pojmova) držimo u [REČNIK.md](../REČNIK.md).

| Termin | Značenje |
|---|---|
| **LLM** (veliki jezički model) | Model obučen na ogromnom tekstu; iz konteksta predviđa sledeći token. „Motor" agenta. |
| **Token** | Jedinica teksta koju model obrađuje (približno pola do tri četvrtine reči). Od njega zavise cena i ograničenja. → modul 01 |
| **Kontekst / kontekstni prozor** (eng. *context window*) | Sve što model „vidi" u jednom pozivu: sistemski tekst, istorija razgovora, rezultati alata. Fizički je ograničen. → modul 01, 05 |
| **Prompt** | Ulazni tekst za model. U ovom kursu: program, ne molba. → modul 01 |
| **Alat / tool use** | Funkcija koju model može da zatraži, a vaš kod izvršava: pretraga, fajl sistem, API poziv… → modul 02 |
| **Petlja agenta** (eng. *agent loop*) | Ciklus razmišljanje → akcija → posmatranje rezultata → ponovo, do cilja. → modul 03 |
| **Ugnežđena reprezentacija** (eng. *embedding*) | Tekst preveden u niz brojeva koji čuva značenje; osnova pretrage po smislu. → modul 04 |
| **RAG** (generisanje podržano pretragom) | Obrazac: pronađi relevantne delove dokumenata, pa tek onda generiši odgovor. → modul 04 |
| **Halucinacija** (eng. *hallucination*) | Kada model samouvereno izmišlja. Glavni razlog zašto agent mora biti pod nadzorom i testiran. → svuda 🙂 |
| **Evaluacija** | Sistematsko merenje koliko je agent dobar. Bez nje radite naslepo. → modul 07 |

---

## 5. Pitanja za samoproveru

Ako možete odgovoriti svojim rečima — spremni ste za sledeći modul:

1. Koja tri dela čine agenta po našoj radnoj definiciji, i šta svaki od njih doprinosi?
2. U čemu je razlika između chatbota i agenta? Navedite primer koji *nije* agent, i objasnite zašto.
3. Zašto kažemo da je model „motor, a ne auto"? Šta bi u toj analogiji bilo „točkovi"?
4. Nabrojite dva razloga zašto je ova oblast eksplodirala u poslednje dve godine.
5. Zašto prompt tretiramo kao program, a ne kao poruku prijatelju?

*Domaći (kratko):* napišite u tri do pet rečenica jedan zadatak iz vašeg posla ili studija koji bi agent mogao da radi umesto vas. Sačuvajte tekst — vratićemo mu se na kraju kursa, u modulu 10.

---

## Sledeće

Naredni korak: [**Modul 01 — Osnove rada sa LLM-ovima**](modul-01-osnove-llm.md). Tu prvi put razgovaramo sa modelom kroz API, saznajemo šta su tokeni zaista, zašto kontekstni prozor jeste novčanik i kako se piše prompt koji se ponaša kao program.

Ako ste ovde prvi put: dobro nam došli — krećemo polako, ali od prvog dana ozbiljno. 🚀
