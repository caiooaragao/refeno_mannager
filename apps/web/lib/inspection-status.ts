export const INSPECTION_STATUSES = [
  "pendente",
  "confirmada",
  "realizada",
  "cancelada",
] as const;

export type InspectionStatus = (typeof INSPECTION_STATUSES)[number];

export const INSPECTION_STATUS_LABELS: Record<InspectionStatus, string> = {
  pendente: "Pendente",
  confirmada: "Confirmada",
  realizada: "Realizada",
  cancelada: "Cancelada",
};

export const INSPECTION_STATUS_COLORS: Record<InspectionStatus, string> = {
  pendente: "text-yellow-500",
  confirmada: "text-yellow-500",
  realizada: "text-green-500",
  cancelada: "text-red-500",
};

export function getInspectionStatusColorClass(status: string): string {
  return (
    INSPECTION_STATUS_COLORS[status as InspectionStatus] ??
    "text-on-surface-variant"
  );
}
