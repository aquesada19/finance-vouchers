export function requireCronSecret(req: Request) {
  const header = req.headers.get("x-cron-secret");
  if (!header || header !== process.env.CRON_SECRET) {
    return { ok: false as const, response: new Response("Unauthorized", { status: 401 }) };
  }
  return { ok: true as const };
}
