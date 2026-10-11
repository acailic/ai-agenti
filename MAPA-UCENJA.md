# Mapa učenja: AI i agenti na srpskom

> Put od prvog poziva API-ju do sopstvenog agenta u produkciji — korak po korak, na srpskom, sa praksom na svakom koraku.

Dobro došli! Ova mapa je vaš kompas kroz celo gradivo. Polazimo od nule (šta je uopšte agent i kako radi veliki jezički model, eng. *large language model*, LLM) i stićemo do ozbiljnih tema: alata, memorije, protokola, evaluacije i produkcije. Nigde ne preskačemo praktičan rad — svaki modul završava vežbama u kojima sami pišete kod. Pojmove sa kojima se prvi put srećete proverite u [REČNIK-u](REČNIK.md) — srpsko-engleskom rečniku celog kursa.

**Za koga je ova mapa?**
- za developere (i studente poslednjih godina) koji znaju osnove programiranja — najbolje Pythona — a žele da ozbiljno uđu u svet AI agenata (eng. *AI agents*);
- za one koji su već „muckali" sa ChatGPT-om ili sličnim alatima i žele da razumeju šta se dešava ispod haube;
- za timove koje žele zajednički plan učenja.

Nije potreban prethodni iz uređaja mašinskog učenja — matematika koja vam treba je uglavnom zdrav razum i malo strpljenja.

---

## Pregled puta

```
                        ┌─────────────────────────────────────────┐
                        │  MODUL 10 — završni projekat (portfolio) │
                        └───────────────▲─────────────────────────┘
                                        │
  produkcija ┌─────────────────────────┴───────────────┐
   ┌─────────┴─────────┐  ┌──────────────┐  ┌──────────┴────────┐
   │ 09 — u produkciju │  │ 08 — multi-  │  │ 07 — evaluacija   │
   │                   │  │ agent sistemi│  │                   │
   └─────────▲─────────┘  └──────▲───────┘  └─────────▲─────────┘
             └───────────────┬───┴────────────────────┘
   ┌─────────┴─────────┐  ┌──┴─────────────┐  ┌────────┴──────────┐
   │ 06 — protokoli    │  │ 05 — inženjer. │  │ 04 — memorija i   │
   │ (MCP, A2A)        │  │    konteksta   │  │    RAG            │
   └─────────▲─────────┘  └──────▲─────────┘  └─────────▲─────────┘
             └───────────────┬───┴──────────────────────┘
   ┌─────────┴───────────────┴──┐
   │ 03 — agent od nule          │◄──── srce puta
   └─────────▲──────────────────┘
   ┌─────────┴─────────┐
   │ 02 — alati (tools)│
   └─────────▲─────────┘
   ┌─────────┴─────────┐
   │ 01 — osnove LLM-a │
   └─────────▲─────────┘
   ┌─────────┴─────────┐
   │ 00 — uvod u agente│
   └───────────────────┘
```

**Legenda statusa:** ✅ napisano · 🔜 planirano (radna verzija uskoro)

---

## Moduli

### Modul 00 — Uvod u agente ✅
**Vreme:** 2–3 časa rada (jedno popodne)
**Preduslovi:** nema — samo radoznalost

Šta je agent, zašto ova oblast bukti baš sada i kako se kroz ovaj kurs najbolje uči. Postavljamo radnu definiciju agenta, razlikujemo chatbot od agenta i dogovaramo način rada: ruke na tastaturi od prve nedelje.

**Nakon ovog modula moći ćete da:**
- objasnite svojim rečima šta je AI agent i po čemu se razlikuje od običnog razgovora sa modelom;
- nabrojite tri ključna razloga zašto su agenti sada relevantni;
- znate kako je kurs organizovan i šta vam treba za početak.

→ [Modul 00: Uvod u agente](moduli/modul-00-uvod-u-agente.md) · povezana [radionica 01](radionice/radionica-01-prvi-koraci.md)

---

### Modul 01 — Osnove rada sa LLM-ovima ✅
**Vreme:** 5–7 časova rada (1–2 nedelje)
**Preduslovi:** modul 00; osnovni Python (promenljive, funkcije, pokretanje skripte)

Kako veliki jezički model zapravo radi: tokeni (eng. *tokens*), kontekstni prozor (eng. *context window*) i prompt kao program (eng. *prompt as a program*). Prva vežba sa pravim API-jem — ključ se čuva u environment varijabli, nikad u kodu.

**Nakon ovog modula moći ćete da:**
- objasnite šta su tokeni i zašto su bitni za cenu, brzinu i ograničenja;
- procenite šta ulazi u kontekst i šta se dešava kada se prenapuni;
- napišete strukturiran, verzionisan prompt (uloga, zadatak, kontekst, format izlaza, ograničenja);
- samostalno napravite prvi poziv API-ju iz Pythona i eksperimentišete sa parametrima.

→ [Modul 01: Osnove rada sa LLM-ovima](moduli/modul-01-osnove-llm.md) · povezana [radionica 01](radionice/radionica-01-prvi-koraci.md)

---

### Modul 02 — Alati: kako agent deluje u svetu ✅
**Vreme:** 4–6 časova rada
**Preduslovi:** modul 01

Kako model iz „razgovarača" postaje „učesnik": definisanje alata (eng. *tools*), shema funkcija, poziv alata (eng. *tool call*) i sigurno izvršavanje. Prvi mali bot koji zna da pročita fajl, pozove API i sabere rezultate.

**Nakon ovog modula moći ćete da:**
- opišete alat modelu tako da ga koristi tačno i pouzdano;
- implementirate petlju „model traži — kod izvršava — rezultat vraća modelu";
- prepoznate tipične greške u korišćenju alata i znate kako da ih izbegnete.

→ [Modul 02: Alati](moduli/modul-02-alati-tool-use.md) · povezana [radionica 02](radionice/radionica-02-alati-i-tool-use.md)

---

### Modul 03 — Agent od nule ✅
**Vreme:** 6–8 časova rada
**Preduslovi:** moduli 01 i 02

Srce puta: gradimo kompletnog agenta „od nule", bez frameworka — petlja agenta (eng. *agent loop*): cilj, plan, akcija, posmatranje, korekcija. Na kraju ovog modula razumećete šta frameworki (kao što postojeći open-source biblioteke) zapravo rade umesto vas.

**Nakon ovog modula moći ćete da:**
- napišete sopstvenu petlju agenta u ~100 linija Pythona;
- objasnite ciklus opažaj → razmišljaj → deluj (eng. *perceive–think–act*);
- odlučite kada vam framework treba, a kada je čist kod bolji.

→ [Modul 03: Agent od nule](moduli/modul-03-agent-od-nule.md) · povezana [radionica 03](radionice/radionica-03-agent-od-nule.md)

---

### Modul 04 — Memorija i RAG ✅
**Vreme:** 6–8 časova rada
**Preduslovi:** moduli 01 i 03

Kako agent pamti: radna memorija kroz razgovor, sažimanje istorije i generisanje podržano pretragom (eng. *retrieval-augmented generation*, RAG). Gradi se mini pretraživač nad sopstvenim dokumentima.

**Nakon ovog modula moći ćete da:**
- podelite dokumente, izračunate ugnežđene reprezentacije (eng. *embeddings*) i sačuvate ih u vektorskoj bazi (eng. *vector database*);
- implementirate RAG cevovod (eng. *pipeline*): pitanje → pretraga → kontekst → odgovor;
- objasnite kada RAG pomaže, a kada pravi nove probleme.

→ [Modul 04: Memorija i RAG](moduli/modul-04-memorija-i-rag.md) · povezana [radionica 04](radionice/radionica-04-rag-memorija.md)

---

### Modul 05 — Inženjering konteksta ✅
**Vreme:** 5–7 časova rada
**Preduslovi:** moduli 03 i 04

Kontekst je najskuplji resurs agenta. Upravljanje onim što model vidi u svakom trenutku: šta ulazi u prozor, šta se sažima (eng. *summarization*), šta se pamti van prozora, kompaktni formati i prioritet informacija.

**Nakon ovog modula moći ćete da:**
- dizajnirate šta agent zna u svakom koraku, a ne samo šta kaže;
- smanjite troškove i kašnjenje bez gubitka kvaliteta;
- prepoznate „trovanje kontekstom" i znate kako da ga izbegnete.

→ [Modul 05: Inženjering konteksta](moduli/modul-05-inzenjering-konteksta.md)

---

### Modul 06 — Protokoli: MCP i A2A ✅
**Vreme:** 4–6 časova rada
**Preduslovi:** moduli 02 i 03

Šta protokoli rešavaju: N×M integracija postaje N+M jednim dogovorom o obliku poruka. Anatomija protokola konteksta modela (eng. *Model Context Protocol*, MCP): host, klijent i server, tri primitiva (alati, resursi, promptovi), JSON-RPC poruke i transporti. Vežbe: MCP-šema alata iz ruke, mali server sa rukovanjem (mock transport), klijent sa pravim modelom. Plus ideja protokola A2A (agent–agent) i bezbednost povezivanja: trovanje alatom i pravila poverenja.

**Nakon ovog modula moći ćete da:**
- objasnite problem koji protokoli rešavaju (N puta M → N plus M) i osnovne delove MCP veze;
- napišete MCP-šemu alata, mali server sa rukovanjem i klijenta koji šeme sa servera koristi u pozivu modela;
- objasnite ideju protokola A2A (agent-kartica, zadatak, artefakti) i kada agent–agent umesto agent–alat;
- procenite bezbednosne rizike povezivanja agenta na spoljne sisteme (trovanje alatom, rug pull, odbrane).

→ [Modul 06: Protokoli: MCP i A2A](moduli/modul-06-protokoli-mcp-a2a.md) · povezana [radionica 06](radionice/radionica-06-protokoli.md)

---

### Modul 07 — Evaluacija agenata ✅
**Vreme:** 5–7 časova rada
**Preduslovi:** moduli 03 i 04

Bez merenja, svaki rad na agentu je nagađanje. Zašto se evaluacija razlikuje od jediničnih testova (više prihvatljivih odgovora, nedeterminizam, postepeno propadanje), scenario-skupovi sa determinističkim proverama, prolaz/pad sa pragom kao kapijom, razmišljanje u razlikama (dif pregled dva pokretanja) — i ocenjivanje pomoću modela (eng. *LLM-as-a-judge*) sa kalibracijom.

**Nakon ovog modula moći ćete da:**
- sastavite mali scenario-skup za sopstveni agent, sa graničnim slučajevima;
- definišete metrike koje nešto zaista mere i provere koje padaju glasno;
- postavite pokretač sa pragom (izlazni kod) i dif pregled umesto pogađanja;
- kalibrišete sudiju-model na primerima koje ste sami ocenili.

→ [Modul 07: Evaluacija agenata](moduli/modul-07-evaluacija-agenata.md) · povezana [radionica 05](radionice/radionica-05-evaluacija.md)

---

### Modul 08 — Multi-agent sistemi ✅
**Vreme:** 4–6 časova rada
**Preduslovi:** moduli 03 i 07

Kada jedan agent nije dovolj: podele uloga, komunikacija između agenata, orkestracija i — najvažnije — kada multi-agent sistem *nije* rešenje.

**Nakon ovog modula moći ćete da:**
- dizajnirate sistem od više agenata sa jasnim ulogama i protokom informacija;
- implementirate jednostavnu orkestraciju (planer + izvršilac);
- argumentujete za i protiv multi-agent pristupa za konkretan zadatak.

→ [Modul 08: Multi-agent sistemi](moduli/modul-08-multi-agent-sistemi.md)

---

### Modul 09 — U produkciju: bezbednost, opservabilnost, troškovi 🔜
**Vreme:** 5–7 časova rada
**Preduslovi:** moduli 03 i 07

Agent koji radi na vašem računaru i agent koji radi kod klijenta — dva različita sveta. Bezbednosni obrasci (ograničenja alata, potvrde korisnika, čuvanje tajni), praćenje rada (eng. *observability*), upravljanje troškovima i otpornost na greške.

**Nakon ovog modula moći ćete da:**
- primenite osnovne bezbednosne obrasce za agente sa pristupom alatima;
- postavite beleženje (eng. *logging*) i praćenje ponašanja agenta;
- procenite i kontrolišete troškove po koraku, po zadatku i po mesecu.

---

### Modul 10 — Završni projekat: portfolio agent 🔜
**Vreme:** 8–12 časova rada
**Preduslovi:** svi prethodni moduli

Samostalan projekat koji spaja sve: agent koji rešava stvaran problem vašeg okruženja, sa evaluacijom, bezbednošću i kratkim tekstom „šta i kako". Namenjen i portfolio-u — neka radi za vas i posle kursa.

**Nakon ovog modula moći ćete da:**
- od ideje dođete do isporučenog agenta kroz sve faze;
- dokumentujete projekat tako da ga drugi (i budući poslodavci) razumeju;
- nastavite dalje sami: čitati dokumentaciju, pratiti oblast, učiti brzo.

---

## Kako raditi kroz mapu

1. **Redosled ima smisla.** Moduli 00–03 grade temelj — ne preskačite ih. Kasnije module (05–09) možete donekle prilagoditi svom kontekstu, ali evaluacija (07) ne preskače se nikada: bez nje ne znate šta ste napravili.
2. **Tempo:** računajte 3–6 časova nedeljno. Celokupna mapa je realno 2–4 meseca rada; brži tempo je moguć, ali iskustvo kaže da vežbe stvarno „sednu" tek nakon spavanja.
3. **Svaki modalitet ima tri dela:** objašnjenje (teorija), vežbe (kod) i domaći (dublje). Domaći nije opciona dekoracija — njime se gradite osećaj.
4. **Radite javno.** Napravite repozitorijum za svoje vežbe od prvog dana. Na kraju puta to je vaš portfolio.
5. **Ne morate sve sami.** Radionice su prilika da materijal prođete uživo, sa pitanjima i razmenom.

## Spremnost za početak

- računar na kome možete pokrenuti Python 3.10+;
- pristup jednom komercijalnom API-ju velikog modela (dovoljan je najjeftiniji plan; u modulu 01 koristimo z.ai/GLM jer je pristupačan, ali vežbe rade sa bilo kojim OpenAI-kompatibilnim API-jem, eng. *OpenAI-compatible API*);
- Git i GitHub nalog (za portfolio);
- oko 2–4 časa nedeljno.

Kada ste spremni — počnite [modulom 00](moduli/modul-00-uvod-u-agente.md). Srećno! 🚀
