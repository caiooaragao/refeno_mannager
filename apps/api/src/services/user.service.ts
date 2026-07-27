import { Permission } from "@prisma/client";

import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";
import { assertCanRead, assertCanReadWrite } from "../lib/permissions";
import { AppError } from "../middlewares/errorHandler";

export interface CreateUserInput {
  login: string;
  password: string;
  permission: Permission;
}

export interface UpdateUserInput {
  login: string;
  password?: string;
  permission: Permission;
}

const MIN_LOGIN_LENGTH = 2;
const MAX_LOGIN_LENGTH = 100;
const MIN_PASSWORD_LENGTH = 6;

const userSelect = {
  id: true,
  login: true,
  permission: true,
  createdAt: true,
} as const;

function validatePermission(permission: Permission) {
  if (permission !== "read" && permission !== "readwrite") {
    throw new AppError(400, "Permissão inválida");
  }
}

function validateLogin(login: string) {
  const normalizedLogin = login.trim();

  if (!normalizedLogin) {
    throw new AppError(400, "Usuário é obrigatório");
  }

  if (normalizedLogin.length < MIN_LOGIN_LENGTH) {
    throw new AppError(
      400,
      `Usuário deve ter pelo menos ${MIN_LOGIN_LENGTH} caracteres`
    );
  }

  if (normalizedLogin.length > MAX_LOGIN_LENGTH) {
    throw new AppError(
      400,
      `Usuário deve ter no máximo ${MAX_LOGIN_LENGTH} caracteres`
    );
  }

  return normalizedLogin;
}

function validatePassword(password: string, required: boolean) {
  if (!password) {
    if (required) {
      throw new AppError(400, "Senha é obrigatória");
    }

    return null;
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new AppError(
      400,
      `Senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`
    );
  }

  return password;
}

function validateCreateUserData(data: CreateUserInput) {
  validatePermission(data.permission);

  return {
    login: validateLogin(data.login),
    password: validatePassword(data.password, true)!,
    permission: data.permission,
  };
}

function validateUpdateUserData(data: UpdateUserInput) {
  validatePermission(data.permission);

  return {
    login: validateLogin(data.login),
    password: validatePassword(data.password ?? "", false),
    permission: data.permission,
  };
}

async function ensureLoginAvailable(login: string, ignoreUserId?: string) {
  const existing = await prisma.user.findUnique({
    where: { login },
  });

  if (existing && existing.id !== ignoreUserId) {
    throw new AppError(409, "Usuário já existe");
  }
}

export class UserService {
  async list(requesterPermission: Permission) {
    assertCanRead(requesterPermission);

    return prisma.user.findMany({
      select: userSelect,
      orderBy: { createdAt: "desc" },
    });
  }

  async create(data: CreateUserInput, requesterPermission: Permission) {
    assertCanReadWrite(requesterPermission);

    const validated = validateCreateUserData(data);
    await ensureLoginAvailable(validated.login);

    const hashedPassword = await hashPassword(validated.password);

    return prisma.user.create({
      data: {
        login: validated.login,
        password: hashedPassword,
        permission: validated.permission,
      },
      select: userSelect,
    });
  }

  async update(
    id: string,
    data: UpdateUserInput,
    requesterPermission: Permission
  ) {
    assertCanReadWrite(requesterPermission);

    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError(404, "Usuário não encontrado");
    }

    const validated = validateUpdateUserData(data);
    await ensureLoginAvailable(validated.login, id);

    const updateData: {
      login: string;
      permission: Permission;
      password?: string;
      token?: null;
    } = {
      login: validated.login,
      permission: validated.permission,
    };

    if (validated.password) {
      updateData.password = await hashPassword(validated.password);
      updateData.token = null;
    }

    return prisma.user.update({
      where: { id },
      data: updateData,
      select: userSelect,
    });
  }

  async delete(
    id: string,
    requesterId: string,
    requesterPermission: Permission
  ): Promise<void> {
    assertCanReadWrite(requesterPermission);

    if (id === requesterId) {
      throw new AppError(400, "Você não pode excluir o próprio usuário");
    }

    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError(404, "Usuário não encontrado");
    }

    await prisma.user.delete({
      where: { id },
    });
  }
}

export const userService = new UserService();
