"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Emne, Kategori } from "@/lib/katalog";
import type { Niveau, Opgave } from "@/lib/typer";
import { KRAEVEDE_RIGTIGE, NIVEAU_RAEKKEFOELGE, OPGAVER_PR_RUNDE } from "@/lib/typer";
import { lavRunde } from "@/lib/opgaver";
import { erTalRigtigt } from "@/lib/tilfaeldig";
import { gemResultat, laesFremskridt, erGennemfoert } from "@/lib/fremskridt";
import { opsamling, opmuntring, ros } from "@/lib/feedback";
import { NIVEAU_NAVN, Tilbage, Toplinje, Udtryk } from "./Deler";
import { Diamant, Flamme, Flueben, Kryds, Medalje, Pokal } from "./Ikoner";
import Konfetti from "./Konfetti";

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
  const [visScore, setVisScore] = useState(0);
  const feltRef = useRef<HTMLInputElement>(null);
  const naesteRef = useRef<HTMLButtonElement>(null);

  const nyRunde = useCallback(() => {
    setOpgaver(lavRunde(emne.id, niveau.id));
    setNr(0);
    setFase("svarer");
    setInput("");
    setValgt(null);
    setResultater([]);
    setVisScore(0);
  }, [emne.id, niveau.id]);

  // Opgaverne laves først i browseren, så server og klient ikke er uenige.
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
  const sidsteVarRigtigt = resultater[resultater.length - 1];

  /** Hvor mange rigtige i træk lige nu. */
  const stime = useMemo(() => {
    let n = 0;
    for (let i = resultater.length - 1; i >= 0 && resultater[i]; i--) n++;
    return n;
  }, [resultater]);

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

  // Scoren tælles op i stedet for bare at stå der.
  useEffect(() => {
    if (fase !== "faerdig") return;
    if (rigtige === 0) return;
    let n = 0;
    const id = setInterval(() => {
      n++;
      setVisScore(n);
      if (n >= rigtige) clearInterval(id);
    }, 130);
    return () => clearInterval(id);
  }, [fase, rigtige]);

  const naesteNiveauId = useMemo(() => {
    const i = NIVEAU_RAEKKEFOELGE.indexOf(niveau.id);
    return i >= 0 && i < NIVEAU_RAEKKEFOELGE.length - 1 ? NIVEAU_RAEKKEFOELGE[i + 1] : null;
  }, [niveau.id]);

  const stil = { ["--accent" as string]: emne.farve };

  // ------------------------------------------------------------------ slut
  if (fase === "faerdig") {
    const bestod = rigtige >= KRAEVEDE_RIGTIGE;
    const laastOp = bestod && naesteNiveauId ? NIVEAU_NAVN[naesteNiveauId] : null;
    const o = opsamling(rigtige, niveau.id, laastOp, varKlaretFoer);
    return (
      <>
        <Toplinje accent={emne.farve} />
        <main className="side" style={stil}>
          <Tilbage href={`/kategori/${kategori.id}/${emne.id}`} tekst={emne.navn} />
          <div className="kort udenstribe opsamling">
            {bestod && <Konfetti antal={rigtige === OPGAVER_PR_RUNDE ? 120 : 80} />}

            <div className="opsamlingPokal opsamlingTrofae">
              {bestod ? (
                niveau.id === "platin" ? (
                  <Diamant stoerrelse={86} svaever />
                ) : niveau.id === "guld" ? (
                  <Pokal stoerrelse={86} svaever />
                ) : (
                  <Medalje niveau={niveau.id} stoerrelse={86} glimt />
                )
              ) : niveau.id === "platin" ? (
                <Diamant stoerrelse={86} daempet />
              ) : (
                <Medalje niveau={niveau.id} stoerrelse={86} daempet />
              )}
            </div>

            <div className="opsamlingScore">
              {visScore}
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

  // ----------------------------------------------------------------- runden
  const ryster = fase === "bedoemt" && sidsteVarRigtigt === false;

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
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {stime >= 3 && (
              <span className="stime" key={stime}>
                <Flamme stoerrelse={15} />
                {stime} i træk
              </span>
            )}
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
        </div>

        <div className={`opgaveKort ${ryster ? "fejl" : ""}`}>
          {!opgave ? (
            <p style={{ color: "var(--blaek-lys)" }}>Henter opgaver …</p>
          ) : (
            <>
              {opgave.optakt && (
                <p className={opgave.spoergsmaal ? "optakt" : "optakt stor"}>{opgave.optakt}</p>
              )}
              {opgave.spoergsmaal && (
                <p className={`stykke ${opgave.slags === "valg" ? "tekst" : ""}`}>
                  <Udtryk tekst={opgave.spoergsmaal} />
                </p>
              )}

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
                          <Udtryk tekst={v} />
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
                <div className={`feedback ${sidsteVarRigtigt ? "rigtigt" : "forkert"}`}>
                  <span className="feedbackIkon">
                    {sidsteVarRigtigt ? <Flueben stoerrelse={28} /> : <Kryds stoerrelse={28} />}
                  </span>
                  <span className="feedbackTekst">
                    <strong>{sidsteVarRigtigt ? ros(nr) : opmuntring(nr)}</strong>
                    <span className="strategimaerke">{opgave.strategi}</span>
                    <div>
                      <Udtryk tekst={opgave.hint} />
                    </div>
                    {!sidsteVarRigtigt && (
                      <div className="facitlinje">
                        Svaret er{" "}
                        <strong style={{ display: "inline" }}>
                          <Udtryk tekst={opgave.svar} />
                        </strong>
                        {opgave.enhed ? ` ${opgave.enhed}` : ""}.
                      </div>
                    )}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
