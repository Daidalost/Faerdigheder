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
 */
export function Udtryk({ tekst }: { tekst: string }) {
  const dele = tekst.split(/(\d+\/\d+)/g);
  return (
    <>
      {dele.map((del, i) => {
        const m = del.match(/^(\d+)\/(\d+)$/);
        if (!m) return <span key={i}>{del}</span>;
        return (
          <span className="broek" key={i}>
            <span className="t">{m[1]}</span>
            <span className="n">{m[2]}</span>
          </span>
        );
      })}
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
