const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

export interface InspectionPayload {
  nome: string;
  nomeEmbarcacao: string;
  responsavelInspecao: string;
  horarioInicio: string;
  horarioFim: string;
}

export interface InspectionResponse {
  id: string;
  nome: string;
  nomeEmbarcacao: string;
  responsavelInspecao: string;
  horarioInicio: string;
  horarioFim: string;
  createdAt: string;
}

export interface TimeSlot {
  inicio: string;
  fim: string;
  disponivel: boolean;
}

export interface DaySlots {
  data: string;
  horarios: TimeSlot[];
}

export interface AvailableSlotsPayload {
  dataInspecao: string;
}

export async function getAvailableSlots(
  data: AvailableSlotsPayload
): Promise<DaySlots> {
  const response = await fetch(`${API_URL}/api/inspections/horariosDisponiveis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error ?? "Erro ao buscar horários disponíveis");
  }

  return body;
}

export async function createInspection(
  data: InspectionPayload
): Promise<InspectionResponse> {
  const response = await fetch(`${API_URL}/api/inspections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error ?? "Erro ao enviar formulário");
  }

  return body;
}
