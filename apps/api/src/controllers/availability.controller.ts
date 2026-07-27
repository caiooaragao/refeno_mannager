import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { DATE_PATTERN } from "../lib/date";
import { INSPECTION_LOCATIONS } from "../lib/location";
import { availabilityService } from "../services/availability.service";
import { AppError } from "../middlewares/errorHandler";

const TIME_PATTERN = /^\d{2}:\d{2}$/;

const localSchema = z.enum(INSPECTION_LOCATIONS, {
  errorMap: () => ({ message: "Local inválido" }),
});

const timeRangeSchema = z.object({
  inicio: z
    .string({ required_error: "Horário de início é obrigatório" })
    .trim()
    .regex(TIME_PATTERN, "Horário de início deve estar no formato HH:mm"),
  fim: z
    .string({ required_error: "Horário de fim é obrigatório" })
    .trim()
    .regex(TIME_PATTERN, "Horário de fim deve estar no formato HH:mm"),
});

const dateField = (label: string) =>
  z
    .string({ required_error: `${label} é obrigatória` })
    .trim()
    .regex(DATE_PATTERN, `${label} deve estar no formato DD/MM/AAAA`);

const createAvailabilitySchema = z.object({
  local: localSchema,
  dataInicio: dateField("Data inicial"),
  dataFim: dateField("Data final"),
  horarios: z
    .array(timeRangeSchema)
    .min(1, "Informe ao menos um horário"),
});

const updateAvailabilitySchema = z.object({
  local: localSchema,
  dataInspecao: z
    .string({ required_error: "Data da inspeção é obrigatória" })
    .trim()
    .regex(DATE_PATTERN, "Data da inspeção deve estar no formato DD/MM/AAAA"),
  inicio: z
    .string({ required_error: "Horário de início é obrigatório" })
    .trim()
    .regex(TIME_PATTERN, "Horário de início deve estar no formato HH:mm"),
  fim: z
    .string({ required_error: "Horário de fim é obrigatório" })
    .trim()
    .regex(TIME_PATTERN, "Horário de fim deve estar no formato HH:mm"),
});

export class AvailabilityController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, "Não autenticado");
      }

      const localParam = req.query.local;
      const local =
        typeof localParam === "string" && localParam
          ? localSchema.parse(localParam)
          : undefined;

      const slots = await availabilityService.list(local);

      return res.json(slots);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, "Não autenticado");
      }

      const parsed = createAvailabilitySchema.safeParse(req.body);

      if (!parsed.success) {
        const message = parsed.error.errors[0]?.message ?? "Dados inválidos";
        throw new AppError(400, message);
      }

      const created = await availabilityService.create(
        parsed.data,
        req.user.permission
      );

      return res.status(201).json(created);
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
        throw new AppError(400, "ID da disponibilidade é obrigatório");
      }

      const parsed = updateAvailabilitySchema.safeParse(req.body);

      if (!parsed.success) {
        const message = parsed.error.errors[0]?.message ?? "Dados inválidos";
        throw new AppError(400, message);
      }

      const updated = await availabilityService.update(
        id,
        parsed.data,
        req.user.permission
      );

      return res.json(updated);
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
        throw new AppError(400, "ID da disponibilidade é obrigatório");
      }

      await availabilityService.delete(id, req.user.permission);

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const availabilityController = new AvailabilityController();
