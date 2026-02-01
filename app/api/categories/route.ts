import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const categories = await prisma.category.findMany({ where: { userId }, orderBy: { name: "asc" } });
  return Response.json({ categories });
}

const CreateSchema = z.object({ name: z.string().min(1).max(50) });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const parsed = CreateSchema.parse(body);

  const category = await prisma.category.create({ data: { userId, name: parsed.name } });
  return Response.json({ category });
}
