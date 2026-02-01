import { tryParseBAC } from "./bac";
import { tryParseGeneric } from "./generic";
import type { ParsedVoucher } from "./bac";

export function parseVoucher(input: { html?: string; text?: string }): ParsedVoucher | null {
  return tryParseBAC(input) ?? tryParseGeneric(input);
}
