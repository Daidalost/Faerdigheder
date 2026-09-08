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

export default function Forside() {
  const [f, setF] = useState<Fremskridt>({});
  const [klar, setKlar] = useState(false);

  useEffect(() => {
    setF(laesFremskridt());
    setKlar(true);
  }, []);

  return (
    <>
      <Toplinje accent="var(--terra)" />
      <main className="side">
        <p className="kicker" style={{ ["--accent" as string]: "var(--terra)" }}>
          Matematik uden hjælpemidler · 8. klasse
        </p>
        <h1 className="titel">Færdigheder</h1>
        <p className="manchet">
          Kortere runder på fem opgaver. Klarer du mindst fire, låser du næste niveau op.
          Guld ligger på samme niveau som prøven uden hjælpemidler.
        </p>

        <div style={{ maxWidth: 420, marginTop: 22, ["--accent" as string]: "var(--blaek)" }}>
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
                  <p className="kicker">{kategori.emner.length} emner</p>
                  <h2 style={{ marginTop: 4 }}>{kategori.navn}</h2>
                </div>
              </div>
              <p>{kategori.beskrivelse}</p>

              <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
                {kategori.emner.map((emne) => (
                  <div
                    key={emne.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      fontSize: 14.5,
                      color: "var(--blaek-lys)",
                    }}
                  >
                    <span>{emne.navn}</span>
                    <Medaljer
                      opnaaet={NIVEAU_RAEKKEFOELGE.filter((n) => erGennemfoert(f, emne.id, n))}
                      klar={klar}
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
