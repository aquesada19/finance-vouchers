import { prisma } from "./db";

export async function categorizeForUser(userId: string, merchantNormalized: string) {
  const rules = await prisma.merchantRule.findMany({
    where: { userId, isActive: true },
    orderBy: [{ priority: "asc" }]
  });

  for (const r of rules) {
    try {
      const re = new RegExp(r.pattern, "i");
      if (re.test(merchantNormalized)) {
        return r.categoryId;
      }
    } catch {
      // ignore invalid regex
    }
  }

  // Ensure "Others" exists
  const others = await prisma.category.upsert({
    where: { userId_name: { userId, name: "Otros" } },
    update: {},
    create: { userId, name: "Otros" }
  });

  return others.id;
}
