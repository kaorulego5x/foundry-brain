"use client";

// Landing page — two acts: the fab (dark: the problem lives in the dark) and
// the dashboard (light: what Foundry Brain makes of it). The hero wafer is the
// signature; everything after it stays quiet.

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import WaferField from "./WaferField";
import { FactoryIcon, SensorIcon, InspectIcon } from "@/components/icons";

const GITHUB = "https://github.com/kaorulego5x/foundry-brain";
const PITCH_VIDEO_ID = "1MBw3zP2_a7A0P9W6Gbg6ZVjxRbNwO1Vj";
const PITCH_VIDEO_EMBED = `https://drive.google.com/file/d/${PITCH_VIDEO_ID}/preview`;
const PITCH_VIDEO_LINK = `https://drive.google.com/file/d/${PITCH_VIDEO_ID}/view`;

const display = { fontFamily: "var(--font-display), system-ui, sans-serif" } as const;
const mono = { fontFamily: "var(--font-mono-l), ui-monospace, monospace" } as const;

function ArrowRight({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "h-4 w-4"}
    >
      <path d="M4 12h16M13 5l7 7-7 7" />
    </svg>
  );
}

export default function LandingPage() {
  // drive the embedded pitch deck (same-origin iframe listens for arrow keys)
  const deckRef = useRef<HTMLIFrameElement>(null);
  const stepDeck = (dir: 1 | -1) => {
    const w = deckRef.current?.contentWindow as
      | (Window & { KeyboardEvent: typeof KeyboardEvent })
      | null
      | undefined;
    if (!w) return;
    try {
      // use the iframe's own KeyboardEvent constructor so its document accepts it
      w.document.dispatchEvent(
        new w.KeyboardEvent("keydown", { key: dir === 1 ? "ArrowRight" : "ArrowLeft" }),
      );
    } catch {
      // preview navigation is best-effort
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f0d] text-[#e8ede9] antialiased">
      {/* ───────────────────────── nav ───────────────────────── */}
      <nav className="fixed inset-x-0 top-0 z-40 border-b border-white/[0.06] bg-[#0a0f0d]/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-6 py-4">
          <Image src="/appIcon.png" alt="" width={22} height={22} unoptimized className="h-[22px] w-[22px]" />
          <span style={mono} className="text-sm font-medium tracking-[0.18em] text-[#e8ede9]">
            FOUNDRY BRAIN
          </span>
          <div className="ml-auto flex items-center gap-6">
            <Link
              href="/"
              style={mono}
              className="text-xs text-slate-400 transition hover:text-[#e8ede9]"
            >
              Live demo
            </Link>
            <a
              href="/slides.html"
              target="_blank"
              rel="noreferrer"
              style={mono}
              className="text-xs text-slate-400 transition hover:text-[#e8ede9]"
            >
              Pitch deck
            </a>
            <a
              href={GITHUB}
              target="_blank"
              rel="noreferrer"
              style={mono}
              className="flex items-center gap-2 rounded-md border border-[#22c55e]/40 px-3 py-1.5 text-xs text-[#22c55e] transition hover:bg-[#22c55e]/10"
            >
              Open GitHub
              <ArrowRight className="h-3 w-3" />
            </a>
          </div>
        </div>
      </nav>

      {/* ───────────────────────── hero ───────────────────────── */}
      <header className="relative h-[100svh] min-h-[640px] overflow-hidden">
        {/* wafer glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[70vmin] w-[70vmin] -translate-y-1/2 rounded-full opacity-30 max-md:-translate-x-1/2 md:left-[42%]"
          style={{ background: "radial-gradient(circle, rgba(34,197,94,0.25) 0%, transparent 65%)" }}
        />
        <div className="absolute inset-0">
          <WaferField />
        </div>
        {/* readability scrim behind the copy — fades in after the logo moment */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="pointer-events-none absolute inset-y-0 left-0 hidden w-[58%] md:block"
          style={{ background: "linear-gradient(90deg, rgba(10,15,13,0.92) 0%, rgba(10,15,13,0.55) 60%, transparent 100%)" }}
        />
        <div
          className="pointer-events-none absolute inset-0 md:hidden"
          style={{ background: "rgba(10,15,13,0.55)" }}
        />
        {/* CRT flavor: faint scanlines + vignette */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.16]"
          style={{
            background:
              "repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0px, rgba(255,255,255,0.06) 1px, transparent 1px, transparent 3px)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, transparent 55%, rgba(2,4,3,0.55) 100%)" }}
        />

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7, ease: "easeOut" }}
          className="pointer-events-none relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-center px-6"
        >
          <p style={mono} className="mb-5 text-[11px] tracking-[0.3em] text-[#22c55e]">
            COMPANY BRAIN · BUILT ON G-STACK &amp; G-BRAIN
          </p>
          <h1
            style={display}
            className="max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl"
          >
            The OS for the
            <br />
            semiconductor factory.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-400 md:text-lg">
            Foundry Brain replaces the yield engineer. When yield drops, it reads the fab&apos;s
            three systems, finds the root-cause machine, and answers the only question that
            matters — hold or ship — in minutes, not days.
          </p>
          <div className="pointer-events-auto mt-9 flex flex-wrap items-center gap-4">
            <a
              href={GITHUB}
              target="_blank"
              rel="noreferrer"
              style={mono}
              className="flex items-center gap-2 rounded-md bg-[#22c55e] px-5 py-3 text-sm font-medium text-[#0a0f0d] transition hover:bg-[#4ade80]"
            >
              Open GitHub
              <ArrowRight />
            </a>
            <Link
              href="/"
              style={mono}
              className="rounded-md border border-white/15 px-5 py-3 text-sm text-slate-300 transition hover:border-white/40 hover:text-white"
            >
              Open the live demo
            </Link>
          </div>
        </motion.div>
      </header>

      {/* ───────────────────────── act I · the problem (dark) ───────────────────────── */}
      <section className="relative border-t border-white/[0.06]">
        <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
          <p style={mono} className="text-[11px] tracking-[0.3em] text-[#ef4444]">
            THE PROBLEM
          </p>
          <h2 style={display} className="mt-4 max-w-2xl text-3xl font-bold leading-tight md:text-4xl">
            Yield decides everything.
            <br />
            Finding why it dropped takes days.
          </h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-400">
            Yield = good chips ÷ all chips made. 90 good out of 100 is 90% yield — the other 10
            are scrapped, pure loss. Yield analysis is the chokepoint of the semiconductor
            foundry: it depends on a few slow, scarce artisans answering two things — which of
            the 1,000+ steps caused the drop, and what to do next.
          </p>

          <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.08] md:grid-cols-3">
            {[
              {
                icon: SensorIcon,
                name: "Sensor Data",
                key: "what the machine did",
                body: "Temperature, pressure and power from every machine, over time. Keyed by machine + timestamp — it never heard of a wafer.",
              },
              {
                icon: FactoryIcon,
                name: "Production History",
                key: "where the wafer went",
                body: "Which lot ran on which machine and chamber, and when. Keyed by lot number.",
              },
              {
                icon: InspectIcon,
                name: "Inspection Results",
                key: "how it turned out",
                body: "Film thickness and pass–fail, measured at the end of the line — where problems show up, never where they start.",
              },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.name} className="bg-[#0d1310] p-8">
                  <Icon className="h-6 w-6 text-[#22c55e]" />
                  <h3 style={display} className="mt-5 text-lg font-bold">
                    {s.name}
                  </h3>
                  <p style={mono} className="mt-1 text-[11px] text-slate-500">
                    {s.key}
                  </p>
                  <p className="mt-4 text-sm leading-relaxed text-slate-400">{s.body}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex items-start gap-4 rounded-xl border border-[#ef4444]/25 bg-[#ef4444]/[0.06] p-6">
            <span className="mt-1.5 h-2 w-2 shrink-0 animate-pulse rounded-full bg-[#ef4444]" />
            <p className="text-sm leading-relaxed text-slate-300">
              The three systems don&apos;t share a key, so the engineer crosses them{" "}
              <b className="text-[#e8ede9]">by hand</b> — and the root cause is usually an in-spec
              drift that never fired an alarm. Every investigation takes days.{" "}
              <b className="text-[#e8ede9]">So yield barely climbs.</b>
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────────── act II · the playbook (light) ───────────────────────── */}
      <section className="bg-[#f4f7f5] text-slate-900">
        <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
          <p style={mono} className="text-[11px] tracking-[0.3em] text-[#16a34a]">
            THE SOLUTION
          </p>
          <h2 style={display} className="mt-4 max-w-2xl text-3xl font-bold leading-tight md:text-4xl">
            One human, days.
            <br />
            Foundry Brain, minutes.
          </h2>
          <p className="mt-4 max-w-xl text-base text-slate-500">
            The AI runs the whole yield analysis — every step below, automatically. Diagnose in
            minutes, iterate faster, and yield climbs faster. The engineer stays on the loop:
            ask, review, approve and execute.
          </p>

          <ol className="mt-14 space-y-0 border-t border-slate-200">
            {[
              {
                n: "01",
                sys: "Alert",
                title: "Yield dropped",
                finding: "Line yield fell 12% — 5 of 11 lots out of spec at final inspection.",
              },
              {
                n: "02",
                sys: "Investigate",
                title: "Query all three systems",
                finding: "Inspection: 5 lots fail spec. Production history: all 5 share Etch-3 / Chamber C, 10:00–12:00.",
              },
              {
                n: "03",
                sys: "Diagnose",
                title: "Find the root cause",
                finding: "Sensor data: RF power drifted to 2.31 kW — under the alarm limit, so no alert ever fired.",
              },
              {
                n: "04",
                sys: "Decide",
                title: "Hold or ship?",
                finding: "One chamber accounts for 100% of failures. Hold the affected lots.",
              },
              {
                n: "05",
                sys: "Report",
                title: "Evidence + action",
                finding: "A verdict card with the proof, and a one-click isolation order — replayable step by step in the UI.",
              },
            ].map((s) => (
              <li
                key={s.n}
                className="grid gap-2 border-b border-slate-200 py-7 md:grid-cols-[80px_220px_1fr] md:gap-8"
              >
                <span style={mono} className="text-sm text-slate-400">
                  {s.n}
                </span>
                <span style={mono} className="text-xs uppercase tracking-wider text-slate-500">
                  {s.sys}
                </span>
                <div>
                  <h3 style={display} className="text-lg font-bold">
                    {s.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">{s.finding}</p>
                </div>
              </li>
            ))}
          </ol>

          {/* the verdict, verbatim */}
          <div
            style={mono}
            className="mt-12 overflow-x-auto rounded-xl bg-[#0d1310] p-6 text-[13px] leading-relaxed text-slate-300"
          >
            <p className="mb-3 text-[10px] tracking-[0.3em] text-[#22c55e]">VERDICT — AS PRINTED BY THE AGENT</p>
            <pre className="whitespace-pre">
{`ROOT CAUSE : Etch-3 / Chamber C   (RF power drift, in-spec so no alarm)
EVIDENCE   : 5/5 failing lots passed through it, 10:00–12:00; RF 2.31 kW vs 2.10 center
AFFECTED   : LOT-0703 0704 0707 0708 0711
RECOMMEND  : HOLD affected lots — do not ship pending re-measure`}
            </pre>
          </div>
        </div>
      </section>

      {/* ───────────────────────── the memory (light) ───────────────────────── */}
      <section className="border-t border-slate-200 bg-[#f4f7f5] text-slate-900">
        <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
          <p style={mono} className="text-[11px] tracking-[0.3em] text-[#16a34a]">
            THE MEMORY
          </p>
          <h2 style={display} className="mt-4 max-w-2xl text-3xl font-bold leading-tight md:text-4xl">
            It improves itself.
          </h2>
          <p className="mt-4 max-w-xl text-base text-slate-500">
            Every good diagnosis makes the next one sharper. The engineer rates each verdict;
            only the good ones are saved to the persistent brain (G-Brain) — so the next
            investigation starts smarter.
          </p>

          <div className="mt-14 grid gap-4 md:grid-cols-4">
            {[
              { step: "Diagnose", body: "The playbook runs against live fab data and prints a verdict." },
              { step: "Rate", body: "The engineer grades the verdict good or bad on the replay UI." },
              { step: "Remember", body: "Good cases are saved to memory; bad ones become anti-patterns to avoid." },
              { step: "Recall", body: "The next investigation loads the good examples and skips the known dead ends." },
            ].map((s, i) => (
              <div key={s.step} className="relative rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                  <h3 style={display} className="text-base font-bold">
                    {s.step}
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">{s.body}</p>
                {i < 3 && (
                  <ArrowRight className="absolute -right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-slate-300 md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────── the pitch deck (light) ───────────────────────── */}
      <section className="border-t border-slate-200 bg-[#f4f7f5] text-slate-900">
        <div className="mx-auto max-w-6xl px-6 py-14 md:py-20">
          <p style={mono} className="text-[11px] tracking-[0.3em] text-[#16a34a]">
            THE PITCH DECK
          </p>
          <h2 style={display} className="mt-4 max-w-2xl text-3xl font-bold leading-tight md:text-4xl">
            The whole story, in 18 slides.
          </h2>
          <p className="mt-4 max-w-xl text-base text-slate-500">
            Problem, product, architecture and market — the deck as presented at the hackathon.
            Click through to read it full-screen.
          </p>

          <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-[#0a0f0d] shadow-sm">
            {/* live, navigable preview of the deck */}
            <div className="relative aspect-[16/9] w-full">
              <iframe
                ref={deckRef}
                src="/slides.html"
                title="Foundry Brain pitch deck"
                tabIndex={-1}
                className="pointer-events-none h-full w-full border-0"
              />
              <button
                type="button"
                onClick={() => stepDeck(-1)}
                aria-label="Previous slide"
                className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#0a0f0d]/70 text-slate-300 backdrop-blur transition hover:border-[#22c55e]/60 hover:text-[#22c55e]"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
              </button>
              <button
                type="button"
                onClick={() => stepDeck(1)}
                aria-label="Next slide"
                className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-[#0a0f0d]/70 text-slate-300 backdrop-blur transition hover:border-[#22c55e]/60 hover:text-[#22c55e]"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 border-t border-white/[0.08] px-5 py-4">
              <span style={mono} className="text-xs text-slate-400">
                flip through right here, or open it full-screen
              </span>
              <a
                href="/slides.html"
                target="_blank"
                rel="noreferrer"
                style={mono}
                className="ml-auto flex items-center gap-2 text-xs text-[#22c55e] transition hover:translate-x-0.5"
              >
                Open the deck
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </div>

          {/* the pitch, on video */}
          <p style={mono} className="mt-12 text-[11px] tracking-[0.3em] text-[#16a34a]">
            THE PITCH VIDEO
          </p>
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-[#0a0f0d] shadow-sm">
            <div className="relative aspect-[16/9] w-full">
              <iframe
                src={PITCH_VIDEO_EMBED}
                title="Foundry Brain pitch video"
                allow="autoplay; fullscreen"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
            <div className="flex items-center gap-2 border-t border-white/[0.08] px-5 py-4">
              <span style={mono} className="text-xs text-slate-400">
                the hackathon pitch, as delivered
              </span>
              <a
                href={PITCH_VIDEO_LINK}
                target="_blank"
                rel="noreferrer"
                style={mono}
                className="ml-auto flex items-center gap-2 text-xs text-[#22c55e] transition hover:translate-x-0.5"
              >
                Watch on Google Drive
                <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────── closing (dark) ───────────────────────── */}
      <section className="border-t border-white/[0.06] bg-[#0a0f0d]">
        <div className="mx-auto flex max-w-6xl flex-col items-center px-6 py-24 text-center md:py-32">
          {/* the market — why this never being solved is the opportunity */}
          <div className="mb-16 grid w-full max-w-3xl grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              { v: "$300–600B", l: "lost to defects every year" },
              { v: "~1,200", l: "fabs worldwide" },
              { v: "$500B+", l: "of new fabs being built" },
            ].map((s) => (
              <div key={s.l}>
                <div style={display} className="text-3xl font-bold text-[#22c55e]">
                  {s.v}
                </div>
                <div style={mono} className="mt-1 text-[11px] text-slate-500">
                  {s.l}
                </div>
              </div>
            ))}
          </div>

          <Image src="/appIcon.png" alt="" width={48} height={48} unoptimized className="h-12 w-12" />
          <h2 style={display} className="mt-8 max-w-2xl text-3xl font-bold leading-tight md:text-5xl">
            Watch it diagnose
            <br />
            Etch-3 / Chamber C.
          </h2>
          <p className="mt-5 max-w-md text-base text-slate-400">
            The full investigation — replayed step by step, with the raw data it worked from.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <a
              href={GITHUB}
              target="_blank"
              rel="noreferrer"
              style={mono}
              className="flex items-center gap-2 rounded-md bg-[#22c55e] px-6 py-3.5 text-sm font-medium text-[#0a0f0d] transition hover:bg-[#4ade80]"
            >
              Open GitHub
              <ArrowRight />
            </a>
            <a
              href="/slides.html"
              target="_blank"
              rel="noreferrer"
              style={mono}
              className="rounded-md border border-white/15 px-6 py-3.5 text-sm text-slate-300 transition hover:border-white/40 hover:text-white"
            >
              Read the pitch deck
            </a>
          </div>
        </div>
        <footer className="border-t border-white/[0.06]">
          <div
            style={mono}
            className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-[11px] text-slate-500"
          >
            <span>FOUNDRY BRAIN — One OS, many skills · Sharpened on yield · It improves itself</span>
            <span>
              Built at the Compiled Global AI Hackathon ·{" "}
              <a href={GITHUB} target="_blank" rel="noreferrer" className="underline-offset-4 transition hover:text-slate-300 hover:underline">
                source on GitHub
              </a>
            </span>
          </div>
        </footer>
      </section>
    </div>
  );
}
