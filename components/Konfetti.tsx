"use client";

import { useEffect, useRef } from "react";

type Stykke = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  drej: number;
  drejFart: number;
  b: number;
  h: number;
  farve: string;
  liv: number;
};

const FARVER = ["#CE5B34", "#E3A73A", "#2C7F76", "#2E6E9E", "#7A6BA8", "#3E93B4"];

/**
 * Konfetti på canvas. Fyres én gang, når en runde er bestået.
 * Ingen pakke udefra — det er 60 linjer fysik, og det holder appen let.
 * Respekterer "reduceret bevægelse" i styresystemet.
 */
export default function Konfetti({ antal = 90 }: { antal?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const b = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    canvas.width = b * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // To udkast fra hver sin side, så det spreder sig over hele kortet
    const stykker: Stykke[] = Array.from({ length: antal }, (_, i) => {
      const fraVenstre = i % 2 === 0;
      const vinkel = (fraVenstre ? -0.9 : -2.25) + (Math.random() - 0.5) * 0.8;
      const fart = 7 + Math.random() * 7;
      return {
        x: fraVenstre ? b * 0.18 : b * 0.82,
        y: h * 0.42,
        vx: Math.cos(vinkel) * fart,
        vy: Math.sin(vinkel) * fart,
        drej: Math.random() * Math.PI,
        drejFart: (Math.random() - 0.5) * 0.3,
        b: 5 + Math.random() * 5,
        h: 8 + Math.random() * 6,
        farve: FARVER[Math.floor(Math.random() * FARVER.length)],
        liv: 1,
      };
    });

    let stopId = 0;
    let sidste = performance.now();

    const tegn = (nu: number) => {
      const dt = Math.min((nu - sidste) / 16.7, 2.5);
      sidste = nu;
      ctx.clearRect(0, 0, b, h);
      let levende = 0;

      for (const s of stykker) {
        s.vy += 0.34 * dt; // tyngdekraft
        s.vx *= 0.995;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.drej += s.drejFart * dt;
        if (s.y > h * 0.55) s.liv -= 0.016 * dt;
        if (s.liv <= 0 || s.y > h + 40) continue;
        levende++;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.drej);
        ctx.globalAlpha = Math.max(0, s.liv);
        ctx.fillStyle = s.farve;
        // Fladtrykt rektangel giver følelsen af papir, der vender i luften
        ctx.fillRect(-s.b / 2, -s.h / 2, s.b, s.h * Math.abs(Math.cos(s.drej)));
        ctx.restore();
      }

      if (levende > 0) stopId = requestAnimationFrame(tegn);
    };

    stopId = requestAnimationFrame(tegn);
    return () => cancelAnimationFrame(stopId);
  }, [antal]);

  return <canvas ref={ref} className="konfetti" aria-hidden />;
}
