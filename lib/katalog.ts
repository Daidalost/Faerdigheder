import type { EmneId, KategoriId } from "./typer";

export type Emne = {
  id: EmneId;
  navn: string;
  kort: string;
  farve: string;
  farveLys: string;
  /** Hvad guld svarer til i prøven — vises på niveausiden. */
  guldSvarerTil: string;
};

export type Kategori = {
  id: KategoriId;
  navn: string;
  beskrivelse: string;
  farve: string;
  farveLys: string;
  /**
   * Rundelængde og krav sættes pr. kategori, ikke globalt.
   * Regnearterne blev bygget med fem opgaver og fire rigtige, og de tal
   * bliver stående — ellers ville elevernes gamle resultater holde op med
   * at tælle som klaret.
   */
  opgaverPrRunde: number;
  kraevedeRigtige: number;
  emner: Emne[];
};

export const KATALOG: Kategori[] = [
  {
    id: "regnearterne",
    opgaverPrRunde: 5,
    kraevedeRigtige: 4,
    navn: "Regnearterne",
    beskrivelse:
      "Plus, minus, gange og division — hvor det gælder om at finde den smarte vej, ikke om at stille op med mente.",
    farve: "var(--terra)",
    farveLys: "var(--terra-lys)",
    emner: [
      {
        id: "addition",
        navn: "Addition",
        kort: "Rund op, og træk tilbage. Find parret der giver 100 eller 1000.",
        farve: "var(--terra)",
        farveLys: "var(--terra-lys)",
        guldSvarerTil: "Opgave 5.1 i prøven uden hjælpemidler",
      },
      {
        id: "subtraktion",
        navn: "Subtraktion",
        kort: "Tæl op i stedet for at trække fra. Flyt begge tal lige meget.",
        farve: "var(--teal)",
        farveLys: "var(--teal-lys)",
        guldSvarerTil: "Opgave 5.2 i prøven uden hjælpemidler",
      },
      {
        id: "multiplikation",
        navn: "Multiplikation",
        kort: "Byt om på faktorerne, så to af dem giver 100 eller 1000.",
        farve: "var(--blaa)",
        farveLys: "var(--blaa-lys)",
        guldSvarerTil: "Opgave 5.3 i prøven uden hjælpemidler",
      },
      {
        id: "division",
        navn: "Division",
        kort: "Del tallet op i dele, der går op. Halvér i stedet for at dividere med 8.",
        farve: "var(--lilla)",
        farveLys: "var(--lilla-lys)",
        guldSvarerTil: "Opgave 5.4 i prøven uden hjælpemidler",
      },
    ],
  },
  {
    id: "enhedsomregning",
    opgaverPrRunde: 10,
    kraevedeRigtige: 8,
    navn: "Enhedsomregning",
    beskrivelse:
      "Trappen og fornemmelsen for, hvor stort et tal egentlig er. To sikre point i hver eneste prøve.",
    farve: "var(--vand)",
    farveLys: "var(--vand-lys)",
    emner: [
      {
        id: "omregning",
        navn: "Omregning",
        kort: "Hvilken vej går jeg, hvor mange trin, og hvor skal kommaet hen?",
        farve: "var(--vand)",
        farveLys: "var(--vand-lys)",
        guldSvarerTil: "Opgave 11/12: Omskriv størrelserne",
      },
      {
        id: "vurdering",
        navn: "Vurdering",
        kort: "Er tallet rimeligt? Størrelsesorden og overslag frem for præcis udregning.",
        farve: "var(--okker)",
        farveLys: "var(--okker-lys)",
        guldSvarerTil: "Opgave 8/9: Brug overslagsregning",
      },
    ],
  },
  {
    id: "procentogbroek",
    opgaverPrRunde: 10,
    kraevedeRigtige: 8,
    navn: "Procent og brøk",
    beskrivelse:
      "Det samme tal skrevet på tre måder — og hvad man kan regne med det. Fire til seks delopgaver i hvert eneste prøvesæt, spredt ud over hele prøven.",
    farve: "var(--lilla)",
    farveLys: "var(--lilla-lys)",
    emner: [
      {
        id: "skrivemaader",
        navn: "Brøk, decimaltal og procent",
        kort: "Samme tal, tre skrivemåder. Kan du skifte mellem dem uden at tælle på fingre?",
        farve: "var(--lilla)",
        farveLys: "var(--lilla-lys)",
        guldSvarerTil: 'Opgave 7: "Skriv 60 % som en brøk"',
      },
      {
        id: "procentregning",
        navn: "Procentregning",
        kort: "Procent af et beløb, rabat, og den baglæns: hvor stort var det hele?",
        farve: "var(--terra)",
        farveLys: "var(--terra-lys)",
        guldSvarerTil: "Opgave 1.3: rabat — i hvert eneste sæt",
      },
      {
        id: "sammenlign",
        navn: "Sammenlign",
        kort: "Hvad er størst? Og hvad ligger imellem to brøker?",
        farve: "var(--teal)",
        farveLys: "var(--teal-lys)",
        guldSvarerTil: 'Opgave 10: "Hvilken brøk er større end 1?"',
      },
    ],
  },
];

export function findKategori(id: string): Kategori | undefined {
  return KATALOG.find((k) => k.id === id);
}

export function findEmne(kategoriId: string, emneId: string): Emne | undefined {
  return findKategori(kategoriId)?.emner.find((e) => e.id === emneId);
}

export const ALLE_EMNER: Emne[] = KATALOG.flatMap((k) => k.emner);

export type Krav = { opgaver: number; kraevede: number };

/** Hvor mange opgaver en runde i dette emne har, og hvor mange der skal være rigtige. */
export function kravFor(emneId: string): Krav {
  const k = KATALOG.find((kat) => kat.emner.some((e) => e.id === emneId));
  return {
    opgaver: k?.opgaverPrRunde ?? 10,
    kraevede: k?.kraevedeRigtige ?? 8,
  };
}

/** Emner hvor rundelængden blev ændret fra 5 til 10 undervejs. */
export const EMNER_SKIFTET_TIL_TI: string[] = ["omregning", "vurdering"];
