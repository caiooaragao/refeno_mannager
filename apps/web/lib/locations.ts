export const INSPECTION_LOCATIONS = ["cabanga", "recife_marina"] as const;

export type InspectionLocation = (typeof INSPECTION_LOCATIONS)[number];

export const LOCATION_LABELS: Record<InspectionLocation, string> = {
  cabanga: "Cabanga",
  recife_marina: "Recife Marina",
};
