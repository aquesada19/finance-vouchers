import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const { categoryId } = await req.json();
    if (!categoryId) return new Response("Missing categoryId", { status: 400 });

    const tx = await prisma.transaction.findUnique({ where: { id: params.id, userId } });
    if (!tx) return new Response("Not found", { status: 404 });

    await prisma.transaction.update({
        where: { id: params.id },
        data: { categoryId },
    });

    return new Response(null, { status: 204 });
}
