import type { Opgave, NiveauId } from "../typer";
import { dansk, heltal, vaelg, type Rng } from "../tilfaeldig";

/**
 * Procentregning i prøvesættenes fire former:
 *   1. procent af et beløb        "Hvor meget er 15 % af 199 kr.?" (maj 2026)
 *   2. rabat / nedsat pris        opgave 1.3 i hvert eneste sæt
 *   3. hvor mange procent er X af Y   "20 ud af 80" (dec 2021)
 *   4. baglæns                    "40 % af et beløb er 200 kr." (dec 2021)
 * Platin lægger procentvis ændring og to trin efter hinanden oveni.
 *
 * Tallene vælges altid, så svaret går op — ellers ligner det ikke en prøveopgave.
 */

function opgave(
  noegle: string,
  spoergsmaal: string,
  svar: string,
  enhed: string,
  strategi: string,
  hint: string,
  optakt = "Regn ud",
): Opgave {
  return { noegle, slags: "tal", optakt, spoergsmaal, svar, enhed, strategi, hint };
}

/** Procentsatser og beløb, der passer sammen, så resultatet bliver et helt tal. */
function satsOgBeloeb(rng: Rng, niveau: NiveauId): { p: number; b: number } {
  if (niveau === "bronze") {
    const p = vaelg(rng, [10, 20, 25, 50]);
    const b = 20 * heltal(rng, 2, 30); // 40–600, deleligt med 20
    return { p, b };
  }
  if (niveau === "soelv") {
    const p = vaelg(rng, [5, 15, 30, 40, 60, 75]);
    const b = 20 * heltal(rng, 3, 60);
    return { p, b };
  }
  if (niveau === "guld") {
    const p = vaelg(rng, [8, 12, 15, 18, 24, 35, 45, 65]);
    const b = 100 * heltal(rng, 2, 40);
    return { p, b };
  }
  const p = vaelg(rng, [7, 12.5, 17.5, 22, 37.5, 55, 62.5, 85]);
  const b = 400 * heltal(rng, 1, 25);
  return { p, b };
}

const procentAf = (p: number, b: number) => (b * p) / 100;

export function lavProcentregning(rng: Rng, niveau: NiveauId): Opgave {
  // -------------------------------------------------------------- platin
  if (niveau === "platin") {
    switch (heltal(rng, 1, 4)) {
      case 1: {
        // Procentvis ændring
        const gammel = 100 * heltal(rng, 2, 20);
        const faktor = vaelg(rng, [1.15, 1.25, 1.4, 1.5, 0.6, 0.75, 0.8, 0.85]);
        const ny = Math.round(gammel * faktor);
        const aendring = Math.round(((ny - gammel) / gammel) * 1000) / 10;
        const opad = ny > gammel;
        return opgave(
          `pct:aendring:${gammel}:${ny}`,
          `En vare gik fra ${gammel} kr. til ${ny} kr. Hvor mange procent ${opad ? "steg" : "faldt"} prisen?`,
          dansk(Math.abs(aendring), 3),
          "%",
          "Sammenlign med det oprindelige tal",
          `Ændringen er ${Math.abs(ny - gammel)} kr. Den skal sammenlignes med den GAMLE pris: ${Math.abs(ny - gammel)} ud af ${gammel}.`,
        );
      }
      case 2: {
        // To nedsættelser efter hinanden
        const b = 200 * heltal(rng, 2, 25);
        const p1 = vaelg(rng, [10, 20, 25, 50]);
        const p2 = vaelg(rng, [10, 20, 25]);
        const efter = (b * (100 - p1) * (100 - p2)) / 10000;
        if (!Number.isInteger(efter)) return lavProcentregning(rng, niveau);
        return opgave(
          `pct:to:${b}:${p1}:${p2}`,
          `En vare til ${b} kr. sættes ned med ${p1} %. Bagefter sættes den nye pris ned med ${p2} %. Hvad koster varen nu?`,
          dansk(efter, 2),
          "kr.",
          "To trin — ikke lagt sammen",
          `Regn ét trin ad gangen. Efter første nedsættelse: ${dansk((b * (100 - p1)) / 100, 2)} kr. Den anden procent regnes af DEN pris, ikke af ${b}. Derfor er det ikke ${p1 + p2} % i alt.`,
        );
      }
      case 3: {
        // Procentpoint over for procent
        const fra = 5 * heltal(rng, 2, 12);
        const til = fra + 5 * heltal(rng, 1, 8);
        const spoergOmPoint = rng() < 0.5;
        const point = til - fra;
        const procent = Math.round((point / fra) * 1000) / 10;
        if (!spoergOmPoint && !Number.isInteger(procent * 10)) return lavProcentregning(rng, niveau);
        return opgave(
          `pct:point:${fra}:${til}:${spoergOmPoint ? "pp" : "p"}`,
          `Andelen steg fra ${fra} % til ${til} %. Hvor mange ${spoergOmPoint ? "procentpoint" : "procent"} steg den?`,
          dansk(spoergOmPoint ? point : procent, 3),
          spoergOmPoint ? "procentpoint" : "%",
          "Procentpoint er ikke procent",
          spoergOmPoint
            ? `Procentpoint er bare forskellen mellem de to tal: ${til} − ${fra}.`
            : `Her spørges der om procent, ikke procentpoint. Stigningen er ${point} procentpoint, og de skal sammenlignes med udgangspunktet ${fra}: ${point} ud af ${fra}.`,
        );
      }
      default: {
        // Baglæns med skæv sats
        const { p, b } = satsOgBeloeb(rng, "platin");
        const del = procentAf(p, b);
        if (!Number.isInteger(del)) return lavProcentregning(rng, niveau);
        return opgave(
          `pct:bag:${p}:${b}`,
          `${dansk(p, 3)} % af et beløb er ${dansk(del, 2)} kr. Hvor stort er hele beløbet?`,
          dansk(b, 2),
          "kr.",
          "Find først 1 %",
          `Find 1 % ved at dividere: ${dansk(del, 2)} : ${dansk(p, 3)} = ${dansk(del / p, 4)} kr. Gang så med 100 for at få det hele.`,
        );
      }
    }
  }

  // ------------------------------------------------- bronze, sølv og guld
  const { p, b } = satsOgBeloeb(rng, niveau);
  const del = procentAf(p, b);
  if (!Number.isInteger(del)) return lavProcentregning(rng, niveau);

  switch (heltal(rng, 1, niveau === "bronze" ? 3 : 4)) {
    case 1:
      return opgave(
        `pct:af:${p}:${b}`,
        `Hvor meget er ${dansk(p, 3)} % af ${b} kr.?`,
        dansk(del, 2),
        "kr.",
        "Gå vejen om 10 % eller 1 %",
        `10 % af ${b} er ${dansk(b / 10, 3)} kr., og 1 % er ${dansk(b / 100, 3)} kr. Byg ${dansk(p, 3)} % op af de to.`,
      );

    case 2: {
      const nedsat = b - del;
      return opgave(
        `pct:rabat:${p}:${b}`,
        `En vare koster ${b} kr. Prisen sættes ned med ${dansk(p, 3)} %. Hvad koster varen nu?`,
        dansk(nedsat, 2),
        "kr.",
        "Regn resten, ikke rabatten",
        `Du kan regne rabatten (${dansk(del, 2)} kr.) og trække fra. Hurtigere: der er ${dansk(100 - p, 3)} % tilbage, så regn ${dansk(100 - p, 3)} % af ${b} direkte.`,
      );
    }

    case 3:
      return opgave(
        `pct:hvormange:${del}:${b}`,
        `Hvor mange procent er ${dansk(del, 2)} kr. af ${b} kr.?`,
        dansk(p, 3),
        "%",
        "Del, og gang med 100",
        `${dansk(del, 2)} ud af ${b} er brøken ${dansk(del, 2)}/${b}. Gang med 100 for at få procenten. Tjek: 10 % af ${b} er ${dansk(b / 10, 3)} kr.`,
      );

    default:
      return opgave(
        `pct:bagl:${p}:${b}`,
        `${dansk(p, 3)} % af et beløb er ${dansk(del, 2)} kr. Hvor stort er hele beløbet?`,
        dansk(b, 2),
        "kr.",
        "Find først 1 %",
        `Find 1 %: ${dansk(del, 2)} : ${dansk(p, 3)} = ${dansk(del / p, 4)} kr. Gang med 100. Svaret skal være STØRRE end ${dansk(del, 2)} kr.`,
      );
  }
}
