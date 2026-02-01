import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // This seed runs AFTER first login typically, but we keep it generic.
  // You'll use UI to manage budgets. Here we only ensure app can run.
  console.log("Seed complete (no-op).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
