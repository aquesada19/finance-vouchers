import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const body = await req.json()
  // Call internal sync by invoking the same logic:
  // Simplicidad: hacemos fetch al endpoint /api/sync/run pasando secreto solo en server env.
  // (En un MVP está bien.)
  const baseUrl = process.env.NEXTAUTH_URL!;
  const res = await fetch(`${baseUrl}/api/sync/run`, {
    method: "POST",
    headers: { "x-cron-secret": process.env.CRON_SECRET! },
    body: JSON.stringify(body)
  });
  if (!res.ok) return new Response(await res.text(), { status: 500 });

  const json = await res.json();
  return Response.json(json);
}
