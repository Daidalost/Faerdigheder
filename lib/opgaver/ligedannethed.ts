import type { NiveauId, Opgave, P, Skitse } from "../typer";
import { heltal, vaelg, type Rng } from "../tilfaeldig";
import { tal, talOpgave, valgOpgave } from "./algebra";
import { firkantFraSider, gange, paa, plus, polygonFraVinkler, trekantFraSider, vinkel } from "./geometri";

/**
 * Ligedannethed — i hvert prøvesæt, typisk opgave 12–14 eller 16–17.
 *
 *   To ligedannede figurer i forholdet 1 : 3 — find sider     dec 20 opg. 14, dec 25 opg. 17
 *   Trekant i trekant (A-figur), AB ∥ DE                      maj 21 opg. 13, maj 24 opg. 14
 *   "Arealet er ___ gange så stort"                           dec 20, maj 21, maj 24, maj 25
 *   "Rumfanget er ___ gange så stort" (kasser)                 dec 21 opg. 13
 *   Hvilket rektangel / hvilken trekant er ligedannet?         maj 22 opg. 12, maj 25 opg. 16
 *   Skygger: person og træ                                     dec 22 opg. 12, maj 26 opg. 17
 *   "Forholdet mellem siderne er 1 : ___"                      dec 21, maj 25, maj 26
 *
 * Bronze: hele tal og forstørrelser. Sølv og guld: højst halve tal.
 */

const cm = (v: number) => `${tal(v)} cm`;
/** 25000 → "25.000" */
const tusind = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/** Lægger to skitser ved siden af hinanden. */
function side_om_side(a: Skitse, b: Skitse, afstand: number, bredA: number): Skitse {
  // Luften mellem figurerne vokser med figurerne, så målene ikke støder sammen.
  const xs = (a.polygoner ?? []).flatMap((p) => p.punkter.map((q) => q[0]));
  const venstre = xs.length ? Math.min(...xs) : 0;
  const hoejre = xs.length ? Math.max(...xs) : bredA;
  const xb = (b.polygoner ?? []).flatMap((p) => p.punkter.map((q) => q[0]));
  const bVenstre = xb.length ? Math.min(...xb) : 0;
  const luft = Math.max(afstand, 0.35 * (hoejre - venstre) + 1.2);
  const flyt = (p: P): P => [p[0] - bVenstre + hoejre + luft, p[1]];
  return {
    slags: "skitse",
    polygoner: [...(a.polygoner ?? []), ...(b.polygoner ?? []).map((p) => ({ ...p, punkter: p.punkter.map(flyt) }))],
    linjer: [...(a.linjer ?? []), ...(b.linjer ?? []).map((l) => ({ ...l, fra: flyt(l.fra), til: flyt(l.til) }))],
    vinkler: [...(a.vinkler ?? []), ...(b.vinkler ?? []).map((v) => ({ ...v, top: flyt(v.top), a: flyt(v.a), b: flyt(v.b) }))],
    maal: [...(a.maal ?? []), ...(b.maal ?? []).map((m) => ({ ...m, fra: flyt(m.fra), til: flyt(m.til) }))],
    tekster: [...(a.tekster ?? []), ...(b.tekster ?? []).map((t) => ({ ...t, ved: flyt(t.ved) }))],
    skitse: true,
  };
}

/** Trekant med mål på siderne (mod uret: side i går fra hjørne i til i + 1). */
function trekant(pkt: P[], tekster: (string | null)[], farve: "terra" | "blaa"): Skitse {
  return {
    slags: "skitse",
    polygoner: [{ punkter: pkt, farve }],
    maal: tekster
      .map((t, i) => (t ? { fra: pkt[i], til: pkt[(i + 1) % 3], tekst: t, side: -1 as const } : null))
      .filter((m): m is NonNullable<typeof m> => m !== null),
  };
}

/** Ingen vinkel under 28° eller over 140° — så figuren er let at aflæse. */
function paen(pkt: P[]): boolean {
  return pkt.every((q, i) => {
    const v = vinkel(q, pkt[(i + pkt.length - 1) % pkt.length], pkt[(i + 1) % pkt.length]);
    return v > 28 && v < 140;
  });
}

/** En tilfældig, pæn trekant: vinkler, så siderne bliver tydeligt forskellige. */
function grundtrekant(rng: Rng): P[] {
  for (;;) {
    const A = heltal(rng, 35, 75);
    const B = heltal(rng, 35, 75);
    if (180 - A - B < 35) continue;
    const p = polygonFraVinkler([A, B, 180 - A - B], [1]);
    if (p) return p;
  }
}

// ================================================================= bronze

/** Forstørrelse: alle sider ganges med k. Somme tider går man den anden vej: fra stor til lille. */
function forstoerrelse(rng: Rng, niveau: NiveauId): Opgave {
  const k = niveau === "bronze" ? heltal(rng, 2, 5) : vaelg(rng, [1.5, 2, 2.5, 3, 4]);
  let a = 0;
  let b = 0;
  do {
    a = heltal(rng, 2, 7);
    b = heltal(rng, 2, 9);
  } while (a === b || !Number.isInteger(a * k * 2) || !Number.isInteger(b * k * 2) || (niveau === "bronze" && !Number.isInteger(b * k)));
  const formindsk = rng() < 0.35;
  const lille: P[] = [[0, 0], [b, 0], [b, a], [0, a]];
  const stor: P[] = lille.map((p) => gange(p, k));
  const maal = (pkt: P[], bund: string, hoejre: string) => [
    { fra: pkt[0], til: pkt[1], tekst: bund, side: -1 as const },
    { fra: pkt[1], til: pkt[2], tekst: hoejre, side: -1 as const },
  ];
  const sk = side_om_side(
    { slags: "skitse", polygoner: [{ punkter: lille, farve: "terra" }], maal: maal(lille, formindsk ? "x" : cm(b), cm(a)) },
    { slags: "skitse", polygoner: [{ punkter: stor, farve: "blaa" }], maal: maal(stor, formindsk ? cm(b * k) : "x", cm(a * k)) },
    1.2,
    b,
  );
  return talOpgave({
    noegle: `lig:skala:${formindsk ? b * k : b}:${formindsk ? a * k : a}:${formindsk ? a : a * k}`,
    optakt: "Ligedannede rektangler",
    spoergsmaal: "De to rektangler er ligedannede. Hvor lang er siden x?",
    figur: sk,
    svar: formindsk ? b : b * k,
    enhed: "cm",
    foran: "x =",
    strategi: "Find forstørrelsesfaktoren",
    hint: formindsk
      ? `Den korte side i det store rektangel er ${tal(a * k)} cm, i det lille ${tal(a)} cm — det store er ${tal(k)} gange så stort. Gå den anden vej og divider: x = ${tal(b * k)} : ${tal(k)} = ${tal(b)} cm.`
      : `Den korte side er gået fra ${tal(a)} til ${tal(a * k)} cm — det er ${tal(k)} gange så lang. Alle sider ganges med det samme: x = ${tal(b)} · ${tal(k)} = ${tal(b * k)} cm.`,
  });
}

/** "Forholdet mellem siderne er 1 : ___" (maj 25 opg. 17.1, dec 21 opg. 13.1). */
function forholdet(rng: Rng, niveau: NiveauId): Opgave {
  const k = niveau === "bronze" ? heltal(rng, 2, 5) : vaelg(rng, [1.5, 2, 2.5, 3, 4, 5]);
  const p = grundtrekant(rng);
  const s = vaelg(rng, [2, 3, 4, 5, 6]);
  const lille = p.map((q) => gange(q, s / Math.hypot(p[1][0] - p[0][0], p[1][1] - p[0][1])));
  const stor = lille.map((q) => gange(q, k));
  const bredde = Math.max(...lille.map((q) => q[0])) - Math.min(...lille.map((q) => q[0]));
  const sk = side_om_side(trekant(lille, [cm(s), null, null], "terra"), trekant(stor, [cm(s * k), null, null], "blaa"), 1, bredde);
  return talOpgave({
    noegle: `lig:forhold:${s}:${s * k}`,
    optakt: "Ligedannede trekanter",
    spoergsmaal: "Trekanterne er ligedannede. Forholdet mellem den røde og den blå trekants sider er 1 : ___. Hvilket tal mangler?",
    figur: sk,
    svar: k,
    foran: "1 :",
    strategi: "Hvor mange gange større?",
    hint: `Sammenlign to sider, der passer sammen: ${cm(s)} og ${cm(s * k)}. ${tal(s * k)} : ${s} = ${tal(k)}, så forholdet er 1 : ${tal(k)}.`,
  });
}

// ================================================================== sølv

/** Ligedannede trekanter: alle tre sider af den ene kendes, én af den anden. */
function trekantSider(rng: Rng, niveau: NiveauId): Opgave {
  const k = niveau === "guld" ? vaelg(rng, [1.5, 2.5, 3, 4]) : vaelg(rng, [1.5, 2, 2.5, 3]);
  for (;;) {
    // Tre sider (hele eller halve), der giver en pæn trekant uden meget spidse vinkler.
    const runde = [0, 1, 2].map(() => heltal(rng, 4, 12) / 2);
    if (!runde.every((x) => Number.isInteger(x * k * 2))) continue;
    const lille = trekantFraSider(runde[1], runde[2], runde[0]);
    if (!lille || !paen(lille)) continue;
    const kendt = heltal(rng, 0, 2);
    const spurgt = (kendt + heltal(rng, 1, 2)) % 3;
    const stor = lille.map((q) => gange(q, k));
    const bredde = Math.max(...lille.map((q) => q[0])) - Math.min(...lille.map((q) => q[0]));
    const sk = side_om_side(
      trekant(lille, runde.map((x) => cm(x)), "terra"),
      trekant(stor, [0, 1, 2].map((i) => (i === kendt ? cm(runde[i] * k) : i === spurgt ? "x" : null)), "blaa"),
      1,
      bredde,
    );
    return talOpgave({
      noegle: `lig:trekant:${runde.join(",")}:${k}:${kendt}:${spurgt}`,
      optakt: "Ligedannede trekanter",
      spoergsmaal: "Den røde og den blå trekant er ligedannede. Hvor lang er siden x?",
      figur: sk,
      svar: runde[spurgt] * k,
      enhed: "cm",
      foran: "x =",
      strategi: "Find faktoren ud fra et par, der passer sammen",
      hint: `Siden på ${cm(runde[kendt] * k)} passer med ${cm(runde[kendt])} i den røde: ${tal(runde[kendt] * k)} : ${tal(runde[kendt])} = ${tal(k)}. x passer med ${cm(runde[spurgt])}: x = ${tal(runde[spurgt])} · ${tal(k)} = ${tal(runde[spurgt] * k)} cm.`,
    });
  }
}

/** maj 25 opg. 16: hvilke sidelængder kan et ligedannet rektangel have? */
function hvilketRektangel(rng: Rng): Opgave {
  const [a, b] = vaelg(rng, [[20, 30], [10, 15], [12, 18], [8, 12], [6, 10], [15, 20], [12, 16], [10, 25]] as [number, number][]);
  const k = vaelg(rng, [0.5, 0.9, 1.2, 1.5, 2, 2.5, 3, 0.8, 1.1]);
  const svar = `${tal(a * k)} cm og ${tal(b * k)} cm`;
  const d = vaelg(rng, [3, 5, 6, 10]);
  const andre = [
    `${tal(a + d)} cm og ${tal(b + d)} cm`,
    `${tal(a * k + 1)} cm og ${tal(b * k - 1)} cm`,
    `${tal(a / 2)} cm og ${tal(b * 2)} cm`,
    `${tal(a * k - 4)} cm og ${tal(b * k - 4)} cm`,
    `${tal(a + d * 2)} cm og ${tal(b + d)} cm`,
  ].filter((v) => {
    const [x, y] = v.match(/[\d,]+/g)!.map((t) => Number(t.replace(",", ".")));
    return x > 0 && y > 0 && Math.abs(x / y - a / b) > 1e-9;
  });
  return valgOpgave(
    {
      noegle: `lig:rekt:${a}:${b}:${k}`,
      optakt: "Sæt X",
      spoergsmaal: `Et rektangel er ${a} cm × ${b} cm. Hvilke sidelængder kan et ligedannet rektangel have?`,
      figur: {
        slags: "skitse",
        polygoner: [{ punkter: [[0, 0], [b, 0], [b, a], [0, a]], farve: "blaa", fyld: false }],
        maal: [
          { fra: [0, 0], til: [b, 0], tekst: cm(b), side: -1 },
          { fra: [0, a], til: [0, 0], tekst: cm(a), side: -1 },
        ],
        skitse: true,
      },
      svar,
      andre,
      strategi: "Begge sider ganges med det samme",
      hint: `I et ligedannet rektangel er begge sider ganget med samme tal. ${tal(a * k)} : ${a} = ${tal(k)} og ${tal(b * k)} : ${b} = ${tal(k)}. At lægge det samme til begge sider giver ikke en ligedannet figur.`,
    },
    rng,
  );
}

/** Skygger (maj 26 opg. 17): personen og træet står i samme sol. */
function skygge(rng: Rng, niveau: NiveauId): Opgave {
  for (;;) {
    const p = vaelg(rng, [1.5, 1.6, 1.8, 2, 1.7, 1.4]);
    const s = vaelg(rng, [0.5, 0.8, 0.9, 1, 1.2, 1.5, 2]);
    const k = heltal(rng, 3, 8);
    const S = s * k;
    const H = p * k;
    if (niveau !== "platin" && (!Number.isInteger(H * 2) || !Number.isInteger(S * 10))) continue;
    // Tegning: jorden, en lodret streg for personen og en for træet, stiplet solstråle.
    const jord = S + s + 1.5;
    const sk: Skitse = {
      slags: "skitse",
      linjer: [
        { fra: [-0.3, 0], til: [jord, 0] },
        { fra: [s, 0], til: [s, p], farve: "terra" },
        { fra: [S + s + 0.5, 0], til: [S + s + 0.5, H], farve: "groen" },
        { fra: [0, 0], til: [s, p], stiplet: true, tynd: true },
        { fra: [s + 0.5, 0], til: [S + s + 0.5, H], stiplet: true, tynd: true },
      ],
      maal: [
        { fra: [0, 0], til: [s, 0], tekst: `${tal(s)} m`, side: -1 },
        { fra: [s + 0.5, 0], til: [S + s + 0.5, 0], tekst: `${tal(S)} m`, side: -1 },
        { fra: [s, 0], til: [s, p], tekst: `${tal(p)} m`, side: 1 },
        { fra: [S + s + 0.5, 0], til: [S + s + 0.5, H], tekst: "?", side: -1 },
      ],
      skitse: true,
    };
    return talOpgave({
      noegle: `lig:skygge:${p}:${s}:${S}`,
      optakt: "Skygger",
      spoergsmaal: `Albert er ${tal(p)} m høj, og hans skygge er ${tal(s)} m. Træets skygge er ${tal(S)} m. Hvor højt er træet?`,
      figur: sk,
      svar: H,
      enhed: "m",
      strategi: "Skyggen og højden vokser med samme faktor",
      hint: `Solen står ens, så Albert og hans skygge er ligedannet med træet og dets skygge. Træets skygge er ${tal(S)} : ${tal(s)} = ${k} gange så lang, så træet er ${k} · ${tal(p)} = ${tal(H)} m.`,
    });
  }
}

// ================================================================== guld

/** Trekant i trekant med parallelle sider (A-figur): maj 21 opg. 13, maj 24 opg. 14. */
function aFigur(rng: Rng, niveau: NiveauId): Opgave {
  const k = niveau === "platin" ? vaelg(rng, [1.5, 2.5, 3, 4]) : heltal(rng, 2, 4);
  for (;;) {
    // Lille trekant A, B, C ud fra siderne AB, BC, CA; den store er skaleret k gange om C.
    const AB = heltal(rng, 2, 8) / 2;
    const BC = heltal(rng, 3, 8) / 2;
    const CAr = heltal(rng, 3, 8) / 2;
    const t = trekantFraSider(BC, CAr, AB);
    if (!t || !paen(t)) continue;
    const [A, B, C] = t;
    const D = paa(C, A, k);
    const E = paa(C, B, k);
    const s = AB * k;
    const AD = CAr * (k - 1);
    const sporgsmaal = vaelg(rng, ["DE", "AD", "CD"] as const);
    const svar = sporgsmaal === "DE" ? s : sporgsmaal === "AD" ? AD : CAr * k;
    if (niveau !== "platin" && !Number.isInteger(svar * 2)) continue;
    const sk: Skitse = {
      slags: "skitse",
      polygoner: [
        { punkter: [C, D, E], farve: "lilla" },
        { punkter: [C, A, B], farve: "lilla" },
      ],
      // Målene står uden for den lille trekant: AB under linjen, CA ud til venstre.
      maal: [
        { fra: A, til: B, tekst: cm(AB), side: -1 },
        { fra: C, til: A, tekst: cm(CAr), side: -1 },
      ],
      tekster: [
        { ved: plus(C, [0, 0.45]), tekst: "C", kursiv: false },
        { ved: plus(A, [-0.45, 0]), tekst: "A", kursiv: false },
        { ved: plus(B, [0.45, 0]), tekst: "B", kursiv: false },
        { ved: plus(D, [-0.4, -0.3]), tekst: "D", kursiv: false },
        { ved: plus(E, [0.4, -0.3]), tekst: "E", kursiv: false },
      ],
      skitse: true,
    };
    const forhold = `1 : ${tal(k)}`;
    return talOpgave({
      noegle: `lig:A:${k}:${AB}:${CAr}:${sporgsmaal}`,
      optakt: "Trekant i trekant",
      spoergsmaal: `AB og DE er parallelle, og trekant ABC og trekant DEC er ligedannede i forholdet ${forhold}. Hvor lang er ${sporgsmaal}?`,
      figur: sk,
      svar,
      enhed: "cm",
      strategi: sporgsmaal === "AD" ? "Hele siden minus den lille" : "Gang med faktoren",
      hint:
        sporgsmaal === "DE"
          ? `DE passer med AB i den lille trekant: ${tal(AB)} · ${tal(k)} = ${tal(s)} cm.`
          : sporgsmaal === "CD"
            ? `CD passer med CA i den lille trekant: ${tal(CAr)} · ${tal(k)} = ${tal(CAr * k)} cm.`
            : `Hele siden CD er ${tal(CAr)} · ${tal(k)} = ${tal(CAr * k)} cm. AD er det stykke, der ikke hører til den lille trekant: ${tal(CAr * k)} − ${tal(CAr)} = ${tal(AD)} cm.`,
    });
  }
}

/** Arealet bliver k² gange så stort — prøvens faste spørgsmål. Rumfang k³. */
function arealFaktor(rng: Rng, niveau: NiveauId): Opgave {
  const rumfang = rng() < (niveau === "platin" ? 0.5 : 0.3);
  const k = niveau === "platin" ? vaelg(rng, [1.5, 2, 2.5, 3, 4, 5, 10]) : heltal(rng, 2, 5);
  const svar = rumfang ? k ** 3 : k ** 2;
  if (niveau !== "platin" && !Number.isInteger(svar * 2)) return arealFaktor(rng, niveau);
  if (rumfang) {
    const [l, b, h] = [heltal(rng, 2, 4), heltal(rng, 1, 3), heltal(rng, 1, 3)];
    return talOpgave({
      noegle: `lig:rumfang:${k}:${l},${b},${h}`,
      optakt: "Ligedannede kasser",
      spoergsmaal: `To kasser er ligedannede. Den lille er ${l} cm × ${b} cm × ${h} cm, og den store er ${tal(l * k)} cm × ${tal(b * k)} cm × ${tal(h * k)} cm. Hvor mange gange så stort er rumfanget af den store kasse?`,
      svar,
      enhed: "gange",
      strategi: "Tre retninger: faktoren i tredje",
      hint: `Alle mål er ${tal(k)} gange så store. Rumfanget vokser i tre retninger: ${tal(k)} · ${tal(k)} · ${tal(k)} = ${tal(svar)}. (Tjek: ${l * b * h} cm³ og ${tal(l * b * h * svar)} cm³.)`,
    });
  }
  const figur = vaelg(rng, ["trekant", "firkant"]);
  return talOpgave({
    noegle: `lig:areal:${k}:${figur}`,
    optakt: "Arealet",
    spoergsmaal: `To ${figur === "trekant" ? "trekanter" : "firkanter"} er ligedannede i længdeforholdet 1 : ${tal(k)}. Arealet af den store er ___ gange så stort som arealet af den lille. Hvilket tal mangler?`,
    svar,
    enhed: "gange",
    strategi: "To retninger: faktoren i anden",
    hint: `Både længden og bredden (grundlinjen og højden) bliver ${tal(k)} gange så store. Arealet bliver ${tal(k)} · ${tal(k)} = ${tal(svar)} gange så stort — ikke ${tal(k)}.`,
  });
}

/** dec 22 opg. 12: to træer og en person i samme solstråle. */
function toTraeer(rng: Rng): Opgave {
  for (;;) {
    const p = vaelg(rng, [1.5, 2, 1.6, 1.8]);
    const d1 = vaelg(rng, [2, 3, 4, 5]);
    const k1 = heltal(rng, 2, 3);
    const k2 = k1 + heltal(rng, 1, 4);
    const d2 = d1 * k1;
    const H1 = p * k1;
    const H2 = p * k2;
    const afst = d1 * k2 - d2;
    if (!Number.isInteger(H1 * 2) || !Number.isInteger(H2 * 2)) continue;
    const spoergAfstand = rng() < 0.5;
    const sk: Skitse = {
      slags: "skitse",
      linjer: [
        { fra: [0, 0], til: [d1 * k2 + 0.5, 0] },
        { fra: [d1, 0], til: [d1, p], farve: "terra" },
        { fra: [d2, 0], til: [d2, H1], farve: "groen" },
        { fra: [d1 * k2, 0], til: [d1 * k2, H2], farve: "groen" },
        { fra: [0, 0], til: [d1 * k2, H2], stiplet: true, tynd: true },
      ],
      maal: [
        { fra: [0, 0], til: [d1, 0], tekst: `${tal(d1)} m`, side: -1 },
        { fra: [d1, 0], til: [d2, 0], tekst: `${tal(d2 - d1)} m`, side: -1 },
        { fra: [d2, 0], til: [d1 * k2, 0], tekst: spoergAfstand ? "?" : `${tal(afst)} m`, side: -1 },
        { fra: [d1, 0], til: [d1, p], tekst: `${tal(p)} m`, side: 1 },
        { fra: [d2, 0], til: [d2, H1], tekst: spoergAfstand ? `${tal(H1)} m` : "?", side: 1 },
        { fra: [d1 * k2, 0], til: [d1 * k2, H2], tekst: `${tal(H2)} m`, side: -1 },
      ],
      skitse: true,
    };
    return talOpgave({
      noegle: `lig:traeer:${p}:${d1}:${d2}:${spoergAfstand ? `a${H2}` : "h"}`,
      optakt: "Skygger",
      spoergsmaal: spoergAfstand
        ? `Sofia er ${tal(p)} m høj. Solstrålen går lige over toppen af Sofia og de to træer. Hvor langt er der mellem de to træer?`
        : `Sofia er ${tal(p)} m høj. Solstrålen går lige over toppen af Sofia og det lille træ. Hvor højt er det lille træ?`,
      figur: sk,
      svar: spoergAfstand ? afst : H1,
      enhed: "m",
      strategi: "Højde pr. meter langs jorden",
      hint: spoergAfstand
        ? `Sofia er ${tal(p)} m høj ${tal(d1)} m fra skyggens spids. Det store træ er ${tal(H2)} m — det er ${tal(H2 / p)} gange så højt, så det står ${tal(H2 / p)} · ${tal(d1)} = ${tal(d1 * k2)} m fra spidsen. Afstanden mellem træerne er ${tal(d1 * k2)} − ${tal(d2)} = ${tal(afst)} m.`
        : `Det lille træ står ${tal(d2)} m fra skyggens spids — det er ${k1} gange så langt som Sofia. Så er træet ${k1} · ${tal(p)} = ${tal(H1)} m højt.`,
    });
  }
}

/** Ligedannede firkanter med forholdet givet (dec 25 opg. 17). Find en side i den ene eller den anden. */
function firkanter(rng: Rng, niveau: NiveauId): Opgave {
  const k = niveau === "platin" ? vaelg(rng, [1.5, 2.5, 3, 4]) : heltal(rng, 2, 4);
  for (;;) {
    const runde = [0, 1, 2, 3].map(() => heltal(rng, 4, 10) / 2);
    const lo = Math.max(Math.abs(runde[0] - runde[1]), Math.abs(runde[2] - runde[3])) + 0.6;
    const hi = Math.min(runde[0] + runde[1], runde[2] + runde[3]) - 0.6;
    if (hi <= lo) continue;
    const p = firkantFraSider(runde, lo + rng() * (hi - lo));
    if (!p || !paen(p)) continue;
    const stor = p.map((q) => gange(q, k));
    // Ét par sider er kendt i begge figurer (giver faktoren); en anden side spørges om.
    const faelles = heltal(rng, 0, 3);
    const j = (faelles + heltal(rng, 1, 3)) % 4;
    const iRoed = rng() < 0.5; // spørg i den røde (store) eller den blå (lille)
    const svar = iRoed ? runde[j] * k : runde[j];
    if (niveau !== "platin" && !Number.isInteger(svar * 2)) continue;
    const navn = iRoed ? "a" : "b";
    const bredde = Math.max(...p.map((q) => q[0])) - Math.min(...p.map((q) => q[0]));
    const side = (pkt: P[], i: number, tekst: string) => ({ fra: pkt[i], til: pkt[(i + 1) % 4], tekst, side: -1 as const });
    const lilleSk: Skitse = {
      slags: "skitse",
      polygoner: [{ punkter: p, farve: "blaa" }],
      maal: [side(p, faelles, cm(runde[faelles])), side(p, j, iRoed ? cm(runde[j]) : navn)],
    };
    const storSk: Skitse = {
      slags: "skitse",
      polygoner: [{ punkter: stor, farve: "terra" }],
      maal: [side(stor, faelles, cm(runde[faelles] * k)), side(stor, j, iRoed ? navn : cm(runde[j] * k))],
    };
    return talOpgave({
      noegle: `lig:firkant:${runde.join(",")}:${k}:${faelles}:${j}:${iRoed ? "roed" : "blaa"}`,
      optakt: "Ligedannede firkanter",
      spoergsmaal: `Den blå og den røde firkant er ligedannede. Hvor lang er siden ${navn}?`,
      figur: side_om_side(lilleSk, storSk, 1, bredde),
      svar,
      enhed: "cm",
      foran: `${navn} =`,
      strategi: "Find faktoren ud fra et par, der passer sammen",
      hint: `Siderne ${cm(runde[faelles])} og ${cm(runde[faelles] * k)} ligger samme sted i de to firkanter, så den røde er ${tal(k)} gange så stor. ${
        iRoed
          ? `a ligger samme sted som ${cm(runde[j])} i den blå: a = ${tal(runde[j])} · ${tal(k)} = ${tal(svar)} cm.`
          : `b ligger samme sted som ${cm(runde[j] * k)} i den røde. Gå den anden vej og divider: b = ${tal(runde[j] * k)} : ${tal(k)} = ${tal(svar)} cm.`
      }`,
    });
  }
}

// ================================================================= platin

function arealBaglaens(rng: Rng): Opgave {
  const k = vaelg(rng, [2, 3, 4, 5, 1.5, 2.5]);
  const A = vaelg(rng, [4, 6, 8, 10, 12, 20]);
  const spoergLaengde = rng() < 0.5;
  if (spoergLaengde) {
    return talOpgave({
      noegle: `lig:arealbag:${k ** 2}`,
      optakt: "Baglæns",
      spoergsmaal: `To figurer er ligedannede. Den store figurs areal er ${tal(k ** 2)} gange så stort som den lilles. Den lille figurs længdeforhold til den store er 1 : ___. Hvilket tal mangler?`,
      svar: k,
      foran: "1 :",
      strategi: "Arealfaktoren er længdefaktoren i anden",
      hint: `Arealet ganges med længdefaktoren i anden. Hvilket tal gange sig selv giver ${tal(k ** 2)}? ${tal(k)} · ${tal(k)} = ${tal(k ** 2)}.`,
    });
  }
  return talOpgave({
    noegle: `lig:arealstor:${A}:${k}`,
    optakt: "Arealet",
    spoergsmaal: `En trekant har arealet ${A} cm². En ligedannet trekant har ${tal(k)} gange så lange sider. Hvor stort er dens areal?`,
    svar: A * k ** 2,
    enhed: "cm²",
    strategi: "Gang med faktoren i anden",
    hint: `Arealet bliver ${tal(k)}² = ${tal(k ** 2)} gange så stort: ${A} · ${tal(k ** 2)} = ${tal(A * k ** 2)} cm².`,
  });
}

function maalestok(rng: Rng): Opgave {
  const M = vaelg(rng, [10000, 20000, 25000, 50000, 100000]);
  const kort = vaelg(rng, [2, 3, 4, 5, 6, 8, 10, 12]);
  const km = (kort * M) / 100000;
  return talOpgave({
    noegle: `lig:maalestok:${M}:${kort}`,
    optakt: "Målestok",
    spoergsmaal: `Et kort har målestokken 1 : ${tusind(M)}. To byer ligger ${kort} cm fra hinanden på kortet. Hvor langt er der i virkeligheden?`,
    svar: km,
    enhed: "km",
    strategi: "Gang op, og skift enhed",
    hint: `1 cm på kortet er ${tusind(M)} cm i virkeligheden. ${kort} cm er ${tusind(kort * M)} cm. 1 km = 100.000 cm, så det er ${tal(km)} km.`,
  });
}

/** Hvilken trekant er ligedannet med den røde? (maj 22 opg. 12) */
function hvilkenTrekant(rng: Rng): Opgave {
  const base = vaelg(rng, [[4, 6, 7], [5, 7, 8], [3, 5, 6], [4, 5, 8], [6, 7, 9], [2, 3, 4]] as [number, number, number][]);
  const k = vaelg(rng, [1.5, 2, 2.5, 0.5, 3]);
  const svar = base.map((x) => tal(x * k)).join(" – ");
  const fejl = [
    base.map((x) => tal(x + 2)).join(" – "),
    [base[0] * k, base[1] * k + 1, base[2] * k].map(tal).join(" – "),
    [base[0] * k, base[1] * k, base[2] * k - 1].map(tal).join(" – "),
    base.map((x, i) => tal(i === 0 ? x * k : x * k * 1.25)).join(" – "),
  ];
  return valgOpgave(
    {
      noegle: `lig:hvilken:${base.join(",")}:${k}`,
      optakt: "Sæt X",
      spoergsmaal: `Den røde trekant har siderne ${base.join(" cm, ")} cm. Hvilken trekant er ligedannet med den? (Siderne i cm.)`,
      svar,
      andre: fejl,
      antal: 4,
      strategi: "Samme faktor på alle tre sider",
      hint: `Del hver side med den tilsvarende side i den røde. I en ligedannet trekant giver det samme tal alle tre gange: ${base.map((x) => `${tal(x * k)} : ${x}`).join(", ")} = ${tal(k)}.`,
    },
    rng,
  );
}

// ================================================================== samlet

export function lavLigedannethed(rng: Rng, niveau: NiveauId): Opgave {
  const r = rng();
  if (niveau === "bronze") {
    if (r < 0.6) return forstoerrelse(rng, niveau);
    return forholdet(rng, niveau);
  }
  if (niveau === "soelv") {
    if (r < 0.3) return trekantSider(rng, niveau);
    if (r < 0.5) return hvilketRektangel(rng);
    if (r < 0.7) return skygge(rng, niveau);
    if (r < 0.85) return forstoerrelse(rng, niveau);
    return forholdet(rng, niveau);
  }
  if (niveau === "guld") {
    if (r < 0.25) return aFigur(rng, niveau);
    if (r < 0.45) return arealFaktor(rng, niveau);
    if (r < 0.6) return toTraeer(rng);
    if (r < 0.8) return firkanter(rng, niveau);
    return trekantSider(rng, niveau);
  }
  if (r < 0.2) return arealBaglaens(rng);
  if (r < 0.35) return maalestok(rng);
  if (r < 0.5) return hvilkenTrekant(rng);
  if (r < 0.65) return aFigur(rng, niveau);
  if (r < 0.8) return arealFaktor(rng, niveau);
  return firkanter(rng, niveau);
}

