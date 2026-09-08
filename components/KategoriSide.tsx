"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Kategori } from "@/lib/katalog";
import {
  laesFremskridt,
  kategoriAndel,
  emneAndel,
  erGennemfoert,
  naesteNiveau,
  type Fremskridt,
} from "@/lib/fremskridt";
import { NIVEAU_RAEKKEFOELGE } from "@/lib/typer";
import { Medaljer, NIVEAU_NAVN, Statuslinje, Tilbage, Toplinje } from "./Deler";

export default function KategoriSide({ kategori }: { kategori: Kategori }) {
  const [f, setF] = useState<Fremskridt>({});
  const [klar, setKlar] = useState(false);

  useEffect(() => {
    setF(laesFremskridt());
    setKlar(true);
  }, []);

  return (
    <>
      <Toplinje accent={kategori.farve} />
      <main className="side" style={{ ["--accent" as string]: kategori.farve }}>
        <Tilbage href="/" tekst="Forside" />
        <p className="kicker">Færdigheder</p>
        <h1 className="titel">{kategori.navn}</h1>
        <p className="manchet">{kategori.beskrivelse}</p>

        <div style={{ maxWidth: 420, marginTop: 20 }}>
          <Statuslinje
            andel={kategoriAndel(f, kategori.id)}
            etiket="Niveauer klaret i denne kategori"
            klar={klar}
          />
        </div>

        <hr className="skillelinje" />

        <div className="gitter to">
          {kategori.emner.map((emne) => {
            const naeste = naesteNiveau(f, emne.id);
            const alleKlaret = NIVEAU_RAEKKEFOELGE.every((n) => erGennemfoert(f, emne.id, n));
            return (
              <Link
                key={emne.id}
                href={`/kategori/${kategori.id}/${emne.id}`}
                className="kort stabel"
                style={{ ["--accent" as string]: emne.farve }}
              >
                <div className="kortHoved">
                  <h2>{emne.navn}</h2>
                  <Medaljer
                    opnaaet={NIVEAU_RAEKKEFOELGE.filter((n) => erGennemfoert(f, emne.id, n))}
                    klar={klar}
                  />
                </div>
                <p>{emne.kort}</p>
                <Statuslinje
                  andel={emneAndel(f, emne.id)}
                  etiket={
                    !klar
                      ? " "
                      : alleKlaret
                        ? "Alle tre niveauer klaret"
                        : `Næste: ${NIVEAU_NAVN[naeste]}`
                  }
                  klar={klar}
                />
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
