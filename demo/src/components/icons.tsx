// Line icons for the three fab systems (replaces emoji). Stroke follows currentColor.

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

/** Play triangle (replaces "▶") */
export function PlayIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className ?? "h-4 w-4"}>
      <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11-6.86a1 1 0 0 0 0-1.7l-11-6.86A1 1 0 0 0 8 5.14Z" />
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

/** Restart arrow (replaces "↺") */
export function RestartIcon({ className }: IconProps) {
  return (
    <svg {...base(className ?? "h-4 w-4")}>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </svg>
  );
}
