# Kako doprineti

> Hvala što ste tu! Ovaj kurs raste zajedno sa zajednicom — a ovaj vodič kaže kako da vaš doprinos stigne bez trenja. Sve što sledi važi za *issue*-e, *pull request*-ove i diskusije: pišemo na srpskom (latinica, ekavica), ton je srdačan i konkretan.

## Šta je uvek dobrodošlo

- **Ispravke grešaka** — jezičke, tehničke, logičke: i najmanja greška vredi prijave.
- **Prijave nejasnoća** — „u sekciji 3 mi nije jasno kako je dobijen broj 0,98" je dragocen *issue*: tekst se piše jednom, a čita na sto načina.
- **Pogrešni ili zastareli linkovi**, neispravan kod u vežbama, primeri koji ne rade sa novim verzijama biblioteka.
- **Novi primeri i varijante vežbi** — posebno iz stvarne prakse: „ovo nam se desilo u firmi" vredi više od bilo kog izmišljenog scenarija.
- **Predlozi za prevod termina** — uz obrazloženje zašto je predlog bolji od postojećeg; rečnik je živ dokument.

Za **veće izmene** — novi modul, nova radionica, prestruktuiranje postojećih — prvo otvorite *issue* sa predlogom i dogovorimo se o obimu i pravcu pre nego što potrošite nedelju na nešto što ide drugačije.

## Jezička pravila

Kurs piše i govori na **srpskom, latinicom, ekavicom**, u toplom nastavničkom tonu, tehnički precizno. Konkretno:

1. **Svaki termin pri prvoj upotrebi u tekstu dobija engleski original u zagradi** — npr. alat (eng. *tool*), sažimanje (eng. *summarization*) — jer će čitalac na engleskom naići na ista imena u dokumentaciji i na poslu.
2. **Terminologija je dogovorena u [REČNIK-u](REČNIK.md)** — pre nego što u novom tekstu upotrebite termin, proverite kako glasi tamo; ako uvodite novi termin, dodajte ga i u REČNIK (uz modul u kome se pojavljuje).
3. **Bez ćirilice i bez ijekavice** u sadržaju — latinica i ekavica, dosledno.
4. Anegdote i primeri su dobrodošli; marketing-reči nisu. „Sjajan", „moćan" i sl. koristimo štedljivo — tačnost prodaje kurs, ne pridevi.

## Tehnička pravila za kod u vežbama

Vežbe su „komad kursa koji se pokreće", pa važe pravila:

1. **Ključevi i konfiguracija isključivo iz environment varijabli** — `Z_AI_API_KEY` (obavezno), `Z_AI_BASE_URL` i `Z_AI_MODEL` (opciono), za ugnežđivanje `Z_AI_EMBED_MODEL`. Nikad ključ u kodu, nikad `.env` u Git.
2. **OpenAI-kompatibilan interfejs** (podrazumevano z.ai/GLM: base `https://api.z.ai/api/paas/v4`, model `glm-4.6`) — kod treba da radi sa bilo kojim provajderom istog interfejsa promenom dve vrednosti.
3. **Bezbedne navike od prve vežbe:** nikad `eval` (računanje preko `ast`), pristup fajlovima samo unutar `sandbox/` direktorijuma, mrežni pozivi sa fiksiranom adresom i `timeout`, greška alata vraća se modelu kao tekst (`GREŠKA: ...`), a ne prekida program.
4. **Kod se piše za čitanje:** imenik funkcija na srpskom bez dijakritika (`procitaj_fajl`, `podeli_na_odlomke`), komentari i ispisi sa dijakritikama, kratki blokovi sa jasnom svrhom.

## Provera pre slanja pull request-a

1. **Linkovi:** svi relativni linkovi u izmenjenim `.md` fajlovima vode na fajlove koji postoje (posebno posle premeštanja/preimenovanja).
2. **Python blokovi kompajliraju:** izdvojite svaki ```python blok i `python -m py_compile` — svaki blok u modulu/radionici mora proći (fragmenti namenjeni umetanju u postojeću funkciju pišite kao komentar ili kao potpunu funkciju).
3. **Jezik:** bez ćirilice i ijekavica (brza pretraga: `vrijeme|mjesto|čovjek|gdje|...`); termini usklađeni sa REČNIK-om.
4. **Bez tajni:** pretražite dif po obrascima ključeva (`sk-...`); `.env` nikad ne ide u commit.
5. **Originalnost:** ništa se ne kopira, ne prevodi niti prilagođava iz kurseva sa nekompatibilnom licencom (hard pravilo: datawhalechina/hello-agents je CC BY-NC-SA — ne diramo njegov tekst; samo redosled tema je inspiracija).
6. **Sajt:** ako izmena dira bilo šta što se renderuje (module, radionice, radionicu, MAPA-UCENJA, REČNIK, O-AUTORU, README), pokrenite `npm run build` i uključite novi `docs/` u isti *pull request* — `npm run check` prolazi samo kad je `docs/` svež.

Ako nešto od ovoga ne umejte da proverite — pošaljite *pull request* kakav jeste i pitajte; rado pomažemo, a to je i prilika da vodič učinimo boljim.

## Tok doprinosa, ukratko

1. *Fork* repozitorijuma (ili granu), izmene po pravilima iznad, u logičkim malim koracima.
2. Commit poruka: kratko **šta** i **zašto** — npr. „Ispraviti primer kosinusne sličnosti u modulu 04 (nedostajao je nazivnik)".
3. Otvorite *pull request* sa opisom: šta menja, zašto, kako provereno.
4. Prva izmena nekog od održavalaca je obično pitanje o jeziku ili terminologiji — ne lično, pravila su tu da tekst ostane jedan kurs, a ne zbornik glasova.

## Licenca doprinosa

Doprinosi se objavljuju pod istom licencom kao i ceo kurs — [CC BY 4.0](LICENSE) — da bi materijal ostao slobodan za korišćenje i prilagođavanje uz navođenje izvora. Pitanja? Otvorite *issue* — najprostiji je često i najbolji.
