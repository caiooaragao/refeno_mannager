import { InspectionLocation } from "@prisma/client";
import { AppError } from "../middlewares/errorHandler";

export const INSPECTION_LOCATIONS = [
  "cabanga",
  "recife_marina",
] as const satisfies readonly InspectionLocation[];

export const LOCATION_LABELS: Record<InspectionLocation, string> = {
  cabanga: "Cabanga",
  recife_marina: "Recife Marina",
};

export function parseLocation(value: string, fieldName = "Local"): InspectionLocation {
  if (!INSPECTION_LOCATIONS.includes(value as InspectionLocation)) {
    throw new AppError(400, `${fieldName} inválido`);
  }

  return value as InspectionLocation;
}
