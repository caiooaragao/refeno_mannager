import { Permission } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { comparePassword } from "../lib/password";
import { signToken } from "../lib/jwt";
import { AppError } from "../middlewares/errorHandler";

export interface LoginInput {
  login: string;
  password: string;
}

export interface AuthenticatedUser {
  id: string;
  login: string;
  permission: Permission;
}

export class AuthService {
  async login({ login, password }: LoginInput): Promise<{ token: string; user: AuthenticatedUser }> {
    const normalizedLogin = login.trim();

    if (!normalizedLogin || !password) {
      throw new AppError(400, "Login e senha são obrigatórios");
    }

    const user = await prisma.user.findUnique({
      where: { login: normalizedLogin },
    });

    if (!user) {
      throw new AppError(401, "Credenciais inválidas");
    }

    const passwordMatches = await comparePassword(password, user.password);

    if (!passwordMatches) {
      throw new AppError(401, "Credenciais inválidas");
    }

    const token = signToken({
      userId: user.id,
      login: user.login,
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { token },
    });

    return {
      token,
      user: {
        id: user.id,
        login: user.login,
        permission: user.permission,
      },
    };
  }

  async logout(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { token: null },
    });
  }
}

export const authService = new AuthService();
