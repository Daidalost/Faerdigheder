import type { Opgave, NiveauId } from "../typer";
import { bland, dansk, heltal, vaelg, type Rng } from "../tilfaeldig";

/**
 * Størrelsesfornemmelse og overslag.
 *
 * Bronze og sølv: "hvilken enhed passer" og "hvad er størst" — formatet fra
 * december 2025 og maj 2026, hvor den rene omregningsopgave blev afløst af
 * en vurderingsopgave.
 * Guld: overslagsregning med decimaltal, som i FP9 Opgave 8/9, hvor det kun
 * gælder om at ramme størrelsesordenen.
 */

type BankPost = {
  tekst: string;
  valg: string[];
  svar: string;
  hint: string;
};

const BRONZE: BankPost[] = [
  { tekst: "En dåse sodavand indeholder cirka", valg: ["33 mL", "33 cL", "33 dL", "33 L"], svar: "33 cL", hint: "En dåse er en tredjedel af en literflaske. 33 cL er 0,33 L." },
  { tekst: "En elev i 8. klasse vejer cirka", valg: ["5 kg", "50 kg", "500 kg", "5000 kg"], svar: "50 kg", hint: "5 kg er en stor kat, 500 kg er en hest." },
  { tekst: "Et glas vand rummer cirka", valg: ["2 mL", "2 cL", "2 dL", "2 L"], svar: "2 dL", hint: "Der går cirka 5 glas på en literflaske, så et glas er omkring 2 dL." },
  { tekst: "Der er cirka så højt op til loftet i klassen", valg: ["3 cm", "3 dm", "3 m", "3 km"], svar: "3 m", hint: "En dør er 2 m høj, og der er lidt mere op til loftet." },
  { tekst: "En bærbar computer vejer cirka", valg: ["20 g", "200 g", "2 kg", "20 kg"], svar: "2 kg", hint: "Omtrent som to literflasker vand." },
  { tekst: "Et æble vejer cirka", valg: ["15 g", "150 g", "1,5 kg", "15 kg"], svar: "150 g", hint: "Der går cirka 6-7 æbler på et kilo." },
  { tekst: "En mælkekarton rummer cirka", valg: ["1 mL", "1 cL", "1 dL", "1 L"], svar: "1 L", hint: "Mælkekartonen er selve målestokken for en liter." },
  { tekst: "En blyant er cirka så lang", valg: ["17 mm", "17 cm", "17 dm", "17 m"], svar: "17 cm", hint: "17 mm er kortere end din tommelfinger." },
  { tekst: "En skoledag varer cirka", valg: ["6 minutter", "6 timer", "6 døgn", "6 uger"], svar: "6 timer", hint: "Fra kl. 8 til kl. 14 er der 6 timer." },
  { tekst: "En fodboldbane er cirka så lang", valg: ["105 mm", "105 cm", "105 m", "105 km"], svar: "105 m", hint: "105 km er afstanden mellem to byer." },
  { tekst: "Et badekar rummer cirka", valg: ["1,5 L", "15 L", "150 L", "1500 L"], svar: "150 L", hint: "Det svarer til 150 mælkekartoner." },
  { tekst: "En dør er cirka så høj", valg: ["2 cm", "2 dm", "2 m", "2 km"], svar: "2 m", hint: "Du er selv omkring 1,7 m høj." },
  { tekst: "En pose hvedemel vejer cirka", valg: ["1 g", "10 g", "100 g", "1 kg"], svar: "1 kg", hint: "En pose mel er den klassiske kilomålestok." },
  { tekst: "En teskefuld rummer cirka", valg: ["5 mL", "5 cL", "5 dL", "5 L"], svar: "5 mL", hint: "5 dL ville være et halvt glas ekstra vand — alt for meget til en teske." },
  { tekst: "En mobiltelefon vejer cirka", valg: ["2 g", "20 g", "200 g", "2 kg"], svar: "200 g", hint: "Cirka som et stort æble." },
  { tekst: "En almindelig bil vejer cirka", valg: ["12 kg", "120 kg", "1200 kg", "12000 kg"], svar: "1200 kg", hint: "Lidt over et ton." },
  { tekst: "Et A4-papir er cirka så bredt", valg: ["21 mm", "21 cm", "21 dm", "21 m"], svar: "21 cm", hint: "Papiret er lidt bredere end en linjal på 20 cm." },
  { tekst: "En banan vejer cirka", valg: ["1,2 g", "12 g", "120 g", "1200 g"], svar: "120 g", hint: "Omtrent som et æble." },
  { tekst: "En cykeltur ind til byen tager cirka", valg: ["20 sekunder", "20 minutter", "20 timer", "20 døgn"], svar: "20 minutter", hint: "20 timer ville være næsten et helt døgn på cyklen." },
  { tekst: "En terning er cirka så bred", valg: ["16 mm", "16 cm", "16 dm", "16 m"], svar: "16 mm", hint: "16 cm ville være større end din hånd." },
  { tekst: "Et klasselokale er cirka så langt", valg: ["8 cm", "8 dm", "8 m", "8 km"], svar: "8 m", hint: "Cirka fire døre lagt efter hinanden." },
  { tekst: "En tekop rummer cirka", valg: ["2,5 mL", "2,5 cL", "2,5 dL", "2,5 L"], svar: "2,5 dL", hint: "En kop er lidt mere end et almindeligt glas." },
  { tekst: "En sukkerknald vejer cirka", valg: ["3 mg", "3 g", "30 g", "3 kg"], svar: "3 g", hint: "Der går omkring 300 sukkerknalder på et kilo." },
  { tekst: "Fra skolen til stationen er der cirka", valg: ["1,2 mm", "1,2 cm", "1,2 m", "1,2 km"], svar: "1,2 km", hint: "Det er cirka et kvarters gang." },
  { tekst: "En vandflaske fra kantinen rummer cirka", valg: ["5 mL", "5 cL", "5 dL", "5 L"], svar: "5 dL", hint: "En halv liter — halvdelen af en mælkekarton." },
  { tekst: "En nøgle vejer cirka", valg: ["1 g", "10 g", "100 g", "1 kg"], svar: "10 g", hint: "Du kan næsten ikke mærke den i hånden." },
  { tekst: "Et bord er cirka så langt", valg: ["12 cm", "1,2 m", "12 m", "120 m"], svar: "1,2 m", hint: "To skoletasker ved siden af hinanden." },
  { tekst: "En kuglepen er cirka så lang", valg: ["14 mm", "14 cm", "14 dm", "14 m"], svar: "14 cm", hint: "Lidt kortere end en linjal på 20 cm." },
  { tekst: "En skoletaske vejer cirka", valg: ["40 g", "400 g", "4 kg", "40 kg"], svar: "4 kg", hint: "Fire pakker mel." },
  { tekst: "En frokostpause varer cirka", valg: ["30 sekunder", "30 minutter", "30 timer", "30 døgn"], svar: "30 minutter", hint: "En halv time." },
  { tekst: "Et vindue er cirka så bredt", valg: ["9 mm", "9 cm", "9 dm", "9 m"], svar: "9 dm", hint: "9 dm er 90 cm — knap en meter." },
  { tekst: "En liter mælk vejer cirka", valg: ["10 g", "100 g", "1 kg", "10 kg"], svar: "1 kg", hint: "Væske vejer omtrent 1 kg pr. liter." },
  { tekst: "En kat vejer cirka", valg: ["45 g", "450 g", "4,5 kg", "45 kg"], svar: "4,5 kg", hint: "Du kan sagtens løfte den med én arm." },
  { tekst: "En håndbold vejer cirka", valg: ["4 g", "45 g", "450 g", "4,5 kg"], svar: "450 g", hint: "Under et halvt kilo." },
  { tekst: "Et klasseværelse er cirka så højt", valg: ["3 dm", "3 m", "30 m", "3 km"], svar: "3 m", hint: "Lidt højere end en dør." },
  { tekst: "En dåse tun indeholder cirka", valg: ["1,6 g", "16 g", "160 g", "1,6 kg"], svar: "160 g", hint: "Cirka som et æble." },
  { tekst: "Et svømmebassin er cirka så langt", valg: ["25 cm", "25 dm", "25 m", "25 km"], svar: "25 m", hint: "En banelængde i en almindelig svømmehal." },
  { tekst: "En kop te rummer cirka", valg: ["25 mL", "25 cL", "25 dL", "25 L"], svar: "25 cL", hint: "25 cL er 0,25 L — en fjerdedel liter." },
  { tekst: "En elev er cirka så høj", valg: ["17 cm", "1,7 m", "17 m", "170 m"], svar: "1,7 m", hint: "Lidt under dørhøjde." },
  { tekst: "Et brev vejer cirka", valg: ["2 g", "20 g", "200 g", "2 kg"], svar: "20 g", hint: "Næsten ingenting — som fire sukkerknalder." },
  { tekst: "En nat varer cirka", valg: ["8 minutter", "8 timer", "8 døgn", "8 uger"], svar: "8 timer", hint: "En tredjedel af et døgn." },
  { tekst: "Et trappetrin er cirka så højt", valg: ["18 mm", "18 cm", "18 dm", "18 m"], svar: "18 cm", hint: "Cirka en håndsbredde." },
];

const SOELV: BankPost[] = [
  { tekst: "En spand vand rummer cirka", valg: ["1 L", "10 L", "100 L", "1000 L"], svar: "10 L", hint: "Ti mælkekartoner fylder omtrent en spand." },
  { tekst: "En dør er cirka så bred", valg: ["9 cm", "90 cm", "9 m", "90 m"], svar: "90 cm", hint: "Lidt mindre end en meter." },
  { tekst: "En sæk kartofler vejer cirka", valg: ["100 g", "1 kg", "10 kg", "100 kg"], svar: "10 kg", hint: "Du kan lige løfte den — men ikke bære den langt." },
  { tekst: "Et vindue er cirka så højt", valg: ["12 cm", "1,2 m", "12 m", "120 m"], svar: "1,2 m", hint: "Lidt lavere end dig selv." },
  { tekst: "En spiseskefuld rummer cirka", valg: ["1,5 mL", "15 mL", "150 mL", "1,5 L"], svar: "15 mL", hint: "Tre teskefulde giver en spiseskefuld." },
  { tekst: "En cykel vejer cirka", valg: ["1,4 kg", "14 kg", "140 kg", "1400 kg"], svar: "14 kg", hint: "Du kan løfte den op med én arm — men lige akkurat." },
  { tekst: "Et frimærke er cirka så bredt", valg: ["2,5 mm", "2,5 cm", "2,5 dm", "2,5 m"], svar: "2,5 cm", hint: "Omtrent bredden af din tommelfingernegl." },
  { tekst: "Der er cirka så langt fra København til Aarhus", valg: ["3 km", "30 km", "300 km", "3000 km"], svar: "300 km", hint: "Cirka tre timers kørsel." },
  { tekst: "En brusebad bruger cirka", valg: ["6 L", "60 L", "600 L", "6000 L"], svar: "60 L", hint: "Cirka seks spande vand." },
  { tekst: "En pakke smør vejer cirka", valg: ["2,5 g", "25 g", "250 g", "2,5 kg"], svar: "250 g", hint: "Fire pakker giver et kilo." },
  { tekst: "Et bord er cirka så højt", valg: ["7,5 cm", "75 cm", "7,5 m", "75 m"], svar: "75 cm", hint: "Cirka i navlehøjde." },
  { tekst: "En liter vand vejer cirka", valg: ["1 g", "10 g", "100 g", "1 kg"], svar: "1 kg", hint: "En liter vand vejer præcis 1 kg — værd at huske." },
  { tekst: "En fodbold vejer cirka", valg: ["4,3 g", "43 g", "430 g", "4,3 kg"], svar: "430 g", hint: "Lidt under et halvt kilo." },
  { tekst: "En etage i et hus er cirka så høj", valg: ["2,8 cm", "2,8 dm", "2,8 m", "2,8 km"], svar: "2,8 m", hint: "Lidt højere end en dør." },
  { tekst: "En madpakke vejer cirka", valg: ["3 g", "30 g", "300 g", "3 kg"], svar: "300 g", hint: "Cirka som to æbler." },
  { tekst: "En skoletime varer cirka", valg: ["45 sekunder", "45 minutter", "45 timer", "45 døgn"], svar: "45 minutter", hint: "Trekvart time." },
];

/** Enheder til sammenligningsopgaverne: [stor, lille, forhold]. */
const SAMMENLIGN: Array<[string, string, number]> = [
  ["L", "mL", 1000],
  ["L", "dL", 10],
  ["kg", "g", 1000],
  ["m", "cm", 100],
  ["km", "m", 1000],
  ["dL", "mL", 100],
  ["cm", "mm", 10],
  ["timer", "minutter", 60],
];

const SAMMENLIGN_LET: Array<[string, string, number]> = [
  ["L", "mL", 1000],
  ["kg", "g", 1000],
  ["m", "cm", 100],
  ["L", "dL", 10],
  ["km", "m", 1000],
];

const SAMMENLIGN_GULD: Array<[string, string, number]> = [
  ["m", "mm", 1000],
  ["L", "mL", 1000],
  ["kg", "g", 1000],
  ["km", "m", 1000],
  ["m", "cm", 100],
  ["dL", "mL", 100],
];

type Sammenligningsgrad = "let" | "mellem" | "svaer";

function lavSammenligning(rng: Rng, grad: Sammenligningsgrad): Opgave {
  const tabel =
    grad === "svaer" ? SAMMENLIGN_GULD : grad === "let" ? SAMMENLIGN_LET : SAMMENLIGN;
  const [stor, lille, forhold] = vaelg(rng, tabel);
  const trin = forhold / 10;
  // Venstre side: et tal med én (eller to) decimaler i den store enhed
  const tiendedele = grad === "svaer" ? heltal(rng, 12, 195) : heltal(rng, 3, 19);
  const storVaerdi = grad === "svaer" ? tiendedele / 100 : tiendedele / 10;
  const storBasis = Math.round(storVaerdi * forhold);
  // Højre side: et rundt tal i den lille enhed, tæt på men ikke lig med
  const spring = trin * heltal(rng, grad === "let" ? 3 : 1, grad === "svaer" ? 2 : 6);
  const opad = rng() < 0.5;
  const lilleBasis = Math.max(trin, storBasis + (opad ? spring : -spring));
  if (lilleBasis === storBasis) return lavSammenligning(rng, grad);

  const a = `${dansk(storVaerdi, 4)} ${stor}`;
  const b = `${dansk(lilleBasis, 4)} ${lille}`;
  const rigtigt = storBasis > lilleBasis ? a : b;
  const raekkefoelge = rng() < 0.5 ? [a, b] : [b, a];

  return {
    noegle: `sml:${storBasis}:${lilleBasis}:${stor}${lille}`,
    slags: "valg",
    optakt: "Hvad er størst?",
    spoergsmaal: `${raekkefoelge[0]}  eller  ${raekkefoelge[1]}`,
    svar: rigtigt,
    valg: raekkefoelge,
    strategi: "Samme enhed først",
    hint: `Lav det ene tal om, før du sammenligner. ${dansk(storVaerdi, 4)} ${stor} er ${dansk(storBasis, 4)} ${lille}.`,
  };
}

/** Overslagsregning: kun størrelsesordenen skal rammes. */
function lavOverslag(rng: Rng): Opgave {
  const gange = rng() < 0.5;
  let udtryk: string;
  let vaerdi: number;
  let hint: string;

  if (gange) {
    const A = heltal(rng, 105, 985); // fx 43,6
    const B = heltal(rng, 2, 9); // fx 0,8
    const a = A / 10;
    const b = B / 10;
    vaerdi = Number(((A * B) / 100).toFixed(4));
    udtryk = `${dansk(a, 2)} · ${dansk(b, 2)}`;
    hint = `${dansk(b, 2)} er lidt under 1, så svaret må være lidt mindre end ${dansk(a, 2)}. Gang cifrene, og placer kommaet derefter.`;
  } else {
    const a = heltal(rng, 11, 98);
    const B = vaelg(rng, [2, 4, 5, 8]);
    const b = B / 10;
    vaerdi = Number(((a * 10) / B).toFixed(4));
    udtryk = `${a} : ${dansk(b, 2)}`;
    hint = `Du dividerer med et tal under 1, så svaret bliver STØRRE end ${a}. ${a} : ${dansk(b, 2)} er det samme som ${a * 10} : ${B}.`;
  }

  const muligheder = [-2, -1, 0, 1, 2].map((k) => dansk(Number((vaerdi * Math.pow(10, k)).toFixed(6)), 6));
  return {
    noegle: `ovs:${udtryk}`,
    slags: "valg",
    optakt: "Brug overslagsregning. Hvad er resultatet?",
    spoergsmaal: udtryk,
    svar: dansk(vaerdi, 6),
    valg: muligheder,
    strategi: "Ram størrelsesordenen",
    hint,
  };
}

function fraBank(rng: Rng, bank: BankPost[]): Opgave {
  const post = vaelg(rng, bank);
  return {
    noegle: `bank:${post.tekst}`,
    slags: "valg",
    optakt: "Vurdér, og vælg ét svar",
    spoergsmaal: post.tekst,
    svar: post.svar,
    valg: bland(rng, post.valg),
    strategi: "Hold det op mod noget, du kender",
    hint: post.hint,
  };
}

export function lavVurdering(rng: Rng, niveau: NiveauId): Opgave {
  if (niveau === "bronze") {
    return rng() < 0.55 ? fraBank(rng, BRONZE) : lavSammenligning(rng, "let");
  }
  if (niveau === "soelv") {
    return rng() < 0.45 ? fraBank(rng, SOELV) : lavSammenligning(rng, "mellem");
  }
  return rng() < 0.62 ? lavOverslag(rng) : lavSammenligning(rng, "svaer");
}
