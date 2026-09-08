import type { Opgave, NiveauId } from "../typer";
import { heltal, vaelg, type Rng } from "../tilfaeldig";

/**
 * Addition efter mønsteret i FP9 Opgave 5.1.
 * Den ene addend ligger altid tæt på et rundt tal, eller de to tal danner
 * tilsammen et rundt tal. Opstilling med mente skal være den langsomme vej.
 */

function opgave(a: number, b: number, strategi: string, hint: string): Opgave {
  return {
    noegle: `add:${a}+${b}`,
    slags: "tal",
    spoergsmaal: `${a} + ${b}`,
    svar: String(a + b),
    strategi,
    hint,
  };
}

/** Runder b op til nærmeste hele hundrede/tusinde og fortæller hvor meget der blev lagt for meget til. */
function kompensationHint(b: number, rundt: number): string {
  const diff = rundt - b;
  return `${b} er ${rundt} − ${diff}. Læg ${rundt} til, og træk så ${diff} fra igen.`;
}

function parHint(a: number, b: number): string {
  const sum = a + b;
  return `Kig på enderne: ${a % 1000 || a} og ${b} giver tilsammen det runde tal ${sum}.`;
}

export function lavAddition(rng: Rng, niveau: NiveauId): Opgave {
  if (niveau === "bronze") {
    switch (heltal(rng, 1, 4)) {
      case 1: {
        const a = heltal(rng, 23, 89);
        const rundt = 100;
        const b = rundt - heltal(rng, 1, 4);
        return opgave(a, b, "Rund op, og træk tilbage", kompensationHint(b, rundt));
      }
      case 2: {
        const a = heltal(rng, 120, 480);
        const rundt = 100 * heltal(rng, 1, 4);
        const b = rundt - heltal(rng, 1, 3);
        return opgave(a, b, "Rund op, og træk tilbage", kompensationHint(b, rundt));
      }
      case 3: {
        const a = heltal(rng, 111, 489);
        const rest = 100 - (a % 100);
        const b = 100 * heltal(rng, 0, 3) + rest;
        return opgave(a, b, "Find hundredeparret", parHint(a, b));
      }
      default: {
        const a = 100 * heltal(rng, 2, 6) - heltal(rng, 1, 3);
        const b = 100 * heltal(rng, 1, 4) - heltal(rng, 1, 3);
        return opgave(
          a,
          b,
          "Rund begge op",
          `Begge tal ligger lige under et hundrede. Læg de runde tal sammen, og træk det for meget fra bagefter.`,
        );
      }
    }
  }

  if (niveau === "soelv") {
    switch (heltal(rng, 1, 3)) {
      case 1: {
        const a = heltal(rng, 310, 890);
        const rundt = 1000 * heltal(rng, 1, 3);
        const b = rundt - heltal(rng, 1, 4);
        return opgave(a, b, "Rund op, og træk tilbage", kompensationHint(b, rundt));
      }
      case 2: {
        const a = heltal(rng, 1200, 4800);
        const rundt = 100 * heltal(rng, 3, 9);
        const b = rundt - heltal(rng, 1, 3);
        return opgave(a, b, "Rund op, og træk tilbage", kompensationHint(b, rundt));
      }
      default: {
        const a = heltal(rng, 1150, 4850);
        const rest = 1000 - (a % 1000);
        const b = 1000 * heltal(rng, 0, 2) + rest;
        return opgave(a, b, "Find tusindeparret", parHint(a, b));
      }
    }
  }

  switch (heltal(rng, 1, 4)) {
    case 1: {
      const a = 1000 * heltal(rng, 1, 4) - heltal(rng, 1, 4);
      const b = 1000 * heltal(rng, 1, 3) - heltal(rng, 1, 4);
      return opgave(
        a,
        b,
        "Rund begge op",
        `Begge tal ligger lige under et tusinde. Læg de runde tal sammen, og træk så det for meget fra.`,
      );
    }
    case 2: {
      const a = heltal(rng, 1205, 4895);
      const rundt = 1000 * heltal(rng, 1, 3);
      const b = rundt - heltal(rng, 1, 9);
      return opgave(a, b, "Rund op, og træk tilbage", kompensationHint(b, rundt));
    }
    case 3: {
      const a = heltal(rng, 1150, 4850);
      const rest = 1000 - (a % 1000);
      const b = 1000 * heltal(rng, 0, 3) + rest;
      return opgave(a, b, "Find tusindeparret", parHint(a, b));
    }
    default: {
      const grund = 1000 * heltal(rng, 2, 5);
      const flyt = heltal(rng, 1, 4);
      const a = grund - flyt;
      const b = 1000 * heltal(rng, 1, 3) + flyt;
      return opgave(
        a,
        b,
        "Flyt imellem tallene",
        `Flyt ${flyt} fra ${b} over til ${a}. Så bliver det ${grund} + ${b - flyt}, og summen er den samme.`,
      );
    }
  }
}
