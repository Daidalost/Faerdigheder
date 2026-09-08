import type { NiveauId } from "@/lib/typer";

/**
 * Alt grafik tegnes som SVG i koden — ingen billedfiler, ingen ikonpakke.
 * Farverne kommer fra to stop pr. metal, så medaljerne får dybde uden at
 * blive glinsende plastik.
 */

const METAL: Record<NiveauId, { lys: string; mork: string; kant: string; baand: string }> = {
  bronze: { lys: "#DE9A5B", mork: "#9C5626", kant: "#7C4319", baand: "#C24E2A" },
  soelv: { lys: "#DFE6EB", mork: "#93A2AF", kant: "#7A8894", baand: "#5B7383" },
  guld: { lys: "#F7D778", mork: "#D19E1C", kant: "#A87A10", baand: "#CE9B24" },
};

/** Medalje med bånd. Bruges overalt, hvor et niveau skal vises. */
export function Medalje({
  niveau,
  stoerrelse = 34,
  daempet = false,
  glimt = false,
}: {
  niveau: NiveauId;
  stoerrelse?: number;
  daempet?: boolean;
  glimt?: boolean;
}) {
  const m = METAL[niveau];
  const id = `med-${niveau}-${daempet ? "d" : "a"}`;
  if (daempet) {
    return (
      <svg width={stoerrelse} height={stoerrelse} viewBox="0 0 48 48" aria-hidden focusable="false">
        <path d="M11 3 h8 l6 19 h-8 Z" fill="none" stroke="var(--linje)" strokeWidth="1.8" />
        <path d="M37 3 h-8 l-6 19 h8 Z" fill="none" stroke="var(--linje)" strokeWidth="1.8" />
        <circle cx="24" cy="31" r="13" fill="var(--papir)" stroke="var(--linje)" strokeWidth="2.2" />
        <circle cx="24" cy="31" r="7.4" fill="none" stroke="var(--linje)" strokeWidth="1.4" />
      </svg>
    );
  }
  return (
    <svg
      width={stoerrelse}
      height={stoerrelse}
      viewBox="0 0 48 48"
      className={glimt ? "glimter" : undefined}
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={m.lys} />
          <stop offset="55%" stopColor={m.mork} />
          <stop offset="100%" stopColor={m.lys} />
        </linearGradient>
      </defs>
      <path d="M11 3 h8 l6 19 h-8 Z" fill={m.baand} opacity="0.72" />
      <path d="M37 3 h-8 l-6 19 h8 Z" fill={m.baand} />
      <circle cx="24" cy="31" r="13.5" fill={`url(#${id})`} stroke={m.kant} strokeWidth="1.3" />
      <circle cx="24" cy="31" r="10" fill="none" stroke={m.kant} strokeWidth="0.9" opacity="0.5" />
      <path
        d="M24 24.2 l1.55 3.6 3.9 .35 -2.95 2.6 .87 3.85 -3.37 -2.05 -3.37 2.05 .87 -3.85 -2.95 -2.6 3.9 -.35 Z"
        fill="#fff"
        opacity="0.92"
      />
    </svg>
  );
}

/** Pokal. Bruges til guldniveauet og til tælleren på forsiden. */
export function Pokal({
  stoerrelse = 40,
  daempet = false,
  svaever = false,
}: {
  stoerrelse?: number;
  daempet?: boolean;
  svaever?: boolean;
}) {
  const m = METAL.guld;
  if (daempet) {
    return (
      <svg width={stoerrelse} height={stoerrelse} viewBox="0 0 48 48" aria-hidden focusable="false">
        <path
          d="M16 8 h16 v9 a8 8 0 0 1 -16 0 Z M16 10 h-4 a5 5 0 0 0 5 6 M32 10 h4 a5 5 0 0 1 -5 6 M24 25 v6 M18 37 h12 l1 5 H17 Z M21 31 h6"
          fill="none"
          stroke="var(--linje)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg
      width={stoerrelse}
      height={stoerrelse}
      viewBox="0 0 48 48"
      className={svaever ? "svaever" : undefined}
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id="pokalfyld" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={m.lys} />
          <stop offset="60%" stopColor={m.mork} />
          <stop offset="100%" stopColor={m.lys} />
        </linearGradient>
      </defs>
      <path
        d="M16 9 h-5 a6 6 0 0 0 6.4 7.6"
        fill="none"
        stroke={m.mork}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M32 9 h5 a6 6 0 0 1 -6.4 7.6"
        fill="none"
        stroke={m.mork}
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path d="M15 7 h18 v10 a9 9 0 0 1 -18 0 Z" fill="url(#pokalfyld)" stroke={m.kant} strokeWidth="1.3" />
      <rect x="22" y="25.5" width="4" height="6" rx="1" fill={m.mork} />
      <path d="M16.5 36 h15 l1.5 5.5 h-18 Z" fill="url(#pokalfyld)" stroke={m.kant} strokeWidth="1.2" />
      <rect x="19" y="31" width="10" height="3" rx="1.4" fill={m.mork} />
      <path d="M20 11 l1.2 2.6 2.8.4 -2 2 .5 2.8 -2.5-1.3 -2.5 1.3 .5-2.8 -2-2 2.8-.4 Z" fill="#fff" opacity="0.75" />
    </svg>
  );
}

export function Laas({ stoerrelse = 22 }: { stoerrelse?: number }) {
  return (
    <svg width={stoerrelse} height={stoerrelse} viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        d="M8 10V7.5a4 4 0 0 1 8 0V10"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="5" y="10" width="14" height="10" rx="2.6" fill="currentColor" />
      <circle cx="12" cy="15" r="1.7" fill="var(--papir)" />
    </svg>
  );
}

/** Flueben der tegner sig selv. */
export function Flueben({ stoerrelse = 26 }: { stoerrelse?: number }) {
  return (
    <svg width={stoerrelse} height={stoerrelse} viewBox="0 0 32 32" aria-hidden focusable="false">
      <circle cx="16" cy="16" r="15" fill="var(--groen)" />
      <path
        className="tegnes"
        d="M9.5 16.5 l4.5 4.5 l8.5 -9"
        fill="none"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Kryds({ stoerrelse = 26 }: { stoerrelse?: number }) {
  return (
    <svg width={stoerrelse} height={stoerrelse} viewBox="0 0 32 32" aria-hidden focusable="false">
      <circle cx="16" cy="16" r="15" fill="var(--roed)" />
      <path
        d="M11 11 l10 10 M21 11 l-10 10"
        fill="none"
        stroke="#fff"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Lille flamme til stimen af rigtige svar i træk. */
export function Flamme({ stoerrelse = 16 }: { stoerrelse?: number }) {
  return (
    <svg width={stoerrelse} height={stoerrelse} viewBox="0 0 24 24" aria-hidden focusable="false">
      <path
        d="M12 2c3.2 3.4 5.5 6 5.5 9.4A5.5 5.5 0 0 1 12 17a5.5 5.5 0 0 1-5.5-5.6C6.5 8 8.8 5.4 12 2Z"
        fill="currentColor"
      />
      <path
        d="M12 10.5c1.4 1.5 2.3 2.6 2.3 4a2.3 2.3 0 0 1-4.6 0c0-1.4.9-2.5 2.3-4Z"
        fill="#fff"
        opacity="0.55"
      />
    </svg>
  );
}
