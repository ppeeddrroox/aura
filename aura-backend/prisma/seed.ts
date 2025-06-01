// aura-backend/prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const preloadedCodes = [
    { code: "AURA-ABC001", name: null },
    { code: "AURA-ABC002", name: null },
    { code: "AURA-ABC003", name: null },
    // …otros códigos
  ];

  for (const entry of preloadedCodes) {
    await prisma.device.upsert({
      where: { code: entry.code },
      update: {},
      create: {
        code: entry.code,
        registered: false,
        name: entry.name,
      },
    });
  }

  console.log("Seeding de códigos de fábrica completo.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });