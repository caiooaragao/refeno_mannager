import { ensureAdminUser } from "../src/lib/ensureAdminUser";
import { prisma } from "../src/lib/prisma";

async function main() {
  await ensureAdminUser();
  console.log("Usuário admin garantido no banco");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
