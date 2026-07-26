import { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { verifyToken } from "../lib/jwt";
import { AppError } from "./errorHandler";

const PUBLIC_ROUTES = [
  { method: "GET", path: "/api/health" },
  { method: "POST", path: "/api/login" },
  { method: "POST", path: "/api/logout" },
  { method: "POST", path: "/api/inspections/horariosDisponiveis" },
  { method: "POST", path: "/api/inspections" },
];

function isPublicRoute(method: string, path: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => route.method === method && route.path === path
  );
}

function extractToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  if (req.cookies?.token) {
    return req.cookies.token;
  }

  return undefined;
}

async function authenticateUser(req: Request): Promise<void> {
  const token = extractToken(req);

  if (!token) {
    throw new AppError(401, "Token não informado");
  }

  const payload = verifyToken(token);

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      login: true,
      permission: true,
      token: true,
    },
  });

  if (!user) {
    throw new AppError(401, "Usuário não encontrado");
  }

  if (!user.token || user.token !== token) {
    throw new AppError(401, "Token inválido ou expirado");
  }

  req.user = {
    id: user.id,
    login: user.login,
    permission: user.permission,
  };
}

export async function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  if (isPublicRoute(req.method, req.path)) {
    try {
      await authenticateUser(req);
    } catch {
      // Rotas públicas não exigem token; autenticação opcional para logout.
    }

    return next();
  }

  try {
    await authenticateUser(req);
    return next();
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }

    return next(new AppError(401, "Token inválido ou expirado"));
  }
}
