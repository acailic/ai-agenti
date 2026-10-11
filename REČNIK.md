# REČNIK — srpsko-engleski rečnik pojmova

> Kako kurs piše i govori o agentima: srpski termin, sa engleskim originalom u zagradi. Referenca za sve module.

U ovom kursu važi dogovor: svaki termin pri prvoj upotrebi u tekstu dobija engleski original u zagradi — npr. alat (eng. *tool*) — jer ćete u dokumentaciji, porukama o greškama i na poslu na ta ista imena naići na engleskom. Ovaj rečnik ih skuplja na jednom mestu: **srpsko ime, engleski original, kratko značenje i modul u kome se pojavljuje.**

Dogovor o prevodima je pragmatičan: nekima je srpski termin potpuno ravnopravan (token, kontekst, temperatura), neki ostaju pretežno na engleskom jer su se u praksi udomaćili (tool use, RAG, LLM-as-a-judge). U nedoumici: pišemo srpski, engleski u zagradi — i nikad mešamo ćirilicu i latinicu (kurs je na latinici i ekavici).

---

## 1. Osnove: model i razgovor

| Termin | Na engleskom | Značenje | Modul |
|---|---|---|---|
| veliki jezički model | *large language model* (LLM) | Model obučen na ogromnom tekstu; iz konteksta predviđa sledeći token. „Motor" agenta. | [00](moduli/modul-00-uvod-u-agente.md) |
| token | *token* | Jedinica teksta koju model obrađuje (približno pola do tri četvrtine reči za engleski). Od tokena zavise cena, brzina i ograničenja. | [01](moduli/modul-01-osnove-llm.md) |
| kontekst | *context* | Sve što model vidi u jednom pozivu: sistemski tekst, istorija, rezultati alata, dokumenti. | [01](moduli/modul-01-osnove-llm.md) |
| kontekstni prozor | *context window* | Maksimalan broj tokena koji staje u jedan poziv; konačan je, meri se u desetinama ili stotinama hiljada. | [01](moduli/modul-01-osnove-llm.md) |
| prompt | *prompt* | Ulazni tekst za model. U ovom kursu: program koji se verzionisa i meri, ne poruka prijatelju. | [01](moduli/modul-01-osnove-llm.md) |
| sistemski prompt | *system prompt* | Poruka uloge `system`: identitet, pravila, format i ograničenja — „konfiguracioni fajl" za model. | [01](moduli/modul-01-osnove-llm.md) |
| temperatura | *temperature* | Parametar koji kontroliše raznovrsnost izlaza: niska → ponovljivo, visoka → kreativno. Za agente: niska. | [01](moduli/modul-01-osnove-llm.md) |
| halucinacija | *hallucination* | Samouvereno izmišljanje kada model nema podatak; svojstvo načina rada, ne bug — zaobilazi se dizajnom (alati, izvori, testovi). | [01](moduli/modul-01-osnove-llm.md) |
| API | *API* | Programski interfejs preko koga kod razgovara sa modelom; poziv = lista poruka, odgovor = izlaz modela. | [01](moduli/modul-01-osnove-llm.md) |
| API ključ | *API key* | Tajni niz koji potvrđuje vaš nalog; kao lozinka — živi u environment varijabli, nikad u kodu. | [01](moduli/modul-01-osnove-llm.md) |
| environment varijabla | *environment variable* | Podešavanje procesa izvan koda (npr. `Z_AI_API_KEY`); standardno mesto za tajne. | [01](moduli/modul-01-osnove-llm.md) |
| OpenAI-kompatibilan interfejs | *OpenAI-compatible interface* | Dogovor o obliku poziva koji su prihvatili mnogi provajderi; promenom `base_url` isti kod radi sa drugim modelima. | [01](moduli/modul-01-osnove-llm.md) |

## 2. Alati

| Termin | Na engleskom | Značenje | Modul |
|---|---|---|---|
| alat | *tool* | Funkcija u vašem kodu koju model može da zatraži; jedina veza modela sa svetom podataka i akcija. | [02](moduli/modul-02-alati-tool-use.md) |
| korišćenje alata | *tool use*, *function calling* | Sposobnost modela da umesto teksta vrati zahtev za izvršenje funkcije sa argumentima. | [02](moduli/modul-02-alati-tool-use.md) |
| definicija alata | *tool definition* | Ono što model vidi: ime, opis i šema parametara. Opis je interfejs ka modelu — piše se kao dokumentacija. | [02](moduli/modul-02-alati-tool-use.md) |
| šema parametara | *JSON Schema* | Formalni opis koje parametre alat prima, kojeg tipa i koji su obavezni. | [02](moduli/modul-02-alati-tool-use.md) |
| poziv alata | *tool call* | Zahtev modela: „izvrši funkciju X sa argumentima Y"; argumenti stižu kao JSON tekst. | [02](moduli/modul-02-alati-tool-use.md) |
| sandbox | *sandbox* | Ograđen prostor (npr. jedan direktorijum) unutar koga alat sme da radi; sve izvan — greška. | [02](moduli/modul-02-alati-tool-use.md) |
| najmanja dozvola | *least privilege* | Alat ume samo ono što mu treba za zadatak: čitanje, ne brisanje; jedan folder, ne ceo disk. | [02](moduli/modul-02-alati-tool-use.md) |
| čovek u petlji | *human in the loop* | Potvrda čoveka pre izvršenja osetljive ili nepovratne operacije. | [03](moduli/modul-03-agent-od-nule.md) |

## 3. Agent i petlja

| Termin | Na engleskom | Značenje | Modul |
|---|---|---|---|
| agent | *AI agent* | Sistem u kome LLM odlučuje i deluje: koristi alate, pravi korake ka cilju, koriguje sebe. | [00](moduli/modul-00-uvod-u-agente.md) |
| petlja agenta | *agent loop* | Ciklus: razmišlja → traži akciju → vidi rezultat → ponovo; dok ne završi ili ne stane. | [03](moduli/modul-03-agent-od-nule.md) |
| opažaj–razmišljaj–deluj | *perceive–think–act* | Klasični ciklus agenta: prikupi stanje, odluči, izvrši — pa opet. | [03](moduli/modul-03-agent-od-nule.md) |
| samo-korekcija | *self-correction* | Sposobnost agenta da grešku alata pretoči u novi, ispravljeni pokušaj umesto da stane. | [03](moduli/modul-03-agent-od-nule.md) |
| trag | *trace* | Zapis koraka agenta (alati, argumenti, rezultati, troškovi); čita se i kada je sve prošlo dobro. | [03](moduli/modul-03-agent-od-nule.md) |
| kočnice | *step limit, token budget* | `max_koraka`, budžet tokena, allow-lista akcija; bez njih agent može da vrti do besvesti. | [03](moduli/modul-03-agent-od-nule.md) |
| framework | *agent framework* | Biblioteka koja slaže petlju, alate i logovanje umesto vas; izbor, ne misterija — ispod je ista petlja. | [03](moduli/modul-03-agent-od-nule.md) |

## 4. Memorija i kontekst

| Termin | Na engleskom | Značenje | Modul |
|---|---|---|---|
| memorija | *memory* | Sve što agent zna između koraka i između sesija: radna (istorija), sažeta, trajna (baza). | [04](moduli/modul-04-memorija-i-rag.md) |
| radna memorija | *short-term memory* | Istorija poruka u kontekstu — ono što agent „zna" tokom tekućeg zadatka. | [04](moduli/modul-04-memorija-i-rag.md) |
| sažeta memorija | *summarized memory* | Sažetak starije istorije umesto svih poruka; oslobađa prozor, gubi detalje. | [04](moduli/modul-04-memorija-i-rag.md) |
| trajna memorija | *long-term memory* | Sve što agent pamti van kontekstnog prozora (fajlovi, baze, indeks); vraća se po potrebi. | [04](moduli/modul-04-memorija-i-rag.md) |
| model bez stanja | *stateless* | Model ne pamti ništa između dva poziva; sve što zna mora biti u kontekstu poziva. | [04](moduli/modul-04-memorija-i-rag.md) |
| povraćaj | *retrieval* | Izdvajanje upravo relevantnog sadržaja iz trajne memorije nazad u kontekst. | [04](moduli/modul-04-memorija-i-rag.md) |
| sažimanje | *summarization* | Sabijanje starije istorije u kraći tekst da bi se oslobodio kontekstni prozor. | [04](moduli/modul-04-memorija-i-rag.md) |
| ugnežđena reprezentacija | *embedding* | Tekst preveden u niz brojeva koji čuva značenje; tekstovi sličnog smisla su blizu jedni drugima. | [04](moduli/modul-04-memorija-i-rag.md) |
| vektorska baza | *vector database* | Skladište ugnežđenih reprezentacija sa pretragom po sličnosti. | [04](moduli/modul-04-memorija-i-rag.md) |
| RAG | *retrieval-augmented generation* | Obrazac: pronađi relevantne odlomke, ubaci ih u kontekst, pa tek onda generiši odgovor sa izvorom. | [04](moduli/modul-04-memorija-i-rag.md) |
| deljenje na odlomke | *chunking* | Sečenje dokumenata na komade pogodne za ugnežđivanje i pretragu; veličina i preklapanje imaju značaja. | [04](moduli/modul-04-memorija-i-rag.md) |
| preklapanje | *overlap* | Deo teksta koji se ponavlja između susednih odlomaka, da granica ne preseče činjenicu. | [04](moduli/modul-04-memorija-i-rag.md) |
| pretraga po smislu | *semantic search* | Traženje odlomaka po značenju (blizina ugnežđenih reprezentacija), a ne po poklapanju reči. | [04](moduli/modul-04-memorija-i-rag.md) |
| kosinusna sličnost | *cosine similarity* | Mera blizine dva vektora (1 = najbliže, 0 = bez veze); osnova pretrage po smislu. | [04](moduli/modul-04-memorija-i-rag.md) |
| k najbližih suseda | *k-nearest neighbours* (k-NN) | Povraćaj k vektora najbližih vektoru pitanja. | [04](moduli/modul-04-memorija-i-rag.md) |
| navođenje izvora | *citation* | Odgovor uz oznaku odakle je tvrdnja (odlomak, dokument); čini odgovor proverljivim. | [04](moduli/modul-04-memorija-i-rag.md) |
| metapodatak | *metadata* | Podaci o podatku: izvor fajla, broj odlomka, datum izmene. | [04](moduli/modul-04-memorija-i-rag.md) |
| izgubljen usred konteksta | *lost in the middle* | Relevantan podatak usred dugačkog konteksta se lakše ignoriše. | [04](moduli/modul-04-memorija-i-rag.md) |
| inženjering konteksta | *context engineering* | Dizajn onoga što model vidi u svakom koraku: šta ulazi, šta se sažima, šta se pamti van prozora. | [05](moduli/modul-05-inzenjering-konteksta.md) |
| politika konteksta | *context policy* | Pisani dogovor šta ulazi u kontekst: uvek / aktivno / sažeto / van prozora. | [05](moduli/modul-05-inzenjering-konteksta.md) |
| trovanje kontekstom | *context poisoning* | Sadržaj u kontekstu koji pogrešno usmerava modela: protivrečno, zastarelo, ubrizgano. | [05](moduli/modul-05-inzenjering-konteksta.md) |
| ubrizgavanje uputstava | *prompt injection* | Tekst u dokumentu ili rezultatu alata koji glumi naredbu modelu. | [05](moduli/modul-05-inzenjering-konteksta.md) |

## 5. Protokoli i povezivanje

| Termin | Na engleskom | Značenje | Modul |
|---|---|---|---|
| protokol | *protocol* | Pisani ugovor o obliku poruka između dve strane; N puta M integracija postaje N plus M. | [06](moduli/modul-06-protokoli-mcp-a2a.md) |
| protokol konteksta modela | *Model Context Protocol* (MCP) | Otvoren standard za povezivanje modela sa spoljnim alatima i izvorima podataka. | [06](moduli/modul-06-protokoli-mcp-a2a.md) |
| host | *host* | Aplikacija koja pokreće model i odlučuje sa kojim serverima se povezuje. | [06](moduli/modul-06-protokoli-mcp-a2a.md) |
| MCP klijent | *MCP client* | Deo hosta koji vodi jednu vezu ka jednom serveru; granica na kojoj se proverava i ograničava. | [06](moduli/modul-06-protokoli-mcp-a2a.md) |
| MCP server | *MCP server* | Program koji nudi alate, resurse i promptove preko protokola — lokalni proces ili udaljeni servis. | [06](moduli/modul-06-protokoli-mcp-a2a.md) |
| primitiv | *primitive* | Vrsta ponude servera; deli se po tome ko odlučuje: alat (model), resurs (aplikacija), prompt (korisnik). | [06](moduli/modul-06-protokoli-mcp-a2a.md) |
| resurs | *resource* | Podatak koji server izlaže za čitanje; u kontekst ga ubacuje vaš kod, ne model. | [06](moduli/modul-06-protokoli-mcp-a2a.md) |
| JSON-RPC | *JSON-RPC* | Format zahteva i odgovora (method, params, id) na kome počiva MCP; notifikacija je poruka bez id i bez odgovora. | [06](moduli/modul-06-protokoli-mcp-a2a.md) |
| rukovanje | *handshake* | Prvi razgovor veze (initialize): ko je ko, koje verzije i sposobnosti — pre bilo kog posla. | [06](moduli/modul-06-protokoli-mcp-a2a.md) |
| otkrivanje alata | *tool discovery* | Klijent pita server šta nudi (tools/list) i dobija šeme; menja ručno održavanu listu u kodu. | [06](moduli/modul-06-protokoli-mcp-a2a.md) |
| transport | *transport* | Kanal kojim putuju poruke: stdio (lokalni proces) ili HTTP (udaljeni servis). | [06](moduli/modul-06-protokoli-mcp-a2a.md) |
| imenski prostor | *namespace* | Prefiks imena alata imenom servera (recnik.trazi), da se alati dva servera ne sudare. | [06](moduli/modul-06-protokoli-mcp-a2a.md) |
| trovanje alatom | *tool poisoning* | Opis alata koji glumi uputstvo modelu; tuđi tekst ulazi u kontekst kao vaš. | [06](moduli/modul-06-protokoli-mcp-a2a.md) |
| agent-kartica | *agent card* | JSON opis agenta za A2A: šta ume (veštine), gde se nalazi, koje sposobnosti podržava. | [06](moduli/modul-06-protokoli-mcp-a2a.md) |
| A2A | *Agent2Agent* | Protokol za saradnju agenata kao ravnopravnih učesnika: dodeljivanje zadataka, poruke u toku, artefakti. | [06](moduli/modul-06-protokoli-mcp-a2a.md) |

## 6. Evaluacija

| Termin | Na engleskom | Značenje | Modul |
|---|---|---|---|
| evaluacija | *evaluation* | Sistematsko merenje koliko je agent dobar; bez nje se radi naslepo. | [07](moduli/modul-07-evaluacija-agenata.md) |
| evaluacioni skup | *evaluation set*, *test set* | Verzionisan spisak primera (ulaz → očekivano) na kome se agent meri, uključujući granične slučajeve. | [07](moduli/modul-07-evaluacija-agenata.md) |
| scenario | *scenario* | Najmanja jedinica evaluacije: id, ulaz, očekivano ponašanje i provere koje padaju glasno. | [07](moduli/modul-07-evaluacija-agenata.md) |
| granični slučaj | *edge case* | Primer na granici domena: van domena, pogrešna pretpostavka, višedelni zahtev; pola vrednosti skupa. | [07](moduli/modul-07-evaluacija-agenata.md) |
| provera | *check* | Mali program uz scenario (sadrži / ne sadrži / regex); determinističke provere idu pre sudije. | [07](moduli/modul-07-evaluacija-agenata.md) |
| metrika | *metric* | Broj koji nešto zaista meri (tačnost, potpunost, trošak po zadatku); bira se po slučaju upotrebe. | [07](moduli/modul-07-evaluacija-agenata.md) |
| stopa prolaznosti | *pass rate* | Procenat scenarija koji prolaze sve provere; glavni broj, ali nikad jedini. | [07](moduli/modul-07-evaluacija-agenata.md) |
| prag | *threshold* | Donja granica stope ispod koje je crveno; kao izlazni kod skripte postaje kapija u CI. | [07](moduli/modul-07-evaluacija-agenata.md) |
| dif pregled | *diff review* | Upareno poređenje ishoda dva pokretanja po scenariju; flipovi objašnjavaju, agregat odlučuje. | [07](moduli/modul-07-evaluacija-agenata.md) |
| ocenjivanje pomoću modela | *LLM-as-a-judge* | Drugi model ocenjuje odgovore prvog po rubrici; korisno, ali se kalibriše na primerima koje je čovek ocenio. | [07](moduli/modul-07-evaluacija-agenata.md) |
| rubrika | *rubric* | Pisani kriterijumi po kojima sudija-model sudi; bez nje sudija je izvor nasumičnosti. | [07](moduli/modul-07-evaluacija-agenata.md) |
| kalibracija | *calibration* | Slaganje sudije sa ljudskim ocenama na par primera, pre nego što mu se poveri skup. | [07](moduli/modul-07-evaluacija-agenata.md) |
| pokretač | *harness* | Skripta koja spaja skup, agenta i provere: tabela, zapis rezultata, izlazni kod po pragu. | [07](moduli/modul-07-evaluacija-agenata.md) |
| regresiona provera | *regression test* | Scenario koji je jednom pao i bio popravljen; ostaje zauvek, da greška ne vrati tiho. | [07](moduli/modul-07-evaluacija-agenata.md) |
| latencija | *latency* | Vreme od zahteva do odgovora; u agentima se sabira iz više koraka. | [07](moduli/modul-07-evaluacija-agenata.md) |

## 7. Produkcija i multi-agent sistemi

| Termin | Na engleskom | Značenje | Modul |
|---|---|---|---|
| višeagentski sistem | *multi-agent system* | Više agenata sa podeljenim ulogama, komunikacijom i orkestracijom (ko radi šta i kojim redom); moćno, ali rešenje samo kada jedan agent zaista nije dovolj. | [08](moduli/modul-08-multi-agent-sistemi.md) |
| orkestracija | *orchestration* | Koordinacija više agenata: ko radi šta, kojim redom, ko sudi kad je gotovo; ista petlja kao kod jednog agenta, samo je „alat" sad drugi agent. | [08](moduli/modul-08-multi-agent-sistemi.md) |
| orkestrator | *orchestrator* | Uloga (agent ili običan kod) koja dodeljuje zadatke, sabire rezultate i odlučuje o kraju; u malim sistemima spojena sa planerom. | [08](moduli/modul-08-multi-agent-sistemi.md) |
| planer | *planner* | Uloga koja cilj razlaže na korake plana (potpitanja, podzadatke), obično u strogo definisanom JSON obliku. | [08](moduli/modul-08-multi-agent-sistemi.md) |
| izvršilac | *worker*, *executor* | Uloga koja radi jedan dodeljeni korak do kraja; ne mora biti model — pretraga je odličan izvršilac. | [08](moduli/modul-08-multi-agent-sistemi.md) |
| kriticar | *critic* | Uloga koja ocenjuje tuđi rezultat po rubrici; mora imati čvrstu granicu popravki, inače se agenti šalju u krug. | [08](moduli/modul-08-multi-agent-sistemi.md) |
| ugovor (između agenata) | *contract* | Dogovoreni oblik poruka između uloga: šta agent prima (zadatak i kontekst), šta vraća (rezultat) i gde su granice. | [08](moduli/modul-08-multi-agent-sistemi.md) |
| gluvi telefon | *context degradation* | Postepeno propadanje sadržaja kroz lanac prenošenja između agenata; lek: artefakt i samo potreban kontekst, ne istorija. | [08](moduli/modul-08-multi-agent-sistemi.md) |
| razdeli i saberi | *fan-out/fan-in* | Orkestracija u kojoj se zadatak podeli na nezavisne delove, oni rade paralelno, pa se rezultati saberu. | [08](moduli/modul-08-multi-agent-sistemi.md) |
| kvota | *quota*, *rate limit* | Ograničenje broja zahteva ili tokena u jedinici vremena; prekoračenje = greška koju kod mora da obradi. | [09](moduli/modul-09-u-produkciju.md) |
| opservabilnost | *observability* | Moć da vidite šta agent radi u radu: logovi, tragovi, metrike; produkcija bez nje je crna kutija. | [09](moduli/modul-09-u-produkciju.md) |
| potvrda korisnika | *human-in-the-loop* | Kapija pred skupim ili nepovratnim akcijama: čovek odobrava, a svaka odluka se upisuje u dnevnik. | [09](moduli/modul-09-u-produkciju.md) |
| suvi rad | *dry run* | Izvršavanje na papiru: izveštaj „šta bih uradio" bez ijedne promene; najjeftinija odbrana pre opasne akcije. | [09](moduli/modul-09-u-produkciju.md) |
| dnevnik odluka | *audit log* | Zapis svake odluke o potvrdama (ko, šta, kada, zašto); odgovor na „a ko je to dozvolio?" dolazi iz zapisa, ne iz sećanja. | [09](moduli/modul-09-u-produkciju.md) |
| strukturisano beleženje | *structured logging* | Svaki događaj je jedna JSON linija sa poznatim poljima; čita ga program (filtriranje, brojanje), ne samo čovek. | [09](moduli/modul-09-u-produkciju.md) |
| id traga | *trace ID* | Identifikator jednog zadatka koji nose svi njegovi događaji, kroz sve agente; jedan id — svi učesnici — jedan pregled. | [09](moduli/modul-09-u-produkciju.md) |
| idempotencija | *idempotency* | Svojstvo akcije da izvršena dva puta daje ishod kao jednom; uslov za bezbedan ponovni pokušaj. | [09](moduli/modul-09-u-produkciju.md) |
| eksponencijalna zadrška | *exponential backoff* | Ponovni pokušaji sa sve dužim čekanjem (1s, 2s, 4s); provajderu se daje vremena da odahne, umesto da ga zaturimo. | [09](moduli/modul-09-u-produkciju.md) |
| budžet | *budget* | Granica troška po zadatku: meki deo upozorava, tvrdi prekida izuzetkom; budžet bez tvrdog limita je dekoracija. | [09](moduli/modul-09-u-produkciju.md) |
| keširanje odgovora | *response caching* | Identičan poziv vraća spremljen odgovor bez novog poziva API-ja; štedi na ponovljenim pitanjima. | [09](moduli/modul-09-u-produkciju.md) |
| preusmeravanje modela | *model routing* | Lakši koraci idu jeftinijem modelu, teški glavnom; smanjuje trošak bez diranja najtežih delova. | [09](moduli/modul-09-u-produkciju.md) |

---

**Nedostaje vam pojam?** Ovo je živ dokument: ako ste na termin naišli u modulu, a nije ovde — to je greška kursa. Prijavite u *issue* ili pošaljite *pull request* (vidi [„Kako doprineti"](README.md#kako-doprineti) u README-u).
