import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const url = new URL(req.url);
    const month = url.searchParams.get("month"); // YYYY-MM
    // Paginación
    const take = Math.max(1, Math.min(100, parseInt(url.searchParams.get("take") || "20", 10)));
    const skip = Math.max(0, parseInt(url.searchParams.get("skip") || "0", 10));

    // Filtros
    let dateFilter: any = {};
    let from: Date | undefined, to: Date | undefined;
    if (month) {
        const [year, monthNum] = month.split('-').map(Number);
        from = new Date(Date.UTC(year, monthNum - 1, 1, 0, 0, 0, 0));
        to = new Date(Date.UTC(year, monthNum, 1, 0, 0, 0, 0));
        dateFilter.occurredAt = { gte: from, lt: to };
    }
    // Rango de fechas dentro del mes
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");
    if (dateFrom) {
        const d = new Date(dateFrom);
        if (!dateFilter.occurredAt) dateFilter.occurredAt = {};
        if (!from || d >= from) dateFilter.occurredAt.gte = d;
    }
    if (dateTo) {
        const d = new Date(dateTo);
        if (!dateFilter.occurredAt) dateFilter.occurredAt = {};
        if (!to || d <= to) dateFilter.occurredAt.lt = d;
    }
    // Filtro por comercio
    const merchant = url.searchParams.get("merchant");
    // Filtro por monto
    const minAmount = url.searchParams.get("minAmount");
    const maxAmount = url.searchParams.get("maxAmount");
    // Filtro por categoría
    const categoryId = url.searchParams.get("categoryId");

    let where: any = { userId, ...dateFilter };
    if (merchant) {
        where.OR = [
            { merchantRaw: { contains: merchant, mode: "insensitive" } },
            { merchantNormalized: { contains: merchant, mode: "insensitive" } }
        ];
    }
    if (minAmount) {
        where.amount = where.amount || {};
        where.amount.gte = parseFloat(minAmount);
    }
    if (maxAmount) {
        where.amount = where.amount || {};
        where.amount.lte = parseFloat(maxAmount);
    }
    if (categoryId) {
        where.categoryId = categoryId;
    }

    // Orden
    const orderByField = url.searchParams.get("orderBy") || "occurredAt";
    const orderDir = url.searchParams.get("orderDir") === "asc" ? "asc" : "desc";
    const validOrderFields = ["occurredAt", "amount", "merchantRaw", "merchantNormalized", "categoryId"];
    const orderBy: any = validOrderFields.includes(orderByField) ? { [orderByField]: orderDir } : { occurredAt: "desc" };

    // Total para paginación
    const total = await prisma.transaction.count({ where });

    const transactions = await prisma.transaction.findMany({
        where,
        orderBy,
        skip,
        take,
        select: {
            id: true,
            occurredAt: true,
            amount: true,
            currency: true,
            merchantRaw: true,
            merchantNormalized: true,
            category: { select: { id: true, name: true } },
            source: true,
            emailSubject: true,
            emailFrom: true,
            createdAt: true,
        },
    });

    return Response.json({ transactions, total });
}
