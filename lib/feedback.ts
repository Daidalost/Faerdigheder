import type { NiveauId } from "./typer";
import { KRAEVEDE_RIGTIGE, OPGAVER_PR_RUNDE } from "./typer";

/**
 * Feedbacken skal pege på strategien, ikke på eleven. Derfor er rosen kort,
 * og den vigtige tekst står i hintet fra selve opgaven.
 */

const ROS = [
  "Godt klaret!",
  "Præcis.",
  "Rigtigt — og hurtigt.",
  "Sådan.",
  "Den sad.",
  "Rigtigt.",
  "Flot set.",
  "Helt rigtigt.",
];

const OPMUNTRING = [
  "Ikke helt. Prøv strategien her:",
  "Tæt på. Se her:",
  "Den var svær. Sådan kan du gribe den an:",
  "Ikke denne gang. Her er vejen:",
];

export function ros(nr: number): string {
  return ROS[nr % ROS.length];
}

export function opmuntring(nr: number): string {
  return OPMUNTRING[nr % OPMUNTRING.length];
}

export type Opsamling = {
  overskrift: string;
  tekst: string;
  bestaaet: boolean;
};

export function opsamling(
  rigtige: number,
  niveau: NiveauId,
  naesteNiveauNavn: string | null,
  varAlleredeKlaret: boolean,
): Opsamling {
  const bestaaet = rigtige >= KRAEVEDE_RIGTIGE;
  const mangler = KRAEVEDE_RIGTIGE - rigtige;

  if (rigtige === OPGAVER_PR_RUNDE) {
    return {
      bestaaet,
      overskrift: `Alle ${OPGAVER_PR_RUNDE} rigtige`,
      tekst: naesteNiveauNavn
        ? `Fejlfrit. ${naesteNiveauNavn} er låst op — tallene bliver større, men strategierne er de samme.`
        : "Fejlfrit på platin. Det her ligger over prøveniveau, så der er ikke mere at komme efter her.",
    };
  }

  if (bestaaet) {
    return {
      bestaaet,
      overskrift: `${rigtige} ud af ${OPGAVER_PR_RUNDE} rigtige`,
      tekst: naesteNiveauNavn
        ? `Det er nok til at gå videre. ${naesteNiveauNavn} er låst op.`
        : varAlleredeKlaret
          ? "Platin er stadig i hus. Kør en runde mere, hvis du vil have farten op."
          : "Platin er i hus. Længere op kommer du ikke i den her kategori.",
    };
  }

  // Under grænsen — sig hvor langt der er, og hvad der er værd at kigge på
  if (mangler <= 2) {
    return {
      bestaaet,
      overskrift: `${rigtige} ud af ${OPGAVER_PR_RUNDE} — tæt på`,
      tekst: `Der mangler kun ${mangler === 1 ? "én" : "to"}. Kig på dem, der gik galt: var det strategien eller selve regnestykket, der drillede? Du skal bruge ${KRAEVEDE_RIGTIGE} for at låse op.`,
    };
  }

  if (rigtige <= 3) {
    return {
      bestaaet,
      overskrift: `${rigtige} ud af ${OPGAVER_PR_RUNDE} rigtige`,
      tekst:
        niveau === "bronze"
          ? "Tag den roligt, og læs hintet under hver opgave, før du svarer på den næste. Strategien er vigtigere end farten her."
          : "Prøv et niveau ned og få strategien til at sidde først. Så bliver det her nemt bagefter.",
    };
  }

  return {
    bestaaet,
    overskrift: `${rigtige} ud af ${OPGAVER_PR_RUNDE} rigtige`,
    tekst: `Du skal bruge ${KRAEVEDE_RIGTIGE} for at låse op — der mangler ${mangler}. Kør en runde mere; du får nye opgaver.`,
  };
}
