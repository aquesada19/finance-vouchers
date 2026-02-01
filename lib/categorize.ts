
import { prisma } from "./db";

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // quitar tildes
    .replace(/[^a-z0-9 ]/g, " ") // quitar símbolos raros
    .replace(/\s+/g, " ")
    .trim();
}

function patternToRegex(pattern: string): RegExp[] {
  // Permite múltiples patrones separados por coma o salto de línea
  const parts = pattern
    .split(/[\n,]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  const regexes: RegExp[] = [];
  for (const part of parts) {
    // Si parece un regex (empieza y termina con /), úsalo como tal
    if (part.startsWith("/") && part.endsWith("/")) {
      try {
        regexes.push(new RegExp(part.slice(1, -1), "i"));
        continue;
      } catch { }
    }
    // Si no, conviértelo en un regex seguro de "contiene palabra" (normalizado)
    try {
      // Normaliza el patrón igual que el texto
      const norm = normalize(part);
      // Busca la frase como substring, sin límites de palabra ni anchors
      regexes.push(new RegExp(norm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "i"));
    } catch { }
  }
  return regexes;
}

export async function categorizeForUser(userId: string, merchantNormalized: string) {
  const rules = await prisma.merchantRule.findMany({
    where: { userId, isActive: true }
  });

  const merchantNorm = normalize(merchantNormalized);

  for (const r of rules) {
    const regexes = patternToRegex(r.pattern);
    for (const re of regexes) {
      try {
        // DEBUG: imprime el regex y el texto
        // console.log('merchantNorm:', merchantNorm, 'regex:', re);
        if (re.test(merchantNorm)) {
          return r.categoryId;
        }
      } catch {
        // ignora regex inválido
      }
    }
  }

  // Ensure "Otros" exists
  const others = await prisma.category.upsert({
    where: { userId_name: { userId, name: "Otros" } },
    update: {},
    create: { userId, name: "Otros" }
  });

  return others.id;
}
