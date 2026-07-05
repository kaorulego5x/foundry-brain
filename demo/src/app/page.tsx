import Link from "next/link";
import { ALERTS, type AlertItem } from "@/lib/alerts";
import { StatusBadge } from "@/components/ui";
import PhaseDots from "@/components/PhaseDots";

// Screen 1 — alert list. The AI has already worked through past excursions;
// the human just reviews the history. Today's alert is the live one.
export default function AlertListPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6 grid grid-cols-3 gap-4">
          <SummaryStat label="Lines monitored" value="3" />
          <SummaryStat label="Alerts this month" value="4" />
          <SummaryStat label="Avg. investigation time" value="4m 12s" />
        </div>

        <h2 className="mb-3 text-lg font-bold text-slate-900">Alerts</h2>
        <div className="space-y-3">
          {ALERTS.map((a) => (
            <AlertCard key={a.id} alert={a} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-0.5 font-mono text-2xl font-bold text-slate-900">
        {value}
      </div>
    </div>
  );
}

function AlertCard({ alert }: { alert: AlertItem }) {
  return (
    <Link
      href={`/alerts/${alert.id}`}
      className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <StatusBadge status={alert.status} />
        <span className="font-mono text-xs text-slate-400">
          {alert.detectedAt}
        </span>
        <span className="ml-auto font-mono text-[10px] text-slate-300">
          {alert.id}
        </span>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span
          className={`text-lg font-bold ${
            alert.status === "resolved" ? "text-slate-700" : "text-red-600"
          }`}
        >
          {alert.headline}
        </span>
        <span className="text-sm text-slate-500">{alert.detail}</span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <PhaseDots causePhase={alert.causePhase} />
        <span className="text-xs text-slate-500">
          {alert.causeLabel ? (
            <>
              root cause:{" "}
              <span className="font-mono font-semibold text-slate-700">
                {alert.causeLabel}
              </span>
            </>
          ) : (
            "detected at Quality Inspection — cause unknown"
          )}
        </span>
        {alert.outcome && (
          <span className="ml-auto font-mono text-xs font-semibold text-emerald-600">
            {alert.outcome}
          </span>
        )}
      </div>
    </Link>
  );
}
