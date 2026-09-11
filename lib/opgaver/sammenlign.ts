import type { Opgave, NiveauId } from "../typer";
import { bland, dansk, heltal, vaelg, type Rng } from "../tilfaeldig";

/**
 * Sammenligning af brøker, decimaltal og procent.
 *
 * Formaterne kommer fra prøvesættene: "Hvilken brøk er større end 1?"
 * (dec 2024), "Hvilken brøk er større end 1/4 og mindre end 1/2?" (dec 2024),
 * "Hvilken brøk har størst værdi?" (maj 2025), "Hvilket regneudtryk har en
 * værdi, der er mindre end 0?" (maj 2025).
 */

type Broek = { t: number; n: number };

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
const forkort = ({ t, n }: Broek): Broek => {
  const d = gcd(t, n);
  return { t: t / d, n: n / d };
};
const skriv = (b: Broek) => `${b.t}/${b.n}`;
const vaerdi = (b: Broek) => b.t / b.n;

const NAEVNERE: Record<NiveauId, number[]> = {
  bronze: [2, 4, 5, 10],
  soelv: [3, 4, 5, 6, 8, 10],
  guld: [3, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 18, 20],
  platin: [6, 7, 8, 9, 11, 12, 14, 16, 20],
};

function tilfaeldigBroek(rng: Rng, niveau: NiveauId, over1 = false): Broek {
  const n = vaelg(rng, NAEVNERE[niveau]);
  const t = over1 ? heltal(rng, n + 1, n * 2) : heltal(rng, 1, n - 1);
  return { t, n };
}

function flervalg(
  noegle: string,
  optakt: string,
  spoergsmaal: string,
  svar: string,
  andre: string[],
  strategi: string,
  hint: string,
  rng: Rng,
): Opgave {
  return {
    noegle,
    slags: "valg",
    optakt,
    spoergsmaal,
    svar,
    valg: bland(rng, [svar, ...andre]),
    strategi,
    hint,
  };
}

/** Fire forskellige brøker, hvor præcis én er størst. */
function fireBroeker(rng: Rng, niveau: NiveauId): Broek[] {
  const ud: Broek[] = [];
  const set = new Set<number>();
  let forsoeg = 0;
  while (ud.length < 4 && forsoeg < 200) {
    forsoeg++;
    const b = forkort(tilfaeldigBroek(rng, niveau));
    const v = Math.round(vaerdi(b) * 1e6);
    if (set.has(v)) continue;
    set.add(v);
    ud.push(b);
  }
  return ud;
}

export function lavSammenlign(rng: Rng, niveau: NiveauId): Opgave {
  // ---------------------------------------------------------------- platin
  if (niveau === "platin") {
    if (heltal(rng, 1, 2) === 1) {
      // Regneudtryk med brøker: hvilket giver under 0 / præcis 1?
      const underNul = rng() < 0.5;
      const a = forkort(tilfaeldigBroek(rng, "guld"));
      const b = forkort(tilfaeldigBroek(rng, "guld"));
      const svar = underNul ? `${skriv(a)} − ${skriv(b)}` : `${skriv(a)} + ${skriv(a)}`;
      // Byg et sandt udtryk og tre falske
      const mindre = vaerdi(a) < vaerdi(b) ? a : b;
      const stoerre = vaerdi(a) < vaerdi(b) ? b : a;
      if (vaerdi(a) === vaerdi(b)) return lavSammenlign(rng, niveau);
      const rigtigt = underNul
        ? `${skriv(mindre)} − ${skriv(stoerre)}`
        : `${skriv(stoerre)} : ${skriv(stoerre)}`;
      const forkerte = underNul
        ? [
            `${skriv(stoerre)} − ${skriv(mindre)}`,
            `${skriv(mindre)} + ${skriv(stoerre)}`,
            `${skriv(stoerre)} · ${skriv(mindre)}`,
          ]
        : [
            `${skriv(stoerre)} + ${skriv(mindre)}`,
            `${skriv(stoerre)} − ${skriv(mindre)}`,
            `${skriv(stoerre)} · ${skriv(mindre)}`,
          ];
      return flervalg(
        `sml:udtryk:${svar}:${underNul}`,
        underNul ? "Hvilket regneudtryk har en værdi under 0?" : "Hvilket regneudtryk har værdien 1?",
        "",
        rigtigt,
        forkerte,
        underNul ? "Hvornår bliver et minus negativt?" : "Hvad giver præcis 1?",
        underNul
          ? "Et minusstykke bliver negativt, når du trækker det STØRSTE tal fra det mindste. Sammenlign de to brøker, før du regner."
          : "Et tal divideret med sig selv giver altid 1. To brøker lagt sammen giver kun 1, hvis de tilsammen er en hel.",
        rng,
      );
    }
    // Ordn tre tal i blandede skrivemåder
    const b = forkort(tilfaeldigBroek(rng, "guld"));
    const d = Math.round(vaerdi(b) * 100) / 100 + (rng() < 0.5 ? 0.07 : -0.07);
    const p = Math.round(vaerdi(b) * 100) + (rng() < 0.5 ? 12 : -12);
    if (d <= 0 || p <= 0) return lavSammenlign(rng, niveau);
    const kandidater = [
      { tekst: skriv(b), v: vaerdi(b) },
      { tekst: dansk(d, 3), v: d },
      { tekst: `${p} %`, v: p / 100 },
    ];
    const stoerst = kandidater.reduce((a, c) => (c.v > a.v ? c : a));
    if (kandidater.filter((k) => k.v === stoerst.v).length > 1) return lavSammenlign(rng, niveau);
    return flervalg(
      `sml:bland:${skriv(b)}:${d}:${p}`,
      "Hvad er størst?",
      "",
      stoerst.tekst,
      kandidater.filter((k) => k !== stoerst).map((k) => k.tekst),
      "Samme skrivemåde først",
      `Du kan ikke sammenligne en brøk, et decimaltal og en procent direkte. Lav dem alle tre om til decimaltal først: ${kandidater
        .map((k) => `${k.tekst} = ${dansk(k.v, 4)}`)
        .join(", ")}.`,
      rng,
    );
  }

  // ---------------------------------------------------------------- guld
  if (niveau === "guld") {
    if (heltal(rng, 1, 2) === 1) {
      // Hvilken brøk ligger mellem to grænser?
      const nedre = vaelg(rng, [
        { t: 1, n: 5 },
        { t: 1, n: 4 },
        { t: 3, n: 10 },
        { t: 1, n: 3 },
        { t: 2, n: 5 },
        { t: 1, n: 2 },
        { t: 3, n: 5 },
      ]);
      const oevre = vaelg(rng, [
        { t: 1, n: 2 },
        { t: 3, n: 5 },
        { t: 2, n: 3 },
        { t: 7, n: 10 },
        { t: 3, n: 4 },
        { t: 4, n: 5 },
        { t: 9, n: 10 },
      ]);
      if (vaerdi(nedre) >= vaerdi(oevre)) return lavSammenlign(rng, niveau);
      const inde: Broek[] = [];
      const ude: Broek[] = [];
      for (let i = 0; i < 400 && (inde.length < 1 || ude.length < 3); i++) {
        const b = forkort(tilfaeldigBroek(rng, "guld"));
        const v = vaerdi(b);
        if (v > vaerdi(nedre) && v < vaerdi(oevre)) {
          if (inde.length < 1 && !inde.some((x) => skriv(x) === skriv(b))) inde.push(b);
        } else if (ude.length < 3 && !ude.some((x) => skriv(x) === skriv(b))) ude.push(b);
      }
      if (inde.length < 1 || ude.length < 3) return lavSammenlign(rng, niveau);
      return flervalg(
        `sml:mellem:${skriv(nedre)}:${skriv(oevre)}:${skriv(inde[0])}`,
        `Hvilken brøk er større end ${skriv(nedre)} og mindre end ${skriv(oevre)}?`,
        "",
        skriv(inde[0]),
        ude.map(skriv),
        "Lav dem om til decimaltal",
        `${skriv(nedre)} er ${dansk(vaerdi(nedre), 4)} og ${skriv(oevre)} er ${dansk(vaerdi(oevre), 4)}. Regn hver svarmulighed om til decimaltal, og se hvilken der lander imellem.`,
        rng,
      );
    }
    // Hvilken brøk er større end 1?
    const over = forkort(tilfaeldigBroek(rng, "guld", true));
    const under = fireBroeker(rng, "guld").slice(0, 3);
    return flervalg(
      `sml:over1:${skriv(over)}`,
      "Hvilken brøk er større end 1?",
      "",
      skriv(over),
      under.map(skriv),
      "Sammenlign tæller og nævner",
      `En brøk er større end 1, når tælleren er større end nævneren. ${skriv(over)} er ${dansk(vaerdi(over), 4)}.`,
      rng,
    );
  }

  // ------------------------------------------------------- bronze og sølv
  if (heltal(rng, 1, 2) === 1) {
    const fire = fireBroeker(rng, niveau);
    if (fire.length < 4) return lavSammenlign(rng, niveau);
    const stoerst = fire.reduce((a, c) => (vaerdi(c) > vaerdi(a) ? c : a));
    return flervalg(
      `sml:stoerst:${fire.map(skriv).join(",")}`,
      "Hvilken brøk har størst værdi?",
      "",
      skriv(stoerst),
      fire.filter((b) => b !== stoerst).map(skriv),
      "Samme nævner, eller lav om til decimaltal",
      `Forlæng brøkerne til samme nævner — eller divider tæller med nævner. ${skriv(stoerst)} er ${dansk(vaerdi(stoerst), 4)}, og det er den største.`,
      rng,
    );
  }

  // Brøk over for decimaltal eller procent
  const b = forkort(tilfaeldigBroek(rng, niveau));
  const somProcent = rng() < 0.5;
  const spring = niveau === "bronze" ? vaelg(rng, [0.1, 0.15, 0.2]) : vaelg(rng, [0.04, 0.06, 0.08]);
  const opad = rng() < 0.5;
  const andenVaerdi = Math.round((vaerdi(b) + (opad ? spring : -spring)) * 100) / 100;
  if (andenVaerdi <= 0 || andenVaerdi >= 1) return lavSammenlign(rng, niveau);
  const andenTekst = somProcent ? `${dansk(andenVaerdi * 100, 3)} %` : dansk(andenVaerdi, 3);
  const stoerstTekst = vaerdi(b) > andenVaerdi ? skriv(b) : andenTekst;
  return flervalg(
    `sml:mod:${skriv(b)}:${andenVaerdi}:${somProcent}`,
    "Hvad er størst?",
    "",
    stoerstTekst,
    [vaerdi(b) > andenVaerdi ? andenTekst : skriv(b)],
    "Samme skrivemåde først",
    `Lav brøken om til decimaltal: ${skriv(b)} er ${dansk(vaerdi(b), 4)}. Så kan du sammenligne direkte med ${andenTekst}.`,
    rng,
  );
}
