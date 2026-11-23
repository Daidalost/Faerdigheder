import type { NiveauId, Opgave, P, Skitse } from "../typer";
import { heltal, vaelg, type Rng } from "../tilfaeldig";
import { tal, talOpgave } from "./algebra";
import { gange, midt, plus } from "./geometri";

/**
 * Areal og rumfang — opgave 14–16 i hvert prøvesæt.
 *
 *   Forslag til g og h ud fra arealet           dec 21 opg. 12, dec 23 opg. 15, dec 24 opg. 15
 *   Kvadratnet: areal og omkreds                maj 24 opg. 16, dec 25 opg. 16, maj 26 opg. 16
 *   Trapez med formel, frem og baglæns          dec 20 opg. 16, maj 24 opg. 15
 *   Terrasse, plankeværk, bordplade             maj 21 opg. 14, dec 22 opg. 14, maj 22 opg. 14
 *   Kasse: rumfang og overflade                 dec 20 opg. 11, dec 23 opg. 16, maj 25 opg. 15
 *   Prisme, cylinder, pyramide, kube (formel)   maj 21 opg. 15, maj 22 opg. 15, dec 22 opg. 15,
 *                                               dec 25 opg. 15, maj 26 opg. 15
 *   Pythagoras i en udfoldet pyramide           dec 24 opg. 16
 *
 * "Giv et forslag til g og h" har mange rigtige svar; i appen gives den ene
 * og eleven finder den anden — samme regning, ét facit.
 *
 * Bronze: hele tal. Sølv og guld: højst halve tal (som 3,5 m i prøven).
 * Platin: hvad som helst med højst tre decimaler.
 */

type Enhed = "cm" | "m";
const m2 = (e: Enhed) => `${e}²`;
const m3 = (e: Enhed) => `${e}³`;
const mt = (v: number, e: Enhed) => `${tal(v)} ${e}`;

function opgave(
  noegle: string,
  optakt: string,
  spoergsmaal: string,
  sk: Skitse | undefined,
  svar: number,
  enhed: string,
  strategi: string,
  hint: string,
): Opgave {
  return talOpgave({ noegle, optakt, spoergsmaal, figur: sk, svar, enhed, strategi, hint });
}

/** Et halvt tal fra sølv: 3, 3,5, 4 … */
const halv = (rng: Rng, min: number, max: number, niveau: NiveauId) =>
  niveau === "bronze" || rng() < 0.6 ? heltal(rng, min, max) : heltal(rng, min, max - 1) + 0.5;

// ============================================================== tegninger

/** Mål på en side i en polygon mod uret: −1 lægger teksten udenfor. */
const ude = (fra: P, til: P, tekst: string) => ({ fra, til, tekst, side: -1 as const });

function rektangel(l: number, b: number, e: Enhed): Skitse {
  const p: P[] = [[0, 0], [l, 0], [l, b], [0, b]];
  return {
    slags: "skitse",
    polygoner: [{ punkter: p, farve: "blaa" }],
    maal: [ude(p[0], p[1], mt(l, e)), ude(p[1], p[2], mt(b, e))],
    vinkler: [{ top: p[0], a: p[1], b: p[3], ret: true }],
    skitse: true,
  };
}

/** Trekant med grundlinje g og stiplet højde h. Toppen ligger over grundlinjen (eller udenfor, hvis stump). */
function trekantMedHoejde(g: number, h: number, topX: number, e: Enhed, farve: "lilla" | "blaa" = "lilla"): Skitse {
  const p: P[] = [[0, 0], [g, 0], [topX, h]];
  const fod: P = [topX, 0];
  const linjer: Skitse["linjer"] = [{ fra: fod, til: p[2], stiplet: true }];
  if (topX < 0 || topX > g) linjer.push({ fra: topX < 0 ? [0, 0] : [g, 0], til: fod, stiplet: true });
  return {
    slags: "skitse",
    polygoner: [{ punkter: p, farve }],
    linjer,
    vinkler: [{ top: fod, a: topX > g / 2 ? [0, 0] : [g, 0], b: p[2], ret: true }],
    maal: [ude(p[0], p[1], mt(g, e)), { fra: fod, til: p[2], tekst: mt(h, e), side: topX > g / 2 ? 1 : -1 }],
    skitse: true,
  };
}

function parallelogram(g: number, h: number, s: number, e: Enhed): Skitse {
  const p: P[] = [[0, 0], [g, 0], [g + s, h], [s, h]];
  return {
    slags: "skitse",
    polygoner: [{ punkter: p, farve: "teal" }],
    linjer: [{ fra: [s, 0], til: [s, h], stiplet: true }],
    vinkler: [{ top: [s, 0], a: [g, 0], b: [s, h], ret: true }],
    maal: [ude(p[0], p[1], mt(g, e)), { fra: [s, 0], til: [s, h], tekst: mt(h, e), side: 1 }],
    skitse: true,
  };
}

function trapez(a: number, b: number, h: number, x1: number, e: Enhed, formel: boolean): Skitse {
  const p: P[] = [[0, 0], [b, 0], [x1 + a, h], [x1, h]];
  const hx = Math.max(x1, 0) + Math.min(a, b) * 0.35;
  return {
    slags: "skitse",
    polygoner: [{ punkter: p, farve: "okker" }],
    linjer: [{ fra: [hx, 0], til: [hx, h], stiplet: true }],
    vinkler: [{ top: [hx, 0], a: [b, 0], b: [hx, h], ret: true }],
    maal: [ude(p[0], p[1], mt(b, e)), ude(p[2], p[3], mt(a, e)), { fra: [hx, 0], til: [hx, h], tekst: mt(h, e), side: -1 }],
    formel: formel
      ? ["A = 1/2 · h · (a + b)", "A er arealet af trapezet.", "h er højden.", "a og b er de parallelle sider."]
      : undefined,
    skitse: true,
  };
}

/** Kasse i skråprojektion. Skjulte kanter stiplet. */
function kasse(l: number, b: number, h: number, tekst: { l?: string; b?: string; h?: string; G?: string }, formel?: string[]): Skitse {
  const skala = Math.max(l, h) / Math.max(b, 1);
  const dv: P = gange([0.55, 0.38], b * Math.min(0.75, Math.max(0.4, skala * 0.35)));
  const F: P[] = [[0, 0], [l, 0], [l, h], [0, h]];
  const B = F.map((q) => plus(q, dv));
  const maal: NonNullable<Skitse["maal"]> = [];
  if (tekst.l) maal.push(ude(F[0], F[1], tekst.l));
  if (tekst.h) maal.push({ fra: F[0], til: F[3], tekst: tekst.h, side: 1 });
  if (tekst.b) maal.push(ude(F[1], B[1], tekst.b));
  return {
    slags: "skitse",
    polygoner: [
      { punkter: F, farve: "blaa" },
      { punkter: [F[3], F[2], B[2], B[3]], farve: "blaa" },
      { punkter: [F[1], B[1], B[2], F[2]], farve: "blaa" },
    ],
    linjer: [
      { fra: F[0], til: B[0], stiplet: true, tynd: true },
      { fra: B[0], til: B[1], stiplet: true, tynd: true },
      { fra: B[0], til: B[3], stiplet: true, tynd: true },
    ],
    maal,
    tekster: tekst.G ? [{ ved: plus(midt(F[0], F[1]), gange(dv, 0.5)), tekst: tekst.G, kursiv: false }] : undefined,
    formel,
    skitse: true,
  };
}

function cylinder(r: number, h: number, tekst: { h?: string; G?: string }, formel: string[]): Skitse {
  const ry = r * 0.32;
  return {
    slags: "skitse",
    ellipser: [
      { c: [0, 0], rx: r, ry, halv: "foran" },
      { c: [0, 0], rx: r, ry, halv: "bagved", stiplet: true },
      { c: [0, h], rx: r, ry },
    ],
    linjer: [
      { fra: [-r, 0], til: [-r, h] },
      { fra: [r, 0], til: [r, h] },
    ],
    maal: tekst.h ? [{ fra: [r, 0], til: [r, h], tekst: tekst.h, side: -1 }] : [],
    tekster: tekst.G ? [{ ved: [0, -ry * 0.05], tekst: tekst.G, kursiv: false }] : undefined,
    formel,
    skitse: true,
  };
}

function pyramide(l: number, b: number, h: number, tekst: { h?: string; G?: string; l?: string; b?: string }, formel: string[]): Skitse {
  const dv: P = gange([0.6, 0.35], b);
  const Q: P[] = [[0, 0], [l, 0], plus([l, 0], dv), dv];
  const c = gange(plus(Q[0], Q[2]), 0.5);
  const T = plus(c, [0, h]);
  const maal: NonNullable<Skitse["maal"]> = [];
  if (tekst.l) maal.push(ude(Q[0], Q[1], tekst.l));
  if (tekst.b) maal.push(ude(Q[1], Q[2], tekst.b));
  if (tekst.h) maal.push({ fra: c, til: T, tekst: tekst.h, side: 1 });
  return {
    slags: "skitse",
    polygoner: [{ punkter: Q, farve: "okker", fyld: true }],
    linjer: [
      { fra: Q[0], til: T },
      { fra: Q[1], til: T },
      { fra: Q[2], til: T },
      { fra: Q[3], til: T, stiplet: true, tynd: true },
      { fra: c, til: T, stiplet: true, tynd: true },
    ],
    maal,
    tekster: tekst.G ? [{ ved: plus(c, [-l * 0.18, -dv[1] * 0.25]), tekst: tekst.G, kursiv: false }] : undefined,
    formel,
    skitse: true,
  };
}

/** Prisme med en retvinklet trekant som grundflade (maj 21 opg. 15). */
function trekantPrisme(k1: number, k2: number, L: number, e: Enhed): Skitse {
  const dv: P = gange([0.75, 0.42], L * 0.55);
  const F: P[] = [[0, 0], [k1, 0], [0, k2]];
  const B = F.map((q) => plus(q, dv));
  return {
    slags: "skitse",
    polygoner: [
      { punkter: F, farve: "terra" },
      { punkter: [F[1], B[1], B[2], F[2]], farve: "terra" },
    ],
    linjer: [
      { fra: F[0], til: B[0], stiplet: true, tynd: true },
      { fra: B[0], til: B[1], stiplet: true, tynd: true },
      { fra: B[0], til: B[2], stiplet: true, tynd: true },
    ],
    vinkler: [{ top: F[0], a: F[1], b: F[2], ret: true }],
    maal: [ude(F[0], F[1], mt(k1, e)), { fra: F[0], til: F[2], tekst: mt(k2, e), side: -1 }, ude(F[1], B[1], mt(L, e))],
    formel: ["V = G · h", "V er rumfanget af prismet.", "G er arealet af grundfladen.", "h er højden (længden) af prismet."],
    skitse: true,
  };
}

// ================================================================ opgaver

function rektangelOpgave(rng: Rng, niveau: NiveauId): Opgave {
  const e: Enhed = vaelg(rng, ["cm", "m"]);
  const l = halv(rng, 3, 12, niveau);
  let b = halv(rng, 2, 9, niveau);
  if (b === l) b = l - 1;
  const omkreds = rng() < 0.4;
  return opgave(
    `areal:rekt:${omkreds ? "o" : "a"}:${l}:${b}`,
    "Rektangel",
    omkreds ? "Hvor stor er omkredsen af rektanglet?" : "Hvor stort er arealet af rektanglet?",
    rektangel(l, b, e),
    omkreds ? 2 * (l + b) : l * b,
    omkreds ? e : m2(e),
    omkreds ? "Hele vejen rundt" : "Længde gange bredde",
    omkreds
      ? `Omkredsen er alle fire sider lagt sammen: ${tal(l)} + ${tal(b)} + ${tal(l)} + ${tal(b)} = ${tal(2 * (l + b))} ${e}.`
      : `Areal = længde · bredde = ${tal(l)} · ${tal(b)} = ${tal(l * b)} ${m2(e)}.`,
  );
}

function trekantOpgave(rng: Rng, niveau: NiveauId): Opgave {
  const e: Enhed = vaelg(rng, ["cm", "m"]);
  let g = 0;
  let h = 0;
  do {
    g = heltal(rng, 3, 12);
    h = heltal(rng, 2, 10);
  } while (niveau === "bronze" && (g * h) % 2 !== 0);
  const topX = rng() < 0.15 && niveau !== "bronze" ? g + heltal(rng, 1, 3) : heltal(rng, 1, g - 1);
  return opgave(
    `areal:trekant:${g}:${h}:${topX}`,
    "Trekant",
    "Hvor stort er arealet af trekanten?",
    trekantMedHoejde(g, h, topX, e),
    (g * h) / 2,
    m2(e),
    "Halvdelen af g · h",
    `En trekant er halvdelen af et rektangel med samme grundlinje og højde: 1/2 · ${g} · ${h} = ${tal((g * h) / 2)} ${m2(e)}.${topX > g ? " Højden står uden for trekanten, fordi trekanten er stump — den måles stadig lodret fra grundlinjen." : ""}`,
  );
}

function parallelogramOpgave(rng: Rng, niveau: NiveauId): Opgave {
  const e: Enhed = vaelg(rng, ["cm", "m"]);
  const g = halv(rng, 4, 11, niveau);
  const h = heltal(rng, 2, 8);
  const s = heltal(rng, 1, 3);
  return opgave(
    `areal:parallelogram:${g}:${h}`,
    "Parallelogram",
    "Hvor stort er arealet af parallelogrammet?",
    parallelogram(g, h, s, e),
    g * h,
    m2(e),
    "Grundlinje gange højde",
    `Klip trekanten af i den ene side og flyt den over i den anden — så er det et rektangel: ${tal(g)} · ${h} = ${tal(g * h)} ${m2(e)}. Brug højden, ikke den skrå side.`,
  );
}

function trapezOpgave(rng: Rng, niveau: NiveauId): Opgave {
  const e: Enhed = vaelg(rng, ["cm", "m"]);
  let a = 0;
  let b = 0;
  let h = 0;
  do {
    a = heltal(rng, 2, 8);
    b = a + heltal(rng, 2, 6);
    h = heltal(rng, 2, 8);
  } while (((a + b) * h) % 2 !== 0 && niveau === "bronze");
  const x1 = heltal(rng, 0, b - a);
  return opgave(
    `areal:trapez:${a}:${b}:${h}`,
    "Trapez",
    "Hvor stort er arealet af trapezet?",
    trapez(a, b, h, x1, e, true),
    ((a + b) * h) / 2,
    m2(e),
    "Brug formlen i boksen",
    `Sæt ind i formlen: A = 1/2 · ${h} · (${a} + ${b}) = 1/2 · ${h} · ${a + b} = ${tal(((a + b) * h) / 2)} ${m2(e)}.`,
  );
}

/** Figur tegnet i kvadratnet. Arealet tælles eller regnes. */
function kvadratnet(rng: Rng, niveau: NiveauId): Opgave {
  const W = 8;
  const H = 6;
  let punkter: P[] = [];
  let navn = "";
  const type = niveau === "bronze" ? vaelg(rng, ["rekt", "rettrekant", "L"]) : niveau === "platin" ? vaelg(rng, ["skaev", "skaev", "trapez"]) : vaelg(rng, ["trekant", "trekant", "parallelogram", "trapez"]);
  for (;;) {
    const x0 = heltal(rng, 0, 2);
    const y0 = heltal(rng, 0, 1);
    const g = heltal(rng, 2, 6);
    const h = heltal(rng, 2, 5);
    if (x0 + g > W || y0 + h > H) continue;
    if (type === "rekt") {
      punkter = [[x0, y0], [x0 + g, y0], [x0 + g, y0 + h], [x0, y0 + h]];
      navn = "rektanglet";
    } else if (type === "rettrekant") {
      if ((g * h) % 2) continue;
      punkter = [[x0, y0], [x0 + g, y0], [x0, y0 + h]];
      navn = "trekanten";
    } else if (type === "L") {
      const a = heltal(rng, 1, g - 1);
      const c = heltal(rng, 1, h - 1);
      punkter = [[x0, y0], [x0 + g, y0], [x0 + g, y0 + c], [x0 + a, y0 + c], [x0 + a, y0 + h], [x0, y0 + h]];
      navn = "figuren";
    } else if (type === "trekant") {
      const tx = heltal(rng, 0, W);
      punkter = [[x0, y0], [x0 + g, y0], [tx, y0 + h]];
      navn = "trekanten";
    } else if (type === "parallelogram") {
      const s = heltal(rng, 1, 2);
      if (x0 + g + s > W) continue;
      punkter = [[x0, y0], [x0 + g, y0], [x0 + g + s, y0 + h], [x0 + s, y0 + h]];
      navn = "parallelogrammet";
    } else if (type === "trapez") {
      const a1 = heltal(rng, 0, g - 1);
      const a2 = heltal(rng, a1 + 1, g + 1);
      if (x0 + a2 > W) continue;
      punkter = [[x0, y0], [x0 + g, y0], [x0 + a2, y0 + h], [x0 + a1, y0 + h]];
      navn = "trapezet";
    } else {
      // Skæv trekant: ingen vandret eller lodret side. Rammes ind og trækkes fra.
      const A: P = [heltal(rng, 0, 2), heltal(rng, 0, 2)];
      const B: P = [heltal(rng, 5, 8), heltal(rng, 0, 3)];
      const C: P = [heltal(rng, 1, 6), heltal(rng, 4, 6)];
      if (A[1] === B[1] || A[0] === C[0] || B[0] === C[0] || C[1] === B[1]) continue;
      punkter = [A, B, C];
      navn = "trekanten";
    }
    break;
  }
  let areal = 0;
  for (let i = 0; i < punkter.length; i++) {
    const [x1, y1] = punkter[i];
    const [x2, y2] = punkter[(i + 1) % punkter.length];
    areal += x1 * y2 - x2 * y1;
  }
  areal = Math.abs(areal) / 2;
  if (niveau !== "platin" && !Number.isInteger(areal * 2)) return kvadratnet(rng, niveau);
  if (niveau === "bronze" && !Number.isInteger(areal)) return kvadratnet(rng, niveau);
  return opgave(
    `areal:net:${punkter.map((q) => q.join(",")).join(";")}`,
    "Kvadratnet",
    `Hvert tern er 1 cm × 1 cm. Hvor stort er arealet af ${navn}?`,
    { slags: "skitse", gitter: { x: [0, W], y: [0, H] }, polygoner: [{ punkter, farve: "terra" }] },
    areal,
    "cm²",
    type === "skaev" ? "Ram trekanten ind i et rektangel" : "Tæl, eller brug en formel",
    type === "skaev"
      ? `Tegn det mindste rektangel, der kan være omkring trekanten. Træk de tre retvinklede trekanter i hjørnerne fra — så er resten ${tal(areal)} cm².`
      : type === "rekt" || type === "L"
        ? `Tæl de hele tern${type === "L" ? ", eller del figuren i to rektangler" : ""}: ${tal(areal)} cm².`
        : `Find grundlinjen og højden ved at tælle tern, og brug formlen for ${{ trekanten: "en trekant", parallelogrammet: "et parallelogram", trapezet: "et trapez" }[navn] ?? "et rektangel"}: ${tal(areal)} cm².`,
  );
}

/** L-formet bordplade (maj 22 opg. 14): areal eller omkreds. */
function sammensat(rng: Rng, niveau: NiveauId): Opgave {
  const e: Enhed = "m";
  const L = halv(rng, 3, 6, niveau);
  const B = halv(rng, 3, 5, niveau);
  const a = halv(rng, 1, Math.max(1, Math.floor(L) - 1), niveau);
  const c = halv(rng, 1, Math.max(1, Math.floor(B) - 1), niveau);
  if (a >= L || c >= B) return sammensat(rng, niveau);
  const p: P[] = [[0, 0], [L, 0], [L, c], [a, c], [a, B], [0, B]];
  const omkreds = rng() < 0.45;
  const areal = L * c + a * (B - c);
  // To halve mål ganget sammen giver kvarte — så trækkes der nye mål.
  if (niveau !== "platin" && !Number.isInteger((omkreds ? 2 * (L + B) : areal) * 2)) return sammensat(rng, niveau);
  return opgave(
    `areal:L:${omkreds ? "o" : "a"}:${p.map((q) => q.join(",")).join(";")}`,
    "Sammensat figur",
    omkreds ? "Skitsen viser en bordplade set fra oven. Hvor stor er omkredsen?" : "Skitsen viser en bordplade set fra oven. Hvor stort er arealet?",
    {
      slags: "skitse",
      polygoner: [{ punkter: p, farve: "okker" }],
      maal: [ude(p[0], p[1], mt(L, e)), ude(p[1], p[2], mt(c, e)), ude(p[3], p[4], mt(B - c, e)), ude(p[5], p[0], mt(B, e)), ude(p[4], p[5], mt(a, e))],
      skitse: true,
    },
    omkreds ? 2 * (L + B) : areal,
    omkreds ? e : m2(e),
    omkreds ? "Find de manglende sider" : "Del i to rektangler",
    omkreds
      ? `To af siderne står ikke på skitsen. Den vandrette mangler ${tal(L)} − ${tal(a)} = ${tal(L - a)}, den lodrette ${tal(B)} − ${tal(c)} = ${tal(B - c)}. Læg alle seks sider sammen: ${tal(2 * (L + B))} m. (Genvej: en L-figur har samme omkreds som rektanglet omkring den.)`
      : `Del figuren med en vandret streg: ${tal(L)} · ${tal(c)} = ${tal(L * c)} og ${tal(a)} · ${tal(B - c)} = ${tal(a * (B - c))}. I alt ${tal(areal)} m².`,
  );
}

/** Terrasse med fliser (maj 21) og plankeværk (dec 22). */
function fliser(rng: Rng): Opgave {
  if (rng() < 0.5) {
    const fl = vaelg(rng, [[1, 0.5], [0.5, 0.5], [1, 1]] as [number, number][]);
    const l = vaelg(rng, [3, 4, 5, 6, 7]);
    const b = vaelg(rng, [2, 2.5, 3, 3.5, 4]);
    const antal = (l * b) / (fl[0] * fl[1]);
    if (!Number.isInteger(antal)) return fliser(rng);
    return opgave(
      `areal:fliser:${l}:${b}:${fl[0]}:${fl[1]}`,
      "Terrasse",
      `En rektangulær terrasse er ${tal(l)} m × ${tal(b)} m. Fliserne er ${tal(fl[0])} m × ${tal(fl[1])} m. Hvor mange fliser skal der bruges?`,
      rektangel(l, b, "m"),
      antal,
      "fliser",
      "Areal delt med fliseareal",
      `Terrassen er ${tal(l)} · ${tal(b)} = ${tal(l * b)} m². Én flise er ${tal(fl[0])} · ${tal(fl[1])} = ${tal(fl[0] * fl[1])} m². ${tal(l * b)} : ${tal(fl[0] * fl[1])} = ${antal} fliser. (Eller: tæl hvor mange fliser der er langs hver side, og gang.)`,
    );
  }
  const bredde = vaelg(rng, [10, 15, 20, 25]);
  const L = vaelg(rng, [3, 4.5, 6, 7.5, 9, 3.5, 5]);
  const antal = (L * 100) / bredde;
  if (!Number.isInteger(antal)) return fliser(rng);
  return opgave(
    `areal:braedder:${L}:${bredde}`,
    "Plankeværk",
    `Et plankeværk skal være ${tal(L)} m langt. Hvert bræt er ${bredde} cm bredt og står lodret. Hvor mange brædder skal der bruges?`,
    undefined,
    antal,
    "brædder",
    "Samme enhed først",
    `${tal(L)} m = ${tal(L * 100)} cm. ${tal(L * 100)} : ${bredde} = ${antal} brædder.`,
  );
}

function kasseRumfang(rng: Rng, niveau: NiveauId): Opgave {
  const e: Enhed = "cm";
  const l = heltal(rng, 2, niveau === "bronze" ? 6 : 10);
  const b = heltal(rng, 2, 6);
  const h = niveau === "bronze" ? heltal(rng, 2, 6) : halv(rng, 2, 8, niveau);
  return opgave(
    `areal:kasseV:${l}:${b}:${h}`,
    "Kasse",
    "Hvor stort er rumfanget af kassen?",
    kasse(l, b, h, { l: mt(l, e), b: mt(b, e), h: mt(h, e) }),
    l * b * h,
    m3(e),
    "Længde · bredde · højde",
    `Bunden er ${l} · ${b} = ${l * b} ${m2(e)}. Der er ${tal(h)} lag: ${l * b} · ${tal(h)} = ${tal(l * b * h)} ${m3(e)}.`,
  );
}

function kubeOgCylinder(rng: Rng, niveau: NiveauId): Opgave {
  if (rng() < 0.5) {
    const s = heltal(rng, 2, 10);
    return opgave(
      `areal:kubeV:${s}`,
      "Kube",
      `En kube har sidelængden ${s} cm. Hvor stort er rumfanget?`,
      kasse(s, s, s, { l: mt(s, "cm") }, ["V = s³", "V er rumfanget af kuben.", "s er sidelængden."]),
      s ** 3,
      "cm³",
      "s · s · s",
      `s³ betyder s · s · s: ${s} · ${s} · ${s} = ${s ** 3} cm³.`,
    );
  }
  const G = heltal(rng, 5, 40);
  const h = halv(rng, 3, 15, niveau);
  return opgave(
    `areal:cylV:${G}:${h}`,
    "Cylinder",
    `En cylinder har en grundflade på ${G} cm² og en højde på ${tal(h)} cm. Hvor stort er rumfanget?`,
    cylinder(2, 3, { h: mt(h, "cm"), G: `${G} cm²` }, ["V = h · G", "V er rumfanget af cylinderen.", "h er højden.", "G er arealet af grundfladen."]),
    G * h,
    "cm³",
    "Grundflade gange højde",
    `V = h · G = ${tal(h)} · ${G} = ${tal(G * h)} cm³.`,
  );
}

// ------------------------------------------------------------------ guld

function baglaensFlade(rng: Rng): Opgave {
  const e: Enhed = vaelg(rng, ["cm", "m"]);
  if (rng() < 0.5) {
    const g = heltal(rng, 3, 12);
    const h = halv(rng, 2, 10, "guld");
    const A = (g * h) / 2;
    const sk = trekantMedHoejde(g, h, heltal(rng, 1, g - 1), e);
    // Højden er det, der spørges om — den må ikke stå på skitsen.
    // Mål nr. 1 er højden.
    sk.maal = sk.maal?.map((m, i) => (i === 1 ? { ...m, tekst: "h" } : m));
    return opgave(
      `areal:trekantH:${A}:${g}`,
      "Trekant — baglæns",
      `Trekantens areal er ${tal(A)} ${m2(e)}, og grundlinjen er ${g} ${e}. Hvor stor er højden?`,
      sk,
      h,
      e,
      "Gang arealet med 2, del med g",
      `A = 1/2 · g · h, så g · h = 2 · ${tal(A)} = ${tal(2 * A)}. h = ${tal(2 * A)} : ${g} = ${tal(h)} ${e}.`,
    );
  }
  let a = 0;
  let b = 0;
  let h = 0;
  do {
    a = heltal(rng, 2, 8);
    b = a + heltal(rng, 2, 8);
    h = heltal(rng, 2, 10);
  } while (((a + b) * h) % 2 !== 0);
  const A = ((a + b) * h) / 2;
  const sk = trapez(a, b, h, heltal(rng, 0, b - a), e, true);
  // Mål nr. 2 er højden.
  sk.maal = sk.maal?.map((m, i) => (i === 2 ? { ...m, tekst: "h" } : m));
  return opgave(
    `areal:trapezH:${A}:${a}:${b}`,
    "Trapez — baglæns",
    `Trapezet har arealet ${tal(A)} ${m2(e)}, og de parallelle sider er ${a} ${e} og ${b} ${e}. Hvor stor er højden?`,
    sk,
    h,
    e,
    "Sæt ind og løs",
    `${tal(A)} = 1/2 · h · (${a} + ${b}) = 1/2 · h · ${a + b}. Halvdelen af ${a + b} er ${tal((a + b) / 2)}, så h = ${tal(A)} : ${tal((a + b) / 2)} = ${h} ${e}.`,
  );
}

function kvadratiskKasse(rng: Rng): Opgave {
  const s = heltal(rng, 2, 10);
  const h = heltal(rng, 2, 12);
  const G = s * s;
  const formel = ["V = G · h", "V er rumfanget af kassen.", "G er arealet af grundfladen.", "h er højden."];
  if (rng() < 0.5) {
    return opgave(
      `areal:kvadratSide:${G}`,
      "Kasse med kvadratisk bund",
      `Kassens grundflade er et kvadrat med arealet ${G} cm². Hvor lang er siden i grundfladen?`,
      kasse(s, s, h, { G: `G = ${G}` }, formel),
      s,
      "cm",
      "Hvilket tal gange sig selv?",
      `Grundfladen er et kvadrat, så siden gange sig selv giver ${G}. ${s} · ${s} = ${G}, så siden er ${s} cm.`,
    );
  }
  return opgave(
    `areal:kasseH:${G * h}:${G}`,
    "Kasse med kvadratisk bund",
    `Kassens grundflade har arealet ${G} cm², og rumfanget er ${G * h} cm³. Hvor høj er kassen?`,
    kasse(s, s, h, { G: `G = ${G}`, h: "h" }, formel),
    h,
    "cm",
    "Rumfang delt med grundflade",
    `V = G · h, så h = V : G = ${G * h} : ${G} = ${h} cm.`,
  );
}

function kubeBaglaens(rng: Rng): Opgave {
  const s = heltal(rng, 2, 10);
  return opgave(
    `areal:kubeS:${s ** 3}`,
    "Kube — baglæns",
    `En kube har rumfanget ${s ** 3} cm³. Hvor lang er siden?`,
    kasse(s, s, s, { l: "s" }, ["V = s³", "V er rumfanget af kuben.", "s er sidelængden."]),
    s,
    "cm",
    "Hvilket tal tre gange med sig selv?",
    `Prøv dig frem: ${s} · ${s} · ${s} = ${s ** 3}. Så er s = ${s} cm.`,
  );
}

function pyramideOpgave(rng: Rng, niveau: NiveauId): Opgave {
  const formel = ["V = 1/3 · G · h", "V er rumfanget af pyramiden.", "G er arealet af grundfladen.", "h er højden."];
  const l = heltal(rng, 2, 8);
  const b = heltal(rng, 2, 6);
  const G = l * b;
  let h = 0;
  do h = heltal(rng, 2, 15);
  while ((G * h) % 3 !== 0);
  const V = (G * h) / 3;
  if (rng() < 0.5 || niveau === "soelv") {
    return opgave(
      `areal:pyrV:${G}:${h}`,
      "Pyramide",
      `Pyramiden har en rektangulær grundflade på ${l} cm × ${b} cm og højden ${h} cm. Hvor stort er rumfanget?`,
      pyramide(l, b, h * 0.6, { l: `${l} cm`, b: `${b} cm`, h: `${h} cm` }, formel),
      V,
      "cm³",
      "En tredjedel af kassen",
      `G = ${l} · ${b} = ${G} cm². V = 1/3 · ${G} · ${h} = ${G * h} : 3 = ${tal(V)} cm³.`,
    );
  }
  return opgave(
    `areal:pyrH:${V}:${G}`,
    "Pyramide — baglæns",
    `Pyramidens grundflade har arealet ${G} cm², og rumfanget er ${tal(V)} cm³. Hvor stor er højden?`,
    pyramide(l, b, h * 0.6, { G: `G = ${G}`, h: "h" }, formel),
    h,
    "cm",
    "Gang med 3, del med G",
    `V = 1/3 · G · h, så G · h = 3 · ${tal(V)} = ${tal(3 * V)}. h = ${tal(3 * V)} : ${G} = ${h} cm.`,
  );
}

function cylinderBaglaens(rng: Rng): Opgave {
  const G = heltal(rng, 5, 30);
  const h = heltal(rng, 2, 12);
  return opgave(
    `areal:cylG:${G * h}:${h}`,
    "Cylinder — baglæns",
    `En cylinder har rumfanget ${G * h} cm³ og højden ${h} cm. Hvor stort er arealet af grundfladen?`,
    cylinder(2, 3, { h: `${h} cm`, G: "G" }, ["V = h · G", "V er rumfanget af cylinderen.", "h er højden.", "G er arealet af grundfladen."]),
    G,
    "cm²",
    "Rumfang delt med højde",
    `V = h · G, så G = V : h = ${G * h} : ${h} = ${G} cm².`,
  );
}

function kasseOverflade(rng: Rng): Opgave {
  const l = heltal(rng, 2, 8);
  const b = heltal(rng, 2, 6);
  const h = heltal(rng, 2, 6);
  const O = 2 * (l * b + l * h + b * h);
  return opgave(
    `areal:kasseO:${l}:${b}:${h}`,
    "Kasse",
    "Hvor stort er kassens overfladeareal?",
    kasse(l, b, h, { l: `${l} cm`, b: `${b} cm`, h: `${h} cm` }),
    O,
    "cm²",
    "Seks sider — tre par",
    `Kassen har tre par ens sider: bund og låg ${l} · ${b} = ${l * b}, for og bag ${l} · ${h} = ${l * h}, ender ${b} · ${h} = ${b * h}. I alt 2 · (${l * b} + ${l * h} + ${b * h}) = ${O} cm².`,
  );
}

function prismeOpgave(rng: Rng): Opgave {
  const [k1, k2] = vaelg(rng, [[3, 4], [4, 3], [6, 8], [5, 12], [2, 5], [4, 5], [3, 6]] as [number, number][]);
  const L = heltal(rng, 4, 12);
  return opgave(
    `areal:prismeV:${k1}:${k2}:${L}`,
    "Prisme",
    "Grundfladen i prismet er en retvinklet trekant. Hvor stort er rumfanget?",
    trekantPrisme(k1, k2, L, "cm"),
    (k1 * k2 * L) / 2,
    "cm³",
    "Find G først",
    `Grundfladen er en retvinklet trekant: G = 1/2 · ${k1} · ${k2} = ${tal((k1 * k2) / 2)} cm². V = G · h = ${tal((k1 * k2) / 2)} · ${L} = ${tal((k1 * k2 * L) / 2)} cm³.`,
  );
}

// ---------------------------------------------------------------- platin

const TRIPLER: [number, number, number][] = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 15, 17], [9, 12, 15], [1.5, 2, 2.5], [7, 24, 25], [12, 16, 20], [2.5, 6, 6.5]];

function pythagoras(rng: Rng): Opgave {
  const [a, b, c] = vaelg(rng, TRIPLER);
  const hyp = rng() < 0.5;
  const p: P[] = [[0, 0], [a, 0], [0, b]];
  const sk: Skitse = {
    slags: "skitse",
    polygoner: [{ punkter: p, farve: "blaa" }],
    vinkler: [{ top: p[0], a: p[1], b: p[2], ret: true }],
    maal: hyp
      ? [ude(p[0], p[1], `${tal(a)} cm`), { fra: p[0], til: p[2], tekst: `${tal(b)} cm`, side: -1 }, ude(p[1], p[2], "?")]
      : [ude(p[0], p[1], `${tal(a)} cm`), { fra: p[0], til: p[2], tekst: "?", side: -1 }, ude(p[1], p[2], `${tal(c)} cm`)],
    formel: ["a² + b² = c²", "I en retvinklet trekant, hvor c er den længste side."],
    skitse: true,
  };
  return opgave(
    `areal:pyt:${hyp ? "hyp" : "kat"}:${a}:${hyp ? b : c}`,
    "Pythagoras",
    "Trekanten er retvinklet. Hvor lang er siden med spørgsmålstegnet?",
    sk,
    hyp ? c : b,
    "cm",
    hyp ? "Læg kvadraterne sammen" : "Træk kvadraterne fra hinanden",
    hyp
      ? `${tal(a)}² + ${tal(b)}² = ${tal(a * a)} + ${tal(b * b)} = ${tal(c * c)}. Hvilket tal i anden giver ${tal(c * c)}? ${tal(c)} cm.`
      : `Den længste side er ${tal(c)}. ${tal(c)}² − ${tal(a)}² = ${tal(c * c)} − ${tal(a * a)} = ${tal(b * b)}, og ${tal(b)}² = ${tal(b * b)}. Siden er ${tal(b)} cm.`,
  );
}

/** Sideflade i en pyramide: ligebenet trekant — højden findes med Pythagoras (dec 24 opg. 16). */
function sideflade(rng: Rng): Opgave {
  const [halvB, h, ben] = vaelg(rng, [[3, 4, 5], [4, 3, 5], [5, 12, 13], [6, 8, 10], [8, 6, 10], [9, 12, 15], [12, 5, 13]] as [number, number, number][]);
  const g = 2 * halvB;
  const p: P[] = [[0, 0], [g, 0], [halvB, h]];
  return opgave(
    `areal:sideflade:${g}:${ben}`,
    "Pyramidens sideflade",
    `En sideflade i en pyramide er en ligebenet trekant med grundlinjen ${g} cm og to sider på ${ben} cm. Hvor stort er arealet?`,
    {
      slags: "skitse",
      polygoner: [{ punkter: p, farve: "okker" }],
      linjer: [
        { fra: [halvB, 0], til: p[2], stiplet: true },
        { fra: p[0], til: p[2], streger: 1 },
        { fra: p[1], til: p[2], streger: 1 },
      ],
      vinkler: [{ top: [halvB, 0], a: [g, 0], b: p[2], ret: true }],
      maal: [ude(p[0], p[1], `${g} cm`), ude(p[1], p[2], `${ben} cm`)],
      formel: ["a² + b² = c²", "I en retvinklet trekant, hvor c er den længste side."],
      skitse: true,
    },
    (g * h) / 2,
    "cm²",
    "Find højden med Pythagoras",
    `Højden deler trekanten i to retvinklede trekanter med siderne ${halvB} og ${ben}. h² = ${ben}² − ${halvB}² = ${ben * ben - halvB * halvB}, så h = ${h} cm. Arealet er 1/2 · ${g} · ${h} = ${(g * h) / 2} cm².`,
  );
}

function liter(rng: Rng): Opgave {
  const l = vaelg(rng, [10, 20, 25, 30, 40, 50]);
  const b = vaelg(rng, [10, 15, 20, 25, 30]);
  const h = vaelg(rng, [10, 12, 15, 20, 30, 40]);
  const V = l * b * h;
  return opgave(
    `areal:liter:${l}:${b}:${h}`,
    "Akvarium",
    `Et akvarium er formet som en kasse: ${l} cm lang, ${b} cm bred og ${h} cm høj. Hvor mange liter vand kan der være i det?`,
    kasse(l, b, h, { l: `${l} cm`, b: `${b} cm`, h: `${h} cm` }),
    V / 1000,
    "L",
    "1 L = 1000 cm³",
    `V = ${l} · ${b} · ${h} = ${V} cm³. 1 liter er 1 dm³ = 1000 cm³, så ${V} cm³ = ${tal(V / 1000)} L.`,
  );
}

function toTrin(rng: Rng): Opgave {
  if (rng() < 0.5) {
    // Trapez: kendt areal, højde og den ene parallelle side → den anden.
    const a = heltal(rng, 2, 10);
    const b = a + heltal(rng, 1, 9);
    const h = vaelg(rng, [2, 4, 5, 6, 8]);
    const A = ((a + b) * h) / 2;
    const sk = trapez(a, b, h, heltal(rng, 0, b - a), "cm", true);
    // Mål nr. 0 er den lange parallelle side.
    sk.maal = sk.maal?.map((m, i) => (i === 0 ? { ...m, tekst: "b" } : m));
    return opgave(
      `areal:trapezB:${A}:${h}:${a}`,
      "Trapez — baglæns",
      `Trapezet har arealet ${tal(A)} cm², højden ${h} cm, og den ene parallelle side er ${a} cm. Hvor lang er den anden?`,
      sk,
      b,
      "cm",
      "Find a + b først",
      `${tal(A)} = 1/2 · ${h} · (a + b), så a + b = ${tal(A)} · 2 : ${h} = ${a + b}. Den anden side er ${a + b} − ${a} = ${b} cm.`,
    );
  }
  const s = heltal(rng, 2, 10);
  return opgave(
    `areal:kubeO:${6 * s * s}`,
    "Kube — baglæns",
    `En kube har overfladearealet ${6 * s * s} cm². Hvor stort er rumfanget?`,
    kasse(s, s, s, { l: "s" }),
    s ** 3,
    "cm³",
    "Seks ens kvadrater",
    `Overfladen er 6 ens kvadrater: ${6 * s * s} : 6 = ${s * s} cm² hver. Siden er ${s} cm (${s} · ${s} = ${s * s}). Rumfanget er ${s}³ = ${s ** 3} cm³.`,
  );
}

// ================================================================== samlet

export function lavArealRumfang(rng: Rng, niveau: NiveauId): Opgave {
  const r = rng();
  if (niveau === "bronze") {
    if (r < 0.3) return rektangelOpgave(rng, niveau);
    if (r < 0.55) return kvadratnet(rng, niveau);
    if (r < 0.8) return trekantOpgave(rng, niveau);
    return kasseRumfang(rng, niveau);
  }
  if (niveau === "soelv") {
    if (r < 0.15) return parallelogramOpgave(rng, niveau);
    if (r < 0.3) return trapezOpgave(rng, niveau);
    if (r < 0.45) return sammensat(rng, niveau);
    if (r < 0.6) return fliser(rng);
    if (r < 0.75) return kubeOgCylinder(rng, niveau);
    if (r < 0.88) return kvadratnet(rng, niveau);
    return trekantOpgave(rng, niveau);
  }
  if (niveau === "guld") {
    if (r < 0.2) return baglaensFlade(rng);
    if (r < 0.35) return kvadratiskKasse(rng);
    if (r < 0.45) return kubeBaglaens(rng);
    if (r < 0.6) return pyramideOpgave(rng, niveau);
    if (r < 0.68) return cylinderBaglaens(rng);
    if (r < 0.78) return kasseOverflade(rng);
    if (r < 0.88) return prismeOpgave(rng);
    return kvadratnet(rng, niveau);
  }
  if (r < 0.25) return pythagoras(rng);
  if (r < 0.45) return sideflade(rng);
  if (r < 0.6) return liter(rng);
  if (r < 0.8) return toTrin(rng);
  return kvadratnet(rng, niveau);
}
