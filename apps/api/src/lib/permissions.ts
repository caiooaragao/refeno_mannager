import { Permission } from "@prisma/client";
import { AppError } from "../middlewares/errorHandler";

export function assertCanRead(permission: Permission): void {
  if (permission !== "read" && permission !== "readwrite") {
    throw new AppError(403, "Usuário não tem permissão de leitura");
  }
}

export function assertCanWrite(permission: Permission): void {
  if (permission !== "write" && permission !== "readwrite") {
    throw new AppError(403, "Usuário não tem permissão de escrita");
  }
}
