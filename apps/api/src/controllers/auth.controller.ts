import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authService } from "../services/auth.service";
import { AppError } from "../middlewares/errorHandler";

const loginSchema = z.object({
  login: z.string().min(1, "Login é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const USE_SECURE_COOKIE =
  process.env.COOKIE_SECURE === "true" ||
  (process.env.COOKIE_SECURE !== "false" &&
    (process.env.FRONTEND_URL?.startsWith("https://") ?? false));

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const parsed = loginSchema.safeParse(req.body);

      if (!parsed.success) {
        const message = parsed.error.errors[0]?.message ?? "Dados inválidos";
        throw new AppError(400, message);
      }

      const { token, user } = await authService.login(parsed.data);

      res.cookie("token", token, {
        httpOnly: true,
        secure: USE_SECURE_COOKIE,
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE_MS,
      });

      return res.json({ token, user });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user) {
        await authService.logout(req.user.id);
      }

      res.clearCookie("token");

      return res.json({ message: "Logout realizado com sucesso" });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new AppError(401, "Não autenticado");
      }

      return res.json({ user: req.user });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
