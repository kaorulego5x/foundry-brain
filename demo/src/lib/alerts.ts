import type { PhaseId } from "./events";

export type AlertStatus = "investigating" | "resolved";

export interface AlertItem {
  id: string;
  detectedAt: string;
  headline: string; // e.g. "Yield drop −12%"
  detail: string;
  status: AlertStatus;
  causePhase: PhaseId | null;
  causeLabel: string | null; // e.g. "Etch-3 / C · RF power drift"
  outcome: string | null; // e.g. "$0.8M saved"
  live?: boolean; // the one alert wired to the demo scenario
}

export const ALERTS: AlertItem[] = [
  {
    id: "ALT-2026-0704",
    detectedAt: "2026-07-04 14:32",
    headline: "Yield drop −12%",
    detail: "5 of 11 lots out of spec at final inspection",
    status: "investigating",
    causePhase: null,
    causeLabel: null,
    outcome: null,
    live: true,
  },
  {
    id: "ALT-2026-0628",
    detectedAt: "2026-06-28 09:15",
    headline: "Yield drop −7%",
    detail: "3 of 12 lots under thickness spec",
    status: "resolved",
    causePhase: "CVD",
    causeLabel: "CVD-1 / A · gas flow drift",
    outcome: "$0.8M saved",
  },
  {
    id: "ALT-2026-0619",
    detectedAt: "2026-06-19 21:48",
    headline: "Defect density +3.1×",
    detail: "particle counts spiking on 2 lots",
    status: "resolved",
    causePhase: "CMP",
    causeLabel: "CMP-2 / B · pad wear",
    outcome: "$0.4M saved",
  },
  {
    id: "ALT-2026-0602",
    detectedAt: "2026-06-02 05:33",
    headline: "Yield drop −9%",
    detail: "CD variation out of control band",
    status: "resolved",
    causePhase: "ETCH",
    causeLabel: "Etch-1 / B · He cooling leak",
    outcome: "$1.2M saved",
  },
];

export function getAlert(id: string): AlertItem | undefined {
  return ALERTS.find((a) => a.id === id);
}
