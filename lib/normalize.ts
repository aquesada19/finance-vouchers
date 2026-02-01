export function stripDiacritics(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function normalizeMerchant(s: string) {
  const upper = stripDiacritics(s).toUpperCase();
  return upper
    .replace(/\s+/g, " ")
    .replace(/[*_#|]/g, " ")
    .replace(/[^\p{L}\p{N}\s.-]/gu, " ")
    .trim();
}
