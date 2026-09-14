"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { KATALOG } from "@/lib/katalog";
import {
  laesFremskridt,
  kategoriAndel,
  samletAndel,
  erGennemfoert,
  nulstil,
  type Fremskridt,
} from "@/lib/fremskridt";
import { NIVEAU_RAEKKEFOELGE } from "@/lib/typer";
import { Medaljer, Statuslinje, Toplinje } from "./Deler";
import { Pokal } from "./Ikoner";

export default function Forside() {
  const [f, setF] = useState<Fremskridt>({});
  const [klar, setKlar] = useState(false);

  useEffect(() => {
    setF(laesFremskridt());
    setKlar(true);
  }, []);

  const alleEmner = KATALOG.flatMap((k) => k.emner);
  const ialt = alleEmner.length * NIVEAU_RAEKKEFOELGE.length;
  const pokaler = alleEmner.reduce(
    (sum, e) => sum + NIVEAU_RAEKKEFOELGE.filter((n) => erGennemfoert(f, e.id, n)).length,
    0,
  );

  return (
    <>
      <Toplinje accent="var(--terra)" />
      <main className="side">
        <p className="kicker" style={{ ["--accent" as string]: "var(--terra)" }}>
          Matematik uden hjælpemidler · 8. klasse
        </p>
        <h1 className="titel">Færdigheder</h1>
        <p className="manchet">
          Korte runder, hvor du skal have langt de fleste rigtige for at låse næste
          niveau op. Guld ligger på samme niveau som prøven uden hjælpemidler — og
          platin ligger over.
        </p>

        <div style={{ marginTop: 22 }}>
          <span className="pokaltaeller">
            <Pokal stoerrelse={30} daempet={pokaler === 0} svaever={pokaler > 0} />
            <span>
              <span className="tal">{klar ? pokaler : "–"}</span>{" "}
              <span className="af">af {ialt} niveauer klaret</span>
            </span>
          </span>
        </div>

        <div style={{ maxWidth: 420, marginTop: 18, ["--accent" as string]: "var(--blaek)" }}>
          <Statuslinje andel={samletAndel(f)} etiket="Samlet fremskridt" klar={klar} />
        </div>

        <hr className="skillelinje" />

        <div className="gitter to">
          {KATALOG.map((kategori) => (
            <Link
              key={kategori.id}
              href={`/kategori/${kategori.id}`}
              className="kort stabel"
              style={{ ["--accent" as string]: kategori.farve }}
            >
              <div className="kortHoved">
                <div>
                  <p className="kicker">
                    {kategori.emner.length} emner · {kategori.opgaverPrRunde} opgaver pr. runde
                  </p>
                  <h2 style={{ marginTop: 4 }}>{kategori.navn}</h2>
                </div>
              </div>
              <p>{kategori.beskrivelse}</p>

              <div style={{ marginTop: 14 }}>
                {kategori.emner.map((emne) => (
                  <div key={emne.id} className="emnelinje">
                    <span>{emne.navn}</span>
                    <Medaljer
                      opnaaet={NIVEAU_RAEKKEFOELGE.filter((n) => erGennemfoert(f, emne.id, n))}
                      klar={klar}
                      stoerrelse={26}
                    />
                  </div>
                ))}
              </div>

              <Statuslinje
                andel={kategoriAndel(f, kategori.id)}
                etiket="Niveauer klaret"
                klar={klar}
              />
            </Link>
          ))}
        </div>

        <div className="fod">
          <span>
            Fremskridtet gemmes i din browser. Bruger du en anden computer, starter du forfra.
          </span>
          {klar && (
            <button
              onClick={() => {
                if (confirm("Vil du slette alt fremskridt på denne computer?")) {
                  nulstil();
                  setF({});
                }
              }}
            >
              Nulstil fremskridt
            </button>
          )}
        </div>
      </main>
    </>
  );
}
