export type NiveauId = "bronze" | "soelv" | "guld" | "platin";
export type KategoriId =
  | "regnearterne"
  | "enhedsomregning"
  | "procentogbroek"
  | "lineaere"
  | "ligninger"
  | "geometri";
export type EmneId =
  | "addition"
  | "subtraktion"
  | "multiplikation"
  | "division"
  | "omregning"
  | "vurdering"
  | "skrivemaader"
  | "procentregning"
  | "sammenlign"
  | "aflaes"
  | "forskrift"
  | "graf"
  | "trin"
  | "beggesider"
  | "broekparentes"
  | "vinkler"
  | "arealrumfang"
  | "ligedannethed";

/** En ret linje y = ax + b, som den tegnes i et koordinatsystem. */
export type Linje = {
  a: number;
  b: number;
  /** Navnet står ved linjen, fx "l" eller "m". */
  navn?: string;
  farve?: "terra" | "blaa" | "teal" | "lilla" | "okker";
};

/** Et punkt, der markeres med et kryds og et navn. */
export type Punkt = { x: number; y: number; navn?: string };

/**
 * En figur, der vises over svarfeltet. Kun de nye emner bruger den —
 * de gamle opgaver har ingen figur og ser ud præcis som før.
 */
export type Figur =
  | {
      slags: "koordinatsystem";
      /** Vinduet: mindste og største x og y. Altid hele tal. */
      x: [number, number];
      y: [number, number];
      linjer?: Linje[];
      punkter?: Punkt[];
    }
  | {
      slags: "tabel";
      /** Navnene i første kolonne, fx ["x", "y"] eller ["Længde (m)", "Pris (kr.)"]. */
      navne: [string, string];
      x: string[];
      /** "?" markerer den celle, eleven skal finde. */
      y: string[];
    }
  | Skitse;

/** Et punkt i en geometrisk skitse. Matematiske koordinater: y peger opad. */
export type P = [number, number];

export type Farve = "terra" | "blaa" | "teal" | "lilla" | "okker" | "groen" | "blaek";

/**
 * En geometrisk skitse: linjer, figurer, vinkelbuer, mål og en formelboks.
 * Generatorerne regner koordinaterne ud, så tegningen passer med tallene —
 * en vinkel, der står som 50°, *er* 50° på tegningen.
 */
export type Skitse = {
  slags: "skitse";
  /** Kvadratnet med tern på 1 × 1 inden for [x0, x1] × [y0, y1]. */
  gitter?: { x: [number, number]; y: [number, number] };
  polygoner?: { punkter: P[]; farve?: Farve; fyld?: boolean; stiplet?: boolean }[];
  linjer?: {
    fra: P;
    til: P;
    farve?: Farve;
    stiplet?: boolean;
    tynd?: boolean;
    /** Små streger midt på linjen, der viser ens længder. */
    streger?: 1 | 2;
  }[];
  /** Ellipser til cylindre. "foran"/"bagved" tegner kun den forreste/bageste halvdel. */
  ellipser?: { c: P; rx: number; ry: number; halv?: "foran" | "bagved"; stiplet?: boolean }[];
  /** En vinkel ved `top` mellem strålerne mod `a` og `b` (den mindste af de to). */
  vinkler?: { top: P; a: P; b: P; tekst?: string; ret?: boolean; farve?: Farve }[];
  /** Et mål skrevet ved et linjestykke. `side` = 1 til venstre for fra→til, −1 til højre. */
  maal?: { fra: P; til: P; tekst: string; side?: 1 | -1 }[];
  tekster?: { ved: P; tekst: string; kursiv?: boolean; anker?: "start" | "middle" | "end" }[];
  /** Linjer i en formelboks ved siden af skitsen, som i prøvehæftet. */
  formel?: string[];
  /** Skriv "Skitse" i hjørnet: målene passer ikke nødvendigvis på tegningen. */
  skitse?: boolean;
};

/** En enkelt opgave, klar til at blive vist. */
export type Opgave = {
  /** Bruges til at fjerne dubletter inden for én runde. */
  noegle: string;
  /**
   * "tal" = eleven skriver et tal. "valg" = eleven vælger mellem svarmuligheder.
   * "punkt" = eleven skriver et koordinatsæt i to felter, ( ; ). Svaret gemmes som "(3;−2)".
   */
  slags: "tal" | "valg" | "punkt";
  /**
   * Selve spørgsmålet. Brøker skrives som "3/5" og bliver sat med brøkstreg,
   * når de vises — så det ligner prøvesættene.
   */
  spoergsmaal: string;
  /** Lille tekst før spørgsmålet, fx "Hvad er størst?" */
  optakt?: string;
  /** Vises efter indtastningsfeltet, fx "kr." eller "%" */
  enhed?: string;
  /** Vises foran indtastningsfeltet, fx "x =" */
  foran?: string;
  /** Koordinatsystem eller tabel, der hører til opgaven. */
  figur?: Figur;
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
  {
    id: "platin",
    navn: "Platin",
    beskrivelse: "Over prøveniveau. Flere trin, og ingen pæne tal at læne sig op ad.",
  },
];

export const NIVEAU_RAEKKEFOELGE: NiveauId[] = ["bronze", "soelv", "guld", "platin"];

/**
 * Standard for en runde. Kategorierne kan sætte deres egne tal i
 * lib/katalog.ts — Regnearterne kører fx stadig med 5 og 4.
 * Brug kravFor(emneId) alle steder, hvor emnet er kendt.
 */
export const OPGAVER_PR_RUNDE = 10;
export const KRAEVEDE_RIGTIGE = 8;
