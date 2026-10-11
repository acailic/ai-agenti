# Radionica 03 — Agent od nule: petlja odlučivanja bez frameworka

> **Povezani modul:** [modul 03 — Agent od nule](../moduli/modul-03-agent-od-nule.md)
> **Trajanje:** 4 časa · **Format:** predavanje 20% / vežbe 80% · **Nivo: srednji**

## Cilj radionice

Svakom učesniku, iz početka i bez frameworka, izlazi sopstveni agent: petlja (eng. *agent loop*) u kojoj model razmišlja, zatraži alat, dobije rezultat, i ponavlja dok ne završi zadatak. Ključna spoznaja radionice: agent je **program sa ~100 linija** koji bi svaki učesnik umeo da objasni liniju po liniju — frameworki samo slažu iste delove umesto vas.

## Agenda po satima

| Sat | Sadržaj |
|---|---|
| **1. sat** | Ponovimo: alati iz radionice 02 (15 min). Petlja agenta: opažaj → razmišljaj → deluj (eng. *perceive–think–act*), na crtežu i u pseudokodu (30 min). Zajedno: skelet petlje — `while True` sa tri izlaza (alat / finalni odgovor / prekidač) (15 min). |
| **2. sat** | Vežba: dovođenje petlje do života — agent koji rešava zadatak „sredi ovaj direktorijum": lista fajlove, čita, preimenuje uz potvrdu (60 min). |
| **3. sat** | Vežba nastavak + bezbednosna ograničenja: maksimalan broj koraka, lista dozvoljenih operacija, zaustavljanje na konstantan budžet tokena (50 min). Kratko: gde petlja „pukne" — slučajevi beskonačnog ponavljanja i kako ih preseći (10 min). |
| **4. sat** | Zajednička autopsija: log jednog trajekta agenta (poruke, odluke, troškovi) — čitanje traga (eng. *trace*) kao veština (30 min). Diskusija: šta bi ovde uradio framework, i da li bi nam pomoglo (20 min). Zatvaranje i domaći (10 min). |

## Vežbe

1. **Skelet petlje (45 min):** od pseudokoda do koda; tri izlaza iz iteracije; odštampani svaki korak (izabrani alat, argumenti, rezultat) — vidljiva petlja je pola razumevanja.
2. **Agent za red u direktorijumu (75 min):** alati `listaj`, `procitaj`, `preimenuj_uz_potvrdu`; zadatak dat u prvoj `user` poruci; agent sam planira redosled.
3. **Ograničenja (50 min):** dodati `max_koraka` i „budžet" tokena; obavezna ljudska potvrda pre destruktivnih operacija (eng. *human in the loop*).

## Domaći

- Proširiti agenta sa jednim alatom po izboru i pokrenuti ga na tri različita zadatka; zapisati gde je odstupio od plana i zašto.
- Isključiti ograničenje `max_koraka` (namerno!) i dokumentovati šta se desilo sa troškom posle 30+ koraka — bolje sada, na 50 dinara, nego posle na 50 evra.
- Za napredne: sažeti istoriju razgovora kada pređe N tokena (prvi susret sa modulom 05).

## Materijali — checklist za učesnike

- [ ] odrađene radionice 01 i 02 (alati rade, ključ u environment varijabli);
- [ ] test direktorijum `radionica03-sandbox/` sa 5–10 „neurednih" fajlova (može i generisanih);
- [ ] moduli 01 i 02 odrađeni (alati rade, ključ u environment varijabli); [modul 03](../moduli/modul-03-agent-od-nule.md) preporučen pre radionice;
- [ ] čitav rad u virtuelnom okruženju, projekat u Git-u (ovo je već navika, zar ne?).

## Za voditelja

- Poruka radionice koju ponoviti tri puta: **nije magija, petlja je.** Kada je učesnici jednom napišu, frameworki postaju izbor, a ne misterija.
- Sandbox obavezno pratiti `git init`-om u njemu — najlakši „undo" za čitav direktorijum.
