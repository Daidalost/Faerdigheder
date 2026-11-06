import type { NiveauId, Opgave } from "../typer";
import { heltal, vaelg, type Rng } from "../tilfaeldig";
import { ikkeNul, side, tal, talOpgave, type Led } from "./algebra";

/**
 * Ligninger i tre emner — sådan som de tre delopgaver i "Løs ligningerne"
 * er bygget op i hvert prøvesæt (opg. 6, 7 eller 8):
 *
 *   Ét og to trin      6x = 42 · 5x + 9 = 34 · 44 − 3x = 20 · 75 − 3x = 0
 *   x på begge sider   3x + 4 = 6x − 5 · 6x − 32 = −2x · 21 + 4x = 7x + 6
 *                      5x + 4 = 2x − 5 (x = −3)
 *   Brøker/parenteser  6x/4 + 1 = 4 · x/5 − 4 = 16 · x/2 + 4 = x − 2
 *                      5x = 3 · (x + 4) · 12/x + 3 = 7 · 8x = x/2 − 15
 *
 * Bronze = 7. klasse, sølv = 8. klasse, guld = prøveniveau, platin = over.
 * Til og med guld er x altid et helt tal (på guld gerne negativt).
 * Platin har løsninger som 0,25, 1,5 og −2,5 — dem har prøven også haft
 * (9x + 16 = 6x + 16,6 i dec 24, 3 − 3x = 7x − 22 i maj 26).
 */

function ligning(
  noegle: string,
  venstre: string,
  hoejre: string,
  x: number,
  strategi: string,
  hint: string,
): Opgave {
  return talOpgave({
    noegle,
    optakt: "Løs ligningen",
    spoergsmaal: `${venstre} = ${hoejre}`,
    svar: x,
    foran: "x =",
    strategi,
    hint,
  });
}

/** Et ikke-helt x til platin: halve, kvarte eller femtedele — altid endelige decimaltal. */
function kommaX(rng: Rng, maks = 6): number {
  for (;;) {
    const n = vaelg(rng, [2, 2, 4, 5]);
    const x = heltal(rng, -maks * n, maks * n) / n;
    if (!Number.isInteger(x) && x !== 0) return x;
  }
}

const k = (n: number, x = true): Led => ({ k: n, x });
const c = (n: number): Led => ({ k: n });

/** "Træk 9 fra" / "Læg 9 til" — det modsatte af leddet. */
const fjern = (n: number) => (n > 0 ? `træk ${tal(n)} fra` : `læg ${tal(-n)} til`);
const fjernX = (n: number) =>
  n > 0 ? `træk ${n === 1 ? "x" : `${tal(n)}x`} fra` : `læg ${n === -1 ? "x" : `${tal(-n)}x`} til`;

// ============================================================ ét og to trin

function trinHint(a: number, b: number, h: number, x: number): string {
  // a·x + b = h
  const dele: string[] = [];
  if (b !== 0) dele.push(`${fjern(b)} på begge sider: ${side([k(a)])} = ${tal(h - b)}`);
  if (a !== 1) dele.push(`divider med ${tal(a)}: x = ${tal(h - b)} : ${a < 0 ? `(${tal(a)})` : tal(a)} = ${tal(x)}`);
  const tekst = dele.join(". Så ");
  return tekst.charAt(0).toUpperCase() + tekst.slice(1) + ". Tjek ved at sætte ind.";
}

export function lavTrin(rng: Rng, niveau: NiveauId): Opgave {
  if (niveau === "bronze") {
    const x = heltal(rng, 1, 20);
    switch (heltal(rng, 1, 4)) {
      case 1: {
        const a = heltal(rng, 2, 30);
        return ligning(`trin:xpa:${a}:${x}`, side([k(1), c(a)]), tal(x + a), x, "Gør det modsatte", `Der er lagt ${a} til x. Gør det modsatte: træk ${a} fra på begge sider. x = ${x + a} − ${a} = ${x}.`);
      }
      case 2: {
        const a = heltal(rng, 2, 30);
        return ligning(`trin:xma:${a}:${x + a}`, side([k(1), c(-a)]), tal(x), x + a, "Gør det modsatte", `Der er trukket ${a} fra x. Gør det modsatte: læg ${a} til på begge sider. x = ${x} + ${a} = ${x + a}.`);
      }
      case 3: {
        const a = heltal(rng, 2, 9);
        const xx = heltal(rng, 2, 12);
        return ligning(`trin:ax:${a}:${xx}`, side([k(a)]), tal(a * xx), xx, "Gange → divider", `${a}x betyder ${a} gange x. Gør det modsatte: divider med ${a} på begge sider. x = ${a * xx} : ${a} = ${xx}.`);
      }
      default: {
        const a = heltal(rng, 2, 30);
        return ligning(`trin:apx:${a}:${x}`, side([c(a), k(1)]), tal(x + a), x, "Gør det modsatte", `Træk ${a} fra på begge sider. x = ${x + a} − ${a} = ${x}.`);
      }
    }
  }

  if (niveau === "soelv") {
    const x = heltal(rng, 1, 15);
    const a = heltal(rng, 2, 9);
    switch (heltal(rng, 1, 4)) {
      case 1: {
        const b = heltal(rng, 1, 25);
        return ligning(`trin:axb:${a}:${b}:${x}`, side([k(a), c(b)]), tal(a * x + b), x, "Først plus/minus, så gange", trinHint(a, b, a * x + b, x));
      }
      case 2: {
        const b = heltal(rng, 1, a * x - 1 > 0 ? a * x - 1 : 1);
        return ligning(`trin:axmb:${a}:${b}:${x}`, side([k(a), c(-b)]), tal(a * x - b), x, "Først plus/minus, så gange", trinHint(a, -b, a * x - b, x));
      }
      case 3: {
        const b = heltal(rng, 1, 25);
        return ligning(`trin:bax:${a}:${b}:${x}`, side([c(b), k(a)]), tal(a * x + b), x, "Først plus/minus, så gange", trinHint(a, b, a * x + b, x));
      }
      default: {
        const b = heltal(rng, 1, 25);
        return ligning(`trin:omvendt:${a}:${b}:${x}`, tal(a * x + b), side([k(a), c(b)]), x, "x må gerne stå til højre", `Det er ligegyldigt, hvilken side x står på. ${trinHint(a, b, a * x + b, x)}`);
      }
    }
  }

  if (niveau === "guld") {
    switch (heltal(rng, 1, 4)) {
      case 1: {
        // 44 − 3x = 20 og 75 − 3x = 0
        const a = heltal(rng, 2, 7);
        const x = heltal(rng, 2, 15);
        const h = vaelg(rng, [0, heltal(rng, 1, 40)]);
        const b = h + a * x;
        return ligning(`trin:bmax:${a}:${b}:${h}`, side([c(b), k(-a)]), tal(h), x, "Minus foran x", `${fjern(b).replace(/^t/, "T").replace(/^l/, "L")} på begge sider: −${a}x = ${tal(h - b)}. Divider med −${a}: x = ${tal(x)}. Minus delt med minus giver plus.`);
      }
      case 2: {
        // Negativ løsning: 3x + 20 = 5
        const a = heltal(rng, 2, 7);
        const x = heltal(rng, -9, -1);
        const b = heltal(rng, 5, 40);
        return ligning(`trin:neg:${a}:${b}:${x}`, side([k(a), c(b)]), tal(a * x + b), x, "Svaret må gerne være negativt", trinHint(a, b, a * x + b, x));
      }
      case 3: {
        // 7x = 77 og −4x = 28
        const a = rng() < 0.6 ? heltal(rng, 6, 15) : -heltal(rng, 2, 9);
        const x = a > 0 ? heltal(rng, 6, 15) : ikkeNul(rng, -12, 12);
        return ligning(`trin:stor:${a}:${x}`, side([k(a)]), tal(a * x), x, "Gange → divider", trinHint(a, 0, a * x, x));
      }
      default: {
        // 9 + 5x = 34
        const a = heltal(rng, 2, 9);
        const x = ikkeNul(rng, -6, 12);
        const b = heltal(rng, 2, 50);
        return ligning(`trin:bpax:${a}:${b}:${x}`, side([c(b), k(a)]), tal(a * x + b), x, "Først plus/minus, så gange", trinHint(a, b, a * x + b, x));
      }
    }
  }

  // ---------------------------------------------------------------- platin
  switch (heltal(rng, 1, 4)) {
    case 1: {
      for (;;) {
        const x = kommaX(rng);
        const a = vaelg(rng, [2, 4, 5, 6, 8, 10, 12]);
        if (!Number.isInteger(a * x)) continue;
        const b = ikkeNul(rng, -15, 15);
        return ligning(`trin:pkomma:${a}:${b}:${x}`, side([k(a), c(b)]), tal(a * x + b), x, "Divisionen går ikke op", trinHint(a, b, a * x + b, x));
      }
    }
    case 2: {
      for (;;) {
        const x = kommaX(rng);
        const a = vaelg(rng, [2, 4, 6, 8, 10]);
        if (!Number.isInteger(a * x)) continue;
        const b = heltal(rng, 5, 40);
        return ligning(`trin:pbmax:${a}:${b}:${x}`, side([c(b), k(-a)]), tal(b - a * x), x, "Minus foran x", trinHint(-a, b, b - a * x, x));
      }
    }
    case 3: {
      for (;;) {
        // Kommatal foran x: 0,5x + 3 = 7
        const a = vaelg(rng, [0.5, 1.5, 2.5, 0.2, 0.25, 0.4, 0.75]);
        const x = ikkeNul(rng, -12, 24);
        if (!Number.isInteger(a * x)) continue;
        const b = ikkeNul(rng, -10, 12);
        return ligning(`trin:pkoef:${a}:${b}:${x}`, side([k(a), c(b)]), tal(a * x + b), x, "Divider med et kommatal", `${trinHint(a, b, a * x + b, x).replace(" Tjek ved at sætte ind.", "")} Tip: at dividere med ${tal(a)} er det samme som at gange med ${tal(1 / a)}.`);
      }
    }
    default: {
      for (;;) {
        // Kommatal i konstanten: 4x − 2,5 = 3,5
        const x = kommaX(rng, 5);
        const a = heltal(rng, 2, 8);
        const b = heltal(rng, -20, 20) + 0.5;
        const h = a * x + b;
        if (Math.abs(h * 10 - Math.round(h * 10)) > 1e-9) continue;
        return ligning(`trin:pkonst:${a}:${b}:${x}`, side([k(a), c(b)]), tal(h), x, "Kommatal på begge sider", trinHint(a, b, h, x));
      }
    }
  }
}

// ========================================================= x på begge sider

/** Hint for ax + b = cx + d: saml x på den side, hvor der er flest. */
function beggeHint(a: number, b: number, cc: number, d: number, x: number): string {
  if (a > cc) {
    const venstre = side([k(a - cc), c(b)].filter((l) => l.k !== 0));
    const trin1 = `${fjernX(cc)} på begge sider: ${venstre} = ${tal(d)}`;
    const slut = a - cc === 1 ? "" : ` Divider med ${tal(a - cc)}: x = ${tal(x)}.`;
    return `Saml x til venstre, hvor der er flest. ${trin1.charAt(0).toUpperCase() + trin1.slice(1)}.${b !== 0 ? ` Så ${fjern(b)}: ${side([k(a - cc)])} = ${tal(d - b)}.` : ""}${slut}`;
  }
  const hoejre = side([k(cc - a), c(d)].filter((l) => l.k !== 0));
  const trin1 = `${fjernX(a)} på begge sider: ${tal(b)} = ${hoejre}`;
  const slut = cc - a === 1 ? "" : ` Divider med ${tal(cc - a)}: x = ${tal(x)}.`;
  return `Saml x til højre, hvor der er flest — så undgår du minus foran x. ${trin1.charAt(0).toUpperCase() + trin1.slice(1)}.${d !== 0 ? ` Så ${fjern(d)}: ${tal(b - d)} = ${side([k(cc - a)])}.` : ""}${slut}`;
}

/**
 * Bygger ax + b = cx + d ud fra a, c, x og b. d regnes ud, så x passer.
 * `orden` bestemmer, om konstanten står før x-leddet på hver side.
 */
function begge(
  noegle: string,
  a: number,
  b: number,
  cc: number,
  x: number,
  orden: [boolean, boolean],
  strategi: string,
): Opgave {
  const d = a * x + b - cc * x;
  const v: Led[] = b === 0 ? [k(a)] : orden[0] ? [c(b), k(a)] : [k(a), c(b)];
  const h: Led[] = d === 0 ? [k(cc)] : cc === 0 ? [c(d)] : orden[1] ? [c(d), k(cc)] : [k(cc), c(d)];
  return ligning(`${noegle}:${a}:${b}:${cc}:${d}`, side(v), side(h), x, strategi, beggeHint(a, b, cc, d, x));
}

export function lavBeggeSider(rng: Rng, niveau: NiveauId): Opgave {
  if (niveau === "bronze") {
    for (;;) {
      const cc = heltal(rng, 1, 4);
      const a = cc + heltal(rng, 1, 3);
      const x = heltal(rng, 1, 10);
      const b = vaelg(rng, [0, heltal(rng, 1, 10)]);
      const d = (a - cc) * x + b;
      if (d > 40) continue;
      return begge("begge:bronze", a, b, cc, x, [false, false], "Saml x på én side");
    }
  }

  if (niveau === "soelv") {
    for (;;) {
      const a = heltal(rng, 2, 9);
      const cc = heltal(rng, 2, 9);
      if (a === cc) continue;
      const x = heltal(rng, 1, 12);
      const b = heltal(rng, 1, 30);
      const d = a * x + b - cc * x;
      if (d < 1 || d > 60) continue;
      return begge("begge:soelv", a, b, cc, x, [rng() < 0.3, rng() < 0.3], "Saml x der, hvor der er flest");
    }
  }

  if (niveau === "guld") {
    const form = heltal(rng, 1, 4);
    for (;;) {
      if (form === 1) {
        // 3x + 4 = 6x − 5
        const a = heltal(rng, 2, 9);
        const cc = a + heltal(rng, 1, 6);
        const x = heltal(rng, 1, 10);
        const b = heltal(rng, 1, 20);
        const d = a * x + b - cc * x;
        if (d >= 0) continue;
        return begge("begge:minus", a, b, cc, x, [false, false], "Saml x der, hvor der er flest");
      }
      if (form === 2) {
        // 6x − 32 = −2x
        const a = heltal(rng, 2, 9);
        const cc = -heltal(rng, 1, 5);
        const x = heltal(rng, 2, 9);
        const b = cc * x - a * x;
        return begge("begge:nul", a, b, cc, x, [false, false], "Minus-x flyttes ved at lægge til");
      }
      if (form === 3) {
        // Negativ løsning: 5x + 4 = 2x − 5
        const cc = heltal(rng, 1, 6);
        const a = cc + heltal(rng, 1, 5);
        const x = heltal(rng, -8, -1);
        const b = heltal(rng, 1, 15);
        const d = a * x + b - cc * x;
        if (d === 0) continue;
        return begge("begge:negativ", a, b, cc, x, [false, false], "Svaret må gerne være negativt");
      }
      // 21 + 4x = 7x + 6, 3 − 3x = 7x − 22, 4x + 2 = 11 − 2x
      const a = ikkeNul(rng, -5, 9);
      const cc = ikkeNul(rng, -5, 9);
      if (a === cc || (a < 0 && cc < 0)) continue;
      const x = ikkeNul(rng, -6, 12);
      const b = ikkeNul(rng, -20, 30);
      const d = a * x + b - cc * x;
      if (d === 0 || Math.abs(d) > 60) continue;
      return begge("begge:blandet", a, b, cc, x, [a < 0 || rng() < 0.4, cc < 0 || rng() < 0.3], "Saml x der, hvor der er flest");
    }
  }

  // ---------------------------------------------------------------- platin
  const form = heltal(rng, 1, 3);
  for (;;) {
    if (form === 1) {
      // 9x + 16 = 6x + 16,6 — løsningen er et kommatal
      const x = kommaX(rng, 4);
      const a = ikkeNul(rng, -6, 10);
      const cc = ikkeNul(rng, -6, 10);
      if (a === cc) continue;
      const b = ikkeNul(rng, -20, 25);
      const d = a * x + b - cc * x;
      if (d === 0 || Math.abs(d * 10 - Math.round(d * 10)) > 1e-9) continue;
      return begge("begge:pkomma", a, b, cc, x, [rng() < 0.4, rng() < 0.4], "Løsningen er et kommatal");
    }
    if (form === 2) {
      // Kommatal foran x: 1,5x + 2 = 0,5x + 7
      const a = vaelg(rng, [1.5, 2.5, 0.5, 1.2, 0.8, 3.5]);
      const cc = vaelg(rng, [0.5, 1.5, 0.2, 2, 3, 1]);
      if (a === cc) continue;
      const x = ikkeNul(rng, -10, 12);
      const b = heltal(rng, -9, 12);
      const d = a * x + b - cc * x;
      if (d === 0 || Math.abs(d * 10 - Math.round(d * 10)) > 1e-9) continue;
      return begge("begge:pkoef", a, b, cc, x, [false, false], "Kommatal foran x");
    }
    // 3 − 3x = 7x − 22
    const a = -heltal(rng, 1, 6);
    const cc = heltal(rng, 2, 9);
    const x = kommaX(rng, 4);
    const b = heltal(rng, 1, 25);
    const d = a * x + b - cc * x;
    if (d === 0 || Math.abs(d * 10 - Math.round(d * 10)) > 1e-9) continue;
    return begge("begge:pminus", a, b, cc, x, [true, false], "Minus foran x på den ene side");
  }
}

// ===================================================== brøker og parenteser

const gcd = (p: number, q: number): number => (q === 0 ? Math.abs(p) : gcd(q, p % q));

export function lavBroekParentes(rng: Rng, niveau: NiveauId): Opgave {
  if (niveau === "bronze") {
    switch (heltal(rng, 1, 4)) {
      case 1: {
        const a = heltal(rng, 2, 10);
        const b = heltal(rng, 2, 12);
        return ligning(`bp:xa:${a}:${b}`, `x/${a}`, tal(b), a * b, "Brøk → gang", `x/${a} betyder x delt med ${a}. Gør det modsatte: gang med ${a} på begge sider. x = ${b} · ${a} = ${a * b}.`);
      }
      case 2: {
        const a = heltal(rng, 2, 5);
        const b = heltal(rng, 1, 9);
        const x = heltal(rng, 1, 10);
        return ligning(`bp:apar:${a}:${b}:${x}`, `${a} · (x + ${b})`, tal(a * (x + b)), x, "Divider parentesen fri", `Divider med ${a} på begge sider: x + ${b} = ${a * (x + b)} : ${a} = ${x + b}. Træk ${b} fra: x = ${x}.`);
      }
      case 3: {
        const a = heltal(rng, 2, 5);
        const b = heltal(rng, 1, 9);
        const x = b + heltal(rng, 1, 10);
        return ligning(`bp:aparm:${a}:${b}:${x}`, `${a} · (x − ${b})`, tal(a * (x - b)), x, "Divider parentesen fri", `Divider med ${a} på begge sider: x − ${b} = ${x - b}. Læg ${b} til: x = ${x}.`);
      }
      default: {
        const a = heltal(rng, 2, 10);
        const b = heltal(rng, 2, 12);
        return ligning(`bp:omv:${a}:${b}`, tal(b), `x/${a}`, a * b, "Brøk → gang", `x må gerne stå til højre. Gang med ${a} på begge sider: x = ${b} · ${a} = ${a * b}.`);
      }
    }
  }

  if (niveau === "soelv") {
    switch (heltal(rng, 1, 4)) {
      case 1: {
        // x/5 + 3 = 7
        const a = heltal(rng, 2, 8);
        const q = heltal(rng, 1, 10);
        const b = heltal(rng, 1, 12);
        return ligning(`bp:xab:${a}:${b}:${q}`, `x/${a} + ${b}`, tal(q + b), a * q, "Først plus/minus, så brøken", `Træk ${b} fra på begge sider: x/${a} = ${q}. Gang med ${a}: x = ${a * q}.`);
      }
      case 2: {
        // x/5 − 4 = 16
        const a = heltal(rng, 2, 8);
        const q = heltal(rng, 2, 20);
        const b = heltal(rng, 1, 10);
        return ligning(`bp:xamb:${a}:${b}:${q}`, `x/${a} − ${b}`, tal(q - b), a * q, "Først plus/minus, så brøken", `Læg ${b} til på begge sider: x/${a} = ${q}. Gang med ${a}: x = ${a * q}.`);
      }
      case 3: {
        // 6x/4 = 9
        for (;;) {
          const a = heltal(rng, 2, 6);
          const kk = heltal(rng, 2, 9);
          if (kk % a === 0 || a % kk === 0) continue;
          const x = (a / gcd(kk, a)) * heltal(rng, 1, 6);
          const h = (kk * x) / a;
          return ligning(`bp:kxa:${kk}:${a}:${x}`, `${kk}x/${a}`, tal(h), x, "Gang først, divider bagefter", `Gang med ${a} på begge sider: ${kk}x = ${tal(h * a)}. Divider med ${kk}: x = ${x}.`);
        }
      }
      default: {
        // 3 · (x − 4) = 15
        const a = heltal(rng, 2, 9);
        const b = ikkeNul(rng, -9, 9);
        const x = heltal(rng, Math.max(1, -b + 1), 15);
        const ind = b < 0 ? `x − ${-b}` : `x + ${b}`;
        return ligning(`bp:apar2:${a}:${b}:${x}`, `${a} · (${ind})`, tal(a * (x + b)), x, "Divider parentesen fri", `Divider med ${a}: ${ind} = ${x + b}. ${fjern(b).replace(/^./, (s) => s.toUpperCase())}: x = ${x}. (Du kan også gange ind: ${a}x ${b < 0 ? "−" : "+"} ${Math.abs(a * b)} = ${a * (x + b)}.)`);
      }
    }
  }

  if (niveau === "guld") {
    switch (heltal(rng, 1, 5)) {
      case 1: {
        // 6x/4 + 1 = 4
        for (;;) {
          const a = heltal(rng, 2, 6);
          const kk = heltal(rng, 2, 9);
          if (kk % a === 0 || a % kk === 0) continue;
          const x = (a / gcd(kk, a)) * ikkeNul(rng, -3, 5);
          const q = (kk * x) / a;
          const b = ikkeNul(rng, -8, 10);
          return ligning(`bp:kxab:${kk}:${a}:${b}:${x}`, `${kk}x/${a} ${b < 0 ? "−" : "+"} ${Math.abs(b)}`, tal(q + b), x, "Først plus/minus, så brøken", `${fjern(b).replace(/^./, (s) => s.toUpperCase())} på begge sider: ${kk}x/${a} = ${tal(q)}. Gang med ${a}: ${kk}x = ${tal(q * a)}. Divider med ${kk}: x = ${tal(x)}.`);
        }
      }
      case 2: {
        // x/2 + 4 = x − 2
        for (;;) {
          const a = heltal(rng, 2, 5);
          const x = a * heltal(rng, 1, 8);
          const sum = (x * (a - 1)) / a;
          if (sum < 2) continue;
          const b = heltal(rng, 1, sum - 1);
          const d = sum - b;
          return ligning(`bp:xabxd:${a}:${b}:${d}`, `x/${a} + ${b}`, `x − ${d}`, x, "Gang brøken væk først", `Gang hele ligningen med ${a}: x + ${a * b} = ${a}x − ${a * d}. Saml x til højre: ${a * b + a * d} = ${a - 1 === 1 ? "x" : `${a - 1}x`}. ${a - 1 === 1 ? "" : `Divider med ${a - 1}: `}x = ${x}.`);
        }
      }
      case 3: {
        // 5x = 3 · (x + 4)
        for (;;) {
          const m = heltal(rng, 2, 6);
          const j = heltal(rng, 1, 4);
          const x = ikkeNul(rng, -8, 12);
          const n = (j * x) / m;
          if (!Number.isInteger(n) || n === 0) continue;
          const kk = m + j;
          const ind = n < 0 ? `x − ${-n}` : `x + ${n}`;
          return ligning(`bp:kxmpar:${kk}:${m}:${n}`, `${kk}x`, `${m} · (${ind})`, x, "Gang parentesen ud", `Gang ind i parentesen: ${kk}x = ${m}x ${n < 0 ? "−" : "+"} ${Math.abs(m * n)}. Træk ${m}x fra: ${j === 1 ? "x" : `${j}x`} = ${tal(m * n)}. ${j === 1 ? "" : `Divider med ${j}: `}x = ${tal(x)}.`);
        }
      }
      case 4: {
        // 12/x + 3 = 7
        const x = vaelg(rng, [2, 3, 4, 5, 6, -2, -3, -4]);
        const q = ikkeNul(rng, -6, 9);
        const taeller = x * q;
        if (taeller <= 0) return lavBroekParentes(rng, niveau);
        const b = heltal(rng, 1, 12);
        return ligning(`bp:ax:${taeller}:${b}:${x}`, `${taeller}/x + ${b}`, tal(q + b), x, "x i nævneren", `Træk ${b} fra: ${taeller}/x = ${tal(q)}. Hvad skal ${taeller} deles med for at give ${tal(q)}? x = ${taeller} : ${q < 0 ? `(${tal(q)})` : q} = ${tal(x)}.`);
      }
      default: {
        // 8x = x/2 − 15
        for (;;) {
          const a = heltal(rng, 2, 4);
          const kk = heltal(rng, 2, 9);
          const x = -a * heltal(rng, 1, 4);
          const b = x / a - kk * x;
          if (!Number.isInteger(b) || b <= 0) continue;
          return ligning(`bp:kxxa:${kk}:${a}:${b}`, `${kk}x`, `x/${a} − ${b}`, x, "Gang brøken væk først", `Gang med ${a} på begge sider: ${kk * a}x = x − ${a * b}. Træk x fra: ${kk * a - 1}x = −${a * b}. Divider: x = ${tal(x)}.`);
        }
      }
    }
  }

  // ---------------------------------------------------------------- platin
  switch (heltal(rng, 1, 5)) {
    case 1: {
      // x + 3/4 = 4x
      for (;;) {
        const q = vaelg(rng, [2, 4, 5]);
        const p = heltal(rng, 1, q * 2);
        if (gcd(p, q) !== 1) continue;
        const cc = heltal(rng, 2, 6);
        const x = p / (q * (cc - 1));
        if (Math.abs(x * 1000 - Math.round(x * 1000)) > 1e-9 || Number.isInteger(x)) continue;
        return ligning(`bp:xpq:${p}:${q}:${cc}`, `x + ${p}/${q}`, `${cc}x`, x, "Brøk eller kommatal — begge dele godkendes", `Træk x fra: ${p}/${q} = ${cc - 1 === 1 ? "x" : `${cc - 1}x`}. ${cc - 1 === 1 ? "" : `Divider med ${cc - 1}: `}x = ${tal(x)}. Du må gerne skrive svaret som brøk.`);
      }
    }
    case 2: {
      // x/3 + x/4 = 7
      for (;;) {
        const a = heltal(rng, 2, 6);
        const b = heltal(rng, 2, 6);
        if (a >= b) continue;
        const l = (a * b) / gcd(a, b);
        const x = l * heltal(rng, 1, 4);
        const h = x / a + x / b;
        return ligning(`bp:xaxb:${a}:${b}:${x}`, `x/${a} + x/${b}`, tal(h), x, "Gang med fællesnævneren", `Gang hele ligningen med ${l}: ${side([k(l / a), k(l / b)])} = ${tal(h * l)}. Saml: ${l / a + l / b}x = ${tal(h * l)}, så x = ${x}.`);
      }
    }
    case 3: {
      // (x + p)/a = (x − q)/b
      for (;;) {
        const a = heltal(rng, 3, 6);
        const b = heltal(rng, 2, a - 1);
        const p = heltal(rng, 1, 9);
        const q = heltal(rng, 1, 9);
        const x = (a * q + b * p) / (a - b);
        if (!Number.isInteger(x * 4)) continue;
        return ligning(`bp:krydsgange:${a}:${p}:${b}:${q}`, `(x + ${p})/${a}`, `(x − ${q})/${b}`, x, "Gang over kors", `Gang over kors: ${b} · (x + ${p}) = ${a} · (x − ${q}). Gang ud: ${b}x + ${b * p} = ${a}x − ${a * q}. Saml x til højre: ${b * p + a * q} = ${a - b === 1 ? "x" : `${a - b}x`}, så x = ${tal(x)}.`);
      }
    }
    case 4: {
      // 2 · (4x − 1) = 10
      for (;;) {
        const a = heltal(rng, 2, 6);
        const bb = heltal(rng, 2, 8);
        const cc = ikkeNul(rng, -9, 9);
        const x = kommaX(rng, 4);
        const h = a * (bb * x - cc);
        if (!Number.isInteger(h * 10)) continue;
        const ind = cc < 0 ? `${bb}x + ${-cc}` : `${bb}x − ${cc}`;
        return ligning(`bp:apbx:${a}:${bb}:${cc}:${x}`, `${a} · (${ind})`, tal(h), x, "Divider parentesen fri", `Divider med ${a}: ${ind} = ${tal(h / a)}. ${cc < 0 ? `Træk ${-cc} fra` : `Læg ${cc} til`}: ${bb}x = ${tal(bb * x)}. Divider med ${bb}: x = ${tal(x)}.`);
      }
    }
    default: {
      // a · (x + p) = b · (x − q) + r
      for (;;) {
        const a = heltal(rng, 2, 7);
        const b = heltal(rng, 2, 7);
        if (a === b) continue;
        const p = heltal(rng, 1, 8);
        const q = heltal(rng, 1, 8);
        const x = rng() < 0.5 ? ikkeNul(rng, -8, 10) : kommaX(rng, 4);
        const r = a * (x + p) - b * (x - q);
        if (!Number.isInteger(r) || r === 0 || r - b * q === 0) continue;
        return ligning(`bp:topar:${a}:${p}:${b}:${q}:${r}`, `${a} · (x + ${p})`, `${b} · (x − ${q}) ${r < 0 ? "−" : "+"} ${Math.abs(r)}`, x, "Gang begge parenteser ud", `Gang ud: ${a}x + ${a * p} = ${b}x − ${b * q} ${r < 0 ? "−" : "+"} ${Math.abs(r)}, altså ${side([k(a), c(a * p)])} = ${side([k(b), c(r - b * q)])}. ${beggeHint(a, a * p, b, r - b * q, x)}`);
      }
    }
  }
}
