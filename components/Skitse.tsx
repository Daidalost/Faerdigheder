import type { Farve, P, Skitse as SkitseData } from "@/lib/typer";
import { Udtryk } from "./Deler";

/**
 * Geometriske skitser i samme stil som prøvehæftet: tynde sorte linjer, let
 * farvede flader, vinkelbuer med tal i, mål ud for siderne og en formelboks.
 *
 * Generatorerne giver matematiske koordinater (y opad). Her regnes de om til
 * pixels, så stregtykkelse, buer og tekst har samme størrelse, uanset hvor
 * stor figuren er i virkeligheden.
 */

const FARVE: Record<Farve, string> = {
  terra: "var(--terra)",
  blaa: "var(--blaa)",
  teal: "var(--teal)",
  lilla: "var(--lilla)",
  okker: "var(--okker)",
  groen: "var(--groen)",
  blaek: "var(--blaek)",
};

const MAKS_B = 440;
const MAKS_H = 300;
const KANT = 22;

export default function Skitse({ data }: { data: SkitseData }) {
  // ---------------------------------------------------------- målestok
  const alle: P[] = [];
  data.polygoner?.forEach((p) => alle.push(...p.punkter));
  data.linjer?.forEach((l) => alle.push(l.fra, l.til));
  data.ellipser?.forEach((e) => alle.push([e.c[0] - e.rx, e.c[1] - e.ry], [e.c[0] + e.rx, e.c[1] + e.ry]));
  data.vinkler?.forEach((v) => alle.push(v.top));
  data.tekster?.forEach((t) => alle.push(t.ved));
  if (data.gitter) {
    alle.push([data.gitter.x[0], data.gitter.y[0]], [data.gitter.x[1], data.gitter.y[1]]);
  }
  const xs = alle.map((p) => p[0]);
  const ys = alle.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const s = Math.min(MAKS_B / Math.max(maxX - minX, 1e-6), MAKS_H / Math.max(maxY - minY, 1e-6), 70);
  const bredde = (maxX - minX) * s + 2 * KANT;
  const hoejde = (maxY - minY) * s + 2 * KANT + (data.skitse ? 10 : 0);
  const px = (p: P): P => [KANT + (p[0] - minX) * s, KANT + (maxY - p[1]) * s];
  // Tekstbokse (x0, y0, x1, y1) — tegnefladen udvides, så ingen tekst bliver skåret af.
  const bokse: [number, number, number, number][] = [];
  const tekstBoks = (x: number, y: number, tekst: string, anker: string, str = 15) => {
    const w = tekst.length * str * 0.55;
    const x0 = anker === "start" ? x : anker === "end" ? x - w : x - w / 2;
    bokse.push([x0 - 2, y - str * 0.7, x0 + w + 2, y + str * 0.7]);
  };

  // ------------------------------------------------------------ dele
  const gitter: React.ReactNode[] = [];
  if (data.gitter) {
    const [x0, x1] = data.gitter.x;
    const [y0, y1] = data.gitter.y;
    for (let x = x0; x <= x1; x++) {
      const [a, b] = [px([x, y0]), px([x, y1])];
      gitter.push(<line key={`gx${x}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="figGitter" />);
    }
    for (let y = y0; y <= y1; y++) {
      const [a, b] = [px([x0, y]), px([x1, y])];
      gitter.push(<line key={`gy${y}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} className="figGitter" />);
    }
  }

  const vinkler = data.vinkler?.map((v, i) => {
    const T = px(v.top);
    const A = px(v.a);
    const B = px(v.b);
    const la = Math.hypot(A[0] - T[0], A[1] - T[1]);
    const lb = Math.hypot(B[0] - T[0], B[1] - T[1]);
    const ua: P = [(A[0] - T[0]) / la, (A[1] - T[1]) / la];
    const ub: P = [(B[0] - T[0]) / lb, (B[1] - T[1]) / lb];
    const farve = FARVE[v.farve ?? "teal"];
    if (v.ret) {
      const k = 11;
      const d = `M${T[0] + k * ua[0]} ${T[1] + k * ua[1]} L${T[0] + k * (ua[0] + ub[0])} ${T[1] + k * (ua[1] + ub[1])} L${T[0] + k * ub[0]} ${T[1] + k * ub[1]}`;
      return <path key={`v${i}`} d={d} className="skRet" />;
    }
    const ta = Math.atan2(ua[1], ua[0]);
    let d = Math.atan2(ub[1], ub[0]) - ta;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d <= -Math.PI) d += 2 * Math.PI;
    const grader = Math.abs((d * 180) / Math.PI);
    // Små vinkler får en større bue, så tallet kan stå inden i den.
    let r = grader < 35 ? 38 : grader < 70 ? 30 : 24;
    r = Math.min(r, 0.45 * Math.min(la, lb));
    const tb = ta + d;
    const start: P = [T[0] + r * Math.cos(ta), T[1] + r * Math.sin(ta)];
    const slut: P = [T[0] + r * Math.cos(tb), T[1] + r * Math.sin(tb)];
    const sti = `M${T[0]} ${T[1]} L${start[0]} ${start[1]} A${r} ${r} 0 0 ${d > 0 ? 1 : 0} ${slut[0]} ${slut[1]} Z`;
    const tm = ta + d / 2;
    const afstand = r + (grader < 35 ? 16 : 13);
    const tekstP: P = [T[0] + afstand * Math.cos(tm), T[1] + afstand * Math.sin(tm)];
    if (v.tekst) tekstBoks(tekstP[0], tekstP[1], v.tekst, "middle");
    return (
      <g key={`v${i}`}>
        <path d={sti} fill={farve} className="skBue" />
        <path
          d={`M${start[0]} ${start[1]} A${r} ${r} 0 0 ${d > 0 ? 1 : 0} ${slut[0]} ${slut[1]}`}
          stroke={farve}
          className="skBueKant"
        />
        {v.tekst && (
          <text
            x={tekstP[0]}
            y={tekstP[1]}
            className={/^[a-zæøå]$/i.test(v.tekst) ? "skVinkelNavn" : "skVinkelTal"}
            textAnchor="middle"
            dominantBaseline="central"
          >
            {v.tekst}
          </text>
        )}
      </g>
    );
  });

  const maal = data.maal?.map((m, i) => {
    const dx = m.til[0] - m.fra[0];
    const dy = m.til[1] - m.fra[1];
    const l = Math.hypot(dx, dy) || 1;
    const side = m.side ?? 1;
    // Normalen til venstre i matematiske koordinater, vendt om til skærmen.
    const n: P = [(-dy / l) * side, (-dx / l) * side];
    const mid = px([(m.fra[0] + m.til[0]) / 2, (m.fra[1] + m.til[1]) / 2]);
    const afst = 13;
    const anker = Math.abs(n[0]) < 0.35 ? "middle" : n[0] > 0 ? "start" : "end";
    tekstBoks(mid[0] + afst * n[0], mid[1] + afst * n[1], m.tekst, anker);
    return (
      <text
        key={`m${i}`}
        x={mid[0] + afst * n[0]}
        y={mid[1] + afst * n[1]}
        className="skMaal"
        textAnchor={anker}
        dominantBaseline="central"
      >
        {m.tekst}
      </text>
    );
  });

  data.tekster?.forEach((t) => {
    const p = px(t.ved);
    tekstBoks(p[0], p[1], t.tekst, t.anker ?? "middle");
  });
  const vx0 = Math.min(0, ...bokse.map((b) => b[0]));
  const vy0 = Math.min(0, ...bokse.map((b) => b[1]));
  const vx1 = Math.max(bredde, ...bokse.map((b) => b[2]));
  const vy1 = Math.max(hoejde, ...bokse.map((b) => b[3]));

  return (
    <div className="skitseRamme">
      <svg
        className="figKoordinat skitse"
        viewBox={`${vx0} ${vy0} ${vx1 - vx0} ${vy1 - vy0}`}
        style={{ maxWidth: vx1 - vx0 }}
        role="img"
        aria-label="Skitse"
      >
        {gitter}
        {data.polygoner?.map((p, i) => {
          const farve = FARVE[p.farve ?? "blaa"];
          return (
            <polygon
              key={`p${i}`}
              points={p.punkter.map((q) => px(q).join(",")).join(" ")}
              fill={p.fyld === false ? "none" : farve}
              stroke={farve}
              className={`skFlade${p.fyld === false ? " tom" : ""}${p.stiplet ? " stiplet" : ""}`}
            />
          );
        })}
        {data.ellipser?.map((e, i) => {
          const c = px(e.c);
          const rx = e.rx * s;
          const ry = e.ry * s;
          const klasse = `skLinje${e.stiplet ? " stiplet" : ""}`;
          if (!e.halv) return <ellipse key={`e${i}`} cx={c[0]} cy={c[1]} rx={rx} ry={ry} className={klasse} />;
          const sweep = e.halv === "foran" ? 0 : 1;
          return (
            <path
              key={`e${i}`}
              d={`M${c[0] - rx} ${c[1]} A${rx} ${ry} 0 0 ${sweep} ${c[0] + rx} ${c[1]}`}
              className={klasse}
            />
          );
        })}
        {vinkler}
        {data.linjer?.map((l, i) => {
          const a = px(l.fra);
          const b = px(l.til);
          const streger: React.ReactNode[] = [];
          if (l.streger) {
            const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
            const u: P = [(b[0] - a[0]) / len, (b[1] - a[1]) / len];
            const n: P = [-u[1], u[0]];
            const m: P = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
            for (let k = 0; k < l.streger; k++) {
              const o = (k - (l.streger - 1) / 2) * 5;
              const c: P = [m[0] + o * u[0], m[1] + o * u[1]];
              streger.push(
                <line
                  key={k}
                  x1={c[0] - 6 * n[0]}
                  y1={c[1] - 6 * n[1]}
                  x2={c[0] + 6 * n[0]}
                  y2={c[1] + 6 * n[1]}
                  className="skLinje"
                />,
              );
            }
          }
          return (
            <g key={`l${i}`}>
              <line
                x1={a[0]}
                y1={a[1]}
                x2={b[0]}
                y2={b[1]}
                stroke={l.farve ? FARVE[l.farve] : undefined}
                className={`skLinje${l.stiplet ? " stiplet" : ""}${l.tynd ? " tynd" : ""}`}
              />
              {streger}
            </g>
          );
        })}
        {maal}
        {data.tekster?.map((t, i) => {
          const p = px(t.ved);
          return (
            <text
              key={`t${i}`}
              x={p[0]}
              y={p[1]}
              className={t.kursiv === false ? "skTekst" : "skTekst kursiv"}
              textAnchor={t.anker ?? "middle"}
              dominantBaseline="central"
            >
              {t.tekst}
            </text>
          );
        })}
        {data.skitse && (
          <text x={vx1 - 6} y={vy1 - 8} className="skSkitse" textAnchor="end">
            Skitse
          </text>
        )}
      </svg>
      {data.formel && (
        <div className="formelboks">
          {data.formel.map((linje, i) => (
            <div key={i} className={i === 0 ? "formelHoved" : undefined}>
              <Udtryk tekst={linje} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
