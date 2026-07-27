import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const ADMIN_LOGIN = process.env.SEED_ADMIN_LOGIN || "dantenovaes";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "danterefeno";
const LEGACY_LOGINS = ["dantenovas"];

export async function ensureAdminUser(): Promise<void> {
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

  for (const legacyLogin of LEGACY_LOGINS) {
    if (legacyLogin === ADMIN_LOGIN) {
      continue;
    }

    const legacyUser = await prisma.user.findUnique({ where: { login: legacyLogin } });

    if (!legacyUser) {
      continue;
    }

    const targetUser = await prisma.user.findUnique({ where: { login: ADMIN_LOGIN } });

    if (targetUser) {
      await prisma.user.delete({ where: { login: legacyLogin } });
    } else {
      await prisma.user.update({
        where: { login: legacyLogin },
        data: { login: ADMIN_LOGIN },
      });
    }
  }

  await prisma.user.upsert({
    where: { login: ADMIN_LOGIN },
    update: {
      password: hashedPassword,
      permission: "readwrite",
    },
    create: {
      login: ADMIN_LOGIN,
      password: hashedPassword,
      permission: "readwrite",
    },
  });
}
