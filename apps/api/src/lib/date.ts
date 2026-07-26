import { AppError } from "../middlewares/errorHandler";

export const DATE_PATTERN = /^\d{2}\/\d{2}\/\d{4}$/;
export const DATETIME_PATTERN = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/;

export function parseDate(value: string, fieldName: string): Date {
  if (!DATE_PATTERN.test(value)) {
    throw new AppError(400, `${fieldName} deve estar no formato DD/MM/AAAA`);
  }

  const [day, month, year] = value.split("/").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    throw new AppError(400, `${fieldName} inválida`);
  }

  return date;
}

export function parseDateTime(value: string, fieldName: string): Date {
  if (!DATETIME_PATTERN.test(value)) {
    throw new AppError(400, `${fieldName} deve estar no formato DD/MM/AAAA HH:mm`);
  }

  const [datePart, timePart] = value.split(" ");
  const [day, month, year] = datePart.split("/").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day ||
    date.getHours() !== hours ||
    date.getMinutes() !== minutes
  ) {
    throw new AppError(400, `${fieldName} inválido`);
  }

  return date;
}

export function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateTime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${formatDate(date)} ${hours}:${minutes}`;
}

export function startOfDay(date: Date): Date {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}

export function endOfDay(date: Date): Date {
  const day = new Date(date);
  day.setHours(23, 59, 59, 999);
  return day;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

interface InspectionRecord {
  id: string;
  nome: string;
  nomeEmbarcacao: string;
  responsavelInspecao: string;
  horarioInicio: Date;
  horarioFim: Date;
  createdAt: Date;
}

export function serializeInspection(inspection: InspectionRecord) {
  return {
    id: inspection.id,
    nome: inspection.nome,
    nomeEmbarcacao: inspection.nomeEmbarcacao,
    responsavelInspecao: inspection.responsavelInspecao,
    horarioInicio: formatDateTime(inspection.horarioInicio),
    horarioFim: formatDateTime(inspection.horarioFim),
    createdAt: formatDateTime(inspection.createdAt),
  };
}
