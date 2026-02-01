import { ParsedVoucher } from "./bac";

// Generic parser: catches common patterns like "Amount: $12.34", "Merchant: XYZ", etc.
// This is intentionally conservative to avoid false positives.
export function tryParseGeneric(input: { html?: string; text?: string }): ParsedVoucher | null {
  const text = (input.text ?? "").replace(/\s+/g, " ").trim();
  if (!text) return null;

  // Example very basic fallback (customize later)
  const merchant = text.match(/Merchant:\s*([^|]+?)(?:\s{2,}|$)/i)?.[1]?.trim();
  const usd = text.match(/\bUSD\s*\$?\s*([\d,]+(?:\.\d{2})?)/i)?.[1];
  if (merchant && usd) {
    const amount = Math.round(Number(usd.replace(/,/g, "")) * 100);
    if (!Number.isFinite(amount)) return null;
    // We need a date; without it we skip.
    return null;
  }

  return null;
}
