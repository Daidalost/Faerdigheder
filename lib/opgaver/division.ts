import type { Opgave, NiveauId } from "../typer";
import { dansk, heltal, vaelg, type Rng } from "../tilfaeldig";

/**
 * Division efter mønsteret i FP9 Opgave 5.4.
 * To designtræk fra prøvesættene er bevaret med vilje:
 *  - divisor er altid ét ciffer
 *  - facit har næsten altid et nul inde i tallet, så "glemt nul" bliver fanget
 * Kvotienten vælges først, og dividenden regnes derefter, så stykket altid går op.
 */

function opgave(dividend: number, divisor: number, strategi: string, hint: string): Opgave {
  return {
    noegle: `div:${dividend}/${divisor}`,
    slags: "tal",
    spoergsmaal: `${dividend} : ${divisor}`,
    svar: String(dividend / divisor),
    strategi,
    hint,
  };
}

/** Deler dividenden i en rund del og en rest, som begge går op i divisoren. */
function opdelHint(dividend: number, divisor: number): string {
  const kvotient = dividend / divisor;
  const stoerrelse = Math.pow(10, String(Math.trunc(kvotient)).length - 1);
  const rundKvotient = Math.floor(kvotient / stoerrelse) * stoerrelse;
  const rundDel = rundKvotient * divisor;
  const rest = dividend - rundDel;
  return `Del tallet op: ${rundDel} : ${divisor} = ${rundKvotient}, og ${rest} : ${divisor} = ${rest / divisor}. Læg de to sammen.`;
}

function halveringsHint(dividend: number, gange: number): string {
  const trin: number[] = [];
  let n = dividend;
  for (let i = 0; i < gange; i++) {
    n = n / 2;
    trin.push(n);
  }
  return `At dividere med ${Math.pow(2, gange)} er at halvere ${gange} gange: ${trin.join(" → ")}.`;
}

export function lavDivision(rng: Rng, niveau: NiveauId): Opgave {
  // Platin: seks cifre, tocifrede divisorer, og division med et tal under 1.
  if (niveau === "platin") {
    switch (heltal(rng, 1, 3)) {
      case 1: {
        const n = 4 * heltal(rng, 3, 60);
        const d = vaelg(rng, [0.5, 0.25]);
        return {
          noegle: `div:${n}/${d}`,
          slags: "tal",
          spoergsmaal: `${n} : ${dansk(d, 2)}`,
          svar: dansk(n / d, 3),
          strategi: "Divider med under 1",
          hint: `Du dividerer med et tal under 1, så svaret bliver STØRRE end ${n}. At dividere med ${dansk(d, 2)} er det samme som at gange med ${d === 0.5 ? 2 : 4}.`,
        };
      }
      case 2: {
        const divisor = vaelg(rng, [11, 12, 15, 25]);
        const kvotient = 100 * heltal(rng, 1, 9) + heltal(rng, 1, 9);
        const dividend = kvotient * divisor;
        return opgave(
          dividend,
          divisor,
          "Del tallet op",
          `Divisoren har to cifre, men tallet kan stadig skæres op: ${dividend} : ${divisor}. Prøv med ${divisor} · 100 = ${divisor * 100} — hvor mange hundreder er der plads til?`,
        );
      }
      default: {
        const divisor = vaelg(rng, [3, 4, 6, 7, 8, 9]);
        const kvotient = 10000 * heltal(rng, 1, 9) + heltal(rng, 1, 99);
        const dividend = kvotient * divisor;
        return opgave(dividend, divisor, "Del tallet op", opdelHint(dividend, divisor));
      }
    }
  }

  if (niveau === "bronze") {
    if (heltal(rng, 1, 2) === 1) {
      const divisor = vaelg(rng, [2, 3, 4]);
      // Kvotient med nul på tierpladsen, fx 207
      const kvotient = 100 * heltal(rng, 1, 9) + heltal(rng, 1, 9);
      const dividend = kvotient * divisor;
      return opgave(dividend, divisor, "Del tallet op", opdelHint(dividend, divisor));
    }
    const divisor = vaelg(rng, [2, 4, 5]);
    const kvotient = 10 * heltal(rng, 11, 89);
    const dividend = kvotient * divisor;
    if (divisor === 5) {
      return opgave(
        dividend,
        5,
        "Divider med 10, og fordobl",
        `5 er 10 : 2. Regn ${dividend} : 10 = ${dividend / 10}, og fordobl: ${kvotient}.`,
      );
    }
    return opgave(
      dividend,
      divisor,
      "Halvér i stedet",
      halveringsHint(dividend, divisor === 2 ? 1 : 2),
    );
  }

  if (niveau === "soelv") {
    if (heltal(rng, 1, 3) === 1) {
      const dividend = heltal(rng, 101, 499) * 8;
      return opgave(dividend, 8, "Halvér i stedet", halveringsHint(dividend, 3));
    }
    const divisor = vaelg(rng, [6, 7, 8, 9]);
    const kvotient = 100 * heltal(rng, 1, 9) + heltal(rng, 1, 9);
    const dividend = kvotient * divisor;
    return opgave(dividend, divisor, "Del tallet op", opdelHint(dividend, divisor));
  }

  switch (heltal(rng, 1, 3)) {
    case 1: {
      // Fircifret kvotient med nul på hundredepladsen, fx 5010
      const divisor = vaelg(rng, [3, 4, 6, 7, 8, 9]);
      const kvotient = 1000 * heltal(rng, 1, 9) + heltal(rng, 1, 99);
      const dividend = kvotient * divisor;
      return opgave(dividend, divisor, "Del tallet op", opdelHint(dividend, divisor));
    }
    case 2: {
      // Kvotient med to nuller i midten, fx 5009
      const divisor = vaelg(rng, [3, 4, 6, 7, 9]);
      const kvotient = 1000 * heltal(rng, 1, 9) + heltal(rng, 1, 9);
      const dividend = kvotient * divisor;
      return opgave(
        dividend,
        divisor,
        "Pas på nullerne",
        `${opdelHint(dividend, divisor)} Læg mærke til, at facit har nuller inde i midten.`,
      );
    }
    default: {
      const dividend = heltal(rng, 101, 999) * 8;
      return opgave(dividend, 8, "Halvér i stedet", halveringsHint(dividend, 3));
    }
  }
}
