import type { Opgave, NiveauId } from "../typer";
import { dansk, heltal, vaelg, type Rng } from "../tilfaeldig";

/**
 * Multiplikation efter mønsteret i FP9 Opgave 5.3.
 * Fem tilbagevendende design: 11-tabellen, opdeling af den ene faktor,
 * kompensation op til et rundt tal, halvering/fordobling, og ombytning
 * så to faktorer giver 100 eller 1000.
 */

function opgave(faktorer: number[], strategi: string, hint: string): Opgave {
  const svar = faktorer.reduce((a, b) => a * b, 1);
  return {
    noegle: `mul:${faktorer.join("*")}`,
    slags: "tal",
    spoergsmaal: faktorer.join(" · "),
    svar: String(svar),
    strategi,
    hint,
  };
}

const elleveHint = (n: number) =>
  `Gange med 11: gang med 10, og læg tallet til én gang mere. ${n} · 10 = ${n * 10}, plus ${n}.`;

function opdelHint(a: number, b: number, trin: number): string {
  const store = Math.floor(b / trin) * trin;
  const rest = b - store;
  return `Del ${b} op i ${store} og ${rest}: ${a} · ${store} = ${a * store}, og ${a} · ${rest} = ${a * rest}. Læg de to sammen.`;
}

function kompensationHint(a: number, b: number, rundt: number): string {
  const diff = rundt - b;
  return `${b} er ${rundt} − ${diff}. Regn ${a} · ${rundt} = ${a * rundt}, og træk så ${a} · ${diff} = ${a * diff} fra.`;
}

function femogtyveHint(n: number): string {
  return `25 er 100 : 4. Regn ${n} · 100 = ${n * 100}, og divider med 4.`;
}

export function lavMultiplikation(rng: Rng, niveau: NiveauId): Opgave {
  // Platin: halvering og fordobling, decimalfaktorer, og kompensation i to cifre.
  if (niveau === "platin") {
    switch (heltal(rng, 1, 4)) {
      case 1: {
        // Halvér den ene, fordobl den anden — indtil det ene tal bliver rundt
        const a = vaelg(rng, [15, 25, 35, 45, 55, 65]);
        const b = 4 * heltal(rng, 3, 24);
        return opgave(
          [a, b],
          "Halvér og fordobl",
          `Halvér det ene tal og fordobl det andet — produktet er det samme: ${a} · ${b} = ${a * 2} · ${b / 2} = ${a * 4} · ${b / 4}. Bliv ved, til det ene tal er rundt.`,
        );
      }
      case 2: {
        // Gange med et decimaltal under 1
        const n = 4 * heltal(rng, 4, 60);
        const f = vaelg(rng, [0.5, 0.25, 0.75]);
        const navn = f === 0.5 ? "halvdelen" : f === 0.25 ? "en fjerdedel" : "tre fjerdedele";
        return {
          noegle: `mul:${n}*${f}`,
          slags: "tal",
          spoergsmaal: `${n} · ${dansk(f, 2)}`,
          svar: dansk(n * f, 3),
          strategi: "Gange med under 1",
          hint: `At gange med ${dansk(f, 2)} er at tage ${navn} af tallet. Svaret bliver MINDRE end ${n}.`,
        };
      }
      case 3: {
        // Tocifret kompensation
        const a = vaelg(rng, [19, 29, 39, 49, 18, 28, 48]);
        const oprundet = Math.ceil(a / 10) * 10;
        const b = heltal(rng, 12, 89);
        return opgave(
          [a, b],
          "Rund op, og træk fra",
          `${a} er ${oprundet} − ${oprundet - a}. Regn ${oprundet} · ${b} = ${oprundet * b}, og træk så ${oprundet - a} · ${b} = ${(oprundet - a) * b} fra.`,
        );
      }
      default: {
        // Tre faktorer, hvor to giver 1000
        const n = heltal(rng, 12, 98);
        const par = vaelg(rng, [
          [8, 125],
          [4, 250],
          [2, 500],
          [40, 25],
        ]);
        return opgave(
          [par[0], n, par[1]],
          "Byt om på faktorerne",
          `${par[0]} · ${par[1]} = ${par[0] * par[1]}. Tag det par først, så er der bare ${n} · ${par[0] * par[1]} tilbage.`,
        );
      }
    }
  }

  if (niveau === "bronze") {
    switch (heltal(rng, 1, 6)) {
      case 1: {
        const n = heltal(rng, 12, 89);
        return opgave([11, n], "Gange med 11", elleveHint(n));
      }
      case 2: {
        const a = heltal(rng, 2, 9);
        const b = 100 - heltal(rng, 1, 4);
        return opgave([a, b], "Rund op, og træk fra", kompensationHint(a, b, 100));
      }
      case 3: {
        const a = heltal(rng, 3, 9);
        const enhed = vaelg(rng, [25, 50]);
        return opgave(
          [a, enhed],
          enhed === 25 ? "Gange med 25" : "Gange med 50",
          enhed === 25
            ? femogtyveHint(a)
            : `50 er 100 : 2. Regn ${a} · 100 = ${a * 100}, og halvér.`,
        );
      }
      case 4: {
        const n = 2 * heltal(rng, 6, 49);
        return opgave(
          [5, n],
          "Halvdelen af ti gange",
          `5 · ${n} er halvdelen af 10 · ${n}. Altså halvdelen af ${10 * n}.`,
        );
      }
      case 5: {
        const a = heltal(rng, 3, 9);
        const rundt = 10 * heltal(rng, 2, 9);
        const b = rundt - heltal(rng, 1, 3);
        return opgave([a, b], "Rund op, og træk fra", kompensationHint(a, b, rundt));
      }
      default: {
        const n = heltal(rng, 25, 99);
        return opgave(
          [4, n],
          "Fordobl to gange",
          `At gange med 4 er at fordoble to gange: ${n} → ${2 * n} → ${4 * n}.`,
        );
      }
    }
  }

  if (niveau === "soelv") {
    switch (heltal(rng, 1, 5)) {
      case 1: {
        const a = heltal(rng, 6, 9);
        const b = 100 * heltal(rng, 2, 9) + heltal(rng, 1, 9);
        return opgave([a, b], "Del faktoren op", opdelHint(a, b, 100));
      }
      case 2: {
        const n = heltal(rng, 23, 89);
        return opgave([n, 11], "Gange med 11", elleveHint(n));
      }
      case 3: {
        const a = heltal(rng, 3, 9);
        const rundt = 100 * heltal(rng, 1, 5);
        const b = rundt - heltal(rng, 1, 3);
        return opgave([a, b], "Rund op, og træk fra", kompensationHint(a, b, rundt));
      }
      case 4: {
        const n = heltal(rng, 12, 48);
        return opgave([n, 25], "Gange med 25", femogtyveHint(n));
      }
      default: {
        const a = heltal(rng, 4, 9);
        const b = 10 * heltal(rng, 3, 9) + heltal(rng, 1, 9);
        return opgave([a, b], "Del faktoren op", opdelHint(a, b, 10));
      }
    }
  }

  switch (heltal(rng, 1, 6)) {
    case 1: {
      const n = heltal(rng, 12, 98);
      return opgave(
        [n, 4, 25],
        "Byt om på faktorerne",
        `Rækkefølgen er ligegyldig. Tag 4 · 25 = 100 først, så er der bare ${n} · 100 tilbage.`,
      );
    }
    case 2: {
      const n = heltal(rng, 2, 9);
      return opgave(
        [125, n, 8],
        "Byt om på faktorerne",
        `125 · 8 = 1000. Så er der bare ${n} · 1000 tilbage.`,
      );
    }
    case 3: {
      const a = heltal(rng, 6, 9);
      const b = 100 * heltal(rng, 2, 9) + heltal(rng, 1, 9);
      return opgave([a, b], "Del faktoren op", opdelHint(a, b, 100));
    }
    case 4: {
      const n = heltal(rng, 12, 98);
      return opgave(
        [5, n, 20],
        "Byt om på faktorerne",
        `5 · 20 = 100. Så er der bare ${n} · 100 tilbage.`,
      );
    }
    case 5: {
      const n = heltal(rng, 12, 98);
      return opgave(
        [n, 2, 50],
        "Byt om på faktorerne",
        `2 · 50 = 100. Så er der bare ${n} · 100 tilbage.`,
      );
    }
    default: {
      const a = heltal(rng, 4, 9);
      const b = 1000 - heltal(rng, 1, 9);
      return opgave([a, b], "Rund op, og træk fra", kompensationHint(a, b, 1000));
    }
  }
}
