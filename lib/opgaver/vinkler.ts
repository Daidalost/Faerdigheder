import type { NiveauId, Opgave, P, Skitse } from "../typer";
import { heltal, vaelg, type Rng } from "../tilfaeldig";
import { talOpgave } from "./algebra";
import { drej, gange, hjoerneNavn, minus, paa, plus, pol, polygonFraVinkler } from "./geometri";

/**
 * Vinkler — opgave 12/13 (og nogle gange 16/17) i hvert eneste prøvesæt.
 *
 *   Parallelle linjer og en eller to skærende linjer   dec 20 opg. 12, dec 21 opg. 15, maj 26 opg. 13
 *   Tre linjer, der skærer hinanden                    maj 22 opg. 13, dec 23 opg. 13
 *   Trekant med forlængede sider og en parallel linje  dec 25 opg. 13
 *   Firkant med forlængede sider                       maj 25 opg. 13
 *   Trapez                                             dec 22 opg. 13, maj 21 opg. 16
 *   Ligesidet / ligebenet trekant i en sammensat figur dec 20 opg. 17, dec 24 opg. 13, maj 24 opg. 13
 *
 * Bronze = 7. kl. (vinkelsum, nabovinkler), sølv = 8. kl. (topvinkler,
 * ligebenet, firkant, parallelle linjer), guld = prøveniveau (to trin),
 * platin = over (n-kanter, uret, ydervinkler).
 *
 * Svaret er altid ét tal i grader. Skitsen er tegnet, så vinklerne passer —
 * testen måler dem på tegningen og sammenligner med teksten.
 */

const NAVNE = ["u", "v", "w"];
const gr = (n: number) => `${n}°`;

function vinkelOpgave(
  noegle: string,
  optakt: string,
  intro: string,
  sk: Skitse,
  navn: string,
  svar: number,
  strategi: string,
  hint: string,
): Opgave {
  return talOpgave({
    noegle,
    optakt,
    spoergsmaal: `${intro ? `${intro} ` : ""}Hvor stor er vinkel ${navn}?`,
    figur: { ...sk, skitse: true },
    svar,
    enhed: "°",
    foran: `${navn} =`,
    strategi,
    hint,
  });
}

/**
 * Tilfældig drejning/spejling, så figurerne ikke altid ligger ens.
 * Figurer med hjørnebogstaver spejles ikke — så står A, B, C, D i den
 * sædvanlige rækkefølge mod uret.
 */
function variation(rng: Rng, sk: Skitse, frit = false): Skitse {
  const vinkel = frit ? heltal(rng, 0, 359) : vaelg(rng, [0, 0, 0, 8, -10, 15]);
  const harBogstaver = (sk.tekster ?? []).some((t) => /^[A-Z]$/.test(t.tekst));
  return drej(sk, vinkel, !harBogstaver && rng() < 0.5);
}

/** Vinkelbue ved hjørne i i en polygon. */
const hjoerne = (pkt: P[], i: number, tekst: string | undefined, farve: "teal" | "terra" = "teal") => ({
  top: pkt[i],
  a: pkt[(i + pkt.length - 1) % pkt.length],
  b: pkt[(i + 1) % pkt.length],
  tekst,
  farve,
});

/** En vinkel med tal (givet) eller med bogstav (den, der spørges om). */
const tekstFor = (svarNavn: string | null, v: number) => (svarNavn ? svarNavn : gr(v));

// ================================================================ trekanter

function trekantSum(rng: Rng, niveau: NiveauId): Opgave {
  const bronze = niveau === "bronze";
  const retvinklet = rng() < 0.25;
  let A = 0;
  let B = 0;
  let pkt: P[] | null = null;
  while (!pkt) {
    const trin = bronze ? 5 : 1;
    A = trin * heltal(rng, Math.ceil(30 / trin), Math.floor(95 / trin));
    B = retvinklet ? 90 : trin * heltal(rng, Math.ceil(30 / trin), Math.floor(110 / trin));
    if (180 - A - B < 25) continue;
    pkt = polygonFraVinkler([A, B, 180 - A - B], [6]);
  }
  const vinkler = [A, B, 180 - A - B];
  const k = retvinklet ? vaelg(rng, [0, 2]) : heltal(rng, 0, 2);
  const navn = vaelg(rng, NAVNE);
  const givne = vinkler.filter((_, i) => i !== k);
  const sk: Skitse = {
    slags: "skitse",
    polygoner: [{ punkter: pkt, farve: "lilla" }],
    vinkler: vinkler.map((v, i) =>
      i === k
        ? hjoerne(pkt!, i, navn, "terra")
        : v === 90
          ? { top: pkt![i], a: pkt![(i + 2) % 3], b: pkt![(i + 1) % 3], ret: true }
          : hjoerne(pkt!, i, gr(v)),
    ),
  };
  return vinkelOpgave(
    `vinkler:sum:${vinkler.join(",")}:${k}:${navn}`,
    "Trekant",
    retvinklet ? "Trekanten er retvinklet." : "",
    variation(rng, sk),
    navn,
    vinkler[k],
    "Vinkelsummen er 180°",
    `Vinklerne i en trekant giver tilsammen 180°. ${navn} = 180° − ${givne[0]}° − ${givne[1]}° = ${vinkler[k]}°.${retvinklet ? " Den rette vinkel er 90°." : ""}`,
  );
}

function nabovinkel(rng: Rng): Opgave {
  const a = 5 * heltal(rng, 5, 31);
  if (a === 90) return nabovinkel(rng);
  const O: P = [0, 0];
  const R = pol(O, 4, a);
  const givetHoejre = rng() < 0.5;
  const navn = vaelg(rng, NAVNE);
  const sk: Skitse = {
    slags: "skitse",
    linjer: [{ fra: [-5, 0], til: [5, 0] }, { fra: O, til: R }],
    vinkler: [
      { top: O, a: [3, 0], b: R, tekst: givetHoejre ? gr(a) : navn, farve: givetHoejre ? "teal" : "terra" },
      { top: O, a: R, b: [-3, 0], tekst: givetHoejre ? navn : gr(180 - a), farve: givetHoejre ? "terra" : "teal" },
    ],
  };
  const svar = givetHoejre ? 180 - a : a;
  return vinkelOpgave(
    `vinkler:nabo:${a}:${givetHoejre ? "h" : "v"}:${navn}`,
    "Nabovinkler",
    "",
    variation(rng, sk),
    navn,
    svar,
    "En lige linje er 180°",
    `De to vinkler ligger på en ret linje, så de giver tilsammen 180°. ${navn} = 180° − ${180 - svar}° = ${svar}°.`,
  );
}

/** Retvinklet trekant: den ene spidse vinkel er givet. */
function retvinklet(rng: Rng): Opgave {
  const A = 5 * heltal(rng, 5, 13);
  const pkt = polygonFraVinkler([A, 90, 90 - A], [6])!;
  const navn = vaelg(rng, NAVNE);
  const sk: Skitse = {
    slags: "skitse",
    polygoner: [{ punkter: pkt, farve: "blaa" }],
    vinkler: [hjoerne(pkt, 0, gr(A)), { top: pkt[1], a: pkt[0], b: pkt[2], ret: true }, hjoerne(pkt, 2, navn, "terra")],
  };
  return vinkelOpgave(
    `vinkler:ret:${A}:${navn}`,
    "Retvinklet trekant",
    "",
    variation(rng, sk),
    navn,
    90 - A,
    "Den rette vinkel er 90°",
    `Den lille firkant viser en ret vinkel på 90°. ${navn} = 180° − 90° − ${A}° = ${90 - A}°.`,
  );
}

/** To linjer, der skærer hinanden: topvinkler og nabovinkler. */
function topvinkel(rng: Rng): Opgave {
  let a = 0;
  do a = heltal(rng, 25, 155);
  while (Math.abs(a - 90) < 8);
  const O: P = [0, 0];
  const straaler: P[] = [[4, 0], pol(O, 4, a), [-4, 0], pol(O, 4, a + 180)];
  const maal = (i: number) => (i % 2 === 0 ? a : 180 - a);
  const givet = heltal(rng, 0, 3);
  const spurgt = (givet + heltal(rng, 1, 3)) % 4;
  const navn = vaelg(rng, NAVNE);
  const bue = (i: number, tekst: string, farve: "teal" | "terra") => ({
    top: O,
    a: gange(straaler[i], 0.7),
    b: gange(straaler[(i + 1) % 4], 0.7),
    tekst,
    farve,
  });
  const sk: Skitse = {
    slags: "skitse",
    linjer: [
      { fra: straaler[2], til: straaler[0] },
      { fra: straaler[3], til: straaler[1] },
    ],
    vinkler: [bue(givet, gr(maal(givet)), "teal"), bue(spurgt, navn, "terra")],
  };
  const top = (spurgt - givet + 4) % 4 === 2;
  return vinkelOpgave(
    `vinkler:top:${a}:${givet}:${spurgt}:${navn}`,
    "To linjer skærer hinanden",
    "",
    variation(rng, sk, true),
    navn,
    maal(spurgt),
    top ? "Topvinkler er lige store" : "Nabovinkler giver 180°",
    top
      ? `${navn} ligger lige over for ${gr(maal(givet))} — de er topvinkler og derfor lige store: ${navn} = ${maal(spurgt)}°.`
      : `${navn} og ${gr(maal(givet))} ligger ved siden af hinanden på en ret linje. De giver 180°: ${navn} = 180° − ${maal(givet)}° = ${maal(spurgt)}°.`,
  );
}

function ligebenet(rng: Rng): Opgave {
  const navn = vaelg(rng, NAVNE);
  if (rng() < 0.15) {
    const pkt = polygonFraVinkler([60, 60, 60], [6])!;
    const k = heltal(rng, 0, 2);
    const sk: Skitse = {
      slags: "skitse",
      polygoner: [{ punkter: pkt, farve: "okker" }],
      linjer: [0, 1, 2].map((i) => ({ fra: pkt[i], til: pkt[(i + 1) % 3], streger: 1 as const })),
      vinkler: [hjoerne(pkt, k, navn, "terra")],
    };
    return vinkelOpgave(
      `vinkler:ligesidet:${k}:${navn}`,
      "Ligesidet trekant",
      "Stregerne viser, at alle tre sider er lige lange.",
      variation(rng, sk),
      navn,
      60,
      "Tre lige store vinkler",
      `En ligesidet trekant har tre lige store vinkler. 180° : 3 = 60°.`,
    );
  }
  let t = 0;
  do t = 2 * heltal(rng, 12, 70);
  while (t === 60);
  const b = (180 - t) / 2;
  const pkt = polygonFraVinkler([b, b, t], [6])!;
  const spoergTop = rng() < 0.5;
  const sk: Skitse = {
    slags: "skitse",
    polygoner: [{ punkter: pkt, farve: "okker" }],
    linjer: [
      { fra: pkt[0], til: pkt[2], streger: 1 },
      { fra: pkt[1], til: pkt[2], streger: 1 },
    ],
    vinkler: spoergTop
      ? [hjoerne(pkt, rng() < 0.5 ? 0 : 1, gr(b)), hjoerne(pkt, 2, navn, "terra")]
      : [hjoerne(pkt, 2, gr(t)), hjoerne(pkt, rng() < 0.5 ? 0 : 1, navn, "terra")],
  };
  return vinkelOpgave(
    `vinkler:ligebenet:${t}:${spoergTop ? "top" : "grund"}:${navn}`,
    "Ligebenet trekant",
    "Stregerne viser, at to sider er lige lange.",
    variation(rng, sk),
    navn,
    spoergTop ? t : b,
    "To lige store vinkler ved grundlinjen",
    spoergTop
      ? `Trekanten er ligebenet, så begge vinkler ved grundlinjen er ${b}°. ${navn} = 180° − ${b}° − ${b}° = ${t}°.`
      : `Trekanten er ligebenet, så de to vinkler ved grundlinjen er lige store. De deler det, der er tilbage: (180° − ${t}°) : 2 = ${b}°.`,
  );
}

function firkant(rng: Rng): Opgave {
  let v: number[] = [];
  let pkt: P[] | null = null;
  while (!pkt) {
    v = [0, 0, 0].map(() => 5 * heltal(rng, 12, 28));
    const sidste = 360 - v[0] - v[1] - v[2];
    if (sidste < 60 || sidste > 140) continue;
    v.push(sidste);
    pkt = polygonFraVinkler(v, [heltal(rng, 5, 7), heltal(rng, 4, 6)]);
  }
  const k = heltal(rng, 0, 3);
  const navn = vaelg(rng, NAVNE);
  const givne = v.filter((_, i) => i !== k);
  const sk: Skitse = {
    slags: "skitse",
    polygoner: [{ punkter: pkt, farve: "teal" }],
    vinkler: v.map((g, i) => (i === k ? hjoerne(pkt!, i, navn, "terra") : hjoerne(pkt!, i, gr(g)))),
  };
  return vinkelOpgave(
    `vinkler:firkant:${v.join(",")}:${k}:${navn}`,
    "Firkant",
    "",
    variation(rng, sk),
    navn,
    v[k],
    "Vinkelsummen er 360°",
    `En firkant kan deles i to trekanter, så vinklerne giver 2 · 180° = 360°. ${navn} = 360° − ${givne.join("° − ")}° = ${v[k]}°.`,
  );
}

// ============================================================ parallelle

/** Én linje skærer to parallelle linjer: ensliggende, vekselvinkler, nabovinkler. */
function parallelEn(rng: Rng): Opgave {
  let a = 0;
  do a = heltal(rng, 35, 145);
  while (Math.abs(a - 90) < 10);
  const h = 3;
  const Q: P = [0, 0];
  const P: P = [h / Math.tan((a * Math.PI) / 180), h];
  const u = pol([0, 0], 1, a);
  const midtX = P[0] / 2;
  const straaler = (X: P): P[] => [plus(X, [1.6, 0]), plus(X, gange(u, 1.6)), plus(X, [-1.6, 0]), plus(X, gange(u, -1.6))];
  const maal = (i: number) => (i % 2 === 0 ? a : 180 - a);
  const ved = rng() < 0.5 ? [P, Q] : [Q, P];
  const gI = heltal(rng, 0, 3);
  const sI = heltal(rng, 0, 3);
  const navn = vaelg(rng, NAVNE);
  const bue = (X: P, i: number, tekst: string, farve: "teal" | "terra") => {
    const r = straaler(X);
    return { top: X, a: r[i], b: r[(i + 1) % 4], tekst, farve };
  };
  const sk: Skitse = {
    slags: "skitse",
    linjer: [
      { fra: [midtX - 4.5, h], til: [midtX + 4.5, h] },
      { fra: [midtX - 4.5, 0], til: [midtX + 4.5, 0] },
      { fra: plus(Q, gange(u, -1.9)), til: plus(P, gange(u, 1.9)) },
    ],
    vinkler: [bue(ved[0], gI, gr(maal(gI)), "teal"), bue(ved[1], sI, navn, "terra")],
    tekster: [
      { ved: [midtX + 4.9, h], tekst: "l" },
      { ved: [midtX + 4.9, 0], tekst: "m" },
    ],
  };
  const ens = gI % 2 === sI % 2;
  return vinkelOpgave(
    `vinkler:parallel:${a}:${ved[0] === P ? "P" : "Q"}:${gI}:${sI}:${navn}`,
    "Parallelle linjer",
    "Linjerne l og m er parallelle.",
    variation(rng, sk),
    navn,
    maal(sI),
    ens ? "Ensliggende og vekselvinkler er lige store" : "Nabovinkler giver 180°",
    ens
      ? `Fordi l og m er parallelle, skærer den skrå linje dem under samme vinkel. ${navn} svarer til ${gr(maal(gI))} — ${navn} = ${maal(sI)}°.`
      : `Fordi l og m er parallelle, er vinklerne de samme ved begge skæringer. ${navn} ligger på den anden side af den skrå linje end ${gr(maal(gI))}, så de giver 180°: ${navn} = ${maal(sI)}°.`,
  );
}

/** To linjer mødes på m og skærer l: trekant mellem parallelle linjer (dec 20, maj 26). */
function trekantMellemParallelle(rng: Rng): Opgave {
  let a = 0;
  let b = 0;
  do {
    a = heltal(rng, 35, 80);
    b = heltal(rng, 35, 80);
  } while (180 - a - b < 30);
  const h = 3;
  const S: P = [0, 0];
  const A: P = [-h / Math.tan((a * Math.PI) / 180), h];
  const B: P = [h / Math.tan((b * Math.PI) / 180), h];
  const navn = vaelg(rng, NAVNE);
  const spurgt = heltal(rng, 0, 2); // 0: venstre ved S (= a), 1: toppen ved S, 2: højre ved S (= b)
  const svar = [a, 180 - a - b, b][spurgt];
  const ud = (X: P, Y: P) => paa(X, Y, 1.35);
  const venstre = Math.min(A[0], -1) - 2;
  const hoejre = Math.max(B[0], 1) + 2;
  const sk: Skitse = {
    slags: "skitse",
    linjer: [
      { fra: [venstre, h], til: [hoejre, h] },
      { fra: [venstre, 0], til: [hoejre, 0] },
      { fra: paa(A, S, 1.3), til: ud(S, A) },
      { fra: paa(B, S, 1.3), til: ud(S, B) },
    ],
    vinkler: [
      { top: A, a: B, b: S, tekst: gr(a) },
      { top: B, a: S, b: A, tekst: gr(b) },
      [
        { top: S, a: [venstre + 1, 0] as P, b: A, tekst: navn, farve: "terra" as const },
        { top: S, a: A, b: B, tekst: navn, farve: "terra" as const },
        { top: S, a: B, b: [hoejre - 1, 0] as P, tekst: navn, farve: "terra" as const },
      ][spurgt],
    ],
    tekster: [
      { ved: [hoejre + 0.4, h], tekst: "l" },
      { ved: [hoejre + 0.4, 0], tekst: "m" },
    ],
  };
  // Vend figuren på hovedet halvdelen af gangene: så ligger trekanten over m.
  const vend = rng() < 0.5;
  return vinkelOpgave(
    `vinkler:mellem:${a}:${b}:${spurgt}:${navn}:${vend ? 1 : 0}`,
    "Parallelle linjer",
    "Linjerne l og m er parallelle.",
    drej(sk, vend ? 180 : 0, rng() < 0.5),
    navn,
    svar,
    spurgt === 1 ? "Vinkelsum i trekanten" : "Vekselvinkler er lige store",
    spurgt === 1
      ? `De to linjer og l danner en trekant. ${navn} = 180° − ${a}° − ${b}° = ${svar}°.`
      : `Fordi l og m er parallelle, er vekselvinklerne lige store (tænk på et Z). ${navn} = ${svar}°.`,
  );
}

/** Trekant med en linje gennem toppen parallel med grundlinjen (dec 25 opg. 13). */
function parallelGennemToppen(rng: Rng): Opgave {
  let A = 0;
  let B = 0;
  let pkt: P[] | null = null;
  while (!pkt) {
    A = heltal(rng, 35, 85);
    B = heltal(rng, 35, 85);
    if (180 - A - B < 25) continue;
    pkt = polygonFraVinkler([A, B, 180 - A - B], [6]);
  }
  const C = pkt[2];
  const u = gange(minus(pkt[1], pkt[0]), 1 / 6);
  const venstre = plus(C, gange(u, -2.4));
  const hoejre = plus(C, gange(u, 2.4));
  const navn = vaelg(rng, NAVNE);
  const spurgt = heltal(rng, 0, 2);
  const vaerdi = [A, 180 - A - B, B][spurgt];
  const ved = [
    { top: C, a: venstre, b: pkt[0] },
    { top: C, a: pkt[0], b: pkt[1] },
    { top: C, a: pkt[1], b: hoejre },
  ];
  const sk: Skitse = {
    slags: "skitse",
    polygoner: [{ punkter: pkt, farve: "blaa" }],
    linjer: [
      { fra: venstre, til: hoejre, farve: "blaa" },
      { fra: pkt[0], til: paa(pkt[0], C, 1.3) },
      { fra: pkt[1], til: paa(pkt[1], C, 1.3) },
    ],
    vinkler: [hjoerne(pkt, 0, gr(A)), hjoerne(pkt, 1, gr(B)), { ...ved[spurgt], tekst: navn, farve: "terra" }],
    tekster: [{ ved: plus(hoejre, gange(u, 0.4)), tekst: "l" }],
  };
  return vinkelOpgave(
    `vinkler:toppen:${A}:${B}:${spurgt}:${navn}`,
    "Trekant og parallel linje",
    "Linjen l er parallel med trekantens grundlinje.",
    variation(rng, sk),
    navn,
    vaerdi,
    spurgt === 1 ? "Vinkelsum i trekanten" : "Vekselvinkler er lige store",
    spurgt === 1
      ? `${navn} er trekantens tredje vinkel: 180° − ${A}° − ${B}° = ${vaerdi}°.`
      : `l er parallel med grundlinjen, så ${navn} og vinklen nede ved grundlinjen er vekselvinkler (et Z): ${navn} = ${vaerdi}°.`,
  );
}

/** Trekant med én side forlænget: ydervinklen er summen af de to modstående vinkler. */
function ydervinkel(rng: Rng): Opgave {
  let A = 0;
  let C = 0;
  let pkt: P[] | null = null;
  while (!pkt) {
    A = heltal(rng, 30, 85);
    C = heltal(rng, 30, 85);
    if (180 - A - C < 25) continue;
    pkt = polygonFraVinkler([A, 180 - A - C, C], [6]);
  }
  const B = 180 - A - C;
  const E = paa(pkt[0], pkt[1], 1.5);
  const navn = vaelg(rng, NAVNE);
  const spoergYder = rng() < 0.5;
  const sk: Skitse = {
    slags: "skitse",
    polygoner: [{ punkter: pkt, farve: "lilla" }],
    linjer: [{ fra: pkt[1], til: E }],
    vinkler: spoergYder
      ? [hjoerne(pkt, 0, gr(A)), hjoerne(pkt, 2, gr(C)), { top: pkt[1], a: E, b: pkt[2], tekst: navn, farve: "terra" }]
      : [hjoerne(pkt, 0, gr(A)), { top: pkt[1], a: E, b: pkt[2], tekst: gr(180 - B) }, hjoerne(pkt, 2, navn, "terra")],
  };
  return vinkelOpgave(
    `vinkler:yder:${A}:${C}:${spoergYder ? "y" : "i"}:${navn}`,
    "Forlænget side",
    "En af trekantens sider er forlænget.",
    variation(rng, sk),
    navn,
    spoergYder ? 180 - B : C,
    "Nabovinkel, så vinkelsum",
    spoergYder
      ? `Trekantens tredje vinkel er 180° − ${A}° − ${C}° = ${B}°. ${navn} er dens nabovinkel: 180° − ${B}° = ${180 - B}°. (Genvej: ydervinklen er summen af de to andre vinkler, ${A}° + ${C}°.)`
      : `Vinklen inde i trekanten ved siden af ${180 - B}° er 180° − ${180 - B}° = ${B}°. Så er ${navn} = 180° − ${A}° − ${B}° = ${C}°.`,
  );
}

/** Trapez med to parallelle sider (dec 22, maj 21). */
function trapez(rng: Rng): Opgave {
  let a = 0;
  let b = 0;
  let w = 0;
  const h = 3;
  let D: P = [0, 0];
  let C: P = [0, 0];
  for (;;) {
    a = heltal(rng, 45, 125);
    b = heltal(rng, 45, 115);
    w = heltal(rng, 7, 9);
    D = [h / Math.tan((a * Math.PI) / 180), h];
    C = [w - h / Math.tan((b * Math.PI) / 180), h];
    if (C[0] - D[0] > 2 && Math.abs(a - 90) > 4 && Math.abs(b - 90) > 4) break;
  }
  const pkt: P[] = [[0, 0], [w, 0], C, D];
  const v = [a, b, 180 - b, 180 - a];
  // Giv én vinkel på hvert ben, og spørg til den anden vinkel på et af benene.
  const givet = rng() < 0.5 ? [0, 2] : [1, 3];
  const spurgt = vaelg(rng, [0, 1, 2, 3].filter((i) => !givet.includes(i)));
  const navn = vaelg(rng, NAVNE);
  const sk: Skitse = {
    slags: "skitse",
    polygoner: [{ punkter: pkt, farve: "okker" }],
    vinkler: [...givet.map((i) => hjoerne(pkt, i, gr(v[i]))), hjoerne(pkt, spurgt, navn, "terra")],
    tekster: ["A", "B", "C", "D"].map((t, i) => ({ ved: hjoerneNavn(pkt, i, 0.5), tekst: t, kursiv: false })),
  };
  const partner = [3, 2, 1, 0][spurgt];
  return vinkelOpgave(
    `vinkler:trapez:${a}:${b}:${givet.join(",")}:${spurgt}:${navn}`,
    "Trapez",
    "Skitsen viser et trapez, hvor AB og DC er parallelle.",
    variation(rng, sk),
    navn,
    v[spurgt],
    "To vinkler på samme ben giver 180°",
    `AB og DC er parallelle, så de to vinkler på samme skrå side giver tilsammen 180°. ${navn} ligger på samme side som ${["A", "B", "C", "D"][partner]}: ${navn} = 180° − ${v[partner]}° = ${v[spurgt]}°.${givet.includes(partner) ? "" : ` (Find først vinklen ved ${["A", "B", "C", "D"][partner]} med vinkelsummen 360°.)`}`,
  );
}

/** Ligebenet trekant med forlænget grundlinje (sammensat figur, dec 24 / maj 24). */
function ligebenetYder(rng: Rng): Opgave {
  const t = 2 * heltal(rng, 12, 65);
  const b = (180 - t) / 2;
  const pkt = polygonFraVinkler([b, b, t], [6])!;
  const E = paa(pkt[0], pkt[1], 1.45);
  const navn = vaelg(rng, NAVNE);
  const spoergTop = rng() < 0.6;
  const sk: Skitse = {
    slags: "skitse",
    polygoner: [{ punkter: pkt, farve: "okker" }],
    linjer: [
      { fra: pkt[1], til: E },
      { fra: pkt[0], til: pkt[2], streger: 1 },
      { fra: pkt[1], til: pkt[2], streger: 1 },
    ],
    vinkler: spoergTop
      ? [{ top: pkt[1], a: E, b: pkt[2], tekst: gr(180 - b) }, hjoerne(pkt, 2, navn, "terra")]
      : [hjoerne(pkt, 2, gr(t)), { top: pkt[1], a: E, b: pkt[2], tekst: navn, farve: "terra" }],
  };
  return vinkelOpgave(
    `vinkler:ligebenetyder:${t}:${spoergTop ? "top" : "yder"}:${navn}`,
    "Ligebenet trekant",
    "Trekanten er ligebenet, og grundlinjen er forlænget.",
    variation(rng, sk),
    navn,
    spoergTop ? t : 180 - b,
    "Nabovinkel, så ligebenet",
    spoergTop
      ? `Vinklen inde i trekanten ved ${180 - b}° er 180° − ${180 - b}° = ${b}°. Trekanten er ligebenet, så den anden vinkel ved grundlinjen er også ${b}°. ${navn} = 180° − ${b}° − ${b}° = ${t}°.`
      : `De to vinkler ved grundlinjen er (180° − ${t}°) : 2 = ${b}°. ${navn} er nabovinkel til den ene: 180° − ${b}° = ${180 - b}°.`,
  );
}

/** Firkant med to sider forlænget (maj 25 opg. 13). */
function firkantYder(rng: Rng): Opgave {
  let v: number[] = [];
  let pkt: P[] | null = null;
  while (!pkt) {
    v = [0, 0, 0].map(() => heltal(rng, 65, 130));
    const s = 360 - v[0] - v[1] - v[2];
    if (s < 65 || s > 130) continue;
    v.push(s);
    pkt = polygonFraVinkler(v, [heltal(rng, 5, 7), heltal(rng, 4, 6)]);
  }
  // Siden fra hjørne 1 til 2 forlænges forbi 2: ydervinkel ved hjørne 2.
  const E = paa(pkt[1], pkt[2], 1.45);
  const navn = vaelg(rng, NAVNE);
  const spoergYder = rng() < 0.5;
  const sk: Skitse = {
    slags: "skitse",
    polygoner: [{ punkter: pkt, farve: "teal" }],
    linjer: [{ fra: pkt[2], til: E }],
    vinkler: spoergYder
      ? [hjoerne(pkt, 0, gr(v[0])), hjoerne(pkt, 1, gr(v[1])), hjoerne(pkt, 3, gr(v[3])), { top: pkt[2], a: E, b: pkt[3], tekst: navn, farve: "terra" }]
      : [hjoerne(pkt, 0, gr(v[0])), hjoerne(pkt, 1, gr(v[1])), { top: pkt[2], a: E, b: pkt[3], tekst: gr(180 - v[2]) }, hjoerne(pkt, 3, navn, "terra")],
  };
  return vinkelOpgave(
    `vinkler:firkantyder:${v.join(",")}:${spoergYder ? "y" : "i"}:${navn}`,
    "Firkant",
    "En af firkantens sider er forlænget.",
    variation(rng, sk),
    navn,
    spoergYder ? 180 - v[2] : v[3],
    "Nabovinkel og 360°",
    spoergYder
      ? `Den fjerde vinkel i firkanten er 360° − ${v[0]}° − ${v[1]}° − ${v[3]}° = ${v[2]}°. ${navn} er dens nabovinkel: 180° − ${v[2]}° = ${180 - v[2]}°.`
      : `Vinklen inde i firkanten ved ${180 - v[2]}° er 180° − ${180 - v[2]}° = ${v[2]}°. ${navn} = 360° − ${v[0]}° − ${v[1]}° − ${v[2]}° = ${v[3]}°.`,
  );
}

// ================================================================== platin

function regulaer(rng: Rng): Opgave {
  const n = vaelg(rng, [5, 6, 8, 9, 10, 12]);
  const navn = vaelg(rng, NAVNE);
  const pkt: P[] = Array.from({ length: n }, (_, i) => pol([0, 0], 3.5, -90 - 180 / n + (360 * i) / n));
  const svar = ((n - 2) * 180) / n;
  const ord: Record<number, string> = { 5: "femkant", 6: "sekskant", 8: "ottekant", 9: "nikant", 10: "tikant", 12: "tolvkant" };
  const sk: Skitse = {
    slags: "skitse",
    polygoner: [{ punkter: pkt, farve: "lilla" }],
    linjer: pkt.map((p, i) => ({ fra: p, til: pkt[(i + 1) % n], streger: 1 as const })),
    vinkler: [hjoerne(pkt, 0, navn, "terra")],
  };
  return vinkelOpgave(
    `vinkler:regulaer:${n}:${navn}`,
    "Regulær polygon",
    `Figuren er en regulær ${ord[n]}: alle sider og alle vinkler er lige store.`,
    drej(sk, heltal(rng, 0, 3) * 15),
    navn,
    svar,
    "Del i trekanter",
    `En ${ord[n]} kan deles i ${n - 2} trekanter fra ét hjørne, så vinkelsummen er ${n - 2} · 180° = ${(n - 2) * 180}°. Der er ${n} lige store vinkler: ${(n - 2) * 180}° : ${n} = ${svar}°.`,
  );
}

function femkant(rng: Rng): Opgave {
  let v: number[] = [];
  let pkt: P[] | null = null;
  while (!pkt) {
    v = [0, 0, 0, 0].map(() => heltal(rng, 85, 140));
    const s = 540 - v.reduce((x, y) => x + y, 0);
    if (s < 85 || s > 140) continue;
    v.push(s);
    pkt = polygonFraVinkler(v, [heltal(rng, 4, 6), heltal(rng, 4, 6), heltal(rng, 4, 6)]);
  }
  const k = heltal(rng, 0, 4);
  const navn = vaelg(rng, NAVNE);
  const sk: Skitse = {
    slags: "skitse",
    polygoner: [{ punkter: pkt, farve: "blaa" }],
    vinkler: v.map((g, i) => (i === k ? hjoerne(pkt!, i, navn, "terra") : hjoerne(pkt!, i, gr(g)))),
  };
  return vinkelOpgave(
    `vinkler:femkant:${v.join(",")}:${k}:${navn}`,
    "Femkant",
    "",
    variation(rng, sk),
    navn,
    v[k],
    "Del femkanten i trekanter",
    `En femkant kan deles i 3 trekanter, så vinklerne giver 3 · 180° = 540°. ${navn} = 540° − ${v.filter((_, i) => i !== k).join("° − ")}° = ${v[k]}°.`,
  );
}

function ur(rng: Rng): Opgave {
  const time = heltal(rng, 1, 12);
  const min = vaelg(rng, [0, 0, 30, 15, 45]);
  const timeVinkel = ((time % 12) * 30 + min * 0.5) % 360; // fra kl. 12, med uret
  const minVinkel = min * 6;
  let forskel = Math.abs(timeVinkel - minVinkel);
  if (forskel > 180) forskel = 360 - forskel;
  if (forskel < 15) return ur(rng);
  const retning = (urVinkel: number) => 90 - urVinkel; // matematisk vinkel
  const O: P = [0, 0];
  const lille = pol(O, 2.1, retning(timeVinkel));
  const stor = pol(O, 3.1, retning(minVinkel));
  const navn = vaelg(rng, NAVNE);
  const sk: Skitse = {
    slags: "skitse",
    ellipser: [{ c: O, rx: 3.6, ry: 3.6 }],
    linjer: [
      ...Array.from({ length: 12 }, (_, i) => ({ fra: pol(O, 3.25, 90 - 30 * i), til: pol(O, 3.6, 90 - 30 * i), tynd: true })),
      { fra: O, til: lille },
      { fra: O, til: stor },
    ],
    vinkler: [{ top: O, a: lille, b: stor, tekst: navn, farve: "terra" }],
    tekster: [12, 3, 6, 9].map((t) => ({ ved: pol(O, 2.75, 90 - 30 * (t % 12)), tekst: String(t), kursiv: false })),
  };
  const kl = `${time}.${String(min).padStart(2, "0")}`;
  return vinkelOpgave(
    `vinkler:ur:${time}:${min}:${navn}`,
    "Uret",
    `Klokken er ${kl}.`,
    sk,
    navn,
    forskel,
    "Ét kvarter er 90°, én time 30°",
    `Hele uret er 360°, så der er 30° mellem to tal. Den store viser står ved ${minVinkel}°. Den lille viser står ved ${time} · 30°${min ? ` + ${min * 0.5}° (den flytter sig ${min * 0.5}° på ${min} minutter)` : ""} = ${timeVinkel}°. Forskellen er ${forskel}°.`,
  );
}

/** De tre ydervinkler i en trekant giver 360°. */
function treYdervinkler(rng: Rng): Opgave {
  let v: number[] = [];
  let pkt: P[] | null = null;
  while (!pkt) {
    v = [heltal(rng, 35, 85), heltal(rng, 35, 85)];
    v.push(180 - v[0] - v[1]);
    if (v[2] < 30) continue;
    pkt = polygonFraVinkler(v, [6]);
  }
  const yder = v.map((g) => 180 - g);
  // Hver side forlænges i samme omløbsretning: forbi hjørne i+1.
  const E = [0, 1, 2].map((i) => paa(pkt![i], pkt![(i + 1) % 3], 1.45));
  const k = heltal(rng, 0, 2);
  const navn = vaelg(rng, NAVNE);
  const bue = (i: number, tekst: string, farve: "teal" | "terra") => ({
    top: pkt![(i + 1) % 3],
    a: E[i],
    b: pkt![(i + 2) % 3],
    tekst,
    farve,
  });
  const sk: Skitse = {
    slags: "skitse",
    polygoner: [{ punkter: pkt, farve: "lilla" }],
    linjer: [0, 1, 2].map((i) => ({ fra: pkt![(i + 1) % 3], til: E[i] })),
    vinkler: [0, 1, 2].map((i) => (i === k ? bue(i, navn, "terra") : bue(i, gr(yder[(i + 1) % 3]), "teal"))),
  };
  const svar = yder[(k + 1) % 3];
  const givne = [0, 1, 2].filter((i) => i !== k).map((i) => yder[(i + 1) % 3]);
  return vinkelOpgave(
    `vinkler:treyder:${v.join(",")}:${k}:${navn}`,
    "Ydervinkler",
    "Alle tre sider i trekanten er forlænget.",
    variation(rng, sk),
    navn,
    svar,
    "Find vinklerne inde i trekanten",
    `Inde i trekanten ligger nabovinklerne ${180 - givne[0]}° og ${180 - givne[1]}°. Den tredje vinkel er 180° − ${180 - givne[0]}° − ${180 - givne[1]}° = ${180 - svar}°, og ${navn} = 180° − ${180 - svar}° = ${svar}°. (De tre ydervinkler giver altid 360°.)`,
  );
}

// ================================================================== samlet

export function lavVinkler(rng: Rng, niveau: NiveauId): Opgave {
  const r = rng();
  if (niveau === "bronze") {
    if (r < 0.45) return trekantSum(rng, niveau);
    if (r < 0.75) return nabovinkel(rng);
    return retvinklet(rng);
  }
  if (niveau === "soelv") {
    if (r < 0.2) return topvinkel(rng);
    if (r < 0.4) return ligebenet(rng);
    if (r < 0.55) return firkant(rng);
    if (r < 0.8) return parallelEn(rng);
    return trekantSum(rng, niveau);
  }
  if (niveau === "guld") {
    if (r < 0.22) return trekantMellemParallelle(rng);
    if (r < 0.4) return parallelGennemToppen(rng);
    if (r < 0.55) return trapez(rng);
    if (r < 0.7) return ydervinkel(rng);
    if (r < 0.85) return ligebenetYder(rng);
    return firkantYder(rng);
  }
  if (r < 0.2) return regulaer(rng);
  if (r < 0.4) return femkant(rng);
  if (r < 0.6) return ur(rng);
  if (r < 0.8) return treYdervinkler(rng);
  return rng() < 0.5 ? firkantYder(rng) : trapez(rng);
}
