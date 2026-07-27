import { Request, Response, NextFunction } from "express";
import { z } from "zod";

import { formatDateTime } from "../lib/date";
import { userService } from "../services/user.service";
import { AppError } from "../middlewares/errorHandler";

const permissionSchema = z.enum(["read", "readwrite"], {
  errorMap: () => ({ message: "Permissão inválida" }),
});

const createUserSchema = z.object({
  login: z
    .string({ required_error: "Usuário é obrigatório" })
    .trim()
    .min(1, "Usuário é obrigatório"),
  password: z
    .string({ required_error: "Senha é obrigatória" })
    .min(1, "Senha é obrigatória"),
  permission: permissionSchema,
});

const updateUserSchema = z.object({
  login: z
    .string({ required_error: "Usuário é obrigatório" })
    .trim()
    .min(1, "Usuário é obrigatório"),
  password: z.string().optional(),
  permission: permissionSchema,
});

function serializeUser(user: {
  id: string;
  login: string;
  permission: string;
  createdAt: Date;
}) {
  return {
    id: user.id,
    login: user.login,
    permission: user.permission,
    createdAt: formatDateTime(user.createdAt),
  };
}

function parseUserId(req: Request): string {
  const rawId = req.params.id;
  const id = (Array.isArray(rawId) ? rawId[0] : rawId)?.trim();

  if (!id) {
    throw new AppError(400, "ID do usuário é obrigatório");
  }

  return id;
}

export class UserController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, "Não autenticado");
      }

      const users = await userService.list(req.user.permission);

      return res.json(users.map(serializeUser));
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, "Não autenticado");
      }

      const parsed = createUserSchema.safeParse(req.body);

      if (!parsed.success) {
        const message = parsed.error.errors[0]?.message ?? "Dados inválidos";
        throw new AppError(400, message);
      }

      const user = await userService.create(parsed.data, req.user.permission);

      return res.status(201).json(serializeUser(user));
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, "Não autenticado");
      }

      const id = parseUserId(req);
      const parsed = updateUserSchema.safeParse(req.body);

      if (!parsed.success) {
        const message = parsed.error.errors[0]?.message ?? "Dados inválidos";
        throw new AppError(400, message);
      }

      const user = await userService.update(id, parsed.data, req.user.permission);

      return res.json(serializeUser(user));
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, "Não autenticado");
      }

      const id = parseUserId(req);

      await userService.delete(id, req.user.id, req.user.permission);

      return res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
