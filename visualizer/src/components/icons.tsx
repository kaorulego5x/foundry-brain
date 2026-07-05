// Line icons (stroke: currentColor) — the app never uses emoji glyphs.

interface IconProps {
  className?: string;
}

function base(className?: string) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: className ?? "h-5 w-5",
  };
}

/** Production History (MES) — factory silhouette */
export function FactoryIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M3 21V9l6 4V9l6 4V5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v16H3Z" />
      <path d="M7 17h.01M12 17h.01M17 17h.01" />
    </svg>
  );
}

/** Machine Sensors (FDC) — antenna with waves */
export function SensorIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M12 21v-8" />
      <circle cx="12" cy="11" r="2" />
      <path d="M8.5 7.5a5 5 0 0 0 0 7M15.5 7.5a5 5 0 0 1 0 7" />
      <path d="M5.6 4.6a9 9 0 0 0 0 12.8M18.4 4.6a9 9 0 0 1 0 12.8" />
    </svg>
  );
}

/** Quality Inspection (Metrology) — microscope */
export function InspectIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M6 18h8M3 22h18" />
      <path d="M14 22a7 7 0 1 0 0-14h-1" />
      <path d="M9 14h2" />
      <path d="M10.2 2.2 8 4.4a1 1 0 0 0 0 1.4l2.2 2.2a1 1 0 0 0 1.4 0l2.2-2.2a1 1 0 0 0 0-1.4l-2.2-2.2a1 1 0 0 0-1.4 0Z" />
    </svg>
  );
}

/** Wafer lot — notched wafer disc with die grid */
export function WaferIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3.5v17M3.5 12h17M6 6.5l12 11M18 6.5l-12 11" opacity="0.45" />
      <path d="M10.5 20.7h3" strokeWidth="2.4" />
    </svg>
  );
}

/** CVD — deposition layers settling on a substrate */
export function CvdIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M4 19h16" />
      <path d="M6 15.5h12" opacity="0.7" />
      <path d="M8 12h8" opacity="0.45" />
      <path d="M8 4v3M12 4v4M16 4v3" />
    </svg>
  );
}

/** Etch — plasma bolt over a substrate */
export function EtchIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M13 3 8 12h3.5L10 20l6-10.5h-3.5L14.5 3H13Z" />
    </svg>
  );
}

/** CMP — polishing pad over a wafer */
export function CmpIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="14" r="6" />
      <path d="M8.5 5.5h7M7 8.5h10" />
      <path d="M9.5 14a2.5 2.5 0 0 1 5 0" opacity="0.6" />
    </svg>
  );
}

/** Generic process step — cog */
export function CogIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
    </svg>
  );
}

/** Play triangle (replaces "▶") */
export function PlayIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className ?? "h-4 w-4"}>
      <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11-6.86a1 1 0 0 0 0-1.7l-11-6.86A1 1 0 0 0 8 5.14Z" />
    </svg>
  );
}

/** Restart arrow (replaces "↺") */
export function RestartIcon({ className }: IconProps) {
  return (
    <svg {...base(className ?? "h-4 w-4")}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}

/** Check mark (replaces "✓") */
export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...base(className ?? "h-3 w-3")} strokeWidth={3}>
      <path d="M4 12.5 9.5 18 20 6.5" />
    </svg>
  );
}

/** Sidebar toggle — panel with a left column */
export function PanelLeftIcon({ className }: IconProps) {
  return (
    <svg {...base(className ?? "h-4 w-4")} strokeWidth={2}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M9.5 4v16" />
    </svg>
  );
}

/** Chevron for expand/collapse affordances */
export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg {...base(className ?? "h-4 w-4")} strokeWidth={2.2}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/** Bidirectional arrows (replaces "⇄") */
export function ExchangeIcon({ className }: IconProps) {
  return (
    <svg {...base(className ?? "h-4 w-4")} strokeWidth={2}>
      <path d="M4 8h13M14 4l4 4-4 4M20 16H7M10 12l-4 4 4 4" />
    </svg>
  );
}
