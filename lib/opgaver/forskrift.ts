import type { NiveauId, Opgave } from "../typer";
import { heltal, vaelg, type Rng } from "../tilfaeldig";
import { forskrift, ikkeNul, ip, punkt, tabel, tal, talOpgave, valgOpgave } from "./algebra";

/**
 * Forskrift og tabel: sæt ind i forskriften, find a og b, og gå mellem
 * tabel, forskrift og hverdagssituationer med fast pris + pris pr. stk.
 *
 * Mønstrene fra prøvesættene:
 *   "Hvilken forskrift har funktionen f?" — tabel, Sæt X        (maj 24 opg. 11)
 *   "Hvilken tabel passer til forskriften f(x) = 4x − 3?"       (dec 23 opg. 11)
 *   Elkabel til fast pris pr. meter: tabel → pris for 35 m     (dec 25 opg. 3)
 *   7,50 kr. pr. kg jordbær / 12 kr. pr. 100 g                  (maj 26 opg. 2–3)
 * Hverdagssituationerne følger materialet fra klassen: løbehjul, taxa,
 * opsparing, mobildata, limonadebod (y = ax + b).
 */

type Situation = {
  id: string;
  tekst: (b: number, a: number) => string;
  /** Hvad x tæller, i ental og flertal. */
  x: [string, string];
  /** Enhed for y. */
  y: string;
  aftagende?: boolean;
  /**
   * Tal der giver mening i virkeligheden: startbeløb b, pr.-beløb a og antal x.
   * Sølv og guld må gå lidt højere end bronze.
   */
  b: { min: number; max: number; trin: number };
  a: { min: number; max: number; trin: number };
  antal: [number, number];
};

const SITUATIONER: Situation[] = [
  {
    id: "loebehjul",
    tekst: (b, a) => `Et el-løbehjul koster ${b} kr. at låse op og ${a} kr. pr. minut.`,
    x: ["minut", "minutter"],
    y: "kr.",
    b: { min: 5, max: 15, trin: 5 },
    a: { min: 2, max: 4, trin: 1 },
    antal: [5, 30],
  },
  {
    id: "taxa",
    tekst: (b, a) => `En taxa koster ${b} kr. i startgebyr og ${a} kr. pr. km.`,
    x: ["km", "km"],
    y: "kr.",
    b: { min: 30, max: 60, trin: 5 },
    a: { min: 8, max: 16, trin: 1 },
    antal: [2, 20],
  },
  {
    id: "limonade",
    tekst: (b, a) => `I en limonadebod koster et medlemskab ${b} kr., og hvert glas koster ${a} kr.`,
    x: ["glas", "glas"],
    y: "kr.",
    b: { min: 5, max: 20, trin: 5 },
    a: { min: 2, max: 6, trin: 1 },
    antal: [2, 12],
  },
  {
    id: "opsparing",
    tekst: (b, a) => `Ida har ${b} kr. i sparegrisen og lægger ${a} kr. i hver uge.`,
    x: ["uge", "uger"],
    y: "kr.",
    b: { min: 50, max: 400, trin: 50 },
    a: { min: 20, max: 100, trin: 10 },
    antal: [2, 15],
  },
  {
    id: "fitness",
    tekst: (b, a) => `Et fitnesscenter koster ${b} kr. i indmeldelse og ${a} kr. pr. måned.`,
    x: ["måned", "måneder"],
    y: "kr.",
    b: { min: 100, max: 300, trin: 50 },
    a: { min: 150, max: 300, trin: 25 },
    antal: [2, 12],
  },
  {
    id: "musik",
    tekst: (b, a) => `En musikskole koster ${b} kr. i tilmelding og ${a} kr. pr. lektion.`,
    x: ["lektion", "lektioner"],
    y: "kr.",
    b: { min: 100, max: 250, trin: 50 },
    a: { min: 60, max: 120, trin: 10 },
    antal: [4, 20],
  },
  {
    id: "data",
    tekst: (b, a) => `Malte har ${b} GB data på sit abonnement og bruger ${a} GB om dagen.`,
    x: ["dag", "dage"],
    y: "GB",
    aftagende: true,
    b: { min: 10, max: 50, trin: 5 },
    a: { min: 1, max: 4, trin: 1 },
    antal: [2, 10],
  },
  {
    id: "lys",
    tekst: (b, a) => `Et stearinlys er ${b} cm højt og brænder ${a} cm ned i timen.`,
    x: ["time", "timer"],
    y: "cm",
    aftagende: true,
    b: { min: 15, max: 30, trin: 1 },
    a: { min: 1, max: 3, trin: 1 },
    antal: [2, 8],
  },
];

const navn = (s: Situation, n: number) => (n === 1 ? s.x[0] : s.x[1]);

// ---------------------------------------------------------- opgavetyper

function indsaet(rng: Rng, niveau: NiveauId): Opgave {
  let a = 0;
  let b = 0;
  let x = 0;
  if (niveau === "bronze") {
    a = heltal(rng, 2, 9);
    b = heltal(rng, 1, 20);
    x = heltal(rng, 2, 10);
  } else {
    do {
      a = ikkeNul(rng, -6, 8);
      b = heltal(rng, -12, 25);
      x = ikkeNul(rng, -5, 9);
    } while (a > 0 && x > 0 && b >= 0);
  }
  const y = a * x + b;
  const fx = rng() < 0.5;
  return talOpgave({
    noegle: `forskrift:indsaet:${a}:${b}:${x}:${fx ? "f" : "y"}`,
    optakt: "Sæt ind",
    spoergsmaal: fx
      ? `${forskrift(a, b, "f(x)")}. Hvad er f(${tal(x)})?`
      : `${forskrift(a, b)}. Hvad er y, når x = ${tal(x)}?`,
    svar: y,
    foran: fx ? `f(${tal(x)}) =` : "y =",
    strategi: "Gange før plus",
    hint:
      b === 0
        ? `Sæt ${tal(x)} ind på x's plads: ${tal(a)} · ${ip(x)} = ${tal(y)}.${a < 0 && x < 0 ? " Minus gange minus giver plus." : ""}`
        : `Sæt ${tal(x)} ind på x's plads: ${tal(a)} · ${ip(x)} ${b < 0 ? "−" : "+"} ${tal(Math.abs(b))} = ${tal(a * x)} ${b < 0 ? "−" : "+"} ${tal(Math.abs(b))} = ${tal(y)}.${a < 0 && x < 0 ? " Minus gange minus giver plus." : ""}`,
  });
}

function aEllerB(rng: Rng, niveau: NiveauId): Opgave {
  const a = niveau === "bronze" ? heltal(rng, 2, 12) : ikkeNul(rng, -9, 12);
  const b = niveau === "bronze" ? heltal(rng, 1, 20) : ikkeNul(rng, -15, 20);
  const spoergA = rng() < 0.5;
  const bronze = niveau === "bronze";
  return talOpgave({
    noegle: `forskrift:${spoergA ? "a" : "b"}:${a}:${b}`,
    optakt: "Aflæs i forskriften",
    spoergsmaal: spoergA
      ? bronze
        ? `${forskrift(a, b)}. Hvor meget vokser y, hver gang x vokser med 1?`
        : `${forskrift(a, b)}. Hvad er hældningstallet a?`
      : bronze
        ? `${forskrift(a, b)}. Hvad er y, når x = 0?`
        : `${forskrift(a, b)}. Hvor skærer linjen y-aksen? Skriv y-værdien.`,
    svar: spoergA ? a : b,
    foran: spoergA ? (bronze ? "" : "a =") : "y =",
    strategi: spoergA ? "a står foran x" : "b står alene",
    hint: spoergA
      ? `I y = ax + b er a tallet foran x. Her er a = ${tal(a)}: hver gang x bliver 1 større, ${a > 0 ? "vokser" : "falder"} y med ${tal(Math.abs(a))}.`
      : `I y = ax + b er b tallet, der står alene. Når x = 0, forsvinder ax, og tilbage er y = ${tal(b)}.`,
  });
}

const iTrin = (rng: Rng, r: { min: number; max: number; trin: number }) =>
  r.min + r.trin * heltal(rng, 0, Math.floor((r.max - r.min) / r.trin));

function situationTal(rng: Rng, _niveau: NiveauId, s: Situation) {
  for (;;) {
    const a = iTrin(rng, s.a);
    const b = iTrin(rng, s.b);
    const x = heltal(rng, s.antal[0], s.antal[1]);
    // Det, der brænder ned eller bruges, må ikke gå under nul.
    if (s.aftagende && b - a * x < 1) continue;
    return { a, b, x };
  }
}

function hverdagFrem(rng: Rng, niveau: NiveauId): Opgave {
  // Bronze holder sig til de situationer, hvor tallene er små.
  const s = vaelg(
    rng,
    niveau === "bronze"
      ? SITUATIONER.filter((v) => ["loebehjul", "limonade", "opsparing", "taxa"].includes(v.id))
      : SITUATIONER,
  );
  const { a, b, x } = situationTal(rng, niveau, s);
  const y = s.aftagende ? b - a * x : b + a * x;
  return talOpgave({
    noegle: `forskrift:frem:${s.id}:${a}:${b}:${x}`,
    optakt: "Hverdag",
    spoergsmaal: `${s.tekst(b, a)} ${s.aftagende ? "Hvor meget er der tilbage" : "Hvor meget er det i alt"} efter ${x} ${navn(s, x)}?`,
    svar: y,
    enhed: s.y,
    strategi: "Det faste + pr. stk. gange antal",
    hint: s.aftagende
      ? `Start med ${b} ${s.y}, og træk ${a} fra ${x} gange: ${b} − ${a} · ${x} = ${b} − ${a * x} = ${y}. Forskriften er ${forskrift(-a, b)}.`
      : `Det faste beløb tælles én gang, resten ganges med antallet: ${b} + ${a} · ${x} = ${b} + ${a * x} = ${y}. Forskriften er ${forskrift(a, b)}.`,
  });
}

function hverdagBaglaens(rng: Rng, niveau: NiveauId): Opgave {
  const s = vaelg(rng, SITUATIONER);
  const { a, b, x } = situationTal(rng, niveau, s);
  const y = s.aftagende ? b - a * x : b + a * x;
  return talOpgave({
    noegle: `forskrift:bag:${s.id}:${a}:${b}:${x}`,
    optakt: "Hverdag — baglæns",
    spoergsmaal: s.aftagende
      ? `${s.tekst(b, a)} Efter hvor mange ${s.x[1]} er der ${y} ${s.y} tilbage?`
      : `${s.tekst(b, a)} Det kostede ${y} kr. i alt. Hvor mange ${s.x[1]} var det?`,
    svar: x,
    enhed: s.x[1],
    strategi: "Fjern det faste først",
    hint: s.aftagende
      ? `Der er brugt ${b} − ${y} = ${b - y} ${s.y}. Med ${a} pr. ${s.x[0]}: ${b - y} : ${a} = ${x}.`
      : `Træk det faste fra: ${y} − ${b} = ${y - b}. Det er det, der er betalt pr. ${s.x[0]}: ${y - b} : ${a} = ${x}.`,
  });
}

function hverdagForskrift(rng: Rng, niveau: NiveauId): Opgave {
  const s = vaelg(rng, SITUATIONER);
  const { a, b } = situationTal(rng, niveau, s);
  const aa = s.aftagende ? -a : a;
  return valgOpgave(
    {
      noegle: `forskrift:mcsit:${s.id}:${aa}:${b}`,
      optakt: "Sæt X",
      spoergsmaal: `${s.tekst(b, a)} Hvilken forskrift passer, når x er antal ${s.x[1]} og y er ${s.y === "kr." ? "prisen i kr." : `antal ${s.y}`}?`,
      svar: forskrift(aa, b),
      andre: [forskrift(b, aa), forskrift(b, a), forskrift(a + b, 0), forskrift(-aa, b), forskrift(aa, -b)],
      strategi: "Pr. stk. foran x",
      hint: `Det, der ${s.aftagende ? "trækkes fra" : "lægges til"} for hver ${s.x[0]}, er hældningstallet og står foran x${s.aftagende ? " med minus" : ""}. Det faste står alene: ${forskrift(aa, b)}.`,
    },
    rng,
  );
}

/** Tabel med x = 0, 1, 2 … Én af y-værdierne mangler. */
function manglendeITabel(rng: Rng, niveau: NiveauId): Opgave {
  const a = niveau === "bronze" ? heltal(rng, 2, 9) : ikkeNul(rng, -6, 9);
  const b = niveau === "bronze" ? heltal(rng, 0, 15) : heltal(rng, -10, 15);
  const start = niveau === "bronze" ? 0 : heltal(rng, -3, 0);
  const xs = [0, 1, 2, 3, 4, 5].map((i) => start + i);
  const hul = heltal(rng, 2, 5);
  const svar = a * xs[hul] + b;
  return talOpgave({
    noegle: `forskrift:hul:${a}:${b}:${start}:${hul}`,
    optakt: "Tabel",
    spoergsmaal: "Tabellen viser en lineær funktion. Hvilket tal skal stå på spørgsmålstegnets plads?",
    figur: tabel(
      ["x", "y"],
      xs,
      xs.map((x, i) => (i === hul ? "?" : a * x + b)),
    ),
    svar,
    strategi: "Samme spring hver gang",
    hint: `Hver gang x vokser med 1, ${a > 0 ? "vokser" : "falder"} y med ${tal(Math.abs(a))}. Gå fra nabotallet: ${tal(a * xs[hul - 1] + b)} ${a > 0 ? "+" : "−"} ${tal(Math.abs(a))} = ${tal(svar)}.`,
  });
}

/** Find a eller b ud fra en tabel. På guld starter tabellen ikke i x = 0. */
function abFraTabel(rng: Rng, niveau: NiveauId): Opgave {
  const a = ikkeNul(rng, -6, 8);
  const b = heltal(rng, -10, 15);
  const guld = niveau === "guld";
  const spring = guld ? vaelg(rng, [1, 2]) : 1;
  const start = guld ? heltal(rng, 1, 3) : 0;
  const xs = [0, 1, 2, 3, 4].map((i) => start + i * spring);
  const spoergA = rng() < 0.5;
  return talOpgave({
    noegle: `forskrift:tab${spoergA ? "a" : "b"}:${a}:${b}:${start}:${spring}`,
    optakt: "Tabel",
    spoergsmaal: `Tabellen viser en lineær funktion y = ax + b. Hvad er ${spoergA ? "a" : "b"}?`,
    figur: tabel(["x", "y"], xs, xs.map((x) => a * x + b)),
    svar: spoergA ? a : b,
    foran: spoergA ? "a =" : "b =",
    strategi: spoergA ? "Spring i y delt med spring i x" : "Gå baglæns til x = 0",
    hint: spoergA
      ? spring === 1
        ? `Når x vokser med 1, ændres y med ${tal(a)}. Det er a.`
        : `x springer ${spring} ad gangen, og y ændres ${tal(a * spring)}. Pr. 1 i x: ${tal(a * spring)} : ${spring} = ${tal(a)}.`
      : start === 0
        ? `b er y-værdien, når x = 0. Den står i første kolonne: ${tal(b)}.`
        : `Find først a = ${tal(a)}. Gå så baglæns fra x = ${start} til x = 0: ${tal(a * start + b)} ${a > 0 ? "−" : "+"} ${tal(Math.abs(a))} · ${start} = ${tal(b)}.`,
  });
}

/** maj 24 opg. 11: tabellen → hvilken forskrift? */
function tabelTilForskrift(rng: Rng): Opgave {
  let a = 0;
  let b = 0;
  do {
    a = ikkeNul(rng, -4, 4);
    b = ikkeNul(rng, -6, 6);
  } while (Math.abs(a) === Math.abs(b));
  const xs = [0, 1, 2, 3, 4, 5];
  const fx = rng() < 0.5;
  const v = fx ? "f(x)" : "y";
  return valgOpgave(
    {
      noegle: `forskrift:mctab:${a}:${b}:${v}`,
      optakt: "Sæt X",
      spoergsmaal: `Tabellen viser værdier for en lineær funktion. Hvilken forskrift har den?`,
      figur: tabel(["x", v], xs, xs.map((x) => a * x + b)),
      svar: forskrift(a, b, v),
      andre: [
        forskrift(b, b, v),
        forskrift(-a, b, v),
        forskrift(a, -b, v),
        forskrift(-a, -b, v),
        forskrift(b, a, v),
      ],
      strategi: "b ved x = 0, a er springet",
      hint: `Ved x = 0 er ${v} = ${tal(b)}, så b = ${tal(b)}. Fra kolonne til kolonne ${a > 0 ? "vokser" : "falder"} ${v} med ${tal(Math.abs(a))}, så a = ${tal(a)}. Tjek med en kolonne mere, fx x = 3: ${tal(a * 3 + b)}.`,
    },
    rng,
  );
}

/** dec 23 opg. 11: forskriften → hvilken række y-værdier? */
function forskriftTilRaekke(rng: Rng): Opgave {
  let a = 0;
  let b = 0;
  do {
    a = ikkeNul(rng, -4, 5);
    b = ikkeNul(rng, -5, 5);
  } while (Math.abs(a) === Math.abs(b));
  const xs = [-2, -1, 0, 1, 2];
  // Et em-mellemrum: browseren slår ikke den slags mellemrum sammen.
  const raekke = (aa: number, bb: number) => xs.map((x) => tal(aa * x + bb)).join("\u2003");
  return valgOpgave(
    {
      noegle: `forskrift:raekke:${a}:${b}`,
      optakt: "Sæt X",
      spoergsmaal: `Hvilken række f(x)-værdier passer til forskriften ${forskrift(a, b, "f(x)")}?`,
      figur: tabel(["x", "f(x)"], xs, xs.map(() => "")),
      svar: raekke(a, b),
      andre: [raekke(a, -b), raekke(-a, b), raekke(b, a), raekke(-b, a), raekke(-a, -b)],
      // Fire muligheder, så hver række kan stå på én linje.
      antal: 4,
      strategi: "Tjek x = 0 og x = 1",
      hint: `Du behøver ikke regne hele rækken. Ved x = 0 skal f(x) være ${tal(b)}, og ved x = 1 skal den være ${tal(a + b)}. Kun én række har begge dele.`,
    },
    rng,
  );
}

/** dec 25 opg. 3: fast pris pr. meter. */
function fastPris(rng: Rng, niveau: NiveauId): Opgave {
  const varer = [
    { id: "kabel", tekst: "elkabel", enhed: "m", navne: ["Længde (m)", "Pris (kr.)"] as [string, string], pris: [8, 29] },
    { id: "reb", tekst: "klatrereb", enhed: "m", navne: ["Længde (m)", "Pris (kr.)"] as [string, string], pris: [15, 39] },
    { id: "slik", tekst: "bland-selv-slik", enhed: "hg", navne: ["Vægt (hg)", "Pris (kr.)"] as [string, string], pris: [8, 16] },
    { id: "stof", tekst: "gardinstof", enhed: "m", navne: ["Længde (m)", "Pris (kr.)"] as [string, string], pris: [25, 79] },
  ];
  const v = vaelg(rng, varer);
  const pris = heltal(rng, v.pris[0], v.pris[1]);
  const xs = [10, 20, 30, 40, 50];
  const spoergPrStk = rng() < 0.4;
  const k = vaelg(rng, niveau === "guld" ? [15, 25, 35, 45, 5] : [5, 15, 25, 60, 100]);
  return talOpgave({
    noegle: `forskrift:fast:${v.id}:${pris}:${spoergPrStk ? "pr" : k}`,
    optakt: "Fast pris",
    spoergsmaal: `Tabellen viser priser på ${v.tekst}, der koster det samme pr. ${v.enhed}. ${
      spoergPrStk ? `Hvad koster ${v.tekst} pr. ${v.enhed}?` : `Hvad koster ${k} ${v.enhed}?`
    }`,
    figur: tabel(v.navne, xs, xs.map((x) => pris * x)),
    svar: spoergPrStk ? pris : pris * k,
    enhed: "kr.",
    strategi: "Find prisen for én",
    hint: spoergPrStk
      ? `10 ${v.enhed} koster ${pris * 10} kr. Én ${v.enhed} koster en tiendedel: ${pris} kr.`
      : `Én ${v.enhed} koster ${pris * 10} : 10 = ${pris} kr. Så koster ${k} ${v.enhed}: ${pris} · ${k} = ${pris * k} kr. ${k % 10 === 5 ? `Eller: halvdelen af ${k * 2} ${v.enhed}.` : ""}`.trim(),
  });
}

// ------------------------------------------------------------ platin

/** En linje gennem to punkter: find a eller b. Hældningen må gerne være et kommatal. */
function toPunkter(rng: Rng): Opgave {
  for (;;) {
    const a = vaelg(rng, [-3, -2, -1.5, -0.5, 0.5, 1.5, 2, 2.5, 3, 4]);
    const b = heltal(rng, -9, 12);
    const x1 = heltal(rng, 1, 4);
    const x2 = x1 + heltal(rng, 2, 5);
    const y1 = a * x1 + b;
    const y2 = a * x2 + b;
    if (!Number.isInteger(y1) || !Number.isInteger(y2)) continue;
    const spoergA = rng() < 0.5;
    return talOpgave({
      noegle: `forskrift:to${spoergA ? "a" : "b"}:${x1}:${y1}:${x2}:${y2}`,
      optakt: "Uden tegning",
      spoergsmaal: `En ret linje y = ax + b går gennem ${punkt(x1, y1)} og ${punkt(x2, y2)}. Hvad er ${spoergA ? "a" : "b"}?`,
      svar: spoergA ? a : b,
      foran: spoergA ? "a =" : "b =",
      strategi: "a = ændring i y : ændring i x",
      hint: `a = (${tal(y2)} − ${ip(y1)}) : (${x2} − ${x1}) = ${tal(y2 - y1)} : ${x2 - x1} = ${tal(a)}.${spoergA ? "" : ` Sæt det første punkt ind: ${tal(y1)} = ${tal(a)} · ${x1} + b, så b = ${tal(y1)} − ${ip(a * x1)} = ${tal(b)}.`}`,
    });
  }
}

/** Ujævne spring i x. Find en manglende værdi. */
function ujaevnTabel(rng: Rng): Opgave {
  for (;;) {
    const a = vaelg(rng, [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5, -3, 3, 4]);
    const b = heltal(rng, -6, 10);
    const xs = [heltal(rng, -2, 1)];
    for (let i = 0; i < 4; i++) xs.push(xs[xs.length - 1] + heltal(rng, 1, 3));
    const ys = xs.map((x) => a * x + b);
    if (!ys.every((y) => Number.isInteger(y * 2))) continue;
    const hul = heltal(rng, 2, 4);
    return talOpgave({
      noegle: `forskrift:ujaevn:${a}:${b}:${xs.join(",")}:${hul}`,
      optakt: "Tabel",
      spoergsmaal: "Tabellen viser en lineær funktion. Hvilket tal skal stå på spørgsmålstegnets plads?",
      figur: tabel(["x", "y"], xs, ys.map((y, i) => (i === hul ? "?" : y))),
      svar: ys[hul],
      strategi: "Find a — springene i x er ikke ens",
      hint: `Fra x = ${tal(xs[0])} til x = ${tal(xs[1])} ændres y med ${tal(ys[1] - ys[0])} på ${tal(xs[1] - xs[0])} skridt, så a = ${tal(a)}. Fra x = ${tal(xs[hul - 1])} til x = ${tal(xs[hul])} er der ${tal(xs[hul] - xs[hul - 1])} skridt: ${tal(ys[hul - 1])} ${a > 0 ? "+" : "−"} ${tal(Math.abs(a * (xs[hul] - xs[hul - 1])))} = ${tal(ys[hul])}.`,
    });
  }
}

/** To tilbud: hvornår koster de det samme? (Materiale 06, side 5: to taxaselskaber.) */
function hvornaarLigeDyre(rng: Rng): Opgave {
  const kontekster = [
    {
      id: "taxa",
      e: "km",
      en: "km",
      A: "Taxa Nord",
      B: "Taxa Syd",
      pr: [8, 14, 1],
      forskel: [1, 4, 1],
      start: [20, 45, 5],
      antal: [3, 15],
      t: (b1: number, a1: number, b2: number, a2: number) =>
        `Taxa Nord koster ${b1} kr. + ${a1} kr. pr. km. Taxa Syd koster ${b2} kr. + ${a2} kr. pr. km.`,
    },
    {
      id: "fitness",
      e: "måneder",
      en: "måned",
      A: "Fitness A",
      B: "Fitness B",
      pr: [150, 250, 25],
      forskel: [25, 75, 25],
      start: [0, 200, 50],
      antal: [2, 12],
      t: (b1: number, a1: number, b2: number, a2: number) =>
        `Fitness A koster ${b1} kr. i indmeldelse + ${a1} kr. pr. måned. Fitness B koster ${b2} kr. i indmeldelse + ${a2} kr. pr. måned.`,
    },
    {
      id: "cykel",
      e: "timer",
      en: "time",
      A: "Udlejer A",
      B: "Udlejer B",
      pr: [20, 40, 5],
      forskel: [5, 15, 5],
      start: [0, 50, 10],
      antal: [2, 8],
      t: (b1: number, a1: number, b2: number, a2: number) =>
        `Udlejer A tager ${b1} kr. + ${a1} kr. pr. time for en cykel. Udlejer B tager ${b2} kr. + ${a2} kr. pr. time.`,
    },
  ];
  const k = vaelg(rng, kontekster);
  const tr = (r: number[]) => iTrin(rng, { min: r[0], max: r[1], trin: r[2] });
  const a1 = tr(k.pr);
  const a2 = a1 + tr(k.forskel);
  const b2 = tr(k.start);
  const x = heltal(rng, k.antal[0], k.antal[1]);
  const b1 = b2 + (a2 - a1) * x;
  return talOpgave({
    noegle: `forskrift:lige:${k.id}:${a1}:${b1}:${a2}:${b2}`,
    optakt: "To tilbud",
    spoergsmaal: `${k.t(b1, a1, b2, a2)} Ved hvor mange ${k.e} koster de to det samme?`,
    svar: x,
    enhed: k.e,
    strategi: "Sæt de to forskrifter lig hinanden",
    hint: `${a1}x + ${b1} = ${a2}x + ${b2}. ${k.A} starter ${b1 - b2} kr. dyrere, men ${k.B} koster ${a2 - a1} kr. mere pr. ${k.en}. Forskellen er væk efter ${b1 - b2} : ${a2 - a1} = ${x} ${k.e}.`,
  });
}

/** Kommatal i prisen, som jordbærplukkeren i maj 26. */
function kommaPris(rng: Rng): Opgave {
  const a = vaelg(rng, [7.5, 6.5, 8.5, 5.5, 6.25, 7.25]);
  const b = 25 * heltal(rng, 0, 8);
  let x = 0;
  do x = heltal(rng, 4, 40);
  while (!Number.isInteger(a * x * 4));
  const y = b + a * x;
  const baglaens = rng() < 0.5;
  const tekst =
    b === 0
      ? `Mads tjener ${tal(a)} kr. pr. kg jordbær, han plukker.`
      : `Mads får ${b} kr. for at møde op og tjener derudover ${tal(a)} kr. pr. kg jordbær, han plukker.`;
  return talOpgave({
    noegle: `forskrift:komma:${a}:${b}:${x}:${baglaens ? "b" : "f"}`,
    optakt: "Hverdag",
    spoergsmaal: baglaens
      ? `${tekst} Han har tjent ${tal(y)} kr. Hvor mange kg har han plukket?`
      : `${tekst} Hvor meget tjener han, hvis han plukker ${x} kg?`,
    svar: baglaens ? x : y,
    enhed: baglaens ? "kg" : "kr.",
    strategi: "Regn med hele tal, del til sidst",
    hint: baglaens
      ? `${b > 0 ? `Træk det faste fra: ${tal(y)} − ${b} = ${tal(y - b)}. ` : ""}Del med ${tal(a)}: ${tal(y - b)} : ${tal(a)} = ${x}. Tip: ${tal(a)} · 4 = ${tal(a * 4)}, så 4 kg giver ${tal(a * 4)} kr.`
      : `${tal(a)} · ${x} = ${tal(a * x)}${b > 0 ? `, plus de faste ${b} kr. = ${tal(y)}` : ""}. Tip: ${tal(a)} · 4 = ${tal(a * 4)}.`,
  });
}

// -------------------------------------------------------------- samlet

export function lavForskrift(rng: Rng, niveau: NiveauId): Opgave {
  if (niveau === "bronze") {
    switch (heltal(rng, 1, 4)) {
      case 1:
        return indsaet(rng, niveau);
      case 2:
        return hverdagFrem(rng, niveau);
      case 3:
        return aEllerB(rng, niveau);
      default:
        return manglendeITabel(rng, niveau);
    }
  }
  if (niveau === "soelv") {
    switch (heltal(rng, 1, 6)) {
      case 1:
        return indsaet(rng, niveau);
      case 2:
        return hverdagBaglaens(rng, niveau);
      case 3:
        return abFraTabel(rng, niveau);
      case 4:
        return hverdagForskrift(rng, niveau);
      case 5:
        return fastPris(rng, niveau);
      default:
        return manglendeITabel(rng, niveau);
    }
  }
  if (niveau === "guld") {
    switch (heltal(rng, 1, 5)) {
      case 1:
        return tabelTilForskrift(rng);
      case 2:
        return forskriftTilRaekke(rng);
      case 3:
        return fastPris(rng, niveau);
      case 4:
        return abFraTabel(rng, niveau);
      default:
        return rng() < 0.5 ? hverdagBaglaens(rng, niveau) : aEllerB(rng, niveau);
    }
  }
  switch (heltal(rng, 1, 4)) {
    case 1:
      return toPunkter(rng);
    case 2:
      return ujaevnTabel(rng);
    case 3:
      return hvornaarLigeDyre(rng);
    default:
      return kommaPris(rng);
  }
}
