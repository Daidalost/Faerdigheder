/**
 * Kontrol af opgavegeneratorerne.
 *
 * Kør med:  npm test
 *
 * Testen regner hver eneste genererede opgave efter uafhængigt af generatoren
 * — regnestykker parses og udregnes forfra, omregninger tjekkes mod en
 * selvstændig enhedstabel — og måler samtidig hvor mange forskellige opgaver
 * hver kombination af emne og niveau kan producere.
 */

import { lavRunde, lavEnOpgave } from "../lib/opgaver/index";
import { lavRng } from "../lib/tilfaeldig";
import type { EmneId, NiveauId, Opgave } from "../lib/typer";
import { kravFor } from "../lib/katalog";

const EMNER: EmneId[] = [
  "addition",
  "subtraktion",
  "multiplikation",
  "division",
  "omregning",
  "vurdering",
  "skrivemaader",
  "procentregning",
  "sammenlign",
  "aflaes",
  "forskrift",
  "graf",
  "trin",
  "beggesider",
  "broekparentes",
];
const NIVEAUER: NiveauId[] = ["bronze", "soelv", "guld", "platin"];

const LINEAERE: EmneId[] = ["aflaes", "forskrift", "graf"];
const LIGNINGER: EmneId[] = ["trin", "beggesider", "broekparentes"];

/** Emner hvor spørgsmålet er en sætning og ikke et regnestykke. */
const TEKSTEMNER: EmneId[] = ["skrivemaader", "procentregning", "sammenlign"];

let fejl = 0;
const sig = (ok: boolean, besked: string) => {
  if (!ok) {
    fejl++;
    console.error("  FEJL: " + besked);
  }
};

const talAf = (s: string) => {
  const r = s.replace(/\s/g, "").replace(/−/g, "-").replace(",", ".");
  const m = r.match(/^(-?[\d.]+)\/([\d.]+)$/);
  return m ? Number(m[1]) / Number(m[2]) : Number(r);
};

// ------------------------------------------------------------------------
// Uafhængig udregner til ligninger og forskrifter.
// Forstår  +  −  ·  /  ²  parenteser, kommatal, "5x", "3 · (x + 4)",
// "6x/4", "12/x", "(x + 5)/2" og brøktal som "1/2x" og "3/4".
// ------------------------------------------------------------------------

type Tok = { t: "tal"; v: number } | { t: "x" } | { t: "op"; v: string };

function tokens(udtryk: string): Tok[] {
  const s = udtryk.replace(/−/g, "-").replace(/·/g, "*").replace(/²/g, "^2").replace(/\s/g, "");
  const ud: Tok[] = [];
  let i = 0;
  const læsTal = () => {
    let j = i;
    while (j < s.length && /[\d,]/.test(s[j])) j++;
    const v = Number(s.slice(i, j).replace(",", "."));
    i = j;
    return v;
  };
  while (i < s.length) {
    const ch = s[i];
    if (/\d/.test(ch)) {
      const v = læsTal();
      // "3/4" og "1/2x": tal skråstreg tal er et brøktal, ikke en division.
      if (s[i] === "/" && /\d/.test(s[i + 1] ?? "")) {
        i++;
        const n = læsTal();
        ud.push({ t: "tal", v: v / n });
      } else ud.push({ t: "tal", v });
    } else if (ch === "x") {
      ud.push({ t: "x" });
      i++;
    } else if ("+-*/^()".includes(ch)) {
      ud.push({ t: "op", v: ch });
      i++;
    } else throw new Error(`ukendt tegn "${ch}" i "${udtryk}"`);
  }
  return ud;
}

function evaluer(udtryk: string, x: number): number {
  const tk = tokens(udtryk);
  let p = 0;
  const kig = () => tk[p];
  const erOp = (v: string) => kig()?.t === "op" && (kig() as { v: string }).v === v;
  function sum(): number {
    let v = produkt();
    while (erOp("+") || erOp("-")) {
      const op = (tk[p++] as { v: string }).v;
      const h = produkt();
      v = op === "+" ? v + h : v - h;
    }
    return v;
  }
  function produkt(): number {
    let v = fortegn();
    for (;;) {
      if (erOp("*")) {
        p++;
        v *= fortegn();
      } else if (erOp("/")) {
        p++;
        v /= fortegn();
      } else if (kig() && (kig().t === "tal" || kig().t === "x" || erOp("("))) {
        v *= potens(); // underforstået gange: 5x, 3(x + 4)
      } else return v;
    }
  }
  function fortegn(): number {
    if (erOp("-")) {
      p++;
      return -fortegn();
    }
    return potens();
  }
  function potens(): number {
    const v = atom();
    if (erOp("^")) {
      p++;
      return Math.pow(v, atom());
    }
    return v;
  }
  function atom(): number {
    const t = tk[p++];
    if (!t) throw new Error(`udtrykket slutter for tidligt: "${udtryk}"`);
    if (t.t === "tal") return t.v;
    if (t.t === "x") return x;
    if (t.v === "(") {
      const v = sum();
      if (!erOp(")")) throw new Error(`mangler ")" i "${udtryk}"`);
      p++;
      return v;
    }
    throw new Error(`uventet "${t.v}" i "${udtryk}"`);
  }
  const v = sum();
  if (p !== tk.length) throw new Error(`rest i "${udtryk}"`);
  return v;
}

const lig = (a: number, b: number) => Math.abs(a - b) < 1e-9;

/** Højresiden af "y = 2x + 3" eller "f(x) = 2x + 3". */
const hoejreside = (f: string) => f.slice(f.indexOf("=") + 1);

/** Er forskriften en ret linje? Og i så fald: hvilken? */
function somLinje(f: string): { ret: boolean; a: number; b: number; v: (x: number) => number } {
  const v = (x: number) => evaluer(hoejreside(f), x);
  const b = v(0);
  const a = v(1) - b;
  const ret = lig(v(2) - v(1), a) && lig(v(-3) + 3 * a, b);
  return { ret, a, b, v };
}

const punktAf = (s: string): [number, number] => {
  const [x, y] = s.replace(/[()\s]/g, "").split(";");
  return [talAf(x), talAf(y)];
};

function tjekLigning(niveau: NiveauId, o: Opgave, hvor: string): void {
  const dele = o.spoergsmaal.split(" = ");
  sig(dele.length === 2, `${hvor}: ligningen "${o.spoergsmaal}" har ikke præcis ét lighedstegn`);
  if (dele.length !== 2) return;
  const x = talAf(o.svar);
  try {
    const v = evaluer(dele[0], x);
    const h = evaluer(dele[1], x);
    sig(lig(v, h), `${hvor}: ${o.spoergsmaal} med x = ${o.svar} giver ${v} = ${h}`);
    // Løsningen skal være entydig: et andet x må ikke også passe.
    sig(!lig(evaluer(dele[0], x + 1), evaluer(dele[1], x + 1)), `${hvor}: ${o.spoergsmaal} passer også med x + 1`);
  } catch (e) {
    sig(false, `${hvor}: ${(e as Error).message}`);
  }
  if (niveau !== "platin") {
    sig(Number.isInteger(x), `${hvor}: ${o.spoergsmaal} har ikke et helt tal som løsning (${o.svar})`);
  }
  sig(o.foran === "x =", `${hvor}: mangler "x =" foran feltet`);
}

/** Præcis én af svarmulighederne opfylder betingelsen — og det er facit. */
function praeciEn(o: Opgave, hvor: string, ok: (v: string) => boolean, hvad: string): void {
  const passer = o.valg!.filter((v) => {
    try {
      return ok(v);
    } catch (e) {
      sig(false, `${hvor}: ${(e as Error).message}`);
      return false;
    }
  });
  sig(
    passer.length === 1 && passer[0] === o.svar,
    `${hvor}: ${hvad} — ${passer.length} muligheder passer (${passer.join(" | ")}), facit er ${o.svar}`,
  );
}

const AFTAGENDE = ["data", "lys"];

function tjekLineaer(o: Opgave, hvor: string): void {
  const n = o.noegle.split(":");
  const [emne, type] = n;
  const N = (i: number) => Number(n[i]);
  const fig = o.figur;
  const linjerI = fig?.slags === "koordinatsystem" ? fig.linjer ?? [] : [];
  const harLinje = (a: number, b: number) => linjerI.some((l) => lig(l.a, a) && lig(l.b, b));
  const tabelOk = (a: number, b: number) => {
    if (fig?.slags !== "tabel") return sig(false, `${hvor}: mangler tabel`);
    fig.x.forEach((xs, i) => {
      const y = fig.y[i];
      if (y === "?" || y === "") return;
      sig(lig(talAf(y), a * talAf(xs) + b), `${hvor}: tabellen passer ikke med a = ${a}, b = ${b} ved x = ${xs}`);
    });
  };
  const facitTal = () => talAf(o.svar);
  const facitPunkt = () => punktAf(o.svar);
  const svarSkal = (forventet: number) =>
    sig(lig(facitTal(), forventet), `${hvor}: facit ${o.svar}, kontrollen siger ${forventet} (${o.noegle})`);
  const punktSkal = (x: number, y: number) => {
    const [fx, fy] = facitPunkt();
    sig(lig(fx, x) && lig(fy, y), `${hvor}: facit ${o.svar}, kontrollen siger (${x};${y}) (${o.noegle})`);
  };

  if (emne === "aflaes") {
    switch (type) {
      case "punkt": {
        punktSkal(N(2), N(3));
        const p = fig?.slags === "koordinatsystem" ? fig.punkter?.[0] : undefined;
        sig(!!p && p.x === N(2) && p.y === N(3), `${hvor}: punktet i figuren passer ikke`);
        return;
      }
      case "hvilket": {
        const pkt = fig?.slags === "koordinatsystem" ? fig.punkter ?? [] : [];
        const med = pkt.filter((p) => p.x === N(2) && p.y === N(3));
        sig(med.length === 1 && med[0].navn === o.svar, `${hvor}: ${o.svar} er ikke det eneste punkt i (${N(2)};${N(3)})`);
        return;
      }
      case "mcpunkt": {
        praeciEn(o, hvor, (v) => {
          const [x, y] = punktAf(v);
          return x === N(2) && y === N(3);
        }, "koordinatsæt");
        return;
      }
      case "yakse":
        punktSkal(0, N(3));
        sig(harLinje(N(2), N(3)), `${hvor}: linjen mangler i figuren`);
        return;
      case "xakse":
        punktSkal(-N(3) / N(2), 0);
        if (fig) sig(harLinje(N(2), N(3)), `${hvor}: linjen mangler i figuren`);
        return;
      case "yved":
        svarSkal(N(2) * N(4) + N(3));
        sig(harLinje(N(2), N(3)), `${hvor}: linjen mangler i figuren`);
        return;
      case "gennem":
        praeciEn(o, hvor, (v) => lig(somLinje(v).v(N(2)), N(3)), `linje gennem (${N(2)};${N(3)})`);
        return;
      case "skaer": {
        const [a1, b1, a2, b2] = [N(2), N(3), N(4), N(5)];
        const X = (b2 - b1) / (a1 - a2);
        punktSkal(X, a1 * X + b1);
        if (fig?.slags === "koordinatsystem") {
          sig(harLinje(a1, b1) && harLinje(a2, b2), `${hvor}: linjerne i figuren passer ikke`);
          const Y = a1 * X + b1;
          const inde = X >= fig.x[0] && X <= fig.x[1] && Y >= fig.y[0] && Y <= fig.y[1];
          sig(!inde, `${hvor}: skæringspunktet kan ses på tegningen`);
        }
        return;
      }
      case "ligger":
        praeciEn(o, hvor, (v) => {
          const [x, y] = punktAf(v);
          return lig(N(2) * x + N(3), y);
        }, "punkt på linjen");
        return;
    }
  }

  if (emne === "forskrift") {
    switch (type) {
      case "indsaet":
        return svarSkal(N(2) * N(4) + N(3));
      case "a":
        return svarSkal(N(2));
      case "b":
        return svarSkal(N(3));
      case "frem": {
        const [id, a, b, x] = [n[2], N(3), N(4), N(5)];
        return svarSkal(AFTAGENDE.includes(id) ? b - a * x : b + a * x);
      }
      case "bag": {
        const [id, a, b, x] = [n[2], N(3), N(4), N(5)];
        const y = AFTAGENDE.includes(id) ? b - a * x : b + a * x;
        sig(o.spoergsmaal.includes(` ${y} `), `${hvor}: y-værdien ${y} står ikke i teksten`);
        return svarSkal(x);
      }
      case "mcsit":
        praeciEn(o, hvor, (v) => {
          const l = somLinje(v);
          return l.ret && lig(l.a, N(3)) && lig(l.b, N(4));
        }, "forskrift til situationen");
        return;
      case "hul": {
        const [a, b, start, hul] = [N(2), N(3), N(4), N(5)];
        tabelOk(a, b);
        return svarSkal(a * (start + hul) + b);
      }
      case "taba":
      case "tabb":
        tabelOk(N(2), N(3));
        return svarSkal(type === "taba" ? N(2) : N(3));
      case "mctab": {
        tabelOk(N(2), N(3));
        praeciEn(o, hvor, (v) => {
          const l = somLinje(v);
          return l.ret && lig(l.a, N(2)) && lig(l.b, N(3));
        }, "forskrift til tabellen");
        return;
      }
      case "raekke": {
        const raekke = [-2, -1, 0, 1, 2].map((x) => N(2) * x + N(3));
        praeciEn(o, hvor, (v) => {
          const tal = v.trim().split(/[\s\u2002\u2003]+/).map(talAf);
          return tal.length === 5 && tal.every((t, i) => lig(t, raekke[i]));
        }, "række til forskriften");
        return;
      }
      case "fast": {
        const pris = N(3);
        tabelOk(pris, 0);
        return svarSkal(n[4] === "pr" ? pris : pris * N(4));
      }
      case "toa":
      case "tob": {
        const [x1, y1, x2, y2] = [N(2), N(3), N(4), N(5)];
        const a = (y2 - y1) / (x2 - x1);
        return svarSkal(type === "toa" ? a : y1 - a * x1);
      }
      case "ujaevn": {
        const [a, b] = [N(2), N(3)];
        const xs = n[4].split(",").map(Number);
        tabelOk(a, b);
        return svarSkal(a * xs[N(5)] + b);
      }
      case "lige": {
        const [a1, b1, a2, b2] = [N(3), N(4), N(5), N(6)];
        return svarSkal((b1 - b2) / (a2 - a1));
      }
      case "komma": {
        const [a, b, x] = [N(2), N(3), N(4)];
        return svarSkal(n[5] === "b" ? x : b + a * x);
      }
    }
  }

  if (emne === "graf") {
    const linjeMed = (krav: (l: ReturnType<typeof somLinje>) => boolean) => (v: string) => {
      const l = somLinje(v);
      return l.ret && krav(l);
    };
    switch (type) {
      case "voks": {
        const a = N(2);
        sig(harLinje(a, N(3)), `${hvor}: linjen mangler i figuren`);
        return sig(o.svar === (a > 0 ? "Voksende" : a < 0 ? "Aftagende" : "Vandret"), `${hvor}: forkert facit for a = ${a}`);
      }
      case "hvilken": {
        const f = o.spoergsmaal.match(/forskriften (.+)\?$/)![1];
        const l = somLinje(f);
        const med = linjerI.filter((m) => lig(m.a, l.a) && lig(m.b, l.b));
        return sig(med.length === 1 && med[0].navn === o.svar, `${hvor}: ${f} passer ikke entydigt til linje ${o.svar}`);
      }
      case "mc":
        sig(harLinje(N(2), N(3)), `${hvor}: linjen mangler i figuren`);
        return praeciEn(o, hvor, linjeMed((l) => lig(l.a, N(2)) && lig(l.b, N(3))), "forskrift til grafen");
      case "haeld":
        return praeciEn(o, hvor, linjeMed((l) => lig(l.a, N(2))), `hældningstal ${N(2)}`);
      case "yskaer":
        return praeciEn(o, hvor, linjeMed((l) => lig(l.b, N(3))), `skærer y-aksen i ${N(3)}`);
      case "origo":
        return praeciEn(o, hvor, linjeMed((l) => lig(l.a, N(2)) && lig(l.b, 0)), "gennem (0;0)");
      case "ret":
        return praeciEn(o, hvor, linjeMed((l) => lig(l.b, N(2))), "ret linje");
      case "ikkeret":
        return praeciEn(o, hvor, (v) => {
          const l = somLinje(v);
          return !l.ret && lig(l.v(0), N(2));
        }, "ikke ret linje");
      case "topunkt":
        return praeciEn(o, hvor, linjeMed((l) => lig(l.v(N(2)), N(3)) && lig(l.v(N(4)), N(5))), "gennem to punkter");
      case "akser":
        return praeciEn(o, hvor, linjeMed((l) => lig(l.v(N(2)), 0) && lig(l.v(0), N(3))), "skæring med akserne");
      case "parallel":
        return praeciEn(
          o,
          hvor,
          linjeMed((l) => lig(l.a, N(2)) && lig(l.v(N(4)), N(5)) && !lig(l.b, N(3))),
          "parallel gennem punkt",
        );
    }
  }
  sig(false, `${hvor}: ukendt nøgletype ${o.noegle}`);
}

/** Regner et regnestykke efter forfra, uden at bruge generatorens facit. */
function facitForStykke(udtryk: string): number | null {
  const rent = udtryk.replace(/\s/g, "").replace(/,/g, ".");
  if (rent.includes("·")) {
    return rent.split("·").map(Number).reduce((a, b) => a * b, 1);
  }
  if (rent.includes(":")) {
    const [a, b] = rent.split(":").map(Number);
    return a / b;
  }
  if (rent.includes("−")) {
    const [a, b] = rent.split("−").map(Number);
    return a - b;
  }
  if (rent.includes("+")) {
    return rent.split("+").map(Number).reduce((a, b) => a + b, 0);
  }
  return null;
}

/** Uafhængig enhedstabel til kontrol af omregningsopgaverne. */
const FAKTOR: Record<string, number> = {
  mm: 1, cm: 10, dm: 100, m: 1000, km: 1_000_000,
  g: 1, kg: 1000,
  mL: 1, cL: 10, dL: 100, L: 1000,
  minutter: 1, timer: 60, "døgn": 1440,
  // Areal og rumfang (platin) — samme basis som rumfangskæden: cm³ = mL
  "cm²": 1, "dm²": 100, "m²": 10_000,
  "cm³": 1, "m³": 1_000_000,
};

function tjekOmregning(o: Opgave): void {
  const m = o.spoergsmaal.match(/^([\d.,]+)\s+(\S+)\s+=$/);
  sig(m !== null, `kunne ikke læse omregningsopgave: "${o.spoergsmaal}"`);
  if (!m) return;
  const fraVaerdi = talAf(m[1]);
  const fraEnhed = m[2];
  const tilEnhed = o.enhed!;
  sig(FAKTOR[fraEnhed] !== undefined, `ukendt enhed ${fraEnhed}`);
  sig(FAKTOR[tilEnhed] !== undefined, `ukendt enhed ${tilEnhed}`);
  const forventet = (fraVaerdi * FAKTOR[fraEnhed]) / FAKTOR[tilEnhed];
  const faktisk = talAf(o.svar);
  sig(
    Math.abs(forventet - faktisk) < 1e-6,
    `${o.spoergsmaal} ${o.enhed}: generator siger ${o.svar}, kontrol siger ${forventet}`,
  );
  // Prøvesættene bruger aldrig mere end tre decimaler i svaret.
  const decimaler = (o.svar.split(",")[1] ?? "").length;
  sig(decimaler <= 3, `for mange decimaler i svaret: ${o.spoergsmaal} = ${o.svar}`);
}

function tjekOpgave(emne: EmneId, niveau: NiveauId, o: Opgave): void {
  const hvor = `${emne}/${niveau}`;
  sig(
    o.spoergsmaal.trim().length > 0 || (o.optakt ?? "").trim().length > 0,
    `${hvor}: hverken spørgsmål eller optakt`,
  );
  sig(o.svar.trim().length > 0, `${hvor}: tomt svar`);
  sig(o.hint.trim().length > 10, `${hvor}: hint mangler eller er for kort`);
  sig(o.strategi.trim().length > 0, `${hvor}: strategi mangler`);

  // Ingen tekst må indeholde rester af en fejlberegning.
  const al = [o.spoergsmaal, o.optakt ?? "", o.hint, o.svar, ...(o.valg ?? [])].join(" ");
  sig(!/\bNaN\b|\bundefined\b|Infinity|\bnull\b/.test(al), `${hvor}: fejlberegning i teksten: ${al.slice(0, 160)}`);

  if (o.slags === "punkt") {
    sig(/^\([^;]+;[^;]+\)$/.test(o.svar), `${hvor}: koordinatsæt skal gemmes som (x;y), fik ${o.svar}`);
  }
  if (LIGNINGER.includes(emne)) {
    tjekLigning(niveau, o, hvor);
  }
  if (LINEAERE.includes(emne)) {
    tjekLineaer(o, hvor);
    if (niveau !== "platin" && o.slags !== "valg") {
      const tal = o.slags === "punkt" ? punktAf(o.svar) : [talAf(o.svar)];
      sig(tal.every(Number.isInteger), `${hvor}: facit ${o.svar} er ikke hele tal (${o.noegle})`);
    }
  }
  if (o.slags !== "valg") {
    const decimaler = Math.max(...o.svar.split(";").map((d) => (d.replace(")", "").split(",")[1] ?? "").length));
    sig(decimaler <= 3, `${hvor}: for mange decimaler i svaret (${o.svar})`);
  }
  if (LIGNINGER.includes(emne) || LINEAERE.includes(emne)) {
    if (o.slags === "valg") {
      sig(o.valg!.includes(o.svar), `${hvor}: facit er ikke blandt svarmulighederne (${o.spoergsmaal})`);
      sig(new Set(o.valg).size === o.valg!.length, `${hvor}: ens svarmuligheder (${o.spoergsmaal})`);
      sig(o.valg!.length >= 3, `${hvor}: for få svarmuligheder (${o.spoergsmaal})`);
    }
    return;
  }

  if (o.slags === "valg") {
    sig(Array.isArray(o.valg) && o.valg.length >= 2, `${hvor}: for få svarmuligheder`);
    sig(o.valg!.includes(o.svar), `${hvor}: facit er ikke blandt svarmulighederne (${o.spoergsmaal})`);
    sig(new Set(o.valg).size === o.valg!.length, `${hvor}: ens svarmuligheder (${o.spoergsmaal})`);
    return;
  }

  if (emne === "omregning") {
    tjekOmregning(o);
    return;
  }

  // Tekstopgaverne har ikke et regnestykke, der kan parses — her tjekker vi
  // kun at svaret er et tal, og at spørgsmålet nævner tallene fra svaret.
  if (TEKSTEMNER.includes(emne)) {
    sig(Number.isFinite(talAf(o.svar)), `${hvor}: svaret "${o.svar}" er ikke et tal`);
    const decimaler = (o.svar.split(",")[1] ?? "").length;
    sig(decimaler <= 3, `${hvor}: for mange decimaler i svaret (${o.svar})`);
    return;
  }

  const forventet = facitForStykke(o.spoergsmaal);
  sig(forventet !== null, `${hvor}: kunne ikke parse "${o.spoergsmaal}"`);
  if (forventet === null) return;
  sig(
    Math.abs(forventet - talAf(o.svar)) < 1e-9,
    `${hvor}: ${o.spoergsmaal} = ${o.svar}, men kontrollen siger ${forventet}`,
  );
  const svarDecimaler = (o.svar.split(",")[1] ?? "").length;
  sig(svarDecimaler <= 3, `${hvor}: for mange decimaler i svaret (${o.spoergsmaal} = ${o.svar})`);
  if (emne === "subtraktion") {
    sig(forventet > 0, `${hvor}: negativt resultat i ${o.spoergsmaal}`);
  }
}

console.log("Kontrollerer opgavegeneratorerne\n");

const PROEVER = 4000;
for (const emne of EMNER) {
  for (const niveau of NIVEAUER) {
    const set = new Set<string>();
    for (let i = 0; i < PROEVER; i++) {
      const o = lavEnOpgave(emne, niveau, lavRng(i * 2654435761));
      tjekOpgave(emne, niveau, o);
      set.add(o.noegle);
    }
    const forskellige = set.size;
    sig(
      forskellige >= 100,
      `${emne}/${niveau}: kun ${forskellige} forskellige opgaver ud af ${PROEVER} træk`,
    );
    console.log(
      `  ${emne.padEnd(15)} ${niveau.padEnd(7)} ${String(forskellige).padStart(4)} forskellige af ${PROEVER} træk`,
    );
  }
}

console.log("\nKontrollerer at en runde har den rigtige længde og ingen dubletter");
for (const emne of EMNER) {
  for (const niveau of NIVEAUER) {
    const { opgaver } = kravFor(emne);
    for (let i = 0; i < 300; i++) {
      const runde = lavRunde(emne, niveau, opgaver, i * 97 + 13);
      sig(
        runde.length === opgaver,
        `${emne}/${niveau}: runden blev ${runde.length} opgaver lang, forventet ${opgaver}`,
      );
      sig(
        new Set(runde.map((o) => o.noegle)).size === runde.length,
        `${emne}/${niveau}: dublet i samme runde`,
      );
    }
  }
}

if (fejl === 0) {
  console.log("\nAlt i orden.");
} else {
  console.error(`\n${fejl} fejl.`);
  process.exit(1);
}
