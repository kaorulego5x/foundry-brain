"use client";

// The landing hero — the Foundry Brain logo itself, alive in 3D.
// The wafer is the icon's exact 9×9 die pattern (colors, mask and all).
// It opens flat (= the logo), tilts into space, and breathes: a gooey
// contamination field and the (damped) cursor perturb the green dies,
// which always recover back to the logo's resting state. Smaller copies
// of the logo float at other depths for parallax.

import { useEffect, useRef } from "react";

// exact icon pattern: 1 = red, 0 = green, -1 = outside the wafer
const LOGO: number[][] = [
  [-1, -1, -1, 0, 0, 0, -1, -1, -1],
  [-1, 0, 1, 0, 0, 0, 0, 0, -1],
  [-1, 0, 0, 0, 0, 0, 0, 0, -1],
  [0, 0, 0, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1],
  [-1, 1, 1, 1, 1, 1, 1, 1, -1],
  [-1, 0, 1, 1, 1, 1, 1, 0, -1],
  [-1, -1, -1, 1, 1, 1, -1, -1, -1],
];
// each logo cell renders as SUB×SUB small dies — same pattern, finer grain
const SUB = 2;
const GRID = 9 * SUB;

// exact icon colors
const GREEN_RGB = [53, 182, 89]; // #35b659
const RED_RGB = [240, 74, 69]; // #f04a45

interface Die {
  gx: number;
  gy: number;
  logo: number; // 0 green, 1 red — the resting state
  heat: number; // temporary damage on green dies, decays back to 0
}

interface Wafer {
  dies: Die[];
  fx: number;
  fxNarrow: number;
  fy: number;
  scale: number; // wafer diameter relative to the hero
  dim: number;
  parallax: number;
  bobAmp: number;
  bobSpeed: number;
  phase: number;
  yawDrift: number;
}

function buildDies(): Die[] {
  const dies: Die[] = [];
  for (let gy = 0; gy < GRID; gy++) {
    for (let gx = 0; gx < GRID; gx++) {
      const v = LOGO[Math.floor(gy / SUB)][Math.floor(gx / SUB)];
      if (v === -1) continue;
      dies.push({ gx, gy, logo: v, heat: 0 });
    }
  }
  return dies;
}

function makeWafers(): Wafer[] {
  const spec: Omit<Wafer, "dies">[] = [
    // the hero logo — the only wafer on stage
    { fx: 0.66, fxNarrow: 0.5, fy: 0.52, scale: 1, dim: 1, parallax: 1, bobAmp: 7, bobSpeed: 0.00045, phase: 0, yawDrift: 0.00004 },
  ];
  return spec.map((w) => ({ ...w, dies: buildDies() }));
}

function mixRgb(a: number[], b: number[], t: number): number[] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
function css(rgb: number[], k = 1) {
  return `rgb(${Math.round(rgb[0] * k)},${Math.round(rgb[1] * k)},${Math.round(rgb[2] * k)})`;
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};

// the contamination field ramps in gently on load
const FIELD_START = 300;
const FIELD_RAMP = 900;

export default function WaferField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wafers = makeWafers();

    const pointer = { x: -9999, y: -9999, dx: -9999, dy: -9999, active: false };
    let yaw = 0;
    let pitchOff = 0;
    let targetYaw = 0;
    let targetPitchOff = 0;
    // π/2 = perfectly face-on — the logo stands upright, pressed to the screen;
    // only the cursor parallax tilts it slightly off-axis.
    const BASE_PITCH = Math.PI / 2;

    let width = 0;
    let height = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      if (!pointer.active) {
        pointer.dx = pointer.x;
        pointer.dy = pointer.y;
      }
      pointer.active = true;
      targetYaw = ((pointer.x / width) - 0.5) * 0.55;
      targetPitchOff = -((pointer.y / height) - 0.5) * 0.28;
    };
    const onLeave = () => {
      pointer.active = false;
      targetYaw = 0;
      targetPitchOff = 0;
    };
    // touch: a finger drag drives the same interaction as the mouse; when the
    // finger lifts, the wafer settles back and the dies recover
    const onUp = (e: PointerEvent) => {
      if (e.pointerType === "touch") onLeave();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    window.addEventListener("pointerleave", onLeave);

    let raf = 0;
    const t0 = performance.now();

    // gooey contamination sources wandering across the wafer (grid units)
    const BLOBS = [
      { s1: 0.00019, s2: 0.00015, p1: 0.3, p2: 2.1, r: 1.15 * SUB },
      { s1: 0.00013, s2: 0.00023, p1: 4.2, p2: 0.9, r: 0.95 * SUB },
      { s1: 0.00025, s2: 0.00011, p1: 1.6, p2: 5.0, r: 0.85 * SUB },
    ];

    const drawWafer = (w: Wafer, elapsed: number, intro: number, field: number) => {
      const center = (GRID - 1) / 2;
      const isHero = w.scale === 1;
      const heroT = isHero ? intro : 1;

      const restCx = (width > 860 ? w.fx : w.fxNarrow) * width;
      // portrait: the wafer floats in the upper half, above the copy
      const fyEff = width > 860 ? w.fy : Math.min(w.fy, 0.30);
      const restCy =
        fyEff * height + (reduceMotion ? 0 : Math.sin(elapsed * w.bobSpeed + w.phase) * w.bobAmp);
      const cx = isHero ? width / 2 + (restCx - width / 2) * heroT : restCx;
      const cy = isHero ? height * 0.5 + (restCy - height * 0.5) * heroT : restCy;

      // portrait/mobile gets a width-driven size so the wafer stays as
      // commanding as it is on desktop
      const diameter =
        (width > 860 ? Math.min(width * 0.58, height * 0.92) : Math.min(width * 0.9, height * 0.52)) *
        w.scale;
      const spacing = diameter / GRID;
      const f = 560; // shorter focal length = stronger perspective

      // ambient sway oscillates (never accumulates) so the wafer always stays
      // near face-on — it moves, but never turns sideways
      const sway = reduceMotion ? 0 : Math.sin(elapsed * 0.00035 + w.phase) * 0.05;
      const clampAngle = (v: number, lim: number) => Math.max(-lim, Math.min(lim, v));
      const wYaw = clampAngle(yaw * w.parallax + sway, 0.3) * heroT;
      const wPitch = (BASE_PITCH + clampAngle(pitchOff * w.parallax, 0.18)) * heroT;
      const sinY = Math.sin(wYaw);
      const cosY = Math.cos(wYaw);
      const sinP = Math.sin(wPitch);
      const cosP = Math.cos(wPitch);

      const waferAlpha = isHero ? 1 : smoothstep(0.55, 1, intro);
      if (waferAlpha <= 0.01) return;

      const tb = elapsed + w.phase * 900;
      const blobs = BLOBS.map((b) => ({
        x: center + Math.sin(tb * b.s1 + b.p1) * center * 0.85,
        y: center + Math.cos(tb * b.s2 + b.p2) * center * 0.85,
        r: b.r,
      }));

      const drawList: { die: Die; sx: number; sy: number; size: number; depth: number; mix: number }[] = [];

      for (const die of w.dies) {
        // gooey field over green dies — merges continuously, then recovers
        let blobField = 0;
        if (!reduceMotion && field > 0 && die.logo === 0) {
          for (const b of blobs) {
            const dd = (die.gx - b.x) ** 2 + (die.gy - b.y) ** 2;
            blobField += (b.r * b.r) / (dd + 0.9 * SUB * SUB);
          }
        }
        const ambient = smoothstep(0.62, 1.3, blobField) * 0.75 * field;

        // damage flips a die away from its logo color, then it recovers
        const damage = clamp01(Math.max(die.heat, die.logo === 0 ? ambient : 0));
        const mix = die.logo === 1 ? 1 - damage : damage;

        // both axes flipped so the logo reads exactly like the icon when face-on
        const wx = (center - die.gx) * spacing;
        const wz = (center - die.gy) * spacing;
        // red dies sit slightly proud of the plane; flipped dies move too
        const wy = -(die.logo === 1 ? 0.3 * (1 - damage) : damage * 0.7) * spacing * heroT;

        const x1 = wx * cosY - wz * sinY;
        const z1 = wx * sinY + wz * cosY;
        const y2 = wy * cosP - z1 * sinP;
        const z2 = wy * sinP + z1 * cosP;

        const s = f / (f + z2 + 260);
        const sx = cx + x1 * s;
        const sy = cy + y2 * s;

        // damped cursor flips nearby dies (green→red, red→green)
        if (pointer.active && !reduceMotion && field > 0.5) {
          const dd = (sx - pointer.dx) ** 2 + (sy - pointer.dy) ** 2;
          const R = spacing * 1.6;
          const cur = (R * R) / (dd + spacing * spacing * 0.5);
          if (cur > 0.5) die.heat = Math.min(1, die.heat + cur * 0.16);
        }
        die.heat *= 0.955;
        if (die.heat < 0.005) die.heat = 0;

        drawList.push({ die, sx, sy, size: spacing * 0.8 * s, depth: z2, mix });
      }

      drawList.sort((a, b) => b.depth - a.depth);

      const thickBase = spacing * 0.24;
      for (const item of drawList) {
        const { sx, sy, size, mix } = item;
        const top = mixRgb(GREEN_RGB, RED_RGB, clamp01(mix));
        const depthAlpha = 0.62 + 0.38 * (item.depth < 0 ? 1 : Math.max(0.4, 1 - item.depth / 500));
        const alpha = depthAlpha * w.dim * waferAlpha;
        const half = size / 2;
        const r = size * 0.12; // the icon's tight corner radius
        const thick = thickBase * (size / spacing) * heroT;

        // extruded side (darker pillar under the face) — this sells the 3D
        if (thick > 0.5) {
          ctx.globalAlpha = alpha;
          ctx.fillStyle = css(top, 0.45);
          ctx.beginPath();
          ctx.roundRect(sx - half, sy - half, size, size + thick, r);
          ctx.fill();
        }
        // top face
        ctx.globalAlpha = alpha;
        ctx.fillStyle = css(top);
        ctx.beginPath();
        ctx.roundRect(sx - half, sy - half, size, size, r);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    };

    const draw = (now: number) => {
      const elapsed = now - t0;
      ctx.clearRect(0, 0, width, height);

      pointer.dx += (pointer.x - pointer.dx) * 0.12;
      pointer.dy += (pointer.y - pointer.dy) * 0.12;
      yaw += (targetYaw - yaw) * 0.05;
      pitchOff += (targetPitchOff - pitchOff) * 0.05;

      const intro = 1; // no launch transition — the scene opens at rest
      const field = reduceMotion ? 0 : easeInOut(clamp01((elapsed - FIELD_START) / FIELD_RAMP));

      for (const w of [...wafers].sort((a, b) => a.scale - b.scale)) {
        drawWafer(w, elapsed, intro, field);
      }

      if (!reduceMotion) raf = requestAnimationFrame(draw);
    };

    if (reduceMotion) {
      draw(performance.now());
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  // pan-y: horizontal drags rotate the wafer, vertical swipes still scroll
  return <canvas ref={canvasRef} className="h-full w-full" style={{ touchAction: "pan-y" }} aria-hidden />;
}
