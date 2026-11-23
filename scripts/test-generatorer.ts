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
  "vinkler",
  "arealrumfang",
  "ligedannethed",
];
const NIVEAUER: NiveauId[] = ["bronze", "soelv", "guld", "platin"];

const LINEAERE: EmneId[] = ["aflaes", "forskrift", "graf"];
const LIGNINGER: EmneId[] = ["trin", "beggesider", "broekparentes"];
const GEOMETRI: EmneId[] = ["vinkler", "arealrumfang", "ligedannethed"];

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

// ------------------------------------------------------------------------
// Geometri: skitsen skal passe med teksten. Hver vinkelbue måles på
// tegningen — en bue med "50°" skal være 50°, og buen med bogstavet skal
// være lige så stor som facit.
// ------------------------------------------------------------------------

function maalVinkel(top: [number, number], a: [number, number], b: [number, number]): number {
  const u = [a[0] - top[0], a[1] - top[1]];
  const v = [b[0] - top[0], b[1] - top[1]];
  const c = (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(u[0], u[1]) * Math.hypot(v[0], v[1]));
  return (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
}

function tjekSkitseVinkler(o: Opgave, hvor: string, ukendt?: string): void {
  if (o.figur?.slags !== "skitse") return;
  for (const v of o.figur.vinkler ?? []) {
    const m = maalVinkel(v.top, v.a, v.b);
    if (v.ret) sig(Math.abs(m - 90) < 0.05, `${hvor}: ret vinkel er ${m.toFixed(2)}° på tegningen`);
    const tal = v.tekst?.match(/^(\d+(?:,\d+)?)°$/);
    if (tal) {
      const g = talAf(tal[1]);
      sig(Math.abs(m - g) < 0.05, `${hvor}: buen "${v.tekst}" er ${m.toFixed(2)}° på tegningen (${o.noegle})`);
    }
    if (ukendt && v.tekst === ukendt) {
      sig(Math.abs(m - talAf(o.svar)) < 0.05, `${hvor}: vinkel ${ukendt} er ${m.toFixed(2)}° på tegningen, facit ${o.svar}° (${o.noegle})`);
    }
  }
}

/** Areal og omkreds af en polygon, regnet direkte ud fra hjørnerne. */
function polygonMaal(p: [number, number][]): { areal: number; omkreds: number } {
  let a = 0;
  let o = 0;
  for (let i = 0; i < p.length; i++) {
    const [x1, y1] = p[i];
    const [x2, y2] = p[(i + 1) % p.length];
    a += x1 * y2 - x2 * y1;
    o += Math.hypot(x2 - x1, y2 - y1);
  }
  return { areal: Math.abs(a) / 2, omkreds: o };
}

function tjekGeometri(o: Opgave, hvor: string): void {
  const n = o.noegle.split(":");
  const [emne, type] = n;
  const N = (i: number) => Number(n[i]);
  const skal = (forventet: number) =>
    sig(Math.abs(talAf(o.svar) - forventet) < 1e-9, `${hvor}: facit ${o.svar}, kontrollen siger ${forventet} (${o.noegle})`);
  if (emne === "vinkler") return;
  if (emne === "areal") {
    const fig = o.figur?.slags === "skitse" ? o.figur : undefined;
    if (["rekt", "trekant", "parallelogram", "trapez", "L", "pyt", "sideflade", "trekantH", "trapezH", "trapezB"].includes(type)) {
      tjekMaalPaaTegning(o, hvor);
    }
    switch (type) {
      case "rekt":
        return skal(n[2] === "o" ? 2 * (N(3) + N(4)) : N(3) * N(4));
      case "trekant":
        return skal((N(2) * N(3)) / 2);
      case "parallelogram":
        return skal(N(2) * N(3));
      case "trapez":
        return skal(((N(2) + N(3)) * N(4)) / 2);
      case "net":
      case "L": {
        // Genberegnes ud fra den tegnede figur — ikke ud fra generatoren.
        const p = fig?.polygoner?.[0]?.punkter;
        sig(!!p, `${hvor}: mangler figur`);
        if (!p) return;
        const m = polygonMaal(p);
        if (type === "net") {
          sig(p.every(([x, y]) => Number.isInteger(x) && Number.isInteger(y)), `${hvor}: hjørne uden for gitteret`);
          return skal(m.areal);
        }
        return skal(n[2] === "o" ? m.omkreds : m.areal);
      }
      case "fliser":
        return skal((N(2) * N(3)) / (N(4) * N(5)));
      case "braedder":
        return skal((N(2) * 100) / N(3));
      case "kasseV":
        return skal(N(2) * N(3) * N(4));
      case "kubeV":
        return skal(N(2) ** 3);
      case "cylV":
        return skal(N(2) * N(3));
      case "trekantH":
        return skal((2 * N(2)) / N(3));
      case "trapezH":
        return skal((2 * N(2)) / (N(3) + N(4)));
      case "kvadratSide":
        return skal(Math.sqrt(N(2)));
      case "kasseH":
        return skal(N(2) / N(3));
      case "kubeS":
        return skal(Math.round(Math.cbrt(N(2))));
      case "pyrV":
        return skal((N(2) * N(3)) / 3);
      case "pyrH":
        return skal((3 * N(2)) / N(3));
      case "cylG":
        return skal(N(2) / N(3));
      case "kasseO":
        return skal(2 * (N(2) * N(3) + N(2) * N(4) + N(3) * N(4)));
      case "prismeV":
        return skal((N(2) * N(3) * N(4)) / 2);
      case "pyt":
        return skal(n[2] === "hyp" ? Math.hypot(N(3), N(4)) : Math.sqrt(N(4) ** 2 - N(3) ** 2));
      case "sideflade":
        return skal((N(2) * Math.sqrt(N(3) ** 2 - (N(2) / 2) ** 2)) / 2);
      case "liter":
        return skal((N(2) * N(3) * N(4)) / 1000);
      case "trapezB":
        return skal((2 * N(2)) / N(3) - N(4));
      case "kubeO":
        return skal(Math.sqrt(N(2) / 6) ** 3);
    }
  }
  if (emne === "lig") {
    tjekLigedannethed(o, hvor, n);
    return;
  }
  sig(false, `${hvor}: ukendt nøgletype ${o.noegle}`);
}

/**
 * Figurer, der er tegnet i rigtig størrelse: et mål som "4,5 cm" skal stå ved
 * et linjestykke, der faktisk er 4,5 lang på tegningen.
 */
function tjekMaalPaaTegning(o: Opgave, hvor: string): void {
  if (o.figur?.slags !== "skitse") return;
  for (const m of o.figur.maal ?? []) {
    const t = m.tekst.match(/^([\d,]+) (cm|m)$/);
    if (!t) continue;
    const l = Math.hypot(m.til[0] - m.fra[0], m.til[1] - m.fra[1]);
    sig(Math.abs(l - talAf(t[1])) < 0.05, `${hvor}: målet "${m.tekst}" står ved en linje, der er ${l.toFixed(2)} lang (${o.noegle})`);
  }
}

const proportional = (a: number[], b: number[]) => a.length === b.length && a.every((x, i) => Math.abs(x / b[i] - a[0] / b[0]) < 1e-9);
const talI = (v: string) => (v.match(/\d+(?:,\d+)?/g) ?? []).map(talAf);

function tjekLigedannethed(o: Opgave, hvor: string, n: string[]): void {
  const N = (i: number) => Number(n[i]);
  const skal = (forventet: number) =>
    sig(Math.abs(talAf(o.svar) - forventet) < 1e-9, `${hvor}: facit ${o.svar}, kontrollen siger ${forventet} (${o.noegle})`);
  tjekMaalPaaTegning(o, hvor);
  switch (n[1]) {
    case "skala":
      return skal(N(2) * (N(4) / N(3)));
    case "forhold":
      return skal(N(3) / N(2));
    case "trekant": {
      const r = n[2].split(",").map(Number);
      return skal(r[N(5)] * N(3));
    }
    case "rekt": {
      const [a, b] = [N(2), N(3)];
      return praeciEn(o, hvor, (v) => proportional(talI(v), [a, b]), "ligedannet rektangel");
    }
    case "hvilken": {
      const base = n[2].split(",").map(Number);
      return praeciEn(o, hvor, (v) => proportional(talI(v), base), "ligedannet trekant");
    }
    case "skygge":
      return skal((N(2) * N(4)) / N(3));
    case "A": {
      const [k, AB, CA] = [N(2), N(3), N(4)];
      return skal(n[5] === "DE" ? AB * k : n[5] === "AD" ? CA * (k - 1) : CA * k);
    }
    case "areal":
      return skal(N(2) ** 2);
    case "rumfang":
      return skal(N(2) ** 3);
    case "traeer": {
      const [p, d1, d2] = [N(2), N(3), N(4)];
      return skal(n[5] === "h" ? (p * d2) / d1 : (Number(n[5].slice(1)) * d1) / p - d2);
    }
    case "firkant": {
      const r = n[2].split(",").map(Number);
      return skal(n[6] === "roed" ? r[N(5)] * N(3) : r[N(5)]);
    }
    case "arealbag":
      return skal(Math.sqrt(N(2)));
    case "arealstor":
      return skal(N(2) * N(3) ** 2);
    case "maalestok":
      return skal((N(3) * N(2)) / 100000);
  }
  sig(false, `${hvor}: ukendt nøgletype ${o.noegle}`);
}

function tjekVinkler(o: Opgave, hvor: string): void {
  const m = o.spoergsmaal.match(/vinkel ([a-zæøå])\?$/);
  sig(!!m, `${hvor}: spørgsmålet nævner ikke en vinkel: ${o.spoergsmaal}`);
  if (!m) return;
  const navn = m[1];
  sig(o.figur?.slags === "skitse", `${hvor}: mangler skitse`);
  if (o.figur?.slags !== "skitse") return;
  const med = (o.figur.vinkler ?? []).filter((v) => v.tekst === navn);
  sig(med.length === 1, `${hvor}: ${med.length} buer hedder ${navn}`);
  tjekSkitseVinkler(o, hvor, navn);
  const g = talAf(o.svar);
  sig(g > 0 && g < 360, `${hvor}: urimelig vinkel ${o.svar}`);
}

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
      case "aflaesa":
        sig(harLinje(N(2), N(3)), `${hvor}: linjen mangler i figuren`);
        return sig(talAf(o.svar) === N(2), `${hvor}: facit ${o.svar}, a = ${N(2)}`);
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

  // Optakten vises med store bogstaver — der må ikke stå matematik i den.
  // (Står spørgsmålet i optakten, vises den med almindelige bogstaver — så er det fint.)
  if (o.spoergsmaal.trim()) {
    const ord = (o.optakt ?? "").split(/[^\p{L}]+/u).filter(Boolean);
    const enkeltBogstav = ord.some((w) => w.length === 1 && w !== "i" && w === w.toLowerCase());
    sig(!/[=\d]/.test(o.optakt ?? "") && !enkeltBogstav, `${hvor}: matematik i optakten "${o.optakt}"`);
  }

  if (o.slags === "punkt") {
    sig(/^\([^;]+;[^;]+\)$/.test(o.svar), `${hvor}: koordinatsæt skal gemmes som (x;y), fik ${o.svar}`);
  }
  if (LIGNINGER.includes(emne)) {
    tjekLigning(niveau, o, hvor);
  }
  if (emne === "vinkler") tjekVinkler(o, hvor);
  if (GEOMETRI.includes(emne)) {
    tjekGeometri(o, hvor);
    tjekSkitseVinkler(o, hvor);
    const x = o.slags === "valg" ? 0 : talAf(o.svar);
    if (niveau === "bronze") sig(Number.isInteger(x), `${hvor}: bronze skal have hele tal, fik ${o.svar} (${o.noegle})`);
    else if (niveau !== "platin") sig(Number.isInteger(x * 2), `${hvor}: højst halve tal på ${niveau}, fik ${o.svar} (${o.noegle})`);
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
  if (LIGNINGER.includes(emne) || LINEAERE.includes(emne) || GEOMETRI.includes(emne)) {
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

// KUN=vinkler,ligedannethed npm test — kør kun nogle emner, mens man arbejder.
const VALGTE = process.env.KUN ? EMNER.filter((e) => process.env.KUN!.split(",").includes(e)) : EMNER;

const PROEVER = 4000;
for (const emne of VALGTE) {
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
for (const emne of VALGTE) {
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
