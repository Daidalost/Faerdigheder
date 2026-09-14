"use client";

import type { EmneId, KategoriId, NiveauId } from "./typer";
import { NIVEAU_RAEKKEFOELGE } from "./typer";
import { KATALOG, EMNER_SKIFTET_TIL_TI, findKategori, kravFor } from "./katalog";

/**
 * Fremskridt gemmes i browserens localStorage, så eleven kan lukke computeren
 * og fortsætte i næste time. Der er ingen server og ingen login — data ligger
 * kun på den maskine, eleven sidder ved.
 */

const NOEGLE = "faerdighedsapp:fremskridt:v1";
const VERSION = 2;

export type EmneFremskridt = {
  /** Bedste antal rigtige på hvert niveau. */
  bedste: Partial<Record<NiveauId, number>>;
  /** Antal gennemførte runder pr. niveau — bruges bare til at vise flid. */
  runder: Partial<Record<NiveauId, number>>;
};

export type Fremskridt = Partial<Record<EmneId, EmneFremskridt>> & { version?: number };

const TOMT: EmneFremskridt = { bedste: {}, runder: {} };

/**
 * Da omregning og vurdering gik fra 5 til 10 opgaver pr. runde, ville et
 * gammelt resultat på 4 ud af 5 pludselig ikke længere tælle som klaret.
 * Her regnes de gamle tal om, så ingen mister et niveau, de har taget.
 */
function migrer(data: Fremskridt): Fremskridt {
  if (data.version === VERSION) return data;
  const ud: Fremskridt = { ...data, version: VERSION };
  for (const emne of EMNER_SKIFTET_TIL_TI) {
    const gammel = ud[emne as EmneId];
    if (!gammel?.bedste) continue;
    const krav = kravFor(emne);
    const nyBedste: Partial<Record<NiveauId, number>> = {};
    for (const niveau of NIVEAU_RAEKKEFOELGE) {
      const b = gammel.bedste[niveau];
      if (b === undefined) continue;
      // Resultater over 5 er allerede på den nye skala og skal ikke røres.
      if (b > 5) nyBedste[niveau] = b;
      else if (b >= 4) nyBedste[niveau] = krav.kraevede; // var klaret, forbliver klaret
      else nyBedste[niveau] = b * 2; // samme andel på den nye skala
    }
    ud[emne as EmneId] = { ...gammel, bedste: nyBedste };
  }
  return ud;
}

export function laesFremskridt(): Fremskridt {
  if (typeof window === "undefined") return {};
  try {
    const raa = window.localStorage.getItem(NOEGLE);
    if (!raa) return { version: VERSION };
    const data = JSON.parse(raa);
    if (typeof data !== "object" || data === null) return { version: VERSION };
    const migreret = migrer(data as Fremskridt);
    if (migreret !== data) {
      try {
        window.localStorage.setItem(NOEGLE, JSON.stringify(migreret));
      } catch {
        /* ignoreres */
      }
    }
    return migreret;
  } catch {
    return { version: VERSION };
  }
}

export function gemResultat(emne: EmneId, niveau: NiveauId, rigtige: number): Fremskridt {
  const nu = laesFremskridt();
  const emnedata: EmneFremskridt = nu[emne] ?? { bedste: {}, runder: {} };
  const bedsteFoer = emnedata.bedste[niveau] ?? 0;
  const opdateret: EmneFremskridt = {
    bedste: { ...emnedata.bedste, [niveau]: Math.max(bedsteFoer, rigtige) },
    runder: { ...emnedata.runder, [niveau]: (emnedata.runder[niveau] ?? 0) + 1 },
  };
  const nyt: Fremskridt = { ...nu, version: VERSION, [emne]: opdateret };
  try {
    window.localStorage.setItem(NOEGLE, JSON.stringify(nyt));
  } catch {
    // Privat vindue eller blokeret lagring — appen virker stadig, men husker ikke.
  }
  return nyt;
}

export function nulstil(): void {
  try {
    window.localStorage.removeItem(NOEGLE);
  } catch {
    /* ignoreres */
  }
}

export function erGennemfoert(f: Fremskridt, emne: EmneId, niveau: NiveauId): boolean {
  return (f[emne]?.bedste?.[niveau] ?? 0) >= kravFor(emne).kraevede;
}

/** Bronze er altid åben. Sølv kræver bronze klaret, guld kræver sølv, og så videre. */
export function erLaastOp(f: Fremskridt, emne: EmneId, niveau: NiveauId): boolean {
  const index = NIVEAU_RAEKKEFOELGE.indexOf(niveau);
  if (index <= 0) return true;
  return erGennemfoert(f, emne, NIVEAU_RAEKKEFOELGE[index - 1]);
}

/** Det højeste niveau eleven har klaret — eller null hvis ingen endnu. */
export function hoejesteKlarede(f: Fremskridt, emne: EmneId): NiveauId | null {
  let hoejeste: NiveauId | null = null;
  for (const niveau of NIVEAU_RAEKKEFOELGE) {
    if (erGennemfoert(f, emne, niveau)) hoejeste = niveau;
  }
  return hoejeste;
}

/** Det niveau eleven skal i gang med nu. */
export function naesteNiveau(f: Fremskridt, emne: EmneId): NiveauId {
  for (const niveau of NIVEAU_RAEKKEFOELGE) {
    if (!erGennemfoert(f, emne, niveau)) return niveau;
  }
  return NIVEAU_RAEKKEFOELGE[NIVEAU_RAEKKEFOELGE.length - 1];
}

export function emneAndel(f: Fremskridt, emne: EmneId): number {
  const klarede = NIVEAU_RAEKKEFOELGE.filter((n) => erGennemfoert(f, emne, n)).length;
  return klarede / NIVEAU_RAEKKEFOELGE.length;
}

export function kategoriAndel(f: Fremskridt, kategori: KategoriId): number {
  const k = findKategori(kategori);
  if (!k) return 0;
  const sum = k.emner.reduce((acc, e) => acc + emneAndel(f, e.id), 0);
  return sum / k.emner.length;
}

export function samletAndel(f: Fremskridt): number {
  const alle = KATALOG.flatMap((k) => k.emner);
  return alle.reduce((acc, e) => acc + emneAndel(f, e.id), 0) / alle.length;
}

export { TOMT, kravFor };
