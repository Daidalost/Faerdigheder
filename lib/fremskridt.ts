"use client";

import type { EmneId, KategoriId, NiveauId } from "./typer";
import { KRAEVEDE_RIGTIGE, NIVEAU_RAEKKEFOELGE, OPGAVER_PR_RUNDE } from "./typer";
import { KATALOG, findKategori } from "./katalog";

/**
 * Fremskridt gemmes i browserens localStorage, så eleven kan lukke computeren
 * og fortsætte i næste time. Der er ingen server og ingen login — data ligger
 * kun på den maskine, eleven sidder ved.
 */

const NOEGLE = "faerdighedsapp:fremskridt:v1";

export type EmneFremskridt = {
  /** Bedste antal rigtige på hvert niveau. */
  bedste: Partial<Record<NiveauId, number>>;
  /** Antal gennemførte runder pr. niveau — bruges bare til at vise flid. */
  runder: Partial<Record<NiveauId, number>>;
};

export type Fremskridt = Partial<Record<EmneId, EmneFremskridt>>;

const TOMT: EmneFremskridt = { bedste: {}, runder: {} };

export function laesFremskridt(): Fremskridt {
  if (typeof window === "undefined") return {};
  try {
    const raa = window.localStorage.getItem(NOEGLE);
    if (!raa) return {};
    const data = JSON.parse(raa);
    return typeof data === "object" && data !== null ? (data as Fremskridt) : {};
  } catch {
    return {};
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
  const nyt: Fremskridt = { ...nu, [emne]: opdateret };
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
  return (f[emne]?.bedste[niveau] ?? 0) >= KRAEVEDE_RIGTIGE;
}

/** Bronze er altid åben. Sølv kræver bronze klaret, guld kræver sølv klaret. */
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
  return "guld";
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

export { KRAEVEDE_RIGTIGE, OPGAVER_PR_RUNDE, TOMT };
