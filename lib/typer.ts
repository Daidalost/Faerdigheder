export type NiveauId = "bronze" | "soelv" | "guld";
export type KategoriId = "regnearterne" | "enhedsomregning";
export type EmneId =
  | "addition"
  | "subtraktion"
  | "multiplikation"
  | "division"
  | "omregning"
  | "vurdering";

/** En enkelt opgave, klar til at blive vist. */
export type Opgave = {
  /** Bruges til at fjerne dubletter inden for én runde. */
  noegle: string;
  /** "tal" = eleven skriver et tal. "valg" = eleven vælger mellem svarmuligheder. */
  slags: "tal" | "valg";
  /** Selve spørgsmålet. Regnestykker står her som ren tekst, fx "3498 + 1996". */
  spoergsmaal: string;
  /** Lille tekst før spørgsmålet, fx "Hvad er størst?" */
  optakt?: string;
  /** Vises efter indtastningsfeltet, fx "m" eller "kr." */
  enhed?: string;
  /** Det korrekte svar, som det skal vises for eleven. */
  svar: string;
  /** Svarmuligheder, når slags er "valg". Indeholder altid svar. */
  valg?: string[];
  /** Kort navn på den strategi, opgaven belønner. */
  strategi: string;
  /** Vises når eleven svarer forkert. Skal pege på strategien, ikke bare på facit. */
  hint: string;
};

export type Niveau = {
  id: NiveauId;
  navn: string;
  beskrivelse: string;
};

export const NIVEAUER: Niveau[] = [
  { id: "bronze", navn: "Bronze", beskrivelse: "Kom i gang. Små tal, tydelige strategier." },
  { id: "soelv", navn: "Sølv", beskrivelse: "Større tal og decimaler." },
  { id: "guld", navn: "Guld", beskrivelse: "Samme niveau som afgangsprøven." },
];

export const NIVEAU_RAEKKEFOELGE: NiveauId[] = ["bronze", "soelv", "guld"];

/** Antal opgaver i en runde, og hvor mange der skal være rigtige for at låse op. */
export const OPGAVER_PR_RUNDE = 5;
export const KRAEVEDE_RIGTIGE = 4;
