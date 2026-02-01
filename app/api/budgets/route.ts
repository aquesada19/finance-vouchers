import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const month = url.searchParams.get("month") ?? new Date().toISOString().slice(0, 7);
  const budgets = await prisma.budget.findMany({
    where: { userId, month },
    include: { category: true }
  });

  return Response.json({ month, budgets });
}

const UpsertSchema = z.object({
  categoryId: z.string().min(1),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  amount: z.number().int().nonnegative(),
  currency: z.string().min(3).max(3).default("CRC")
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const p = UpsertSchema.parse(body);

  const budget = await prisma.budget.upsert({
    where: {
      userId_categoryId_month_currency: {
        userId,
        categoryId: p.categoryId,
        month: p.month,
        currency: p.currency
      }
    },
    update: { amount: p.amount },
    create: { userId, categoryId: p.categoryId, month: p.month, amount: p.amount, currency: p.currency }
  });

  return Response.json({ budget });
}
