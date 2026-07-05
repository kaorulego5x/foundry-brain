// Shared UI atoms used across the alert list and detail screens.

export function Chip({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "red" | "amber" | "indigo";
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-600",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber-100 text-amber-700",
    indigo: "bg-indigo-100 text-indigo-700",
  };
  return (
    <span
      className={`rounded-md px-2 py-0.5 font-mono text-[11px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm">
      <span className="text-slate-400">{label}: </span>
      <span className="font-mono font-semibold text-slate-900">{value}</span>
    </div>
  );
}

export type AlertStatus = "investigating" | "resolved";

export function StatusBadge({ status }: { status: AlertStatus }) {
  const map = {
    investigating: {
      label: "Investigating",
      cls: "bg-indigo-100 text-indigo-700",
      dot: "bg-indigo-500 animate-pulse",
    },
    resolved: {
      label: "Resolved",
      cls: "bg-emerald-100 text-emerald-700",
      dot: "bg-emerald-500",
    },
  } as const;
  const m = map[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${m.cls}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}
