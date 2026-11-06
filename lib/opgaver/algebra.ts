import type { Figur, Linje, Opgave, Punkt } from "../typer";
import { bland, heltal, type Rng } from "../tilfaeldig";

/**
 * Fælles byggesten til Lineære funktioner og Ligninger.
 *
 * Tal skrives som i prøvesættene: komma som decimaltegn og et rigtigt
 * minustegn (−), ikke en bindestreg.
 */

/** Dansk talformat med rigtigt minus. Højst tre decimaler. */
export function tal(n: number): string {
  const afrundet = Number(n.toFixed(3));
  const s = String(Math.abs(afrundet)).replace(".", ",");
  return afrundet < 0 ? `−${s}` : s;
}

/** Heltal i [min, max], men aldrig 0. */
export function ikkeNul(rng: Rng, min: number, max: number): number {
  let v = 0;
  while (v === 0) v = heltal(rng, min, max);
  return v;
}

/** Skriver et tal, der ganges på x: 1 → "x", −1 → "−x", 0,5 → "1/2x". */
export function koefficient(a: number): string {
  if (a === 1) return "x";
  if (a === -1) return "−x";
  const fortegn = a < 0 ? "−" : "";
  const abs = Math.abs(a);
  if (Number.isInteger(abs)) return `${fortegn}${abs}x`;
  for (const n of [2, 3, 4, 5, 6]) {
    const t = abs * n;
    if (Math.abs(t - Math.round(t)) < 1e-9) return `${fortegn}${Math.round(t)}/${n}x`;
  }
  return `${fortegn}${tal(abs)}x`;
}

/** "y = 2x + 3", "y = −x", "y = 3x − 6", "y = 4". */
export function forskrift(a: number, b: number, venstre = "y"): string {
  if (a === 0) return `${venstre} = ${tal(b)}`;
  const ax = koefficient(a);
  if (b === 0) return `${venstre} = ${ax}`;
  return `${venstre} = ${ax} ${b < 0 ? "−" : "+"} ${tal(Math.abs(b))}`;
}

/** Facit for et koordinatsæt — sådan gemmes det i Opgave.svar. */
export const punktSvar = (x: number, y: number) => `(${tal(x)};${tal(y)})`;

/** Et koordinatsæt, som det står i en opgavetekst. */
export const punkt = (x: number, y: number) => `(${tal(x)} ; ${tal(y)})`;

export function koordinatsystem(
  x: [number, number],
  y: [number, number],
  linjer: Linje[] = [],
  punkter: Punkt[] = [],
): Figur {
  return { slags: "koordinatsystem", x, y, linjer, punkter };
}

export function tabel(navne: [string, string], x: number[], y: (number | "?" | "")[]): Figur {
  return {
    slags: "tabel",
    navne,
    x: x.map(tal),
    y: y.map((v) => (typeof v === "number" ? tal(v) : v)),
  };
}

type Faelles = {
  noegle: string;
  optakt?: string;
  spoergsmaal: string;
  strategi: string;
  hint: string;
  figur?: Figur;
};

export function talOpgave(
  o: Faelles & { svar: number; enhed?: string; foran?: string },
): Opgave {
  return { ...o, slags: "tal", svar: tal(o.svar) };
}

export function punktOpgave(o: Faelles & { x: number; y: number }): Opgave {
  const { x, y, ...rest } = o;
  return { ...rest, slags: "punkt", svar: punktSvar(x, y) };
}

/**
 * Flervalg. Dubletter fjernes, og der tages højst `antal` muligheder,
 * så facit altid er med.
 */
export function valgOpgave(
  o: Faelles & { svar: string; andre: string[]; antal?: number },
  rng: Rng,
): Opgave {
  const { svar, andre, antal = 5, ...rest } = o;
  const unikke = [...new Set(andre.filter((v) => v !== svar))].slice(0, antal - 1);
  return { ...rest, slags: "valg", svar, valg: bland(rng, [svar, ...unikke]) };
}

/** Et led i en ligning: et tal, eller et tal gange x. */
export type Led = { k: number; x?: boolean };

/** Skriver en side af en ligning i den rækkefølge, leddene står: "44 − 3x", "3x + 4". */
export function side(led: Led[]): string {
  let s = "";
  led.forEach((l, i) => {
    const abs = Math.abs(l.k);
    const krop = l.x ? (abs === 1 ? "x" : `${tal(abs)}x`) : tal(abs);
    if (i === 0) s += (l.k < 0 ? "−" : "") + krop;
    else s += (l.k < 0 ? " − " : " + ") + krop;
  });
  return s || "0";
}

/** Negative tal i parentes, når de står efter et regnetegn: 3 · (−4), 4 − (−4). */
export const ip = (n: number) => (n < 0 ? `(${tal(n)})` : tal(n));

/** "+ 4" / "− 4" — til at beskrive et skridt i et hint. */
export const medFortegn = (n: number) => (n < 0 ? `− ${tal(-n)}` : `+ ${tal(n)}`);
