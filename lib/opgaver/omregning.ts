import type { Opgave, NiveauId } from "../typer";
import { dansk, heltal, vaelg, type Rng } from "../tilfaeldig";

/**
 * Enhedsomregning efter mønsteret i "Omskriv størrelserne" (FP9 Opgave 11/12).
 *
 * Alt regnes i heltal af en basisenhed, så der aldrig opstår afrundingsfejl.
 * Værdien vælges så BEGGE sider bliver pæne tal — ellers ligner opgaven
 * ikke en prøveopgave.
 */

type Enhed = { navn: string; faktor: number };
type Par = { lille: Enhed; stor: Enhed; kaede: "trappe" | "tid" };

// Basis: mm for længde, mg for vægt, mL for rumfang, minutter for tid.
const mm: Enhed = { navn: "mm", faktor: 1 };
const cm: Enhed = { navn: "cm", faktor: 10 };
const dm: Enhed = { navn: "dm", faktor: 100 };
const m: Enhed = { navn: "m", faktor: 1000 };
const km: Enhed = { navn: "km", faktor: 1_000_000 };
const g: Enhed = { navn: "g", faktor: 1000 };
const kg: Enhed = { navn: "kg", faktor: 1_000_000 };
const mL: Enhed = { navn: "mL", faktor: 1 };
const cL: Enhed = { navn: "cL", faktor: 10 };
const dL: Enhed = { navn: "dL", faktor: 100 };
const L: Enhed = { navn: "L", faktor: 1000 };
const minutter: Enhed = { navn: "minutter", faktor: 1 };
const timer: Enhed = { navn: "timer", faktor: 60 };
const doegn: Enhed = { navn: "døgn", faktor: 1440 };

const par = (lille: Enhed, stor: Enhed, kaede: Par["kaede"] = "trappe"): Par => ({
  lille,
  stor,
  kaede,
});

/** Bronze: ét spring, og begge sider bliver hele tal. */
const PAR_BRONZE: Par[] = [
  par(mm, cm),
  par(cm, m),
  par(m, km),
  par(g, kg),
  par(dL, L),
  par(cL, dL),
  par(mL, cL),
  par(mL, L),
  par(minutter, timer, "tid"),
  par(timer, doegn, "tid"),
];

/** Sølv: samme spring, men nu med én decimal i det ene tal. */
const PAR_SOELV: Par[] = [
  par(mm, cm),
  par(cm, m),
  par(m, km),
  par(g, kg),
  par(dL, L),
  par(mL, L),
  par(minutter, timer, "tid"),
];

/** Guld: to decimaler og værdier under 1 — som i prøvesættene. */
const PAR_GULD: Par[] = [
  par(cm, m),
  par(m, km),
  par(g, kg),
  par(dL, L),
  par(mL, L),
  par(cL, dL),
  par(mm, m),
];

function vis(basis: number, enhed: Enhed): string {
  return dansk(basis / enhed.faktor, 6);
}

function retningsHint(fra: Enhed, til: Enhed, kaede: Par["kaede"]): string {
  if (kaede === "tid") {
    return `Tid følger ikke trappen. 1 time er 60 minutter, og 1 døgn er 24 timer. Her skal du ${
      fra.faktor > til.faktor ? "gange" : "dividere"
    } med ${Math.max(fra.faktor, til.faktor) / Math.min(fra.faktor, til.faktor)}.`;
  }
  const forhold = Math.max(fra.faktor, til.faktor) / Math.min(fra.faktor, til.faktor);
  if (fra.faktor > til.faktor) {
    return `${fra.navn} → ${til.navn} går mod højre på trappen, altså til en mindre enhed. Gang med ${forhold} — tallet skal blive større.`;
  }
  return `${fra.navn} → ${til.navn} går mod venstre på trappen, altså til en større enhed. Divider med ${forhold} — tallet skal blive mindre.`;
}

function byg(basis: number, fra: Enhed, til: Enhed, kaede: Par["kaede"], strategi: string): Opgave {
  return {
    noegle: `omr:${basis}:${fra.navn}:${til.navn}`,
    slags: "tal",
    optakt: "Omskriv",
    spoergsmaal: `${vis(basis, fra)} ${fra.navn}  =`,
    enhed: til.navn,
    svar: vis(basis, til),
    strategi,
    hint: retningsHint(fra, til, kaede),
  };
}

export function lavOmregning(rng: Rng, niveau: NiveauId): Opgave {
  if (niveau === "bronze") {
    const p = vaelg(rng, PAR_BRONZE);
    const basis = p.stor.faktor * heltal(rng, 1, 19);
    const modHoejre = rng() < 0.5;
    const fra = modHoejre ? p.stor : p.lille;
    const til = modHoejre ? p.lille : p.stor;
    return byg(basis, fra, til, p.kaede, "Ét spring på trappen");
  }

  if (niveau === "soelv") {
    const p = vaelg(rng, PAR_SOELV);
    const tiendedel = p.stor.faktor / 10;
    const decimal = p.kaede === "tid" ? 5 : heltal(rng, 1, 9);
    const basis = p.stor.faktor * heltal(rng, 1, 9) + tiendedel * decimal;
    const modHoejre = rng() < 0.5;
    const fra = modHoejre ? p.stor : p.lille;
    const til = modHoejre ? p.lille : p.stor;
    return byg(basis, fra, til, p.kaede, "Flyt kommaet");
  }

  const p = vaelg(rng, PAR_GULD);
  const hundrededel = p.stor.faktor / 100;
  let basis: number;
  let strategi: string;
  if (heltal(rng, 1, 3) === 1) {
    // Værdi under 1 i den store enhed, fx 0,05 L eller 0,45 L.
    // Enerpladsen er aldrig 0, så der altid står to decimaler.
    basis =
      hundrededel *
      (rng() < 0.5 ? heltal(rng, 2, 9) : heltal(rng, 1, 9) * 10 + heltal(rng, 1, 9));
    strategi = "Værdier under 1";
  } else {
    // To decimaler, fx 9,05 kg. Enerpladsen er aldrig 0, så tallet
    // faktisk HAR to decimaler og ikke bare én.
    const hundrededele = heltal(rng, 0, 9) * 10 + heltal(rng, 1, 9);
    basis = p.stor.faktor * heltal(rng, 1, 9) + hundrededel * hundrededele;
    strategi = "To decimaler";
  }
  const modHoejre = rng() < 0.5;
  const fra = modHoejre ? p.stor : p.lille;
  const til = modHoejre ? p.lille : p.stor;
  return byg(basis, fra, til, p.kaede, strategi);
}
