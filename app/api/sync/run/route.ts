import { requireCronSecret } from "@/lib/security";
import { prisma } from "@/lib/db";
import { gmailListMessages, gmailGetMessageFull, extractHeaders, findHtmlAndText } from "@/lib/gmail";
import { parseVoucher } from "@/lib/parsing";
import { normalizeMerchant } from "@/lib/normalize";
import { categorizeForUser } from "@/lib/categorize";
import crypto from "crypto";

export async function POST(req: Request) {
    const ok = requireCronSecret(req);
    if (!ok.ok) return ok.response;

    const body = await req.json().catch(() => null);

    if (!body?.month) {
        return Response.json(
            { ok: false, error: "month is required (YYYY-MM)" },
            { status: 400 }
        );
    }

    // "2025-12" -> year=2025, month=12
    const [year, month] = body.month.split("-").map(Number);

    if (
        !Number.isInteger(year) ||
        !Number.isInteger(month) ||
        month < 1 ||
        month > 12
    ) {
        return Response.json(
            { ok: false, error: "Invalid month format. Expected YYYY-MM" },
            { status: 400 }
        );
    }

    const users = await prisma.user.findMany();
    const results: any[] = [];

    for (const u of users) {
        const r = await syncUser(u.id, { year, month });
        results.push({ userId: u.id, ...r });
    }

    return Response.json({ ok: true, results });
}

function buildGmailMonthQuery({
    year,
    month
}: {
    year: number;
    month: number; // 1–12
}) {
    const from = new Date(year, month - 1, 1);
    const to = new Date(year, month, 1);

    const fmt = (d: Date) =>
        `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;

    return [
        `after:${fmt(from)}`,
        `before:${fmt(to)}`,
        "(",
        'subject:(Notificación de transacción OR "Notificacion de transaccion" OR voucher OR comprobante)',
        "OR",
        "from:(bac OR notificaciones OR no-reply)",
        "OR",
        '("DLC* UBER" OR "UBER RIDES")',
        ")"
    ].join(" ");
}


async function syncUser(
    userId: string,
    opts: { year: number; month: number }
) {
    const q = buildGmailMonthQuery(opts);

    let pageToken: string | undefined;
    let imported = 0;
    let skipped = 0;

    for (let page = 0; page < 10; page++) { // safety cap
        const list = await gmailListMessages({ userId, q, maxResults: 50, pageToken });
        const msgs = list.messages ?? [];
        if (msgs.length === 0) break;

        for (const m of msgs) {
            const full = await gmailGetMessageFull(userId, m.id);
            const headers = extractHeaders(full);
            const { html, text } = findHtmlAndText(full);

            const parsed = parseVoucher({ html, text });
            if (!parsed) {
                skipped++;
                continue;
            }

            const merchantNormalized = normalizeMerchant(parsed.merchant);
            const categoryId = await categorizeForUser(userId, merchantNormalized);

            // fingerprint: merchant + amount + currency + occurredAt rounded to minute
            const occurred = parsed.occurredAt;
            const occurredMinute = new Date(
                occurred.getFullYear(),
                occurred.getMonth(),
                occurred.getDate(),
                occurred.getHours(),
                occurred.getMinutes(),
                0,
                0
            ).toISOString();

            const fpBase = `${merchantNormalized}|${parsed.amount}|${parsed.currency}|${occurredMinute}`;
            const fingerprint = crypto.createHash("sha256").update(fpBase).digest("hex");

            const metaJson = parsed.meta ? JSON.stringify(parsed.meta) : null;

            try {
                await prisma.transaction.create({
                    data: {
                        userId,
                        categoryId,
                        source: "gmail",
                        gmailMessageId: m.id,
                        gmailThreadId: m.threadId,
                        emailSubject: headers.subject ?? null,
                        emailFrom: headers.from ?? null,
                        occurredAt: parsed.occurredAt,
                        amount: parsed.amount,
                        currency: parsed.currency,
                        merchantRaw: parsed.merchant,
                        merchantNormalized,
                        fingerprint,
                        metaJson
                    }
                });
                imported++;
            } catch (e: any) {
                console.error("CREATE FAILED", {
                    code: e?.code,
                    message: e?.message,
                    meta: e?.meta,
                    gmailMessageId: m.id
                });
                // Unique constraint violation => duplicate, safe to skip
                skipped++;
            }
        }

        pageToken = list.nextPageToken;
        if (!pageToken) break;
    }

    return { imported, skipped };
}
