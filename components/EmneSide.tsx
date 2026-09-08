"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Emne, Kategori } from "@/lib/katalog";
import {
  laesFremskridt,
  emneAndel,
  erGennemfoert,
  erLaastOp,
  type Fremskridt,
} from "@/lib/fremskridt";
import { NIVEAUER, OPGAVER_PR_RUNDE, KRAEVEDE_RIGTIGE } from "@/lib/typer";
import { Statuslinje, Tilbage, Toplinje } from "./Deler";
import { Laas, Medalje, Pokal } from "./Ikoner";

const MAERKEFARVE: Record<string, string> = {
  bronze: "var(--bronze-farve)",
  soelv: "var(--soelv-farve)",
  guld: "var(--guld-farve)",
};

export default function EmneSide({ kategori, emne }: { kategori: Kategori; emne: Emne }) {
  const [f, setF] = useState<Fremskridt>({});
  const [klar, setKlar] = useState(false);

  useEffect(() => {
    setF(laesFremskridt());
    setKlar(true);
  }, []);

  return (
    <>
      <Toplinje accent={emne.farve} />
      <main className="side" style={{ ["--accent" as string]: emne.farve }}>
        <Tilbage href={`/kategori/${kategori.id}`} tekst={kategori.navn} />
        <p className="kicker">{kategori.navn}</p>
        <h1 className="titel">{emne.navn}</h1>
        <p className="manchet">{emne.kort}</p>

        <div style={{ maxWidth: 420, marginTop: 20 }}>
          <Statuslinje andel={emneAndel(f, emne.id)} etiket="Niveauer klaret" klar={klar} />
        </div>

        <hr className="skillelinje" />

        <div className="gitter">
          {NIVEAUER.map((niveau) => {
            const aaben = !klar ? niveau.id === "bronze" : erLaastOp(f, emne.id, niveau.id);
            const klaret = klar && erGennemfoert(f, emne.id, niveau.id);
            const bedste = f[emne.id]?.bedste?.[niveau.id];
            const indhold = (
              <>
                <span
                  className={`niveauMaerke ${aaben ? "" : "tom"}`}
                  style={{ ["--niveaufarve" as string]: MAERKEFARVE[niveau.id] }}
                >
                  {!aaben ? (
                    <Laas stoerrelse={24} />
                  ) : niveau.id === "guld" ? (
                    <Pokal stoerrelse={40} daempet={!klaret} svaever={klaret} />
                  ) : (
                    <Medalje niveau={niveau.id} stoerrelse={38} daempet={!klaret} />
                  )}
                </span>
                <div className="niveauInfo">
                  <h3>{niveau.navn}</h3>
                  <p style={{ color: "var(--blaek-lys)" }}>
                    {niveau.id === "guld"
                      ? `${niveau.beskrivelse} Svarer til ${emne.guldSvarerTil}.`
                      : niveau.beskrivelse}
                  </p>
                </div>
                <div className="niveauStatus">
                  {!klar ? (
                    " "
                  ) : klaret ? (
                    <strong style={{ color: MAERKEFARVE[niveau.id] }}>Klaret</strong>
                  ) : aaben ? (
                    bedste !== undefined ? (
                      `Bedste: ${bedste} / ${OPGAVER_PR_RUNDE}`
                    ) : (
                      "Ikke prøvet"
                    )
                  ) : (
                    "Låst"
                  )}
                </div>
              </>
            );

            if (!aaben) {
              return (
                <div key={niveau.id} className="kort niveauKort laast">
                  {indhold}
                </div>
              );
            }
            // Et niveau, der lige er blevet åbnet, men endnu ikke klaret,
            // får et enkelt glimt hen over kortet, så øjet finder det.
            const nyligtAabnet = klar && !klaret && bedste === undefined && niveau.id !== "bronze";
            return (
              <Link
                key={niveau.id}
                href={`/kategori/${kategori.id}/${emne.id}/${niveau.id}`}
                className={`kort niveauKort ${nyligtAabnet ? "oplaast" : ""}`}
              >
                {indhold}
              </Link>
            );
          })}
        </div>

        <div className="fod">
          <span>
            Hver runde er {OPGAVER_PR_RUNDE} opgaver. Med mindst {KRAEVEDE_RIGTIGE} rigtige låser du
            næste niveau op. Opgaverne er nye hver gang.
          </span>
        </div>
      </main>
    </>
  );
}
