export function monthKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function startOfMonth(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m - 1, 1, 0, 0, 0, 0);
}
export function endOfMonthExclusive(month: string) {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 1, 0, 0, 0, 0);
}
