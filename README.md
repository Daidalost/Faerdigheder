# Færdighedsappen

Træningsapp til matematik uden hjælpemidler, 8. klasse med sigte mod FP9.
Bygget som et Next.js-projekt, der kan lægges direkte på GitHub og deployes
på Vercel uden konfiguration.

Opgaverne genereres i browseren efter mønstrene i prøvesættene 2020–2026 —
der er ingen fast opgavebank, så to elever ved siden af hinanden får ikke
det samme sæt.

---

## Kom i gang

```bash
npm install     # installerer afhængigheder
npm run dev     # udviklingsserver på http://localhost:3000
npm run build   # produktionsbuild — skal passere før deploy
npm test        # regner alle genererede opgaver efter
```

### Læg det på GitHub

```bash
git init
git add .
git commit -m "Færdighedsappen: første version"
git branch -M main
git remote add origin git@github.com:<dit-brugernavn>/faerdighedsappen.git
git push -u origin main
```

### Deploy på Vercel

1. Gå til vercel.com → **Add New** → **Project**.
2. Vælg repoet. Vercel genkender Next.js selv.
3. Framework: Next.js · Build: `next build` · Output: standard. **Rør ikke ved noget.**
4. **Deploy**.

Der er ingen miljøvariabler, ingen database og ingen API-nøgler. Alt kører
i browseren, og alle 30 sider er statiske, så appen ligger på Vercels CDN.

---

## Sådan hænger det sammen

```
app/
  page.tsx                                      forside med de to kategorier
  kategori/[kategori]/page.tsx                  emnerne i en kategori
  kategori/[kategori]/[emne]/page.tsx           bronze / sølv / guld
  kategori/[kategori]/[emne]/[niveau]/page.tsx  selve runden
  globals.css                                   alle farver og mål ét sted
  layout.tsx, icon.svg, not-found.tsx

components/
  Forside.tsx, KategoriSide.tsx, EmneSide.tsx   oversigterne
  Runde.tsx                                     spørgsmål, svar og feedback
  Deler.tsx                                     toplinje, statuslinje, medaljer
  Ikoner.tsx                                    al grafik som SVG
  Konfetti.tsx                                  konfetti ved bestået runde

lib/
  katalog.ts        kategorier, emner, farver — start her, hvis du vil tilføje et emne
  typer.ts          datatyper og de to tal, der styrer det hele
  tilfaeldig.ts     tilfældighedsgenerator, dansk talformat, svarkontrol
  fremskridt.ts     localStorage, oplåsning og statusberegning
  feedback.ts       ros, opmuntring og opsamlingstekster
  opgaver/          én fil pr. emne + index.ts, der samler dem

scripts/
  test-generatorer.ts   uafhængig efterregning af alle opgaver
```

### Struktur i appen

**Forside** → to kategorier: Regnearterne og Enhedsomregning.
**Regnearterne** → addition, subtraktion, multiplikation, division.
**Enhedsomregning** → omregning og vurdering.
Hvert emne har tre niveauer: **bronze → sølv → guld**.

En runde er 5 opgaver. Med mindst 4 rigtige låses næste niveau op.
De to tal står i `lib/typer.ts`:

```ts
export const OPGAVER_PR_RUNDE = 5;
export const KRAEVEDE_RIGTIGE = 4;
```

### Fremskridt

Gemmes i browserens `localStorage` under nøglen `faerdighedsapp:fremskridt:v1`.
Eleven kan lukke computeren og fortsætte i næste time. Der er intet login og
ingen server, så fremskridtet følger **maskinen**, ikke personen — skifter
eleven computer, starter hun forfra. Det står der også på forsiden.

Vises fire steder: medaljer og pokal pr. emne, en pokaltæller øverst på
forsiden, en statuslinje pr. kategori og en samlet linje på forsiden.

---

## Hvor opgaverne kommer fra

Hver generator følger et mønster, jeg har fundet ved at gennemgå prøvesættene.
Tallene er valgt, så en standardalgoritme er den **langsomme** vej.

| Emne | Bronze | Sølv | Guld |
|---|---|---|---|
| Addition | 2-3 cifre, ét tal tæt på 100 | 3-4 cifre, tæt på 1000 | 4 cifre, som Opgave 5.1 |
| Subtraktion | tæl op, eller rund op til 40 | 3-4 cifre | som Opgave 5.2 |
| Multiplikation | 11-tabellen, ·25, ·50, fordobling | opdeling af faktoren | ombytning: 4·25, 125·8, 5·20 |
| Division | divisor 2-5, nul i kvotienten | divisor 6-9, halvering med 8 | femcifrede, som Opgave 5.4 |
| Omregning | ét spring, hele tal | én decimal | to decimaler og værdier under 1 |
| Vurdering | hvilken enhed passer | tættere valg + sammenligning | overslagsregning, som Opgave 8/9 |

**Guld er kalibreret til afgangsprøven.** Bronze og sølv ligger bevidst under,
fordi eleverne er i begyndelsen af 8. klasse.

To designtræk fra prøvesættene er bevaret med vilje:

- **Divisor er altid ét ciffer**, og dividenden kan skæres i dele, der går op.
- **Facit har næsten altid et nul inde i tallet** (5010, 502, 2006, 603, 706).
  Det rammer præcis "glemt nul"-fejlen.

### Hvor meget variation er der?

`npm test` måler det. Ved 4000 træk pr. kombination:

```
addition        bronze  2035    soelv  3778    guld  2166
subtraktion     bronze  1708    soelv  3883    guld  3782
multiplikation  bronze   371    soelv   802    guld   579
division        bronze   480    soelv   675    guld  2186
omregning       bronze   380    soelv   958    guld  2977
vurdering       bronze   643    soelv  1191    guld  2797
```

Selv den smalleste (multiplikation bronze, 371) giver over 6 milliarder mulige
femspørgsmålsrunder. Ingen elev møder de samme fem opgaver som sidemanden.

### Testen

`npm test` regner **hver eneste opgave efter uafhængigt af generatoren**:
regnestykker parses og udregnes forfra, og omregninger tjekkes mod en separat
enhedstabel. Den kontrollerer også, at facit er blandt svarmulighederne, at
ingen runde indeholder dubletter, og at hint og strategi altid er udfyldt.
Kør den, hver gang du ændrer en generator.

---

## Sådan ændrer du noget

**Tilføje et emne:** læg det ind i `lib/katalog.ts`, skriv en generator i
`lib/opgaver/`, og registrér den i `lib/opgaver/index.ts`. Ruterne og
fremskridtet følger automatisk med.

**Ændre sværhedsgraden:** tallene står i den enkelte generator som
`heltal(rng, min, maks)`. De er samlet i små, navngivne blokke — ét mønster
pr. `case`.

**Skifte farver:** alt ligger i `:root` i `app/globals.css`. Farverne er de
samme som i LaTeX-kompendierne (`kompendie.sty`), så app og papir hænger sammen.

**Ændre kravet for at låse op:** `KRAEVEDE_RIGTIGE` i `lib/typer.ts`.

**Skrifttyper:** Carlito og Poppins ligger som woff2 i `public/fonts/`
(95 KB i alt, kun de tegn der bruges). De indlæses med `next/font/local`,
så der er ingen kald til Google Fonts.

---

## Det visuelle lag

Al grafik er SVG skrevet direkte i koden — ingen billedfiler og ingen ikonpakke.

| Fil | Hvad |
|---|---|
| `components/Ikoner.tsx` | medaljer, pokal, lås, flueben, kryds, flamme |
| `components/Konfetti.tsx` | konfetti på canvas, ~60 linjer fysik, ingen pakke udefra |
| `app/globals.css` | alle keyframes samlet nederst i filen |

Medaljerne får deres metal fra `METAL`-tabellen øverst i `Ikoner.tsx`. To
farvestop pr. metal giver dybde uden at det bliver blank plastik. Guld vises
som pokal i stedet for medalje, så det tredje trin føles som noget andet end
"endnu en medalje".

**Hvornår der sker noget:**

- rigtigt svar: flueben der tegner sig selv, og prikken i toppen popper
- forkert svar: kortet ryster kort, og krydset vises
- tre rigtige i træk: en flammechip dukker op i hovedet
- bestået runde: konfetti, medaljen eller pokalen springer ind, og scoren tælles op
- nyt niveau åbnet: et enkelt glimt hen over kortet, næste gang du ser listen

Konfetti fyres kun ved en **bestået runde** — ikke ved hvert rigtigt svar.
Ellers holder det op med at betyde noget.

Hele animationslaget slår fra af sig selv, hvis eleven har "reducér bevægelse"
slået til i styresystemet. Der er ingen lyd; i et klasselokale med 26 elever
er det en fordel.

---

## Kendte begrænsninger

- Fremskridt følger browseren. Skal flere elever dele en computer, eller skal
  læreren kunne se klassens data, kræver det login og en database — det er et
  større skridt end det her.
- Vurderingsopgaverne på bronze og sølv trækker fra en bank af virkelige
  størrelser (42 + 16 poster). Den del kan ikke genereres, så vil du have
  flere, skal de skrives ind i `lib/opgaver/vurdering.ts`.
- Der er ingen tidtagning. Prøven er på tid, så det er en oplagt næste ting.
