import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  DATE_PATTERN,
  parseDateTime,
  serializeInspection,
} from "../lib/date";
import { INSPECTION_STATUSES } from "../lib/inspection-status";
import { INSPECTION_LOCATIONS } from "../lib/location";
import { availabilityService } from "../services/availability.service";
import { inspectionService } from "../services/inspection.service";
import { AppError } from "../middlewares/errorHandler";

const MAX_FIELD_LENGTH = 200;

function requiredTextField(label: string) {
  return z
    .string({ required_error: `${label} é obrigatório` })
    .trim()
    .min(1, `${label} é obrigatório`)
    .min(2, `${label} deve ter pelo menos 2 caracteres`)
    .max(MAX_FIELD_LENGTH, `${label} deve ter no máximo ${MAX_FIELD_LENGTH} caracteres`);
}

const localSchema = z.enum(INSPECTION_LOCATIONS, {
  errorMap: () => ({ message: "Local inválido" }),
});

const createInspectionSchema = z.object({
  nome: requiredTextField("Nome"),
  nomeEmbarcacao: requiredTextField("Nome da embarcação"),
  responsavelInspecao: requiredTextField("Responsável pela inspeção"),
  celular: requiredTextField("Celular"),
  local: localSchema,
  dataInspecao: z
    .string({ required_error: "Data da inspeção é obrigatória" })
    .trim()
    .min(1, "Data da inspeção é obrigatória")
    .regex(DATE_PATTERN, "Data da inspeção deve estar no formato DD/MM/AAAA"),
  horario: z
    .string({ required_error: "Horário é obrigatório" })
    .trim()
    .min(1, "Horário é obrigatório")
    .regex(/^\d{2}:\d{2}$/, "Horário deve estar no formato HH:mm"),
});

const updateInspectionSchema = createInspectionSchema.extend({
  observacoes: z
    .string()
    .max(2000, "Observações devem ter no máximo 2000 caracteres")
    .optional()
    .nullable(),
  status: z.enum(INSPECTION_STATUSES, {
    errorMap: () => ({ message: "Status inválido" }),
  }),
});

const availableDatesBodySchema = z.object({
  local: localSchema,
});

const availableSlotsBodySchema = z.object({
  local: localSchema,
  dataInspecao: z
    .string({ required_error: "Data da inspeção é obrigatória" })
    .trim()
    .min(1, "Data da inspeção é obrigatória")
    .regex(DATE_PATTERN, "Data da inspeção deve estar no formato DD/MM/AAAA"),
});

async function resolveSlotTimes(
  local: z.infer<typeof localSchema>,
  dataInspecao: string,
  horario: string,
  excludeInspectionId?: string
) {
  const horarioInicio = parseDateTime(
    `${dataInspecao} ${horario}`,
    "Data e horário"
  );

  const daySlots = await availabilityService.getSlotsForDay(local, dataInspecao);
  const matchedSlot = daySlots.horarios.find((item) => {
    const start = parseDateTime(item.inicio, "Horário");
    return start.getTime() === horarioInicio.getTime();
  });

  if (!matchedSlot) {
    throw new AppError(400, "Horário selecionado não está disponível");
  }

  const horarioFim = parseDateTime(matchedSlot.fim, "Horário de fim");

  await availabilityService.findBookableSlot(
    local,
    horarioInicio,
    horarioFim,
    excludeInspectionId
  );

  return { horarioInicio, horarioFim };
}

export class InspectionController {
  async getAvailableDates(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = availableDatesBodySchema.safeParse(req.body);

      if (!parsed.success) {
        const message = parsed.error.errors[0]?.message ?? "Parâmetros inválidos";
        throw new AppError(400, message);
      }

      const dates = await inspectionService.getAvailableDates(parsed.data.local);

      return res.json({ datas: dates });
    } catch (error) {
      next(error);
    }
  }

  async getAvailableSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = availableSlotsBodySchema.safeParse(req.body);

      if (!parsed.success) {
        const message = parsed.error.errors[0]?.message ?? "Parâmetros inválidos";
        throw new AppError(400, message);
      }

      const slots = await inspectionService.getAvailableSlots(
        parsed.data.local,
        parsed.data.dataInspecao
      );

      return res.json(slots);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = createInspectionSchema.safeParse(req.body);

      if (!parsed.success) {
        const message = parsed.error.errors[0]?.message ?? "Dados inválidos";
        throw new AppError(400, message);
      }

      const { horarioInicio, horarioFim } = await resolveSlotTimes(
        parsed.data.local,
        parsed.data.dataInspecao,
        parsed.data.horario
      );

      const inspection = await inspectionService.create({
        nome: parsed.data.nome,
        nomeEmbarcacao: parsed.data.nomeEmbarcacao,
        responsavelInspecao: parsed.data.responsavelInspecao,
        celular: parsed.data.celular,
        local: parsed.data.local,
        horarioInicio,
        horarioFim,
      });

      return res.status(201).json(serializeInspection(inspection));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, "Não autenticado");
      }

      const rawId = req.params.id;
      const id = (Array.isArray(rawId) ? rawId[0] : rawId)?.trim();
      if (!id) {
        throw new AppError(400, "ID da inspeção é obrigatório");
      }

      const parsed = updateInspectionSchema.safeParse(req.body);

      if (!parsed.success) {
        const message = parsed.error.errors[0]?.message ?? "Dados inválidos";
        throw new AppError(400, message);
      }

      const { horarioInicio, horarioFim } = await resolveSlotTimes(
        parsed.data.local,
        parsed.data.dataInspecao,
        parsed.data.horario,
        id
      );

      const inspection = await inspectionService.update(
        id,
        {
          nome: parsed.data.nome,
          nomeEmbarcacao: parsed.data.nomeEmbarcacao,
          responsavelInspecao: parsed.data.responsavelInspecao,
          celular: parsed.data.celular,
          local: parsed.data.local,
          horarioInicio,
          horarioFim,
          observacoes: parsed.data.observacoes,
          status: parsed.data.status,
        },
        req.user.permission
      );

      return res.json(serializeInspection(inspection));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, "Não autenticado");
      }

      const rawId = req.params.id;
      const id = (Array.isArray(rawId) ? rawId[0] : rawId)?.trim();
      if (!id) {
        throw new AppError(400, "ID da inspeção é obrigatório");
      }

      await inspectionService.delete(id, req.user.permission);

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const inspectionController = new InspectionController();
