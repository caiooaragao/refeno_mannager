const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3333";

const defaultFetchOptions: RequestInit = {
  credentials: "include",
};

async function parseResponse<T>(response: Response): Promise<T> {
  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error ?? "Erro na requisição");
  }

  return body as T;
}

export interface InspectionPayload {
  nome: string;
  nomeEmbarcacao: string;
  responsavelInspecao: string;
  celular: string;
  local: string;
  dataInspecao: string;
  horario: string;
}

export interface UpdateInspectionPayload extends InspectionPayload {
  observacoes?: string | null;
  status: string;
}

export interface Inscricao {
  id: string;
  nome: string;
  nomeEmbarcacao: string;
  responsavelInspecao: string;
  celular: string;
  local: string;
  horarioInicio: string;
  horarioFim: string;
  observacoes: string | null;
  status: string;
  createdAt: string;
}

export interface InspectionResponse extends Inscricao {}

export interface AuthUser {
  id: string;
  login: string;
  permission: string;
}

export interface CreateUserPayload {
  login: string;
  password: string;
  permission: "read" | "readwrite";
}

export interface UpdateUserPayload {
  login: string;
  password?: string;
  permission: "read" | "readwrite";
}

export interface AdminUser {
  id: string;
  login: string;
  permission: string;
  createdAt: string;
}

export interface TimeSlot {
  id?: string;
  local?: string;
  inicio: string;
  fim: string;
  disponivel: boolean;
}

export interface DaySlots {
  data: string;
  horarios: TimeSlot[];
}

export interface AvailableDatesPayload {
  local: string;
}

export interface AvailableDatesResponse {
  datas: string[];
}

export interface AvailableSlotsPayload {
  local: string;
  dataInspecao: string;
}

export interface AvailabilitySlot {
  id: string;
  local: string;
  horarioInicio: string;
  horarioFim: string;
  disponivel: boolean;
}

export interface CreateAvailabilityPayload {
  local: string;
  dataInicio: string;
  dataFim: string;
  horarios: Array<{ inicio: string; fim: string }>;
}

export interface UpdateAvailabilityPayload {
  local: string;
  dataInspecao: string;
  inicio: string;
  fim: string;
}

export async function loginAdmin(
  login: string,
  password: string
): Promise<{ token: string; user: AuthUser }> {
  const response = await fetch(`${API_URL}/api/login`, {
    ...defaultFetchOptions,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password }),
  });

  return parseResponse(response);
}

export async function logoutAdmin(): Promise<void> {
  const response = await fetch(`${API_URL}/api/logout`, {
    ...defaultFetchOptions,
    method: "POST",
  });

  await parseResponse(response);
}

export async function getMe(): Promise<AuthUser> {
  const response = await fetch(`${API_URL}/api/me`, {
    ...defaultFetchOptions,
    cache: "no-store",
  });

  const body = await parseResponse<{ user: AuthUser }>(response);
  return body.user;
}

export async function createUser(
  data: CreateUserPayload
): Promise<AdminUser> {
  const response = await fetch(`${API_URL}/api/usuarios`, {
    ...defaultFetchOptions,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return parseResponse(response);
}

export async function getUsers(): Promise<AdminUser[]> {
  const response = await fetch(`${API_URL}/api/usuarios`, {
    ...defaultFetchOptions,
    cache: "no-store",
  });

  return parseResponse(response);
}

export async function updateUser(
  id: string,
  data: UpdateUserPayload
): Promise<AdminUser> {
  const response = await fetch(`${API_URL}/api/usuarios/${id}`, {
    ...defaultFetchOptions,
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return parseResponse(response);
}

export async function deleteUser(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/usuarios/${id}`, {
    ...defaultFetchOptions,
    method: "DELETE",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? "Erro ao excluir usuário");
  }
}

export async function getInscricoes(): Promise<Inscricao[]> {
  const response = await fetch(`${API_URL}/api/inscricoes`, {
    ...defaultFetchOptions,
    cache: "no-store",
  });

  return parseResponse<Inscricao[]>(response);
}

export async function getAvailableDates(
  data: AvailableDatesPayload
): Promise<AvailableDatesResponse> {
  const response = await fetch(`${API_URL}/api/inspections/datasDisponiveis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return parseResponse(response);
}

export async function getAvailableSlots(
  data: AvailableSlotsPayload
): Promise<DaySlots> {
  const response = await fetch(`${API_URL}/api/inspections/horariosDisponiveis`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return parseResponse(response);
}

export async function createInspection(
  data: InspectionPayload
): Promise<InspectionResponse> {
  const response = await fetch(`${API_URL}/api/inspections`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return parseResponse(response);
}

export async function deleteInspection(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/inspections/${id}`, {
    ...defaultFetchOptions,
    method: "DELETE",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? "Erro ao excluir inspeção");
  }
}

export async function updateInspection(
  id: string,
  data: UpdateInspectionPayload
): Promise<InspectionResponse> {
  const response = await fetch(`${API_URL}/api/inspections/${id}`, {
    ...defaultFetchOptions,
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return parseResponse(response);
}

export async function getDisponibilidades(
  local?: string
): Promise<AvailabilitySlot[]> {
  const query = local ? `?local=${encodeURIComponent(local)}` : "";
  const response = await fetch(`${API_URL}/api/disponibilidades${query}`, {
    ...defaultFetchOptions,
    cache: "no-store",
  });

  return parseResponse(response);
}

export async function createDisponibilidade(
  data: CreateAvailabilityPayload
): Promise<AvailabilitySlot[]> {
  const response = await fetch(`${API_URL}/api/disponibilidades`, {
    ...defaultFetchOptions,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return parseResponse(response);
}

export async function updateDisponibilidade(
  id: string,
  data: UpdateAvailabilityPayload
): Promise<AvailabilitySlot> {
  const response = await fetch(`${API_URL}/api/disponibilidades/${id}`, {
    ...defaultFetchOptions,
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  return parseResponse(response);
}

export async function deleteDisponibilidade(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/disponibilidades/${id}`, {
    ...defaultFetchOptions,
    method: "DELETE",
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? "Erro ao excluir disponibilidade");
  }
}
