import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { endOfMonthExclusive, startOfMonth } from "@/lib/dates";
import { USD_TO_CRC_EXCHANGE_RATE } from "@/lib/constants";
import currencyjs from "currency.js";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const month = url.searchParams.get("month") ?? new Date().toISOString().slice(0, 7); // YYYY-MM

  const from = startOfMonth(month);
  const to = endOfMonthExclusive(month);

  const categories = await prisma.category.findMany({ where: { userId } });
  const budgets = await prisma.budget.findMany({ where: { userId, month } });

  const tx = await prisma.transaction.findMany({
    where: { userId, occurredAt: { gte: from, lt: to } }
  });

  const catMap = new Map(categories.map(c => [c.id, c.name]));
  const spendByCategory: Record<string, number> = {};
  let total = 0;

  for (const t of tx) {
    const name = t.categoryId ? (catMap.get(t.categoryId) ?? "Uncategorized") : "Uncategorized";
    let amountCRC = t.amount;
    spendByCategory[name] = (spendByCategory[name] ?? 0) + amountCRC;
    total += amountCRC;
  }

  const budgetByCategory: Record<string, number> = {};
  for (const b of budgets) {
    const name = catMap.get(b.categoryId) ?? "Unknown";
    budgetByCategory[name] = (budgetByCategory[name] ?? 0) + b.amount;
  }

  return Response.json({
    month,
    currency: "CRC",
    total,
    spendByCategory,
    budgetByCategory,
    transactionsCount: tx.length
  });
}
