import type { EmneId, NiveauId, Opgave } from "../typer";
import { OPGAVER_PR_RUNDE } from "../typer";
import { lavRng, nytFroe, type Rng } from "../tilfaeldig";
import { lavAddition } from "./addition";
import { lavSubtraktion } from "./subtraktion";
import { lavMultiplikation } from "./multiplikation";
import { lavDivision } from "./division";
import { lavOmregning } from "./omregning";
import { lavVurdering } from "./vurdering";
import { lavSkrivemaader } from "./skrivemaader";
import { lavProcentregning } from "./procentregning";
import { lavSammenlign } from "./sammenlign";

const GENERATORER: Record<EmneId, (rng: Rng, niveau: NiveauId) => Opgave> = {
  addition: lavAddition,
  subtraktion: lavSubtraktion,
  multiplikation: lavMultiplikation,
  division: lavDivision,
  omregning: lavOmregning,
  vurdering: lavVurdering,
  skrivemaader: lavSkrivemaader,
  procentregning: lavProcentregning,
  sammenlign: lavSammenlign,
};

export function lavEnOpgave(emne: EmneId, niveau: NiveauId, rng: Rng): Opgave {
  return GENERATORER[emne](rng, niveau);
}

/**
 * Bygger en runde. Opgaverne er unikke inden for runden, og frøet er nyt hver
 * gang, så to elever ved siden af hinanden ikke får det samme sæt.
 */
export function lavRunde(
  emne: EmneId,
  niveau: NiveauId,
  antal: number = OPGAVER_PR_RUNDE,
  froe: number = nytFroe(),
): Opgave[] {
  const rng = lavRng(froe);
  const runde: Opgave[] = [];
  const set = new Set<string>();
  let forsoeg = 0;
  while (runde.length < antal && forsoeg < antal * 200) {
    forsoeg++;
    const opgave = GENERATORER[emne](rng, niveau);
    if (set.has(opgave.noegle)) continue;
    set.add(opgave.noegle);
    runde.push(opgave);
  }
  return runde;
}
