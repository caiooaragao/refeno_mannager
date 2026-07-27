import { InspectionLocation, Permission } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { assertCanReadWrite } from "../lib/permissions";
import {
  addDays,
  addMinutes,
  endOfDay,
  formatDate,
  formatDateTime,
  parseDate,
  parseDateTime,
  startOfDay,
} from "../lib/date";
import { parseLocation } from "../lib/location";
import { AppError } from "../middlewares/errorHandler";

const TIME_STEP_MINUTES = 30;

export interface TimeRangeInput {
  inicio: string;
  fim: string;
}

export interface CreateAvailabilityInput {
  local: InspectionLocation;
  dataInicio: string;
  dataFim: string;
  horarios: TimeRangeInput[];
}

export interface UpdateAvailabilityInput {
  local: InspectionLocation;
  dataInspecao: string;
  inicio: string;
  fim: string;
}

interface AvailabilitySlotRecord {
  id: string;
  local: InspectionLocation;
  horarioInicio: Date;
  horarioFim: Date;
  inspection: { id: string } | null;
}

export function serializeAvailabilitySlot(slot: AvailabilitySlotRecord) {
  return {
    id: slot.id,
    local: slot.local,
    horarioInicio: formatDateTime(slot.horarioInicio),
    horarioFim: formatDateTime(slot.horarioFim),
    disponivel: !slot.inspection,
  };
}

function buildSlotTimes(dataInspecao: string, inicio: string, fim: string) {
  const horarioInicio = parseDateTime(`${dataInspecao} ${inicio}`, "Horário de início");
  const horarioFim = parseDateTime(`${dataInspecao} ${fim}`, "Horário de fim");

  if (horarioFim <= horarioInicio) {
    throw new AppError(400, "Horário de fim deve ser posterior ao horário de início");
  }

  return { horarioInicio, horarioFim };
}

function splitTimeRangeIntoSlots(horarioInicio: Date, horarioFim: Date) {
  const slots: Array<{ horarioInicio: Date; horarioFim: Date }> = [];
  let current = horarioInicio;

  while (true) {
    const slotEnd = addMinutes(current, TIME_STEP_MINUTES);

    if (slotEnd > horarioFim) {
      break;
    }

    slots.push({
      horarioInicio: new Date(current),
      horarioFim: slotEnd,
    });

    current = slotEnd;
  }

  if (!slots.length) {
    throw new AppError(
      400,
      `O intervalo deve ter pelo menos ${TIME_STEP_MINUTES} minutos`
    );
  }

  return slots;
}

function assertSlotIsFree(slot: AvailabilitySlotRecord) {
  if (slot.inspection) {
    throw new AppError(409, "Não é possível alterar uma disponibilidade já reservada");
  }
}

function buildDateRange(dataInicio: string, dataFim: string): Date[] {
  const start = parseDate(dataInicio, "Data inicial");
  const end = parseDate(dataFim, "Data final");

  if (end < start) {
    throw new AppError(400, "Data final deve ser igual ou posterior à data inicial");
  }

  const dates: Date[] = [];
  let current = start;

  while (current <= end) {
    dates.push(new Date(current));
    current = addDays(current, 1);
  }

  return dates;
}

export class AvailabilityService {
  async list(local?: InspectionLocation) {
    const slots = await prisma.availabilitySlot.findMany({
      where: local ? { local } : undefined,
      include: {
        inspection: {
          select: { id: true },
        },
      },
      orderBy: [{ horarioInicio: "asc" }],
    });

    return slots.map(serializeAvailabilitySlot);
  }

  async create(data: CreateAvailabilityInput, permission: Permission) {
    assertCanReadWrite(permission);

    if (!data.horarios.length) {
      throw new AppError(400, "Informe ao menos um horário");
    }

    const local = parseLocation(data.local);
    const dates = buildDateRange(data.dataInicio, data.dataFim);
    const created = [];

    for (const day of dates) {
      const dataInspecao = formatDate(day);

      for (const horario of data.horarios) {
        const { horarioInicio, horarioFim } = buildSlotTimes(
          dataInspecao,
          horario.inicio,
          horario.fim
        );

        const timeSlots = splitTimeRangeIntoSlots(horarioInicio, horarioFim);

        for (const timeSlot of timeSlots) {
          const existing = await prisma.availabilitySlot.findUnique({
            where: {
              local_horarioInicio: {
                local,
                horarioInicio: timeSlot.horarioInicio,
              },
            },
            include: {
              inspection: {
                select: { id: true },
              },
            },
          });

          if (existing) {
            throw new AppError(
              409,
              `Já existe disponibilidade em ${formatDateTime(timeSlot.horarioInicio)} para ${local}`
            );
          }

          const slot = await prisma.availabilitySlot.create({
            data: {
              local,
              horarioInicio: timeSlot.horarioInicio,
              horarioFim: timeSlot.horarioFim,
            },
            include: {
              inspection: {
                select: { id: true },
              },
            },
          });

          created.push(serializeAvailabilitySlot(slot));
        }
      }
    }

    return created;
  }

  async update(id: string, data: UpdateAvailabilityInput, permission: Permission) {
    assertCanReadWrite(permission);

    const existing = await prisma.availabilitySlot.findUnique({
      where: { id },
      include: {
        inspection: {
          select: { id: true },
        },
      },
    });

    if (!existing) {
      throw new AppError(404, "Disponibilidade não encontrada");
    }

    assertSlotIsFree(existing);

    const local = parseLocation(data.local);
    const { horarioInicio, horarioFim } = buildSlotTimes(
      data.dataInspecao,
      data.inicio,
      data.fim
    );

    const duplicate = await prisma.availabilitySlot.findFirst({
      where: {
        id: { not: id },
        local,
        horarioInicio,
      },
    });

    if (duplicate) {
      throw new AppError(
        409,
        `Já existe disponibilidade em ${formatDateTime(horarioInicio)} para ${local}`
      );
    }

    const updated = await prisma.availabilitySlot.update({
      where: { id },
      data: {
        local,
        horarioInicio,
        horarioFim,
      },
      include: {
        inspection: {
          select: { id: true },
        },
      },
    });

    return serializeAvailabilitySlot(updated);
  }

  async delete(id: string, permission: Permission): Promise<void> {
    assertCanReadWrite(permission);

    const existing = await prisma.availabilitySlot.findUnique({
      where: { id },
      include: {
        inspection: {
          select: { id: true },
        },
      },
    });

    if (!existing) {
      throw new AppError(404, "Disponibilidade não encontrada");
    }

    assertSlotIsFree(existing);

    await prisma.availabilitySlot.delete({
      where: { id },
    });
  }

  async getAvailableDates(local: InspectionLocation): Promise<string[]> {
    const now = new Date();

    const slots = await prisma.availabilitySlot.findMany({
      where: {
        local,
        horarioInicio: { gte: startOfDay(now) },
        inspection: null,
      },
      select: {
        horarioInicio: true,
      },
      orderBy: { horarioInicio: "asc" },
    });

    const uniqueDates = new Set<string>();

    for (const slot of slots) {
      uniqueDates.add(formatDate(slot.horarioInicio));
    }

    return Array.from(uniqueDates);
  }

  async getSlotsForDay(local: InspectionLocation, dataInspecao: string) {
    const day = parseDate(dataInspecao, "Data da inspeção");

    const slots = await prisma.availabilitySlot.findMany({
      where: {
        local,
        horarioInicio: { gte: startOfDay(day), lte: endOfDay(day) },
      },
      include: {
        inspection: {
          select: { id: true },
        },
      },
      orderBy: { horarioInicio: "asc" },
    });

    return {
      data: formatDate(day),
      horarios: slots.map((slot) => ({
        id: slot.id,
        local: slot.local,
        inicio: formatDateTime(slot.horarioInicio),
        fim: formatDateTime(slot.horarioFim),
        disponivel: !slot.inspection,
      })),
    };
  }

  async findBookableSlot(
    local: InspectionLocation,
    horarioInicio: Date,
    horarioFim: Date,
    excludeInspectionId?: string
  ) {
    const slot = await prisma.availabilitySlot.findFirst({
      where: {
        local,
        horarioInicio,
        horarioFim,
      },
      include: {
        inspection: {
          select: { id: true },
        },
      },
    });

    if (!slot) {
      throw new AppError(400, "Horário não disponível para este local");
    }

    if (slot.inspection && slot.inspection.id !== excludeInspectionId) {
      throw new AppError(409, "Este horário já está reservado");
    }

    return slot;
  }
}

export const availabilityService = new AvailabilityService();
