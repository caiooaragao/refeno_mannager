import { prisma } from "../lib/prisma";
import {
  endOfDay,
  formatDate,
  formatDateTime,
  parseDate,
  startOfDay,
} from "../lib/date";
import { AppError } from "../middlewares/errorHandler";

export interface CreateInspectionInput {
  nome: string;
  nomeEmbarcacao: string;
  responsavelInspecao: string;
  horarioInicio: Date;
  horarioFim: Date;
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

const MIN_LENGTH = 2;
const MAX_LENGTH = 200;
const WORK_START_HOUR = 8;
const WORK_END_HOUR = 18;
const SLOT_DURATION_MS = 60 * 60 * 1000;

function validateString(value: string, fieldName: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new AppError(400, `${fieldName} é obrigatório`);
  }

  if (trimmed.length < MIN_LENGTH) {
    throw new AppError(400, `${fieldName} deve ter pelo menos ${MIN_LENGTH} caracteres`);
  }

  if (trimmed.length > MAX_LENGTH) {
    throw new AppError(400, `${fieldName} deve ter no máximo ${MAX_LENGTH} caracteres`);
  }

  return trimmed;
}

function slotsOverlap(
  slotStart: Date,
  slotEnd: Date,
  bookedStart: Date,
  bookedEnd: Date
): boolean {
  return slotStart < bookedEnd && slotEnd > bookedStart;
}

export class InspectionService {
  async create(data: CreateInspectionInput) {
    const nome = validateString(data.nome, "Nome");
    const nomeEmbarcacao = validateString(data.nomeEmbarcacao, "Nome da embarcação");
    const responsavelInspecao = validateString(
      data.responsavelInspecao,
      "Responsável pela inspeção"
    );

    if (!(data.horarioInicio instanceof Date) || isNaN(data.horarioInicio.getTime())) {
      throw new AppError(400, "Horário de início inválido");
    }

    if (!(data.horarioFim instanceof Date) || isNaN(data.horarioFim.getTime())) {
      throw new AppError(400, "Horário de fim inválido");
    }

    if (data.horarioFim <= data.horarioInicio) {
      throw new AppError(400, "Horário de fim deve ser posterior ao horário de início");
    }

    const duration = data.horarioFim.getTime() - data.horarioInicio.getTime();
    if (duration !== SLOT_DURATION_MS) {
      throw new AppError(400, "A inspeção deve ser agendada em um intervalo de 1 hora");
    }

    const overlapping = await prisma.inspection.findFirst({
      where: {
        horarioInicio: { lt: data.horarioFim },
        horarioFim: { gt: data.horarioInicio },
      },
    });

    if (overlapping) {
      throw new AppError(
        409,
        "Já existe uma inspeção agendada neste horário. Escolha outro intervalo."
      );
    }

    return prisma.inspection.create({
      data: {
        nome,
        nomeEmbarcacao,
        responsavelInspecao,
        horarioInicio: data.horarioInicio,
        horarioFim: data.horarioFim,
      },
    });
  }

  async getAvailableSlots(dataInspecao: string): Promise<DaySlots> {
    const day = parseDate(dataInspecao, "Data da inspeção");

    const booked = await prisma.inspection.findMany({
      where: {
        horarioInicio: { lt: endOfDay(day) },
        horarioFim: { gt: startOfDay(day) },
      },
      select: {
        horarioInicio: true,
        horarioFim: true,
      },
    });

    const horarios: TimeSlot[] = [];

    for (let hour = WORK_START_HOUR; hour < WORK_END_HOUR; hour++) {
      const slotStart = new Date(day);
      slotStart.setHours(hour, 0, 0, 0);

      const slotEnd = new Date(slotStart);
      slotEnd.setTime(slotStart.getTime() + SLOT_DURATION_MS);

      const isBooked = booked.some((inspection) =>
        slotsOverlap(
          slotStart,
          slotEnd,
          inspection.horarioInicio,
          inspection.horarioFim
        )
      );

      horarios.push({
        inicio: formatDateTime(slotStart),
        fim: formatDateTime(slotEnd),
        disponivel: !isBooked,
      });
    }

    return {
      data: formatDate(day),
      horarios,
    };
  }
}

export const inspectionService = new InspectionService();
