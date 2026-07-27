import { InspectionStatus } from "@prisma/client";

export const INSPECTION_STATUSES = [
  "pendente",
  "confirmada",
  "realizada",
  "cancelada",
] as const satisfies readonly InspectionStatus[];

export const INSPECTION_STATUS_LABELS: Record<InspectionStatus, string> = {
  pendente: "Pendente",
  confirmada: "Confirmada",
  realizada: "Realizada",
  cancelada: "Cancelada",
};
