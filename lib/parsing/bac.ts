import { Currency } from "@prisma/client";
import * as cheerio from "cheerio";
import { USD_TO_CRC_EXCHANGE_RATE } from "../constants";

export interface ParsedVoucher {
  merchant: string;
  occurredAt: Date;
  amount: number;      // int
  currency: Currency;    // "CRC" | "USD" etc
  meta?: Record<string, string>;
}

function parseAmountAndCurrency(text: string): { amount: number; currency: Currency, originalCurrency?: Currency } | null {
  // Support both CRC and USD, e.g. "CRC 3,490.00" or "USD 12.34" or "USD $12.34"
  const m = text.match(/(CRC|USD)\s*\$?([\d,]+)(?:\.(\d{2}))?/i);
  if (!m) return null;
  const currency = m[1].toUpperCase() as Currency;
  const intPart = m[2].replace(/,/g, "");
  const decPart = m[3] ? m[3] : "00";
  let amount: number;
  if (currency === "USD") {
    let usdCents = Math.round(Number(`${intPart}.${decPart}`) * 100); // USD in cents
    amount = Math.round((usdCents / 100) * USD_TO_CRC_EXCHANGE_RATE);
    return { amount, currency: "CRC", originalCurrency: "USD" };
  } else {
    amount = Number(intPart); // CRC as integer
  }
  if (!Number.isFinite(amount)) return null;
  return { amount, currency };
}

export function tryParseBAC(htmlOrText: { html?: string; text?: string }): ParsedVoucher | null {
  const html = htmlOrText.html;
  const text = htmlOrText.text;

  // Many BAC emails are HTML-heavy; parse with cheerio if html exists.
  if (html) {
    const $ = cheerio.load(html);

    // Heuristic: BAC templates often contain label/value rows like "Comercio:" "Fecha:" etc.
    const bodyText = $("body").text().replace(/\s+/g, " ").trim();

    // Comercio: DLC* UBER RIDES
    const commerceMatch = bodyText.match(/Comercio:\s*([A-Z0-9* ._-]+)/i);
    const merchant = commerceMatch?.[1]?.trim();

    // Fecha: Ene 30, 2026, 15:06
    const dateMatch = bodyText.match(/Fecha:\s*([A-Za-z]{3}\s+\d{1,2},\s+\d{4}),\s*([0-9]{1,2}:[0-9]{2})/i);
    let occurredAt: Date | null = null;
    if (dateMatch) {
      // JS Date parsing may not understand Spanish month abbreviations.
      // We'll map Spanish abbreviations ourselves.
      const monthMap: Record<string, number> = {
        ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
        jul: 6, ago: 7, sep: 8, set: 8, oct: 9, nov: 10, dic: 11
      };
      const raw = dateMatch[1]; // "Ene 30, 2026"
      const time = dateMatch[2]; // "15:06"
      const m2 = raw.match(/([A-Za-z]{3})\s+(\d{1,2}),\s+(\d{4})/);
      if (m2) {
        const mon = monthMap[m2[1].toLowerCase()];
        const day = Number(m2[2]);
        const year = Number(m2[3]);
        const [hh, mm] = time.split(":").map(Number);
        occurredAt = new Date(Date.UTC(year, mon, day, hh, mm, 0, 0));
      }
    }

    // Monto: CRC 3,490.00 or USD 12.34
    const amt = parseAmountAndCurrency(bodyText);
    if (merchant && occurredAt && amt != null) {
      const meta: Record<string, string> = {};
      const auth = bodyText.match(/Autorizaci[oó]n:\s*([0-9]+)/i)?.[1];
      const ref = bodyText.match(/Referencia:\s*([0-9]+)/i)?.[1];
      if (auth) meta.authorization = auth;
      if (ref) meta.reference = ref;
      if (amt.originalCurrency) meta.originalCurrency = amt.originalCurrency;
      return { merchant, occurredAt, amount: amt.amount, currency: amt.currency, meta };
    }
  }

  // Fallback: try text
  if (text) {
    const flat = text.replace(/\s+/g, " ").trim();
    const merchant = flat.match(/Comercio:\s*([A-Z0-9* ._-]+)/i)?.[1]?.trim();
    const amt = parseAmountAndCurrency(flat);
    if (merchant && amt != null) {
      // If no date is parseable, skip (we prefer not to import ambiguous data)
      return null;
    }
  }

  return null;
}
