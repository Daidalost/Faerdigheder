/**
 * Kontrol af opgavegeneratorerne.
 *
 * Kør med:  npm test
 *
 * Testen regner hver eneste genererede opgave efter uafhængigt af generatoren
 * — regnestykker parses og udregnes forfra, omregninger tjekkes mod en
 * selvstændig enhedstabel — og måler samtidig hvor mange forskellige opgaver
 * hver kombination af emne og niveau kan producere.
 */

import { lavRunde, lavEnOpgave } from "../lib/opgaver/index";
import { lavRng } from "../lib/tilfaeldig";
import type { EmneId, NiveauId, Opgave } from "../lib/typer";

const EMNER: EmneId[] = [
  "addition",
  "subtraktion",
  "multiplikation",
  "division",
  "omregning",
  "vurdering",
];
const NIVEAUER: NiveauId[] = ["bronze", "soelv", "guld"];

let fejl = 0;
const sig = (ok: boolean, besked: string) => {
  if (!ok) {
    fejl++;
    console.error("  FEJL: " + besked);
  }
};

const talAf = (s: string) => Number(s.replace(/\s/g, "").replace(",", "."));

/** Regner et regnestykke efter forfra, uden at bruge generatorens facit. */
function facitForStykke(udtryk: string): number | null {
  const rent = udtryk.replace(/\s/g, "");
  if (rent.includes("·")) {
    return rent.split("·").map(Number).reduce((a, b) => a * b, 1);
  }
  if (rent.includes(":")) {
    const [a, b] = rent.split(":").map(Number);
    return a / b;
  }
  if (rent.includes("−")) {
    const [a, b] = rent.split("−").map(Number);
    return a - b;
  }
  if (rent.includes("+")) {
    const [a, b] = rent.split("+").map(Number);
    return a + b;
  }
  return null;
}

/** Uafhængig enhedstabel til kontrol af omregningsopgaverne. */
const FAKTOR: Record<string, number> = {
  mm: 1, cm: 10, dm: 100, m: 1000, km: 1_000_000,
  g: 1, kg: 1000,
  mL: 1, cL: 10, dL: 100, L: 1000,
  minutter: 1, timer: 60, "døgn": 1440,
};

function tjekOmregning(o: Opgave): void {
  const m = o.spoergsmaal.match(/^([\d.,]+)\s+(\S+)\s+=$/);
  sig(m !== null, `kunne ikke læse omregningsopgave: "${o.spoergsmaal}"`);
  if (!m) return;
  const fraVaerdi = talAf(m[1]);
  const fraEnhed = m[2];
  const tilEnhed = o.enhed!;
  sig(FAKTOR[fraEnhed] !== undefined, `ukendt enhed ${fraEnhed}`);
  sig(FAKTOR[tilEnhed] !== undefined, `ukendt enhed ${tilEnhed}`);
  const forventet = (fraVaerdi * FAKTOR[fraEnhed]) / FAKTOR[tilEnhed];
  const faktisk = talAf(o.svar);
  sig(
    Math.abs(forventet - faktisk) < 1e-6,
    `${o.spoergsmaal} ${o.enhed}: generator siger ${o.svar}, kontrol siger ${forventet}`,
  );
  // Prøvesættene bruger aldrig mere end tre decimaler i svaret.
  const decimaler = (o.svar.split(",")[1] ?? "").length;
  sig(decimaler <= 3, `for mange decimaler i svaret: ${o.spoergsmaal} = ${o.svar}`);
}

function tjekOpgave(emne: EmneId, niveau: NiveauId, o: Opgave): void {
  const hvor = `${emne}/${niveau}`;
  sig(o.spoergsmaal.trim().length > 0, `${hvor}: tomt spørgsmål`);
  sig(o.svar.trim().length > 0, `${hvor}: tomt svar`);
  sig(o.hint.trim().length > 10, `${hvor}: hint mangler eller er for kort`);
  sig(o.strategi.trim().length > 0, `${hvor}: strategi mangler`);

  if (o.slags === "valg") {
    sig(Array.isArray(o.valg) && o.valg.length >= 2, `${hvor}: for få svarmuligheder`);
    sig(o.valg!.includes(o.svar), `${hvor}: facit er ikke blandt svarmulighederne (${o.spoergsmaal})`);
    sig(new Set(o.valg).size === o.valg!.length, `${hvor}: ens svarmuligheder (${o.spoergsmaal})`);
    return;
  }

  if (emne === "omregning") {
    tjekOmregning(o);
    return;
  }

  const forventet = facitForStykke(o.spoergsmaal);
  sig(forventet !== null, `${hvor}: kunne ikke parse "${o.spoergsmaal}"`);
  if (forventet === null) return;
  sig(
    Math.abs(forventet - talAf(o.svar)) < 1e-9,
    `${hvor}: ${o.spoergsmaal} = ${o.svar}, men kontrollen siger ${forventet}`,
  );
  sig(Number.isInteger(forventet), `${hvor}: ${o.spoergsmaal} giver ikke et helt tal (${forventet})`);
  if (emne === "subtraktion") {
    sig(forventet > 0, `${hvor}: negativt resultat i ${o.spoergsmaal}`);
  }
}

console.log("Kontrollerer opgavegeneratorerne\n");

const PROEVER = 4000;
for (const emne of EMNER) {
  for (const niveau of NIVEAUER) {
    const set = new Set<string>();
    for (let i = 0; i < PROEVER; i++) {
      const o = lavEnOpgave(emne, niveau, lavRng(i * 2654435761));
      tjekOpgave(emne, niveau, o);
      set.add(o.noegle);
    }
    const forskellige = set.size;
    sig(
      forskellige >= 60,
      `${emne}/${niveau}: kun ${forskellige} forskellige opgaver ud af ${PROEVER} træk`,
    );
    console.log(
      `  ${emne.padEnd(15)} ${niveau.padEnd(7)} ${String(forskellige).padStart(4)} forskellige af ${PROEVER} træk`,
    );
  }
}

console.log("\nKontrollerer at en runde ikke gentager sig selv");
for (const emne of EMNER) {
  for (const niveau of NIVEAUER) {
    for (let i = 0; i < 300; i++) {
      const runde = lavRunde(emne, niveau, 5, i * 97 + 13);
      sig(runde.length === 5, `${emne}/${niveau}: runden blev kun ${runde.length} opgaver lang`);
      sig(
        new Set(runde.map((o) => o.noegle)).size === runde.length,
        `${emne}/${niveau}: dublet i samme runde`,
      );
    }
  }
}

if (fejl === 0) {
  console.log("\nAlt i orden.");
} else {
  console.error(`\n${fejl} fejl.`);
  process.exit(1);
}
