import type { P, Skitse } from "../typer";

/**
 * Geometriske byggesten til skitserne. Alt regnes i "rigtige" koordinater,
 * så en vinkel, der står som 50°, også er 50° på tegningen.
 */

export const rad = (g: number) => (g * Math.PI) / 180;
export const grad = (r: number) => (r * 180) / Math.PI;

/** Punktet i afstanden `l` fra `p` i retningen `g` grader (mod uret fra x-aksen). */
export const pol = (p: P, l: number, g: number): P => [p[0] + l * Math.cos(rad(g)), p[1] + l * Math.sin(rad(g))];

export const plus = (a: P, b: P): P => [a[0] + b[0], a[1] + b[1]];
export const minus = (a: P, b: P): P => [a[0] - b[0], a[1] - b[1]];
export const gange = (a: P, k: number): P => [a[0] * k, a[1] * k];
export const midt = (a: P, b: P): P => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
export const afstand = (a: P, b: P) => Math.hypot(b[0] - a[0], b[1] - a[1]);
/** Punktet på linjen gennem a og b ved parameteren t (0 = a, 1 = b, 1,3 = lidt forbi b). */
export const paa = (a: P, b: P, t: number): P => [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];

/** Vinklen ved `top` mellem strålerne mod a og b, i grader (0–180). */
export function vinkel(top: P, a: P, b: P): number {
  const u = minus(a, top);
  const v = minus(b, top);
  const c = (u[0] * v[0] + u[1] * v[1]) / (Math.hypot(...u) * Math.hypot(...v));
  return grad(Math.acos(Math.max(-1, Math.min(1, c))));
}

/** Skæringspunktet mellem linjen gennem p med retning d og linjen gennem q med retning e. */
export function skaering(p: P, d: P, q: P, e: P): { punkt: P; t: number; u: number } | null {
  const det = d[0] * -e[1] - d[1] * -e[0];
  if (Math.abs(det) < 1e-12) return null;
  const r = minus(q, p);
  const t = (r[0] * -e[1] - r[1] * -e[0]) / det;
  const u = (d[0] * r[1] - d[1] * r[0]) / det;
  return { punkt: plus(p, gange(d, t)), t, u };
}

/**
 * En polygon med de indre vinkler `vinkler` (i rækkefølge mod uret).
 * De første n − 2 sider har længderne `laengder`; de to sidste findes, så
 * figuren lukker. Giver null, hvis det ikke kan lade sig gøre.
 */
export function polygonFraVinkler(vinkler: number[], laengder: number[]): P[] | null {
  const n = vinkler.length;
  const pkt: P[] = [[0, 0]];
  let retning = 0;
  for (let i = 0; i < n - 2; i++) {
    pkt.push(pol(pkt[i], laengder[i], retning));
    retning += 180 - vinkler[i + 1];
  }
  const s = skaering(pkt[n - 2], pol([0, 0], 1, retning), [0, 0], pol([0, 0], 1, vinkler[0]));
  if (!s || s.t <= 0.3 || s.u <= 0.3) return null;
  pkt.push(s.punkt);
  // Tjek, at alle vinkler faktisk passer (dvs. at polygonen er konveks og lukker rigtigt).
  for (let i = 0; i < n; i++) {
    const v = vinkel(pkt[i], pkt[(i + n - 1) % n], pkt[(i + 1) % n]);
    if (Math.abs(v - vinkler[i]) > 0.01) return null;
  }
  return pkt;
}

/** Drejer og spejler alle punkter i en skitse — giver variation uden at ændre vinklerne. */
export function drej(sk: Skitse, grader: number, spejl = false): Skitse {
  const f = (p: P): P => {
    const q: P = spejl ? [-p[0], p[1]] : p;
    const c = Math.cos(rad(grader));
    const s = Math.sin(rad(grader));
    return [q[0] * c - q[1] * s, q[0] * s + q[1] * c];
  };
  return {
    ...sk,
    polygoner: sk.polygoner?.map((p) => ({ ...p, punkter: p.punkter.map(f) })),
    linjer: sk.linjer?.map((l) => ({ ...l, fra: f(l.fra), til: f(l.til) })),
    vinkler: sk.vinkler?.map((v) => ({ ...v, top: f(v.top), a: f(v.a), b: f(v.b) })),
    // Spejling vender venstre og højre om — så skal målet over på den anden side.
    maal: sk.maal?.map((m) => ({ ...m, fra: f(m.fra), til: f(m.til), side: spejl ? ((-(m.side ?? 1)) as 1 | -1) : m.side })),
    tekster: sk.tekster?.map((t) => ({ ...t, ved: f(t.ved) })),
  };
}

/** Et punkt lidt uden for en polygon ved hjørnet `i` — til et bogstav som A, B, C. */
export function hjoerneNavn(pkt: P[], i: number, afst = 0.45): P {
  const c = pkt.reduce((s, p) => plus(s, p), [0, 0] as P);
  const tp = gange(c, 1 / pkt.length);
  const r = minus(pkt[i], tp);
  const l = Math.hypot(...r);
  return plus(pkt[i], gange(r, afst / l));
}

/**
 * Trekant ud fra de tre sider: P0P1 = c, P1P2 = a, P2P0 = b (mod uret).
 * Null hvis siderne ikke kan danne en trekant.
 */
export function trekantFraSider(a: number, b: number, c: number): P[] | null {
  const x = (b * b + c * c - a * a) / (2 * c);
  const y2 = b * b - x * x;
  if (y2 <= 1e-9) return null;
  return [[0, 0], [c, 0], [x, Math.sqrt(y2)]];
}

/**
 * Firkant ud fra fire sider og en diagonal P0P2 = d, bygget af to trekanter.
 * Siderne: P0P1 = s[0], P1P2 = s[1], P2P3 = s[2], P3P0 = s[3]. Null hvis ikke konveks.
 */
export function firkantFraSider(s: number[], d: number): P[] | null {
  // trekantFraSider(a, b, c) giver et punkt i afstanden b fra (0,0) og a fra (c,0).
  // Under diagonalen: s[0] fra P0 og s[1] fra P2 (spejlet ned under x-aksen).
  const t1 = trekantFraSider(s[1], s[0], d);
  // Over diagonalen: s[3] fra P0 og s[2] fra P2.
  const t2 = trekantFraSider(s[2], s[3], d);
  if (!t1 || !t2) return null;
  const P1: P = [t1[2][0], -t1[2][1]];
  const P3: P = t2[2];
  const pkt: P[] = [[0, 0], P1, [d, 0], P3];
  for (let i = 0; i < 4; i++) {
    const a = pkt[i];
    const b = pkt[(i + 1) % 4];
    const c = pkt[(i + 2) % 4];
    const kryds = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (kryds <= 0.05) return null;
  }
  return pkt;
}
