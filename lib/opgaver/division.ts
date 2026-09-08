import type { Opgave, NiveauId } from "../typer";
import { heltal, vaelg, type Rng } from "../tilfaeldig";

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
