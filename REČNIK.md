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
| sažimanje | *summarization* | Sabijanje starije istorije u kraći tekst da bi se oslobodio kontekstni prozor. | [04](moduli/modul-04-memorija-i-rag.md) |
| ugnežđena reprezentacija | *embedding* | Tekst preveden u niz brojeva koji čuva značenje; tekstovi sličnog smisla su blizu jedni drugima. | [04](moduli/modul-04-memorija-i-rag.md) |
| vektorska baza | *vector database* | Skladište ugnežđenih reprezentacija sa pretragom po sličnosti. | [04](moduli/modul-04-memorija-i-rag.md) |
| RAG | *retrieval-augmented generation* | Obrazac: pronađi relevantne odlomke, ubaci ih u kontekst, pa tek onda generiši odgovor sa izvorom. | [04](moduli/modul-04-memorija-i-rag.md) |
| deljenje na odlomke | *chunking* | Sečenje dokumenata na komade pogodne za ugnežđivanje i pretragu; veličina i preklapanje imaju značaja. | [04](moduli/modul-04-memorija-i-rag.md) |
| inženjering konteksta | *context engineering* | Dizajn onoga što model vidi u svakom koraku: šta ulazi, šta se sažima, šta se pamti van prozora. | [05](moduli/modul-05-inzenjering-konteksta.md) |

## 5. Evaluacija, povezivanje i produkcija

| Termin | Na engleskom | Značenje | Modul |
|---|---|---|---|
| evaluacija | *evaluation* | Sistematsko merenje koliko je agent dobar; bez nje se radi naslepo. | [07](MAPA-UCENJA.md) |
| evaluacioni skup | *evaluation set*, *test set* | Verzionisan spisak primera (ulaz → očekivano) na kome se agent meri, uključujući granične slučajeve. | [07](MAPA-UCENJA.md) |
| metrika | *metric* | Broj koji nešto zaista meri (tačnost, potpunost, trošak po zadatku); bira se po slučaju upotrebe. | [07](MAPA-UCENJA.md) |
| ocenjivanje pomoću modela | *LLM-as-a-judge* | Drugi model ocenjuje odgovore prvog; korisno, ali se kalibriše na primerima koje je čovek ocenio. | [07](MAPA-UCENJA.md) |
| regresiona provera | *regression test* | Skup primera koji već radi; svaka izmena prompta mora proći i njega, da „popravka" ne pokvari tiho ostalo. | [07](MAPA-UCENJA.md) |
| latencija | *latency* | Vreme od zahteva do odgovora; u agentima se sabira iz više koraka. | [07](MAPA-UCENJA.md) |
| kvota | *quota*, *rate limit* | Ograničenje broja zahteva ili tokena u jedinici vremena; prekoračenje = greška koju kod mora da obradi. | [09](MAPA-UCENJA.md) |
| opserverabilnost | *observability* | Moć da vidite šta agent radi u radu: logovi, tragovi, metrike; produkcija bez nje je crna kutija. | [09](MAPA-UCENJA.md) |
| protokol konteksta modela | *Model Context Protocol* (MCP) | Otvoren standard za povezivanje modela sa spoljnim alatima i izvorima podataka. | [06](MAPA-UCENJA.md) |
| višeagentski sistem | *multi-agent system* | Više agenata sa podeljenim ulogama, komunikacijom i orkestracijom (ko radi šta i kojim redom); moćno, ali rešenje samo kada jedan agent zaista nije dovolj. | [08](MAPA-UCENJA.md) |

---

**Nedostaje vam pojam?** Ovo je živ dokument: ako ste na termin naišli u modulu, a nije ovde — to je greška kursa. Prijavite u *issue* ili pošaljite *pull request* (vidi [„Kako doprineti"](README.md#kako-doprineti) u README-u).
