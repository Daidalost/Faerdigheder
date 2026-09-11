import type { Opgave, NiveauId } from "../typer";
import { bland, dansk, heltal, vaelg, type Rng } from "../tilfaeldig";

/**
 * Sammenhængen mellem brøk, decimaltal og procent.
 *
 * Formatet er taget direkte fra prøvesættene: "Skriv 60 % som en brøk"
 * (dec 2021), "Skriv 6 % som decimaltal" (dec 2020), "Hvilken brøk har samme
 * værdi som 1,5?" (dec 2025), "7 ud af 10 → procentdel" (dec 2025).
 *
 * Brøker skrives som "3/5" i teksten og sættes med brøkstreg ved visning.
 */

type Broek = { t: number; n: number };

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

function forkort({ t, n }: Broek): Broek {
  const d = gcd(t, n);
  return { t: t / d, n: n / d };
}

const skriv = (b: Broek) => `${b.t}/${b.n}`;

/** Procent -> forkortet brøk. */
function procentSomBroek(p: number): Broek {
  return forkort({ t: Math.round(p * 10), n: 1000 });
}

/** Brøker der ligner prøvesættenes: pæne nævnere og korte decimaltal. */
const BRONZE_PROCENTER = [5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90];
const SOELV_PROCENTER = [4, 6, 8, 12, 16, 18, 22, 24, 28, 32, 35, 36, 44, 45, 52, 55, 64, 65, 68, 72, 85, 88, 95];
const GULD_PROCENTER = [1, 2, 3, 7, 9, 11, 13, 14, 17, 19, 21, 23, 26, 29, 31, 33, 37, 39, 41, 43, 46, 47, 53, 57, 59, 61, 63, 67, 71, 73, 77, 79, 83, 87, 89, 91, 93, 96, 97, 98];
const PLATIN_PROCENTER = [
  2.5, 7.5, 12.5, 17.5, 22.5, 27.5, 37.5, 42.5, 47.5, 57.5, 62.5, 72.5, 87.5, 92.5,
  105, 108, 112, 115, 120, 125, 135, 140, 150, 160, 175, 180, 200, 225, 240, 250,
];

function brug(
  noegle: string,
  spoergsmaal: string,
  svar: string,
  strategi: string,
  hint: string,
  enhed?: string,
): Opgave {
  return { noegle, slags: "tal", optakt: "Skriv om", spoergsmaal, svar, strategi, hint, enhed };
}

/** Flervalg, når svaret er en brøk — den kan ikke tastes entydigt. */
function valgopgave(
  noegle: string,
  spoergsmaal: string,
  svar: string,
  afledere: string[],
  strategi: string,
  hint: string,
  rng: Rng,
): Opgave {
  return {
    noegle,
    slags: "valg",
    optakt: "Skriv om",
    spoergsmaal,
    svar,
    valg: bland(rng, [svar, ...afledere]),
    strategi,
    hint,
  };
}

function procenterFor(niveau: NiveauId): number[] {
  if (niveau === "bronze") return BRONZE_PROCENTER;
  if (niveau === "soelv") return SOELV_PROCENTER;
  if (niveau === "guld") return GULD_PROCENTER;
  return PLATIN_PROCENTER;
}

export function lavSkrivemaader(rng: Rng, niveau: NiveauId): Opgave {
  const procenter = procenterFor(niveau);
  const p = vaelg(rng, procenter);
  const decimal = p / 100;

  switch (heltal(rng, 1, 5)) {
    // ---- procent -> decimaltal ------------------------------------------
    case 1:
      return brug(
        `skr:p2d:${p}`,
        `${dansk(p, 3)} % som decimaltal`,
        dansk(decimal, 5),
        "Procent betyder hundrededele",
        `${dansk(p, 3)} % betyder ${dansk(p, 3)} ud af 100. Divider med 100 — altså ryk kommaet to pladser til venstre.`,
      );

    // ---- decimaltal -> procent ------------------------------------------
    case 2:
      return brug(
        `skr:d2p:${p}`,
        `${dansk(decimal, 5)} som procent`,
        dansk(p, 3),
        "Gang med 100",
        `Den anden vej ganger du med 100: ryk kommaet to pladser til højre. ${dansk(decimal, 5)} bliver til ${dansk(p, 3)} %.`,
        "%",
      );

    // ---- procent -> brøk (flervalg) -------------------------------------
    case 3: {
      const b = procentSomBroek(p);
      const forkerte = [
        skriv(forkort({ t: Math.round(p * 10), n: 10000 })),
        skriv({ t: Math.round(p), n: 10 }),
        skriv(forkort({ t: 100, n: Math.max(2, Math.round(p)) })),
      ].filter((x) => x !== skriv(b));
      return valgopgave(
        `skr:p2b:${p}`,
        `${dansk(p, 3)} % som brøk`,
        skriv(b),
        [...new Set(forkerte)].slice(0, 3),
        "Sæt over 100, og forkort",
        `${dansk(p, 3)} % er ${dansk(p, 3)}/100. Forkort brøken, til den ikke kan forkortes mere: ${skriv(b)}.`,
        rng,
      );
    }

    // ---- brøk -> procent -------------------------------------------------
    case 4: {
      const b = procentSomBroek(p);
      return brug(
        `skr:b2p:${p}`,
        `${skriv(b)} som procent`,
        dansk(p, 3),
        "Forlæng op til hundrededele",
        `Gang både tæller og nævner, så nævneren bliver 100: ${skriv(b)} bliver til ${dansk(p, 3)}/100, altså ${dansk(p, 3)} %.`,
        "%",
      );
    }

    // ---- "n ud af m" -> procent ------------------------------------------
    default: {
      const nævnere =
        niveau === "bronze"
          ? [4, 5, 10, 20, 25, 50]
          : niveau === "soelv"
            ? [8, 16, 20, 25, 40, 50, 200]
            : niveau === "guld"
              ? [8, 16, 40, 80, 200]
              : [16, 32, 64, 125, 160, 400, 800];
      const n = vaelg(rng, nævnere);
      const t = heltal(rng, 1, n - 1);
      const procentdel = (t / n) * 100;
      // Kun pæne svar — prøvesættene bruger aldrig krumme procenttal her
      if (!Number.isInteger(procentdel * 10)) return lavSkrivemaader(rng, niveau);
      return brug(
        `skr:udaf:${t}:${n}`,
        `${t} ud af ${n} er`,
        dansk(procentdel, 3),
        "Lav det om til hundrededele",
        `${t} ud af ${n} er brøken ${t}/${n}. Gang op, så nævneren bliver 100 — eller regn ${t} : ${n} og gang med 100.`,
        "%",
      );
    }
  }
}
