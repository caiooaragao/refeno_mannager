import { Permission } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { assertCanRead } from "../lib/permissions";

export class InscricaoService {
  async listarInscricoes(permission: Permission) {
    assertCanRead(permission);
    return prisma.inspection.findMany({
      orderBy: { createdAt: "desc" },
    });
  }
}

export const inscricaoService = new InscricaoService();
