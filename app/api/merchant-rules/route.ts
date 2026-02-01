import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const rules = await prisma.merchantRule.findMany({
    where: { userId },
    include: { category: true },
    orderBy: [{ priority: "asc" }, { name: "asc" }]
  });
  return Response.json({ rules });
}

const CreateSchema = z.object({
  name: z.string().min(1).max(60),
  pattern: z.string().min(1).max(200),
  categoryId: z.string().min(1),
  priority: z.number().int().min(1).max(10000).default(100)
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const p = CreateSchema.parse(body);

  const rule = await prisma.merchantRule.create({
    data: {
      userId,
      name: p.name,
      pattern: p.pattern,
      categoryId: p.categoryId,
      priority: p.priority
    }
  });

  return Response.json({ rule });
}
