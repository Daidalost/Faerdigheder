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
  emner: Emne[];
};

export const KATALOG: Kategori[] = [
  {
    id: "regnearterne",
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
];

export function findKategori(id: string): Kategori | undefined {
  return KATALOG.find((k) => k.id === id);
}

export function findEmne(kategoriId: string, emneId: string): Emne | undefined {
  return findKategori(kategoriId)?.emner.find((e) => e.id === emneId);
}

export const ALLE_EMNER: Emne[] = KATALOG.flatMap((k) => k.emner);
