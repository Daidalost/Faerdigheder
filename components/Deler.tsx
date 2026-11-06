import Link from "next/link";
import type { NiveauId } from "@/lib/typer";
import { NIVEAU_RAEKKEFOELGE } from "@/lib/typer";
import { Diamant, Medalje, Pokal } from "./Ikoner";

export function Toplinje({ accent }: { accent: string }) {
  return (
    <div className="toplinje" style={{ ["--accent" as string]: accent }}>
      <span />
      <span />
    </div>
  );
}

export function Statuslinje({
  andel,
  etiket,
  klar,
}: {
  andel: number;
  etiket: string;
  klar: boolean;
}) {
  const procent = Math.round(andel * 100);
  return (
    <div className="status">
      <div className="statusTekst">
        <span>{etiket}</span>
        <span>{klar ? `${procent} %` : " "}</span>
      </div>
      <div className="statusSpor">
        <div className="statusFyld" style={{ width: klar ? `${procent}%` : "0%" }} />
      </div>
    </div>
  );
}

const FULDT_NAVN: Record<NiveauId, string> = {
  bronze: "Bronze",
  soelv: "Sølv",
  guld: "Guld",
  platin: "Platin",
};

/** Tre medaljer i rækken. De opnåede er farvede, resten er stiplede omrids. */
export function Medaljer({
  opnaaet,
  klar,
  stoerrelse = 30,
}: {
  opnaaet: NiveauId[];
  klar: boolean;
  stoerrelse?: number;
}) {
  return (
    <div className="medaljer" aria-label="Opnåede niveauer">
      {NIVEAU_RAEKKEFOELGE.map((n) => {
        const har = klar && opnaaet.includes(n);
        return (
          <span
            key={n}
            className={`medalje ${n} ${har ? "opnaaet" : ""}`}
            title={`${FULDT_NAVN[n]}${har ? " — klaret" : " — ikke klaret endnu"}`}
          >
            {n === "platin" ? (
              <Diamant stoerrelse={stoerrelse} daempet={!har} />
            ) : n === "guld" ? (
              <Pokal stoerrelse={stoerrelse} daempet={!har} />
            ) : (
              <Medalje niveau={n} stoerrelse={stoerrelse} daempet={!har} />
            )}
          </span>
        );
      })}
    </div>
  );
}

/**
 * Sætter tekst med rigtige brøkstreger. Alt der ser ud som "3/5" bliver
 * til en stablet brøk — så opgaverne ligner dem i prøvesættene.
 * Division skrives med " : " i appen, så skråstregen er altid en brøk.
 *
 * Ligningerne bruger også bogstaver og parenteser i brøken:
 * "x/5", "6x/4", "12/x" og "(x + 5)/2". Parentesen om tælleren er kun
 * til for at markere, hvad der står over brøkstregen — den vises ikke.
 */
const BROEK = /(\([^()]+\)|\d*x|\d+)\/(\d+|x)/g;

export function Udtryk({ tekst }: { tekst: string }) {
  const dele: { slags: "tekst" | "broek"; t: string; n?: string }[] = [];
  let sidst = 0;
  for (const m of tekst.matchAll(BROEK)) {
    const start = m.index ?? 0;
    if (start > sidst) dele.push({ slags: "tekst", t: tekst.slice(sidst, start) });
    const taeller = m[1].startsWith("(") ? m[1].slice(1, -1) : m[1];
    dele.push({ slags: "broek", t: taeller, n: m[2] });
    sidst = start + m[0].length;
  }
  if (sidst < tekst.length) dele.push({ slags: "tekst", t: tekst.slice(sidst) });
  return (
    <>
      {dele.map((del, i) =>
        del.slags === "tekst" ? (
          <span key={i}>{del.t}</span>
        ) : (
          <span className="broek" key={i}>
            <span className="t">{del.t}</span>
            <span className="n">{del.n}</span>
          </span>
        ),
      )}
    </>
  );
}

export function Tilbage({ href, tekst }: { href: string; tekst: string }) {
  return (
    <Link className="tilbage" href={href}>
      <span aria-hidden>←</span>
      {tekst}
    </Link>
  );
}

export const NIVEAU_NAVN = FULDT_NAVN;
