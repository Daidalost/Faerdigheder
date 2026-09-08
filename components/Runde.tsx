"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Emne, Kategori } from "@/lib/katalog";
import type { Niveau, Opgave } from "@/lib/typer";
import { NIVEAU_RAEKKEFOELGE, OPGAVER_PR_RUNDE } from "@/lib/typer";
import { lavRunde } from "@/lib/opgaver";
import { erTalRigtigt } from "@/lib/tilfaeldig";
import { gemResultat, laesFremskridt, erGennemfoert } from "@/lib/fremskridt";
import { opsamling, opmuntring, ros } from "@/lib/feedback";
import { NIVEAU_NAVN, Tilbage, Toplinje } from "./Deler";

type Fase = "svarer" | "bedoemt" | "faerdig";

export default function Runde({
  kategori,
  emne,
  niveau,
}: {
  kategori: Kategori;
  emne: Emne;
  niveau: Niveau;
}) {
  const [opgaver, setOpgaver] = useState<Opgave[] | null>(null);
  const [nr, setNr] = useState(0);
  const [fase, setFase] = useState<Fase>("svarer");
  const [input, setInput] = useState("");
  const [valgt, setValgt] = useState<string | null>(null);
  const [resultater, setResultater] = useState<boolean[]>([]);
  const [varKlaretFoer, setVarKlaretFoer] = useState(false);
  const feltRef = useRef<HTMLInputElement>(null);
  const naesteRef = useRef<HTMLButtonElement>(null);

  const nyRunde = useCallback(() => {
    setOpgaver(lavRunde(emne.id, niveau.id));
    setNr(0);
    setFase("svarer");
    setInput("");
    setValgt(null);
    setResultater([]);
  }, [emne.id, niveau.id]);

  // Opgaverne laves først i browseren, så serveren og klienten ikke uenige om indholdet.
  useEffect(() => {
    setVarKlaretFoer(erGennemfoert(laesFremskridt(), emne.id, niveau.id));
    nyRunde();
  }, [nyRunde, emne.id, niveau.id]);

  const opgave = opgaver?.[nr] ?? null;

  useEffect(() => {
    if (fase === "svarer" && opgave?.slags === "tal") feltRef.current?.focus();
    if (fase === "bedoemt") naesteRef.current?.focus();
  }, [fase, nr, opgave?.slags]);

  const rigtige = resultater.filter(Boolean).length;

  const bedoem = useCallback(
    (svar: string) => {
      if (!opgave || fase !== "svarer") return;
      const korrekt =
        opgave.slags === "tal" ? erTalRigtigt(svar, opgave.svar) : svar === opgave.svar;
      setValgt(svar);
      setResultater((r) => [...r, korrekt]);
      setFase("bedoemt");
    },
    [opgave, fase],
  );

  const videre = useCallback(() => {
    if (!opgaver) return;
    if (nr + 1 >= opgaver.length) {
      setFase("faerdig");
      return;
    }
    setNr((n) => n + 1);
    setInput("");
    setValgt(null);
    setFase("svarer");
  }, [nr, opgaver]);

  // Gem resultatet, når runden er slut.
  const gemt = useRef(false);
  useEffect(() => {
    if (fase === "faerdig" && !gemt.current) {
      gemt.current = true;
      gemResultat(emne.id, niveau.id, resultater.filter(Boolean).length);
    }
    if (fase !== "faerdig") gemt.current = false;
  }, [fase, emne.id, niveau.id, resultater]);

  const naesteNiveauId = useMemo(() => {
    const i = NIVEAU_RAEKKEFOELGE.indexOf(niveau.id);
    return i >= 0 && i < NIVEAU_RAEKKEFOELGE.length - 1 ? NIVEAU_RAEKKEFOELGE[i + 1] : null;
  }, [niveau.id]);

  const stil = { ["--accent" as string]: emne.farve };

  if (fase === "faerdig") {
    const bestod = rigtige >= 4;
    const laastOp = bestod && naesteNiveauId ? NIVEAU_NAVN[naesteNiveauId] : null;
    const o = opsamling(rigtige, niveau.id, laastOp, varKlaretFoer);
    return (
      <>
        <Toplinje accent={emne.farve} />
        <main className="side" style={stil}>
          <Tilbage href={`/kategori/${kategori.id}/${emne.id}`} tekst={emne.navn} />
          <div className="kort udenstribe opsamling">
            <div className="opsamlingScore">
              {rigtige}
              <span style={{ fontSize: 26, color: "var(--blaek-lys)" }}>/{OPGAVER_PR_RUNDE}</span>
            </div>
            <h2>{o.overskrift}</h2>
            <p>{o.tekst}</p>
            <div className="opsamlingKnapper">
              <button
                className="knap"
                onClick={() => {
                  gemt.current = false;
                  nyRunde();
                }}
              >
                Ny runde
              </button>
              {bestod && naesteNiveauId && (
                <Link
                  className="knap sekundaer"
                  href={`/kategori/${kategori.id}/${emne.id}/${naesteNiveauId}`}
                >
                  Videre til {NIVEAU_NAVN[naesteNiveauId].toLowerCase()}
                </Link>
              )}
              <Link className="knap sekundaer" href={`/kategori/${kategori.id}/${emne.id}`}>
                Vælg niveau
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Toplinje accent={emne.farve} />
      <main className="side" style={stil}>
        <Tilbage href={`/kategori/${kategori.id}/${emne.id}`} tekst={emne.navn} />

        <div className="rundeHoved">
          <div>
            <p className="kicker">
              {emne.navn} · {niveau.navn}
            </p>
            <h1 className="titel" style={{ fontSize: 24 }}>
              Opgave {Math.min(nr + 1, OPGAVER_PR_RUNDE)} af {OPGAVER_PR_RUNDE}
            </h1>
          </div>
          <div className="prikker" aria-label={`${rigtige} rigtige indtil nu`}>
            {Array.from({ length: OPGAVER_PR_RUNDE }).map((_, i) => (
              <span
                key={i}
                className={`prik ${
                  i < resultater.length
                    ? resultater[i]
                      ? "rigtig"
                      : "forkert"
                    : i === nr && fase === "svarer"
                      ? "nu"
                      : ""
                }`}
              />
            ))}
          </div>
        </div>

        <div className="opgaveKort">
          {!opgave ? (
            <p style={{ color: "var(--blaek-lys)" }}>Henter opgaver …</p>
          ) : (
            <>
              {opgave.optakt && <p className="optakt">{opgave.optakt}</p>}
              <p className={`stykke ${opgave.slags === "valg" ? "tekst" : ""}`}>
                {opgave.spoergsmaal}
              </p>

              {opgave.slags === "tal" ? (
                <form
                  className="svarrække"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (fase === "svarer") {
                      if (input.trim() === "") return;
                      bedoem(input);
                    } else {
                      videre();
                    }
                  }}
                >
                  <input
                    ref={feltRef}
                    className="svarfelt"
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="Dit svar"
                    aria-label="Dit svar"
                    value={input}
                    disabled={fase !== "svarer"}
                    onChange={(e) => setInput(e.target.value)}
                  />
                  {opgave.enhed && <span className="svarEnhed">{opgave.enhed}</span>}
                  <button
                    ref={naesteRef}
                    className="knap"
                    type="submit"
                    disabled={fase === "svarer" && !input.trim()}
                  >
                    {fase === "svarer" ? "Svar" : "Næste"}
                  </button>
                </form>
              ) : (
                <>
                  <div className="valgListe">
                    {opgave.valg?.map((v) => {
                      const erFacit = v === opgave.svar;
                      const klasse =
                        fase === "bedoemt"
                          ? erFacit
                            ? "facit"
                            : v === valgt
                              ? "fejl"
                              : ""
                          : "";
                      return (
                        <button
                          key={v}
                          className={`valgKnap ${klasse}`}
                          disabled={fase !== "svarer"}
                          onClick={() => bedoem(v)}
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                  {fase === "bedoemt" && (
                    <div style={{ marginTop: 18 }}>
                      <button ref={naesteRef} className="knap" onClick={videre}>
                        Næste
                      </button>
                    </div>
                  )}
                </>
              )}

              {fase === "bedoemt" && (
                <div
                  className={`feedback ${resultater[resultater.length - 1] ? "rigtigt" : "forkert"}`}
                >
                  {resultater[resultater.length - 1] ? (
                    <>
                      <strong>{ros(nr)}</strong>
                      <span className="strategimaerke">{opgave.strategi}</span>
                      <div>{opgave.hint}</div>
                    </>
                  ) : (
                    <>
                      <strong>{opmuntring(nr)}</strong>
                      <span className="strategimaerke">{opgave.strategi}</span>
                      <div>{opgave.hint}</div>
                      <div className="facitlinje">
                        Svaret er <strong style={{ display: "inline" }}>{opgave.svar}</strong>
                        {opgave.enhed ? ` ${opgave.enhed}` : ""}.
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
