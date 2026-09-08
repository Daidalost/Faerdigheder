/**
 * Lille deterministisk tilfældighedsgenerator (mulberry32).
 * Med et frø kan den samme runde genskabes; uden frø får hver elev sin egen.
 */
export type Rng = () => number;

export function lavRng(froe: number): Rng {
  let a = froe >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function nytFroe(): number {
  return (Math.floor(Math.random() * 0xffffffff) ^ Date.now()) >>> 0;
}

/** Heltal i [min, max], begge inklusive. */
export function heltal(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

export function vaelg<T>(rng: Rng, muligheder: readonly T[]): T {
  return muligheder[Math.floor(rng() * muligheder.length)];
}

export function bland<T>(rng: Rng, liste: readonly T[]): T[] {
  const ud = [...liste];
  for (let i = ud.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [ud[i], ud[j]] = [ud[j], ud[i]];
  }
  return ud;
}

/**
 * Dansk talformat: komma som decimaltegn, ingen tusindtalsseparator
 * (prøvesættene skriver 3200, ikke 3.200).
 */
export function dansk(tal: number, maxDecimaler = 4): string {
  const afrundet = Number(tal.toFixed(maxDecimaler));
  return String(afrundet).replace(".", ",");
}

/**
 * Læser et elevsvar. Accepterer både komma og punktum, mellemrum,
 * og tillader at eleven skriver enheden med ("3 m").
 */
export function laesTal(input: string): number | null {
  const renset = input
    .replace(/\s/g, "")
    .replace(/,/g, ".")
    .replace(/[^0-9.+-]/g, "");
  if (renset === "" || renset === "-" || renset === "+") return null;
  const n = Number(renset);
  return Number.isFinite(n) ? n : null;
}

/** Sammenligner elevens tal med facit. Tolerancen dækker afrundingsstøj. */
export function erTalRigtigt(input: string, facit: string): boolean {
  const a = laesTal(input);
  const b = laesTal(facit);
  if (a === null || b === null) return false;
  return Math.abs(a - b) < 1e-9;
}
