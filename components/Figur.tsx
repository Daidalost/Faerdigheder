import type { Figur as FigurData, Linje } from "@/lib/typer";

/**
 * Figurer til opgaverne: et koordinatsystem med gitter, linjer og punkter,
 * eller en værditabel. Alt er SVG og HTML — ingen billedfiler.
 *
 * Koordinatsystemet er tegnet, så det ligner prøvesættene: tyndt gitter for
 * hver hele enhed, tal på akserne og pile i positiv retning.
 */

const FARVE: Record<NonNullable<Linje["farve"]>, string> = {
  terra: "var(--terra)",
  blaa: "var(--blaa)",
  teal: "var(--teal)",
  lilla: "var(--lilla)",
  okker: "var(--okker)",
};

const minus = (n: number) => String(n).replace("-", "−");

/** Den del af linjen y = ax + b, der ligger inde i vinduet. */
function klip(l: Linje, x0: number, x1: number, y0: number, y1: number) {
  let lo = x0;
  let hi = x1;
  if (l.a === 0) {
    if (l.b < y0 || l.b > y1) return null;
  } else {
    const xa = (y0 - l.b) / l.a;
    const xb = (y1 - l.b) / l.a;
    lo = Math.max(lo, Math.min(xa, xb));
    hi = Math.min(hi, Math.max(xa, xb));
  }
  if (hi - lo < 1e-9) return null;
  return { xa: lo, ya: l.a * lo + l.b, xb: hi, yb: l.a * hi + l.b };
}

function Koordinatsystem({ data }: { data: Extract<FigurData, { slags: "koordinatsystem" }> }) {
  const [x0, x1] = data.x;
  const [y0, y1] = data.y;
  const nx = x1 - x0;
  const ny = y1 - y0;
  // Enheden vælges, så hele figuren holder sig inden for ca. 440 × 380.
  const u = Math.max(20, Math.min(40, Math.floor(Math.min(440 / nx, 380 / ny))));
  const kant = 24;
  const bredde = nx * u + 2 * kant;
  const hoejde = ny * u + 2 * kant;
  const px = (x: number) => kant + (x - x0) * u;
  const py = (y: number) => kant + (y1 - y) * u;
  const hverAnden = u < 26;

  const gitter: React.ReactNode[] = [];
  for (let x = x0; x <= x1; x++) {
    gitter.push(
      <line key={`gx${x}`} x1={px(x)} y1={py(y0)} x2={px(x)} y2={py(y1)} className="figGitter" />,
    );
  }
  for (let y = y0; y <= y1; y++) {
    gitter.push(
      <line key={`gy${y}`} x1={px(x0)} y1={py(y)} x2={px(x1)} y2={py(y)} className="figGitter" />,
    );
  }

  const xAkse = y0 <= 0 && y1 >= 0;
  const yAkse = x0 <= 0 && x1 >= 0;
  // Tallene står ved akserne — eller ved kanten, hvis aksen ligger uden for vinduet.
  const tx = xAkse ? py(0) : py(y0);
  const ty = yAkse ? px(0) : px(x0);

  const tal: React.ReactNode[] = [];
  for (let x = x0; x <= x1; x++) {
    if (x === 0 && yAkse && xAkse) continue;
    if (hverAnden && x % 2 !== 0) continue;
    if (x === x1) continue;
    tal.push(
      <text key={`tx${x}`} x={px(x)} y={tx + 15} className="figTal" textAnchor="middle">
        {minus(x)}
      </text>,
    );
  }
  for (let y = y0; y <= y1; y++) {
    if (y === 0 && yAkse && xAkse) continue;
    if (hverAnden && y % 2 !== 0) continue;
    if (y === y1) continue;
    tal.push(
      <text key={`ty${y}`} x={ty - 6} y={py(y) + 4.5} className="figTal" textAnchor="end">
        {minus(y)}
      </text>,
    );
  }
  if (xAkse && yAkse) {
    tal.push(
      <text key="nul" x={px(0) - 6} y={py(0) + 15} className="figTal" textAnchor="end">
        0
      </text>,
    );
  }

  const pil = 7;
  return (
    <svg
      className="figKoordinat"
      viewBox={`0 0 ${bredde} ${hoejde}`}
      style={{ maxWidth: bredde }}
      role="img"
      aria-label="Koordinatsystem"
    >
      <rect x={px(x0)} y={py(y1)} width={nx * u} height={ny * u} className="figBaggrund" />
      {gitter}
      {xAkse && (
        <>
          <line x1={px(x0)} y1={py(0)} x2={px(x1) + 10} y2={py(0)} className="figAkse" />
          <path
            d={`M${px(x1) + 10 + 2} ${py(0)} l${-pil - 2} ${-pil / 1.6} v${(2 * pil) / 1.6} z`}
            className="figPil"
          />
          <text x={px(x1) + 6} y={py(0) - 8} className="figAkseNavn" textAnchor="middle">
            x
          </text>
        </>
      )}
      {yAkse && (
        <>
          <line x1={px(0)} y1={py(y0)} x2={px(0)} y2={py(y1) - 10} className="figAkse" />
          <path
            d={`M${px(0)} ${py(y1) - 10 - 2} l${-pil / 1.6} ${pil + 2} h${(2 * pil) / 1.6} z`}
            className="figPil"
          />
          <text x={px(0) + 10} y={py(y1) - 6} className="figAkseNavn">
            y
          </text>
        </>
      )}
      {tal}

      {data.linjer?.map((l, i) => {
        const s = klip(l, x0, x1, y0, y1);
        if (!s) return null;
        const farve = FARVE[l.farve ?? "terra"];
        // Navnet sættes ved linjens højre ende.
        const slut = { x: s.xb, y: s.yb };
        const nx2 = Math.min(px(slut.x) - 8, bredde - kant - 4);
        const ny2 = Math.max(py(slut.y) + (l.a >= 0 ? 16 : -8), kant + 12);
        return (
          <g key={`l${i}`}>
            <line
              x1={px(s.xa)}
              y1={py(s.ya)}
              x2={px(s.xb)}
              y2={py(s.yb)}
              stroke={farve}
              strokeWidth={2.6}
              strokeLinecap="round"
            />
            {l.navn && (
              <text x={nx2} y={ny2} className="figLinjeNavn" fill={farve} textAnchor="end">
                {l.navn}
              </text>
            )}
          </g>
        );
      })}

      {data.punkter?.map((p, i) => (
        <g key={`p${i}`}>
          <path
            d={`M${px(p.x) - 5} ${py(p.y) - 5} l10 10 M${px(p.x) + 5} ${py(p.y) - 5} l-10 10`}
            className="figKryds"
          />
          {p.navn && (
            <text x={px(p.x) + 7} y={py(p.y) - 7} className="figPunktNavn">
              {p.navn}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

function Tabel({ data }: { data: Extract<FigurData, { slags: "tabel" }> }) {
  return (
    <div className="figTabelRamme">
      <table className="figTabel">
        <tbody>
          <tr>
            <th scope="row">{data.navne[0]}</th>
            {data.x.map((v, i) => (
              <td key={i}>{v}</td>
            ))}
          </tr>
          <tr>
            <th scope="row">{data.navne[1]}</th>
            {data.y.map((v, i) => (
              <td key={i} className={v === "?" ? "figUkendt" : ""}>
                {v}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default function Figur({ data }: { data: FigurData }) {
  return (
    <div className="figur">
      {data.slags === "koordinatsystem" ? <Koordinatsystem data={data} /> : <Tabel data={data} />}
    </div>
  );
}
