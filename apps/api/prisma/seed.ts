import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const login = process.env.SEED_ADMIN_LOGIN || "dantenovas";
  const password = process.env.SEED_ADMIN_PASSWORD || "danterefeno";

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { login },
    update: {
      password: hashedPassword,
      permission: "readwrite",
    },
    create: {
      login,
      password: hashedPassword,
      permission: "readwrite",
    },
  });

  console.log(`Usuário seed criado: ${login}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
