# Radionica 02 — Alati i tool use: dajemo modelu ruke

> **Povezani modul:** [modul 02 — Alati: kako agent deluje u svetu](../MAPA-UCENJA.md)
> **Trajanje:** 4 časa · **Format:** predavanje 25% / vežbe 75% · **Nivo: srednji**

## Cilj radionice

Učesnici definišu alate (eng. *tools*) tako da ih model pouzdano koristi, implementiraju petlju „model traži — kod izvršava — rezultat se vraća modelu" i stiču kritički pogled na bezbednost izvršavanja. Rezultat radionice: bot sa dva do tri alata (vreme, računanje, čitanje fajla) koji odgovara korisniku koristeći stvarne podatke.

## Agenda po satima

| Sat | Sadržaj |
|---|---|
| **1. sat** | Zašto alati: ograničenja čistog modela, šta je poziv alata (eng. *tool call*) (25 min). Anatomija definicije alata: ime, opis, šema parametara — zašto je *opis* deo interfejsa koji model čita (35 min). |
| **2. sat** | Zajedno: prvi alat — funkcija za trenutno vreme u gradu; povezivanje sa `chat.completions` pozivom iz radionice 01 (50 min). Pauza — pitanja (10 min). |
| **3. sat** | Vežba: dodavanje drugog i trećeg alata (kalkulator, čitanje lokalnog fajla) (50 min). Kratki ulomak: šta se dešava kada model zatraži pogrešan parametar — validacija i vraćanje greške *modelu*, ne čoveku (10 min). |
| **4. sat** | Vežba: „stres test" — tri namerno dvosmerna pitanja gde model bira pogrešan alat ili pogrešne argumente; popravka opisa alata dok se ponašanje ne popravi (45 min). Diskusija: bezbednost — ko sme da pokreće šta; zatvaranje (15 min). |

## Vežbe

1. **Prvi alat (50 min):** funkcija `vreme_u_gradu(grad)` (može i „suvi" izvor — fajl sa podacima, da ne pravimo naloge za servis vremena); definicija alata u formatu koji API očekuje; ručno izvršavanje zahteva i vraćanje rezultata u novi poziv.
2. **Više alata (50 min):** dodati `izracunaj(izraz)` (bezbedno, samo preko `ast`-a ili slično — nikad `eval`!) i `procitaj_fajl(putanja)`; pustiti model da sam bira.
3. **Stres test (45 min):** voditelj daje pitanja-tipa zamke („koliko je sati kod nas ako u Tokiju…" + argument koji ne postoji); učesnici dijagnostikuju: je li problem u opisu alata, šemi ili promptu — i popravljaju.

## Domaći

- Dodati četvrti alat po sopstvenom izboru (npr. pretraga lokalnih beleški) i napisati u README zašto je opis alata napisan baš tako.
- Zapisati tri situacije u kojima je model pogrešio i šta je pomoglo (opis? primer u opisu? validacija?) — ovo je prva „evaluacija" koju radimo, samo ručna.
- Pripremiti jedno pitanje za diskusiju na početku sledeće radionice.

## Materijali — checklist za učesnike

- [ ] odrađena [radionica 01](radionica-01-prvi-koraci.md) / umeće poziva API-ju iz Pythona;
- [ ] repozitorijum sa vežbama iz radionice 01 (ključ i dalje samo u environment varijabli);
- [ ] pročitana sekcija 5 modula 01 (petlja poziva) — modul 02 u izradi, radionica je samostalna;
- [ ] Python 3.10+, `openai` biblioteka instalirana;
- [ ] slobodnih ~200 MB i živaca za eksperimentisanje. 🙂

## Za voditelja

- „Suvi" izvori podataka (fajlovi umesto mrežnih API-ja) drže fokus na *tool use*, a ne na registracije servisa.
- Zastavica bezbednosti: svaki primer koji dira fajl sistem radimo u zasebnom direktorijumu `radionica02-sandbox/` — navika od prvog dana.
