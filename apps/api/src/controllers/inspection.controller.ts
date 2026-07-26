import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import {
  DATE_PATTERN,
  DATETIME_PATTERN,
  parseDateTime,
  serializeInspection,
} from "../lib/date";
import { inspectionService } from "../services/inspection.service";
import { AppError } from "../middlewares/errorHandler";

const createInspectionSchema = z.object({
  nome: z.string(),
  nomeEmbarcacao: z.string(),
  responsavelInspecao: z.string(),
  horarioInicio: z
    .string()
    .regex(DATETIME_PATTERN, "Horário de início deve estar no formato DD/MM/AAAA HH:mm"),
  horarioFim: z
    .string()
    .regex(DATETIME_PATTERN, "Horário de fim deve estar no formato DD/MM/AAAA HH:mm"),
});

const availableSlotsBodySchema = z.object({
  dataInspecao: z
    .string()
    .regex(DATE_PATTERN, "Data da inspeção deve estar no formato DD/MM/AAAA"),
});

export class InspectionController {
  async getAvailableSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = availableSlotsBodySchema.safeParse(req.body);

      if (!parsed.success) {
        const message = parsed.error.errors[0]?.message ?? "Parâmetros inválidos";
        throw new AppError(400, message);
      }

      const slots = await inspectionService.getAvailableSlots(parsed.data.dataInspecao);

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

      const inspection = await inspectionService.create({
        nome: parsed.data.nome,
        nomeEmbarcacao: parsed.data.nomeEmbarcacao,
        responsavelInspecao: parsed.data.responsavelInspecao,
        horarioInicio: parseDateTime(parsed.data.horarioInicio, "Horário de início"),
        horarioFim: parseDateTime(parsed.data.horarioFim, "Horário de fim"),
      });

      return res.status(201).json(serializeInspection(inspection));
    } catch (error) {
      next(error);
    }
  }
}

export const inspectionController = new InspectionController();
