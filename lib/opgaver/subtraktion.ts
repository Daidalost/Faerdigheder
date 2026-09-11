import type { Opgave, NiveauId } from "../typer";
import { heltal, type Rng } from "../tilfaeldig";

/**
 * Subtraktion efter mønsteret i FP9 Opgave 5.2.
 * Enten ligger det tal, der trækkes fra, lige under et rundt tal, eller
 * de to tal ligger så tæt, at det er hurtigere at tælle op end at trække fra.
 */

function opgave(a: number, b: number, strategi: string, hint: string): Opgave {
  return {
    noegle: `sub:${a}-${b}`,
    slags: "tal",
    spoergsmaal: `${a} − ${b}`,
    svar: String(a - b),
    strategi,
    hint,
  };
}

function rundOpHint(b: number, rundt: number): string {
  const diff = rundt - b;
  return `${b} er ${rundt} − ${diff}. Træk ${rundt} fra, og læg så ${diff} til igen.`;
}

function taelOpHint(a: number, b: number): string {
  return `${a} og ${b} ligger tæt på hinanden. Tæl op fra ${b} til ${a} i stedet for at trække fra.`;
}

export function lavSubtraktion(rng: Rng, niveau: NiveauId): Opgave {
  // Platin: fem cifre, og differenser der kræver et kig før man regner.
  if (niveau === "platin") {
    switch (heltal(rng, 1, 3)) {
      case 1: {
        const rundt = 10000 * heltal(rng, 1, 5);
        const b = rundt - heltal(rng, 1, 8);
        const a = b + heltal(rng, 3000, 30000);
        return opgave(a, b, "Rund op, og læg tilbage", rundOpHint(b, rundt));
      }
      case 2: {
        const a = heltal(rng, 20002, 90008);
        const b = a - heltal(rng, 8, 45);
        return opgave(a, b, "Tæl op i stedet", taelOpHint(a, b));
      }
      default: {
        const a = 10000 * heltal(rng, 3, 9);
        const b = heltal(rng, 2103, 9897);
        return opgave(
          a,
          b,
          "Tæl op til det runde tal",
          `Tæl op fra ${b}: først til ${Math.ceil(b / 1000) * 1000}, og derfra videre til ${a}. To spring i stedet for en lang opstilling.`,
        );
      }
    }
  }

  if (niveau === "bronze") {
    switch (heltal(rng, 1, 3)) {
      case 1: {
        const rundt = 10 * heltal(rng, 2, 5);
        const b = rundt - heltal(rng, 1, 4);
        const a = heltal(rng, 62, 148);
        return opgave(a, b, "Rund op, og læg tilbage", rundOpHint(b, rundt));
      }
      case 2: {
        const a = heltal(rng, 62, 140);
        const b = a - heltal(rng, 3, 9);
        return opgave(a, b, "Tæl op i stedet", taelOpHint(a, b));
      }
      default: {
        const a = 100 * heltal(rng, 1, 5);
        const b = heltal(rng, 21, 89);
        return opgave(
          a,
          b,
          "Træk i to spring",
          `Del det op: træk først ${Math.floor(b / 10) * 10} fra, og så de sidste ${b % 10}.`,
        );
      }
    }
  }

  if (niveau === "soelv") {
    switch (heltal(rng, 1, 3)) {
      case 1: {
        const rundt = 100 * heltal(rng, 1, 3);
        const b = rundt - heltal(rng, 1, 4);
        const a = heltal(rng, 420, 1400);
        return opgave(a, b, "Rund op, og læg tilbage", rundOpHint(b, rundt));
      }
      case 2: {
        const a = heltal(rng, 600, 1500);
        const b = a - heltal(rng, 6, 40);
        return opgave(a, b, "Tæl op i stedet", taelOpHint(a, b));
      }
      default: {
        const b = 100 * heltal(rng, 6, 9) + 10 * heltal(rng, 1, 9) + heltal(rng, 7, 9);
        const a = b + heltal(rng, 300, 900);
        const flyt = 10 - (b % 10);
        return opgave(
          a,
          b,
          "Flyt begge tal",
          `Læg ${flyt} til begge tal: ${a + flyt} − ${b + flyt}. Forskellen er den samme, men regnestykket er nemmere.`,
        );
      }
    }
  }

  switch (heltal(rng, 1, 4)) {
    case 1: {
      const rundt = 1000 * heltal(rng, 1, 3);
      const b = rundt - heltal(rng, 1, 5);
      const a = b + heltal(rng, 400, 3000);
      return opgave(a, b, "Rund op, og læg tilbage", rundOpHint(b, rundt));
    }
    case 2: {
      const a = heltal(rng, 1002, 9008);
      const b = a - heltal(rng, 7, 29);
      return opgave(a, b, "Tæl op i stedet", taelOpHint(a, b));
    }
    case 3: {
      const enere = heltal(rng, 1, 9);
      const b = 100 * heltal(rng, 2, 6) + enere;
      const a = 1000 * heltal(rng, 2, 6) + 10 * heltal(rng, 0, 9) + enere;
      return opgave(
        a,
        b,
        "Træk i to spring",
        `Enerne er ens i begge tal, så de går ud. Træk ${b - enere} fra, og du er der næsten.`,
      );
    }
    default: {
      const b = 100 * heltal(rng, 7, 9) + 10 * heltal(rng, 1, 9) + heltal(rng, 7, 9);
      const a = b + heltal(rng, 400, 2000);
      const flyt = 10 - (b % 10);
      return opgave(
        a,
        b,
        "Flyt begge tal",
        `Læg ${flyt} til begge tal: ${a + flyt} − ${b + flyt}. Forskellen ændrer sig ikke.`,
      );
    }
  }
}
