import { prisma } from "./db";

interface TokenInfo {
  access_token: string;
  expires_at?: number | null;
  refresh_token?: string | null;
}

async function refreshAccessToken(refreshToken: string) {
  const params = new URLSearchParams();
  params.set("client_id", process.env.GOOGLE_CLIENT_ID!);
  params.set("client_secret", process.env.GOOGLE_CLIENT_SECRET!);
  params.set("refresh_token", refreshToken);
  params.set("grant_type", "refresh_token");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString()
  });

  if (!res.ok) throw new Error(`Failed to refresh token: ${await res.text()}`);
  return res.json() as Promise<{ access_token: string; expires_in: number; token_type: string }>;
}

async function getValidAccessToken(userId: string): Promise<string> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" }
  });
  if (!account?.access_token) throw new Error("No Google account tokens stored.");

  const now = Math.floor(Date.now() / 1000);
  const expiresAt = account.expires_at ?? null;

  // If expires_at is missing, try using as-is.
  if (!expiresAt || expiresAt - now > 60) {
    return account.access_token;
  }

  if (!account.refresh_token) throw new Error("Missing refresh_token. Re-login with consent.");

  const refreshed = await refreshAccessToken(account.refresh_token);
  const newExpiresAt = now + refreshed.expires_in;

  await prisma.account.update({
    where: { id: account.id },
    data: { access_token: refreshed.access_token, expires_at: newExpiresAt }
  });

  return refreshed.access_token;
}

export async function gmailListMessages(opts: {
  userId: string;
  q: string;
  maxResults?: number;
  pageToken?: string;
}) {
  const token = await getValidAccessToken(opts.userId);
  const url = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
  url.searchParams.set("q", opts.q);
  url.searchParams.set("maxResults", String(opts.maxResults ?? 50));
  if (opts.pageToken) url.searchParams.set("pageToken", opts.pageToken);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`gmailListMessages error: ${await res.text()}`);
  return res.json() as Promise<{ messages?: { id: string; threadId: string }[]; nextPageToken?: string }>;
}

export async function gmailGetMessageFull(userId: string, messageId: string) {
  const token = await getValidAccessToken(userId);
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`gmailGetMessageFull error: ${await res.text()}`);
  return res.json();
}

export function decodeBase64Url(data: string) {
  const normalized = data.replace(/-/g, "+").replace(/_/g, "/");
  const pad = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  const str = Buffer.from(normalized + pad, "base64").toString("utf8");
  return str;
}

export function extractHeaders(payload: any) {
  const headers: Record<string, string> = {};
  for (const h of payload?.payload?.headers ?? []) {
    headers[h.name.toLowerCase()] = h.value;
  }
  return headers;
}

function decodeBody(data?: string): string | undefined {
  if (!data) return undefined;
  return Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

export function findHtmlAndText(message: any): {
  html: string | undefined;
  text: string | undefined;
} {
  let html: string | undefined = undefined;
  let text: string | undefined = undefined;

  function walk(part: any) {
    if (!part) return;

    if (part.mimeType === "text/html" && part.body?.data) {
      html ??= decodeBody(part.body.data);
    }

    if (part.mimeType === "text/plain" && part.body?.data) {
      text ??= decodeBody(part.body.data);
    }

    if (Array.isArray(part.parts)) {
      for (const subPart of part.parts) {
        walk(subPart);
      }
    }
  }

  walk(message.payload);

  return { html, text };
}


