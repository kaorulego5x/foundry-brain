import type { PhaseId } from "@/lib/events";

const ORDER: { id: PhaseId; label: string }[] = [
  { id: "CVD", label: "CVD" },
  { id: "ETCH", label: "Etch" },
  { id: "CMP", label: "CMP" },
  { id: "INSPECT", label: "Inspection" },
];

// Mini process strip for alert cards: 4 dots, root-cause phase in red.
// While still investigating, only the detection point (Inspection) is marked.
export default function PhaseDots({
  causePhase,
}: {
  causePhase: PhaseId | null;
}) {
  return (
    <span className="inline-flex items-center">
      {ORDER.map((p, i) => {
        const isCause = causePhase === p.id;
        const isDetect = causePhase === null && p.id === "INSPECT";
        return (
          <span key={p.id} className="inline-flex items-center" title={p.label}>
            {i > 0 && <span className="h-px w-5 bg-slate-200" />}
            <span
              className={`h-2 w-2 rounded-full ${
                isCause
                  ? "bg-red-500 ring-2 ring-red-200"
                  : isDetect
                  ? "bg-red-400 animate-pulse"
                  : "bg-slate-300"
              }`}
            />
          </span>
        );
      })}
    </span>
  );
}
