import type { Linje, NiveauId, Opgave } from "../typer";
import { bland, heltal, vaelg, type Rng } from "../tilfaeldig";
import {
  forskrift,
  ikkeNul,
  koefficient,
  koordinatsystem,
  punkt,
  punktOpgave,
  tal,
  talOpgave,
  valgOpgave,
} from "./algebra";

/**
 * Aflæs grafen: koordinatsæt, skæring med akserne og skæringspunktet
 * mellem to linjer.
 *
 * Mønstrene fra prøvesættene:
 *   "Hvad er koordinatsættet til punktet P?" — Sæt X     (dec 21, maj 25, maj 26, opg. 14.1)
 *   "Hvilken ligning går gennem punktet Q?" — Sæt X      (dec 21, maj 25, maj 26, opg. 14.2)
 *   "Linjen s skærer y-aksen i punktet ( ; )"            (dec 20 opg. 13.1, dec 24 opg. 14.1)
 *   "Linjerne skærer hinanden uden for tegningen" ( ; )  (dec 20 opg. 13.2, dec 24 opg. 14.2)
 *
 * Bronze = 7. klasse, sølv = 8. klasse, guld = prøveniveau, platin = over.
 * Til og med guld er alle facit hele tal.
 */

const NAVNE = ["P", "Q", "A", "B", "R"];

const HINT_KOORDINAT = (x: number, y: number) =>
  `Start i (0 ; 0). Gå først vandret hen til x = ${tal(x)}, og så lodret til y = ${tal(y)}. Koordinatsættet skrives (x ; y) — x først.`;

// ------------------------------------------------------------ hjælpere

/** Antal gitterpunkter på linjen inde i vinduet — mindst to, ellers kan hældningen ikke aflæses. */
function gitterpunkter(l: Linje, x: [number, number], y: [number, number]): number {
  let n = 0;
  for (let i = x[0]; i <= x[1]; i++) {
    const v = l.a * i + l.b;
    if (Number.isInteger(v) && v >= y[0] && v <= y[1]) n++;
  }
  return n;
}

function koordinatsaet(rng: Rng, x: [number, number], y: [number, number], ikkeAkse: boolean) {
  for (;;) {
    const px = heltal(rng, x[0], x[1] - 1);
    const py = heltal(rng, y[0], y[1] - 1);
    if (px === 0 && py === 0) continue;
    if (ikkeAkse && (px === 0 || py === 0)) continue;
    return { px, py };
  }
}

// ---------------------------------------------------------- opgavetyper

function aflaesPunkt(rng: Rng, x: [number, number], y: [number, number], ikkeAkse: boolean): Opgave {
  const { px, py } = koordinatsaet(rng, x, y, ikkeAkse);
  const navn = vaelg(rng, NAVNE);
  return punktOpgave({
    noegle: `aflaes:punkt:${px}:${py}:${navn}`,
    optakt: "Aflæs",
    spoergsmaal: `Hvad er koordinatsættet til punktet ${navn}?`,
    figur: koordinatsystem(x, y, [], [{ x: px, y: py, navn }]),
    x: px,
    y: py,
    strategi: "Først x, så y",
    hint: HINT_KOORDINAT(px, py),
  });
}

/** Fire punkter A–D. Ét har de nævnte koordinater; et andet har dem byttet om. */
function hvilketPunkt(rng: Rng): Opgave {
  const x: [number, number] = [0, 8];
  const y: [number, number] = [0, 8];
  let px = 0;
  let py = 0;
  do {
    px = heltal(rng, 1, 7);
    py = heltal(rng, 1, 7);
  } while (px === py);
  const kandidater = [
    { x: py, y: px },
    { x: px, y: py + (py < 6 ? 2 : -2) },
    { x: px + (px < 6 ? 1 : -1), y: py },
    { x: heltal(rng, 1, 7), y: heltal(rng, 1, 7) },
    { x: heltal(rng, 1, 7), y: heltal(rng, 1, 7) },
  ];
  const punkter = [{ x: px, y: py }];
  for (const k of kandidater) {
    if (punkter.length === 4) break;
    if (punkter.some((p) => p.x === k.x && p.y === k.y)) continue;
    punkter.push(k);
  }
  while (punkter.length < 4) {
    const k = { x: heltal(rng, 1, 7), y: heltal(rng, 1, 7) };
    if (!punkter.some((p) => p.x === k.x && p.y === k.y)) punkter.push(k);
  }
  // Bogstaverne fordeles tilfældigt, så det rigtige ikke altid er A.
  const bogstaver = bland(rng, ["A", "B", "C", "D"]);
  const navngivne = punkter.map((p, i) => ({ ...p, navn: bogstaver[i] }));
  const facit = navngivne[0].navn;
  // Svarmulighederne står altid i rækkefølgen A, B, C, D.
  return {
    noegle: `aflaes:hvilket:${px}:${py}:${facit}`,
    slags: "valg",
    optakt: "Aflæs",
    spoergsmaal: `Hvilket punkt har koordinatsættet ${punkt(px, py)}?`,
    figur: koordinatsystem(x, y, [], navngivne),
    svar: facit,
    valg: ["A", "B", "C", "D"],
    strategi: "Først x, så y",
    hint: `Gå ${px} hen ad x-aksen og ${py} op. Pas på punktet ${punkt(py, px)} — der er x og y byttet om.`,
  };
}

/** Koordinatsæt som "Sæt X" med de fejl, prøven selv bruger som distraktorer. */
function koordinatFlervalg(rng: Rng): Opgave {
  const x: [number, number] = [-6, 7];
  const y: [number, number] = [-5, 7];
  let px = 0;
  let py = 0;
  do {
    px = ikkeNul(rng, -5, 6);
    py = ikkeNul(rng, -4, 6);
  } while (Math.abs(px) === Math.abs(py) || (px > 0 && py > 0));
  const navn = vaelg(rng, NAVNE);
  return valgOpgave(
    {
      noegle: `aflaes:mcpunkt:${px}:${py}:${navn}`,
      optakt: "Sæt X",
      spoergsmaal: `Hvad er koordinatsættet til punktet ${navn}?`,
      figur: koordinatsystem(x, y, [], [{ x: px, y: py, navn }]),
      svar: punkt(px, py),
      andre: [
        punkt(py, px),
        punkt(-px, py),
        punkt(px, -py),
        punkt(-py, -px),
        punkt(-px, -py),
        punkt(py, -px),
      ],
      strategi: "Først x, så y",
      hint: `${navn} ligger ud for x = ${tal(px)} (${px < 0 ? "til venstre for" : "til højre for"} y-aksen) og y = ${tal(py)} (${py < 0 ? "under" : "over"} x-aksen). Tjek fortegnene — det er dem, distraktorerne bytter rundt på.`,
    },
    rng,
  );
}

function skaeringYakse(rng: Rng, niveau: NiveauId): Opgave {
  const negativ = niveau !== "bronze";
  const x: [number, number] = negativ ? [-5, 5] : [0, 6];
  const y: [number, number] = negativ ? [-6, 6] : [0, 10];
  let l: Linje;
  do {
    l = negativ
      ? { a: ikkeNul(rng, -3, 3), b: ikkeNul(rng, -5, 5) }
      : { a: heltal(rng, 1, 3), b: heltal(rng, 1, 6) };
  } while (gitterpunkter(l, x, y) < 3);
  const navn = vaelg(rng, ["l", "m", "s", "t"]);
  return punktOpgave({
    noegle: `aflaes:yakse:${l.a}:${l.b}:${navn}`,
    optakt: "Aflæs",
    spoergsmaal: `I hvilket punkt skærer linjen ${navn} y-aksen?`,
    figur: koordinatsystem(x, y, [{ ...l, navn, farve: "terra" }]),
    x: 0,
    y: l.b,
    strategi: "På y-aksen er x = 0",
    hint: `y-aksen er den lodrette akse. Alle punkter på den har x = 0, så svaret hedder (0 ; ?). Linjen rammer aksen ved y = ${tal(l.b)}.`,
  });
}

function skaeringXakse(rng: Rng): Opgave {
  const x: [number, number] = [-5, 5];
  const y: [number, number] = [-6, 6];
  let l: Linje;
  let k = 0;
  do {
    k = ikkeNul(rng, -4, 4);
    const a = vaelg(rng, [-3, -2, -1, 1, 2, 3]);
    l = { a, b: -a * k };
  } while (Math.abs(l.b) > 6 || l.b === 0 || gitterpunkter(l, x, y) < 3);
  const navn = vaelg(rng, ["l", "m", "s", "t"]);
  return punktOpgave({
    noegle: `aflaes:xakse:${l.a}:${l.b}:${navn}`,
    optakt: "Aflæs",
    spoergsmaal: `I hvilket punkt skærer linjen ${navn} x-aksen?`,
    figur: koordinatsystem(x, y, [{ ...l, navn, farve: "blaa" }]),
    x: k,
    y: 0,
    strategi: "På x-aksen er y = 0",
    hint: `x-aksen er den vandrette akse. Alle punkter på den har y = 0, så svaret hedder (? ; 0). Linjen krydser aksen ved x = ${tal(k)}.`,
  });
}

function yVed(rng: Rng, niveau: NiveauId): Opgave {
  const bronze = niveau === "bronze";
  const x: [number, number] = bronze ? [0, 6] : [-5, 5];
  const y: [number, number] = bronze ? [0, 10] : [-6, 6];
  let l: Linje;
  let x0 = 0;
  do {
    l = bronze
      ? { a: heltal(rng, 1, 2), b: heltal(rng, 0, 4) }
      : { a: ikkeNul(rng, -3, 3), b: heltal(rng, -4, 4) };
    x0 = bronze ? heltal(rng, 1, 5) : ikkeNul(rng, -4, 4);
  } while (
    l.a * x0 + l.b < y[0] ||
    l.a * x0 + l.b >= y[1] ||
    gitterpunkter(l, x, y) < 3 ||
    (!bronze && l.a * x0 + l.b >= 0 && x0 > 0 && l.a > 0)
  );
  const svar = l.a * x0 + l.b;
  const navn = vaelg(rng, ["l", "m", "s", "t"]);
  return talOpgave({
    noegle: `aflaes:yved:${l.a}:${l.b}:${x0}:${navn}`,
    optakt: "Aflæs",
    spoergsmaal: `Hvad er y på linjen ${navn}, når x = ${tal(x0)}?`,
    figur: koordinatsystem(x, y, [{ ...l, navn, farve: "teal" }]),
    svar,
    foran: "y =",
    strategi: "Lodret op eller ned fra x",
    hint: `Find x = ${tal(x0)} på x-aksen. Gå lodret ${svar >= 0 ? "op" : "ned"}, til du rammer linjen, og aflæs y: ${tal(svar)}.`,
  });
}

/** Prøvens opg. 14.2: kun én af forskrifterne går gennem Q. */
function gennemQ(rng: Rng): Opgave {
  const x: [number, number] = [-5, 6];
  const y: [number, number] = [-3, 8];
  let qx = 0;
  let qy = 0;
  do {
    qx = heltal(rng, 1, 5);
    qy = heltal(rng, 1, 7);
  } while (qx === qy);
  let a = 0;
  let b = 0;
  do {
    a = vaelg(rng, [-2, -1, 1, 2, 3]);
    b = qy - a * qx;
  } while (b === 0 || Math.abs(b) > 9 || b === qx || b === qy);
  const gaarGennem = (aa: number, bb: number) => aa * qx + bb === qy;
  const forslag: [number, number][] = [
    [qx, qy],
    [qy, qx],
    [1, qx],
    [1, qy],
    [a, qx],
    [qy, a],
    [-a, b],
    [a, -b],
  ];
  const andre = forslag.filter(([aa, bb]) => !gaarGennem(aa, bb)).map(([aa, bb]) => forskrift(aa, bb));
  const navn = vaelg(rng, ["Q", "P", "R"]);
  return valgOpgave(
    {
      noegle: `aflaes:gennem:${qx}:${qy}:${a}:${navn}`,
      optakt: "Sæt X",
      spoergsmaal: `Hvilken af ligningerne er ligningen for en linje, som går gennem punktet ${navn}?`,
      figur: koordinatsystem(x, y, [], [{ x: qx, y: qy, navn }]),
      svar: forskrift(a, b),
      andre,
      strategi: "Sæt punktet ind i forskriften",
      hint: `${navn} = ${punkt(qx, qy)}. Sæt x = ${qx} ind i hver forskrift, og se om du får y = ${qy}. For ${forskrift(a, b)}: ${tal(a)} · ${qx} ${b < 0 ? "−" : "+"} ${tal(Math.abs(b))} = ${qy}. Pas på dem, hvor koordinaterne bare er sat ind som tal i forskriften.`,
    },
    rng,
  );
}

/**
 * To linjer, der skærer hinanden uden for tegningen (dec 20, dec 24).
 * Eleven skal aflæse begge forskrifter og regne skæringspunktet ud.
 */
function skaeringUdenfor(rng: Rng, niveau: NiveauId): Opgave {
  const platin = niveau === "platin";
  const x: [number, number] = platin ? [-1, 6] : [-1, 4];
  const y: [number, number] = [-1, 6];
  for (;;) {
    const a1 = platin ? vaelg(rng, [-1, 1, 2, 3]) : vaelg(rng, [1, 2, 3]);
    const a2 = platin ? vaelg(rng, [0.5, -0.5, 1.5]) : vaelg(rng, [-1, 1, 2, 3]);
    if (a1 === a2) continue;
    const b1 = heltal(rng, 0, 5);
    const b2 = heltal(rng, 0, 5);
    const X = (b2 - b1) / (a1 - a2);
    const Y = a1 * X + b1;
    if (!Number.isInteger(X) || !Number.isInteger(Y)) continue;
    const udenfor = X > x[1] || X < x[0] || Y > y[1] || Y < y[0];
    if (!udenfor || Math.abs(X) > 10 || Math.abs(Y) > 30) continue;
    const l1: Linje = { a: a1, b: b1, farve: "terra" };
    const l2: Linje = { a: a2, b: b2, farve: "blaa" };
    if (gitterpunkter(l1, x, y) < 2 || gitterpunkter(l2, x, y) < 2) continue;
    return punktOpgave({
      noegle: `aflaes:skaer:${a1}:${b1}:${a2}:${b2}`,
      optakt: "Linjerne skærer hinanden uden for tegningen",
      spoergsmaal: "I hvilket punkt skærer den røde og den blå linje hinanden?",
      figur: koordinatsystem(x, y, [l1, l2]),
      x: X,
      y: Y,
      strategi: "Aflæs begge forskrifter",
      hint: `Rød: skærer y-aksen i ${tal(b1)} og ${a1 > 0 ? "stiger" : "falder"} ${tal(Math.abs(a1))} pr. skridt til højre, så ${forskrift(a1, b1)}. Blå: ${forskrift(a2, b2)}. Fortsæt de to linjer i hovedet (eller i en tabel), til de har samme y: ved x = ${tal(X)} er y = ${tal(Y)} for begge.`,
    });
  }
}

/** Platin: skæringspunktet ud fra forskrifterne alene, gerne med et komma i. */
function skaeringRegnet(rng: Rng): Opgave {
  for (;;) {
    const a1 = ikkeNul(rng, -4, 5);
    const a2 = ikkeNul(rng, -4, 5);
    if (a1 === a2) continue;
    const X = heltal(rng, -8, 8) / 2;
    const b1 = heltal(rng, -9, 9);
    const Y = a1 * X + b1;
    const b2 = Y - a2 * X;
    if (!Number.isInteger(b2) || Math.abs(b2) > 15 || !Number.isInteger(Y * 2)) continue;
    return punktOpgave({
      noegle: `aflaes:skaer:${a1}:${b1}:${a2}:${b2}`,
      optakt: "Uden tegning",
      spoergsmaal: `Linjerne ${forskrift(a1, b1)} og ${forskrift(a2, b2)} skærer hinanden. I hvilket punkt?`,
      x: X,
      y: Y,
      strategi: "Sæt de to forskrifter lig hinanden",
      hint: `I skæringspunktet har de samme y: ${forskrift(a1, b1).slice(4)} = ${forskrift(a2, b2).slice(4)}. Saml x på den ene side: ${koefficient(a1 - a2)} = ${tal(b2 - b1)}, så x = ${tal(X)}. Sæt x ind i en af dem: y = ${tal(Y)}.`,
    });
  }
}

/** Platin: skæring med x-aksen ud fra forskriften — ofte et kommatal. */
function xAkseRegnet(rng: Rng): Opgave {
  for (;;) {
    const a = vaelg(rng, [-4, -2, 2, 4, -6, 6, 8]);
    const k = heltal(rng, -12, 12) / (Math.abs(a) >= 4 ? 4 : 2);
    if (k === 0) continue;
    const b = -a * k;
    if (!Number.isInteger(b) || Math.abs(b) > 30 || Number.isInteger(k)) continue;
    return punktOpgave({
      noegle: `aflaes:xakse:${a}:${b}:regnet`,
      optakt: "Uden tegning",
      spoergsmaal: `I hvilket punkt skærer linjen ${forskrift(a, b)} x-aksen?`,
      x: k,
      y: 0,
      strategi: "Sæt y = 0",
      hint: `På x-aksen er y = 0. Løs ${koefficientTekst(a)} ${b < 0 ? "−" : "+"} ${tal(Math.abs(b))} = 0: ${tal(a)}x = ${tal(-b)}, så x = ${tal(k)}.`,
    });
  }
}

const koefficientTekst = (a: number) => forskrift(a, 0).slice(4);

/** Platin: hvilket punkt ligger på linjen? Kræver at man sætter ind fire gange. */
function liggerPaa(rng: Rng): Opgave {
  const a = ikkeNul(rng, -4, 4);
  const b = heltal(rng, -8, 8);
  const x1 = ikkeNul(rng, -5, 6);
  const y1 = a * x1 + b;
  const forkerte = [
    [y1, x1],
    [x1, y1 + (rng() < 0.5 ? 1 : -1)],
    [-x1, y1],
    [x1 + 1, y1 + 1],
    [x1, -y1],
  ].filter(([px, py]) => a * px + b !== py);
  return valgOpgave(
    {
      noegle: `aflaes:ligger:${a}:${b}:${x1}`,
      optakt: "Sæt X",
      spoergsmaal: `Hvilket af punkterne ligger på linjen ${forskrift(a, b)}?`,
      svar: punkt(x1, y1),
      andre: forkerte.map(([px, py]) => punkt(px, py)),
      antal: 4,
      strategi: "Sæt punktet ind i forskriften",
      hint: `Sæt x-koordinaten ind og se, om du får y-koordinaten. For ${punkt(x1, y1)}: ${tal(a)} · ${x1 < 0 ? `(${tal(x1)})` : tal(x1)}${b === 0 ? "" : ` ${b < 0 ? "−" : "+"} ${tal(Math.abs(b))}`} = ${tal(y1)}. Det passer.`,
    },
    rng,
  );
}

// -------------------------------------------------------------- samlet

export function lavAflaes(rng: Rng, niveau: NiveauId): Opgave {
  if (niveau === "bronze") {
    switch (heltal(rng, 1, 4)) {
      case 1:
        return aflaesPunkt(rng, [0, 8], [0, 8], false);
      case 2:
        return hvilketPunkt(rng);
      case 3:
        return skaeringYakse(rng, niveau);
      default:
        return yVed(rng, niveau);
    }
  }
  if (niveau === "soelv") {
    switch (heltal(rng, 1, 4)) {
      case 1:
        return aflaesPunkt(rng, [-6, 6], [-6, 6], true);
      case 2:
        return skaeringYakse(rng, niveau);
      case 3:
        return skaeringXakse(rng);
      default:
        return yVed(rng, niveau);
    }
  }
  if (niveau === "guld") {
    switch (heltal(rng, 1, 4)) {
      case 1:
        return koordinatFlervalg(rng);
      case 2:
        return gennemQ(rng);
      case 3:
        return skaeringUdenfor(rng, niveau);
      default:
        return rng() < 0.5 ? skaeringXakse(rng) : skaeringUdenfor(rng, niveau);
    }
  }
  switch (heltal(rng, 1, 4)) {
    case 1:
      return skaeringUdenfor(rng, niveau);
    case 2:
      return skaeringRegnet(rng);
    case 3:
      return xAkseRegnet(rng);
    default:
      return liggerPaa(rng);
  }
}
