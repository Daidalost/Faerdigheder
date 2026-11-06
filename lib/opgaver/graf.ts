import type { Linje, NiveauId, Opgave } from "../typer";
import { heltal, vaelg, type Rng } from "../tilfaeldig";
import { forskrift, ikkeNul, ip, koordinatsystem, punkt, tal, valgOpgave } from "./algebra";

/**
 * Graf og forskrift: hvilken forskrift passer til grafen eller til en
 * beskrivelse af linjen?
 *
 * Mønstrene fra prøvesættene — alle som "Sæt X":
 *   Graf → "Hvilken ligning beskriver linjen m?"                    (maj 21 opg. 9)
 *   "Min graf er en ret linje. Den skærer y-aksen i 3."             (dec 22 opg. 16)
 *   "Stigningstallet 5 og går gennem (0,0)" / "(0,6) og (3,0)"       (dec 23 opg. 17)
 *   "Går gennem (0,3) og (1,5)" / "parallel med y = 3x + 2 og
 *    skærer x-aksen i (2,0)"                                          (dec 24 opg. 17)
 *   "Hældningstallet 2" / "skærer y-aksen i (0,3)"                   (dec 25 opg. 14)
 *
 * Distraktorerne er dem, prøven selv bruger: a og b byttet om, forkert
 * fortegn, og koordinaterne sat direkte ind som tal i forskriften.
 */

const NAVNE = ["l", "m", "s", "t"];

/** Gitterpunkter på linjen inden for vinduet. */
function gitter(l: Linje, x: [number, number], y: [number, number]) {
  let n = 0;
  for (let i = x[0]; i <= x[1]; i++) {
    const v = l.a * i + l.b;
    if (Math.abs(v - Math.round(v)) < 1e-9 && v >= y[0] && v <= y[1]) n++;
  }
  return n;
}

const LINJE_HINT = (a: number, b: number) =>
  `Se hvor linjen skærer y-aksen: b = ${tal(b)}. Gå 1 til højre fra et gitterpunkt på linjen — linjen ${a > 0 ? "stiger" : "falder"} ${tal(Math.abs(a))}, så a = ${tal(a)}. Forskriften er ${forskrift(a, b)}.`;

// ---------------------------------------------------------- opgavetyper

function voksende(rng: Rng): Opgave {
  const x: [number, number] = [-4, 5];
  const y: [number, number] = [-4, 6];
  let l: Linje;
  do {
    l = { a: vaelg(rng, [-3, -2, -1, 0, 1, 2, 3]), b: heltal(rng, -3, 5) };
  } while (gitter(l, x, y) < 3);
  const svar = l.a > 0 ? "Voksende" : l.a < 0 ? "Aftagende" : "Vandret";
  const navn = vaelg(rng, NAVNE);
  return {
    noegle: `graf:voks:${l.a}:${l.b}:${navn}`,
    slags: "valg",
    optakt: "Se på grafen",
    spoergsmaal: `Er linjen ${navn} voksende, aftagende eller vandret?`,
    figur: koordinatsystem(x, y, [{ ...l, navn, farve: "terra" }]),
    svar,
    valg: ["Voksende", "Aftagende", "Vandret"],
    strategi: "Læs fra venstre mod højre",
    hint: `Følg linjen fra venstre mod højre, ligesom når du læser. Går den op, er den voksende (a er positiv). Går den ned, er den aftagende (a er negativ). Her er a = ${tal(l.a)}.`,
  };
}

/** To eller tre linjer i samme koordinatsystem. Hvilken har forskriften …? */
function hvilkenLinje(rng: Rng, niveau: NiveauId): Opgave {
  const x: [number, number] = niveau === "bronze" ? [0, 6] : [-4, 5];
  const y: [number, number] = niveau === "bronze" ? [0, 10] : [-5, 7];
  const antal = 3;
  const linjer: Linje[] = [];
  const farver: Linje["farve"][] = ["terra", "blaa", "teal"];
  let vagt = 0;
  while (linjer.length < antal && vagt++ < 500) {
    const l: Linje =
      niveau === "bronze"
        ? { a: heltal(rng, 1, 3), b: heltal(rng, 0, 5) }
        : { a: ikkeNul(rng, -3, 3), b: heltal(rng, -4, 5) };
    if (gitter(l, x, y) < 3) continue;
    if (linjer.some((m) => m.a === l.a || m.b === l.b)) continue;
    linjer.push({ ...l, navn: NAVNE[linjer.length], farve: farver[linjer.length] });
  }
  if (linjer.length < antal) return hvilkenLinje(rng, niveau);
  const facit = vaelg(rng, linjer);
  return {
    noegle: `graf:hvilken:${linjer.map((l) => `${l.a},${l.b}`).join("|")}:${facit.navn}`,
    slags: "valg",
    optakt: "Se på graferne",
    spoergsmaal: `Hvilken af linjerne har forskriften ${forskrift(facit.a, facit.b)}?`,
    figur: koordinatsystem(x, y, linjer),
    svar: facit.navn!,
    valg: linjer.map((l) => l.navn!),
    strategi: "Start med b",
    hint: `b = ${tal(facit.b)}, så linjen skal skære y-aksen i ${tal(facit.b)}. Det er kun linje ${facit.navn}, der gør det. Tjek a bagefter: den ${facit.a > 0 ? "stiger" : "falder"} ${tal(Math.abs(facit.a))} for hver gang x vokser med 1.`,
  };
}

/** Graf → forskrift. Bronze: kun voksende. Guld: prøvens distraktorer. */
function grafTilForskrift(rng: Rng, niveau: NiveauId): Opgave {
  const x: [number, number] = niveau === "bronze" ? [0, 6] : [-3, 5];
  const y: [number, number] = niveau === "bronze" ? [0, 10] : [-3, 7];
  let a = 0;
  let b = 0;
  do {
    if (niveau === "bronze") {
      a = heltal(rng, 1, 3);
      b = heltal(rng, 1, 5);
    } else if (niveau === "soelv") {
      a = ikkeNul(rng, -3, 3);
      b = ikkeNul(rng, -2, 5);
    } else {
      a = vaelg(rng, [-4, -3, -2, -1, 2, 3, 4]);
      b = heltal(rng, 1, 6);
    }
  } while (a === b || gitter({ a, b }, x, y) < 2);
  const andre =
    niveau === "bronze"
      ? [forskrift(b, a), forskrift(a + 1, b), forskrift(a, b + 1), forskrift(a, 0), forskrift(1, b)]
      : niveau === "soelv"
        ? [forskrift(-a, b), forskrift(b, a), forskrift(a, -b), forskrift(-a, -b), forskrift(b, -a)]
        : [forskrift(b, a), forskrift(-b, -a), forskrift(-a, b), forskrift(1 / a, b), forskrift(a, -b)];
  const navn = vaelg(rng, NAVNE);
  return valgOpgave(
    {
      noegle: `graf:mc:${a}:${b}:${niveau}:${navn}`,
      optakt: "Sæt X",
      spoergsmaal: `Hvilken ligning beskriver linjen ${navn}?`,
      figur: koordinatsystem(x, y, [{ a, b, navn, farve: "terra" }]),
      svar: forskrift(a, b),
      andre,
      strategi: "Find b først, så a",
      hint: LINJE_HINT(a, b),
    },
    rng,
  );
}

/** dec 25 opg. 14 og dec 23 opg. 17.1: én oplysning → kun én forskrift passer. */
function enOplysning(rng: Rng): Opgave {
  const slags = heltal(rng, 1, 3);
  if (slags === 1) {
    // "Linjen har hældningstallet a."
    const a = ikkeNul(rng, -5, 6);
    const c = heltal(rng, 2, 7);
    const svar = rng() < 0.5 ? forskrift(a, 0) : forskrift(a, c === Math.abs(a) ? c + 1 : c);
    return valgOpgave(
      {
        noegle: `graf:haeld:${a}:${svar}`,
        optakt: "Sæt X",
        spoergsmaal: `En ret linje har hældningstallet ${tal(a)}. Hvilken ligning kan passe?`,
        svar,
        // Ingen distraktor må have hældningstallet a — ellers er der to rigtige.
        andre: [
          ...[forskrift(1, a), forskrift(0, a), forskrift(-a, 0), forskrift(c, a)].filter(
            (_, i) => [1, 0, -a, c][i] !== a,
          ),
          `y = x² ${a < 0 ? "−" : "+"} ${tal(Math.abs(a))}`,
        ],
        strategi: "Hældningstallet står foran x",
        hint: `I y = ax + b er hældningstallet a — tallet foran x. Det skal være ${tal(a)}. Pas på dem, hvor ${tal(a)} står alene: så er det b.`,
      },
      rng,
    );
  }
  if (slags === 2) {
    // "Linjen skærer y-aksen i punktet (0 ; b)."
    const b = ikkeNul(rng, -6, 7);
    const a = vaelg(rng, [1, 2, 3, -1, -2]);
    return valgOpgave(
      {
        noegle: `graf:yskaer:${a}:${b}`,
        optakt: "Sæt X",
        spoergsmaal: `En ret linje skærer y-aksen i punktet ${punkt(0, b)}. Hvilken ligning kan passe?`,
        svar: forskrift(a, b),
        andre: [forskrift(b, 0), forskrift(b, -b), forskrift(-b, 0), `y = ${tal(b / 10)}x`, forskrift(a, -b)],
        strategi: "Sæt x = 0",
        hint: `På y-aksen er x = 0. Sæt x = 0 ind i hver forskrift: kun ${forskrift(a, b)} giver y = ${tal(b)}.`,
      },
      rng,
    );
  }
  // "Linjen har stigningstallet a og går gennem (0 ; 0)."
  const a = ikkeNul(rng, -5, 7);
  return valgOpgave(
    {
      noegle: `graf:origo:${a}`,
      optakt: "Sæt X",
      spoergsmaal: `En ret linje har stigningstallet ${tal(a)} og går gennem ${punkt(0, 0)}. Hvilken ligning passer?`,
      svar: forskrift(a, 0),
      andre: [forskrift(a, -a), forskrift(0, a), forskrift(1, 0), forskrift(1, a), forskrift(-a, 0)],
      strategi: "Gennem (0 ; 0) betyder b = 0",
      hint: `Går linjen gennem (0 ; 0), skærer den y-aksen i 0, så b = 0. Stigningstallet står foran x: ${forskrift(a, 0)}.`,
    },
    rng,
  );
}

/** dec 22 opg. 16: ret linje eller ej — men samme skæring med y-aksen. */
function retLinje(rng: Rng): Opgave {
  const b = heltal(rng, 2, 7);
  const ret = rng() < 0.5;
  if (ret) {
    return valgOpgave(
      {
        noegle: `graf:ret:${b}`,
        optakt: "Sæt X",
        spoergsmaal: `Grafen er en ret linje, og den skærer y-aksen i ${b}. Hvilken ligning passer?`,
        svar: forskrift(1, b),
        andre: [`y = x² + ${b}`, forskrift(b, 0), forskrift(1, -b), `y = x/${b}`],
        strategi: "Ret linje: x uden potens",
        hint: `En ret linje har forskriften y = ax + b — x må ikke være i anden. Den skal skære y-aksen i ${b}, så b = ${b}: ${forskrift(1, b)}.`,
      },
      rng,
    );
  }
  return valgOpgave(
    {
      noegle: `graf:ikkeret:${b}`,
      optakt: "Sæt X",
      spoergsmaal: `Grafen er ikke en ret linje, men den skærer y-aksen i ${b}. Hvilken ligning passer?`,
      svar: `y = x² + ${b}`,
      andre: [forskrift(2, -b), `y = ${b}x²`, forskrift(-b, b), `y = x/${b}`],
      strategi: "x² giver en bue",
      hint: `Når x står i anden (x²), bliver grafen en bue, ikke en ret linje. Og ved x = 0 giver y = x² + ${b} præcis ${b}. ${b}x² er også en bue, men den går gennem (0 ; 0).`,
    },
    rng,
  );
}

/** Guld: beskrivelser fra dec 23 og dec 24 opg. 17. */
function beskrivelseGuld(rng: Rng): Opgave {
  const slags = heltal(rng, 1, 3);
  if (slags === 1) {
    // "Går gennem (0 ; b) og (1 ; a + b)."
    let a = 0;
    let b = 0;
    do {
      a = ikkeNul(rng, -3, 5);
      b = heltal(rng, 1, 6);
    } while (a === b || a + b === 0 || a + b === 1);
    return valgOpgave(
      {
        noegle: `graf:topunkt:0:${b}:1:${a + b}`,
        optakt: "Sæt X",
        spoergsmaal: `Linjen går både gennem ${punkt(0, b)} og ${punkt(1, a + b)}. Hvilken ligning passer?`,
        svar: forskrift(a, b),
        andre: [forskrift(a + b, b), forskrift(1, a + b - 1), forskrift(b, b), forskrift(a + b, 1), forskrift(b, a)],
        strategi: "Fra x = 0 til x = 1 er ændringen a",
        hint: `${punkt(0, b)} ligger på y-aksen, så b = ${b}. Fra x = 0 til x = 1 går y fra ${b} til ${a + b} — det er en ændring på ${tal(a)}, så a = ${tal(a)}.`,
      },
      rng,
    );
  }
  if (slags === 2) {
    // "Skærer y-aksen i (0 ; m) og x-aksen i (k ; 0)."
    let k = 0;
    let a = 0;
    do {
      k = heltal(rng, 2, 6);
      a = vaelg(rng, [-1, -2, -3, -4]);
    } while (-a * k > 12 || -a * k < 4 || -a === k);
    const m = -a * k;
    return valgOpgave(
      {
        noegle: `graf:akser:${k}:${m}`,
        optakt: "Sæt X",
        spoergsmaal: `Linjen skærer y-aksen i ${punkt(0, m)} og x-aksen i ${punkt(k, 0)}. Hvilken ligning passer?`,
        svar: forskrift(a, m),
        andre: [forskrift(m, k), forskrift(k, m), forskrift(-a, -m), forskrift(m, a), forskrift(-a, m)],
        strategi: "Fra y-aksen ned til x-aksen",
        hint: `b = ${m}, fordi linjen skærer y-aksen der. På vejen fra x = 0 til x = ${k} falder y fra ${m} til 0 — det er ${m} på ${k} skridt, altså ${tal(-a)} pr. skridt. Linjen falder, så a = ${tal(a)}.`,
      },
      rng,
    );
  }
  // "Parallel med y = cx + d, men skærer x-aksen i (k ; 0)."
  let c = 0;
  let d = 0;
  let k = 0;
  do {
    c = ikkeNul(rng, -4, 4);
    d = ikkeNul(rng, -5, 5);
    k = ikkeNul(rng, -4, 5);
  } while (-c * k === d || Math.abs(c) === Math.abs(k) || Math.abs(c * k) > 16);
  const b = -c * k;
  return valgOpgave(
    {
      noegle: `graf:parallel:${c}:${d}:${k}:0`,
      optakt: "Sæt X",
      spoergsmaal: `Linjen er parallel med ${forskrift(c, d)}, men skærer x-aksen i ${punkt(k, 0)}. Hvilken ligning passer?`,
      svar: forskrift(c, b),
      andre: [forskrift(-c, d), forskrift(c, -b), forskrift(k, c), forskrift(-c, -b), forskrift(c, k)],
      strategi: "Parallel = samme a",
      hint: `Parallelle linjer har samme hældningstal, så a = ${tal(c)}. Punktet ${punkt(k, 0)} skal passe: 0 = ${tal(c)} · ${ip(k)} + b, så b = ${tal(b)}.`,
    },
    rng,
  );
}

// ------------------------------------------------------------ platin

/** Hældningen er en brøk og skal aflæses over flere tern. */
function brokHaeldning(rng: Rng): Opgave {
  const x: [number, number] = [-6, 6];
  const y: [number, number] = [-5, 6];
  let a = 0;
  let b = 0;
  do {
    a = vaelg(rng, [1 / 2, -1 / 2, 1 / 3, -1 / 3, 2 / 3, -2 / 3, 3 / 2, -3 / 2]);
    b = ikkeNul(rng, -3, 4);
  } while (gitter({ a, b }, x, y) < 3);
  const navn = vaelg(rng, NAVNE);
  return valgOpgave(
    {
      noegle: `graf:mc:${a}:${b}:platin:${navn}`,
      optakt: "Sæt X",
      spoergsmaal: `Hvilken ligning beskriver linjen ${navn}?`,
      figur: koordinatsystem(x, y, [{ a, b, navn, farve: "lilla" }]),
      svar: forskrift(a, b),
      andre: [forskrift(1 / a, b), forskrift(-a, b), forskrift(a, -b), forskrift(-1 / a, b), forskrift(b, a)],
      strategi: "Find to gitterpunkter på linjen",
      hint: `b = ${tal(b)}. Find to punkter, hvor linjen rammer et gitterkryds præcist. Tæl hvor langt du går til siden, og hvor meget op eller ned: a = (op/ned) : (til siden). Her er a = ${forskriftA(a)}, så ${forskrift(a, b)}.`,
    },
    rng,
  );
}

const forskriftA = (a: number) => forskrift(a, 0).slice(4).replace("x", "");

/** Gennem to vilkårlige punkter — ingen af dem på y-aksen. */
function toVilkaarlige(rng: Rng): Opgave {
  for (;;) {
    const a = vaelg(rng, [-3, -2, -1, 1, 2, 3, 0.5, -0.5, 1.5]);
    const b = heltal(rng, -6, 8);
    const x1 = heltal(rng, 1, 4);
    const x2 = x1 + vaelg(rng, [2, 4]);
    const y1 = a * x1 + b;
    const y2 = a * x2 + b;
    if (!Number.isInteger(y1) || !Number.isInteger(y2) || b === 0 || a === b) continue;
    return valgOpgave(
      {
        noegle: `graf:topunkt:${x1}:${y1}:${x2}:${y2}`,
        optakt: "Sæt X",
        spoergsmaal: `Linjen går gennem ${punkt(x1, y1)} og ${punkt(x2, y2)}. Hvilken ligning passer?`,
        svar: forskrift(a, b),
        andre: [
          forskrift(y2 - y1, b),
          forskrift(a, y1),
          forskrift(-a, b),
          forskrift((x2 - x1) / (y2 - y1), b),
          forskrift(a, b + a),
        ],
        strategi: "a = ændring i y : ændring i x",
        hint: `a = (${tal(y2)} − ${ip(y1)}) : (${x2} − ${x1}) = ${tal(a)}. Sæt ${punkt(x1, y1)} ind: ${tal(y1)} = ${tal(a)} · ${x1} + b, så b = ${tal(b)}.`,
      },
      rng,
    );
  }
}

/** Parallel med en linje og gennem et punkt, der ikke ligger på en akse. */
function parallelGennem(rng: Rng): Opgave {
  for (;;) {
    const c = ikkeNul(rng, -4, 4);
    const d = ikkeNul(rng, -6, 6);
    const px = ikkeNul(rng, -4, 5);
    const b = heltal(rng, -8, 10);
    const py = c * px + b;
    if (b === d || b === 0 || py === 0 || Math.abs(py) > 20) continue;
    return valgOpgave(
      {
        noegle: `graf:parallel:${c}:${d}:${px}:${py}`,
        optakt: "Sæt X",
        spoergsmaal: `Linjen er parallel med ${forskrift(c, d)} og går gennem ${punkt(px, py)}. Hvilken ligning passer?`,
        svar: forskrift(c, b),
        andre: [forskrift(c, py), forskrift(c, d), forskrift(-c, py + c * px), forskrift(px, py), forskrift(c, py + c * px)],
        strategi: "Samme a — find b med punktet",
        hint: `Parallel betyder samme hældningstal: a = ${tal(c)}. Sæt punktet ind: ${tal(py)} = ${tal(c)} · ${ip(px)} + b, så b = ${tal(py)} − ${ip(c * px)} = ${tal(b)}.`,
      },
      rng,
    );
  }
}

/** Skæring med begge akser, hvor hældningen bliver en brøk. */
function akserBroek(rng: Rng): Opgave {
  for (;;) {
    const k = ikkeNul(rng, -8, 8);
    const m = ikkeNul(rng, -6, 6);
    const a = -m / k;
    if (Number.isInteger(a) || Math.abs(a) > 3) continue;
    const ok = [2, 3, 4].some((n) => Number.isInteger(a * n));
    if (!ok) continue;
    return valgOpgave(
      {
        noegle: `graf:akser:${k}:${m}`,
        optakt: "Sæt X",
        spoergsmaal: `Linjen skærer y-aksen i ${punkt(0, m)} og x-aksen i ${punkt(k, 0)}. Hvilken ligning passer?`,
        svar: forskrift(a, m),
        andre: [forskrift(-a, m), forskrift(1 / a, m), forskrift(-1 / a, m), forskrift(a, k), forskrift(m, k)],
        strategi: "Ændring i y : ændring i x",
        hint: `b = ${tal(m)}. Fra ${punkt(0, m)} til ${punkt(k, 0)} ændres y med ${tal(-m)}, mens x ændres med ${tal(k)}. a = ${tal(-m)} : ${tal(k)} = ${forskriftA(a)}.`,
      },
      rng,
    );
  }
}

// -------------------------------------------------------------- samlet

export function lavGraf(rng: Rng, niveau: NiveauId): Opgave {
  if (niveau === "bronze") {
    switch (heltal(rng, 1, 3)) {
      case 1:
        return voksende(rng);
      case 2:
        return hvilkenLinje(rng, niveau);
      default:
        return grafTilForskrift(rng, niveau);
    }
  }
  if (niveau === "soelv") {
    switch (heltal(rng, 1, 4)) {
      case 1:
        return grafTilForskrift(rng, niveau);
      case 2:
        return enOplysning(rng);
      case 3:
        return retLinje(rng);
      default:
        return hvilkenLinje(rng, niveau);
    }
  }
  if (niveau === "guld") {
    switch (heltal(rng, 1, 3)) {
      case 1:
        return grafTilForskrift(rng, niveau);
      case 2:
        return beskrivelseGuld(rng);
      default:
        return rng() < 0.5 ? beskrivelseGuld(rng) : enOplysning(rng);
    }
  }
  switch (heltal(rng, 1, 4)) {
    case 1:
      return brokHaeldning(rng);
    case 2:
      return toVilkaarlige(rng);
    case 3:
      return parallelGennem(rng);
    default:
      return akserBroek(rng);
  }
}
