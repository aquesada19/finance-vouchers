import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./db";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/gmail.readonly"
          ].join(" "),
          access_type: "offline",
          prompt: "consent"
        }
      }
    })
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account }) {
      // "Auto-register": if user not exists, create.
      const email = user.email;
      if (!email) return false;

      const existing = await prisma.user.findUnique({ where: { email } });
      const dbUser = existing ?? (await prisma.user.create({
        data: { email, name: user.name ?? null, image: user.image ?? null }
      }));

      // Persist tokens in Account table so Gmail API can refresh access.
      if (account) {
        await prisma.account.upsert({
          where: {
            provider_providerAccountId: {
              provider: account.provider,
              providerAccountId: account.providerAccountId
            }
          },
          update: {
            userId: dbUser.id,
            access_token: account.access_token ?? null,
            refresh_token: account.refresh_token ?? null,
            expires_at: account.expires_at ?? null,
            token_type: account.token_type ?? null,
            scope: account.scope ?? null,
            id_token: account.id_token ?? null,
            session_state: (account as any).session_state ?? null,
            type: account.type
          },
          create: {
            userId: dbUser.id,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            type: account.type,
            access_token: account.access_token ?? null,
            refresh_token: account.refresh_token ?? null,
            expires_at: account.expires_at ?? null,
            token_type: account.token_type ?? null,
            scope: account.scope ?? null,
            id_token: account.id_token ?? null,
            session_state: (account as any).session_state ?? null
          }
        });
      }

      return true;
    },
    async jwt({ token }) {
      if (token.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email } });
        if (dbUser) token.sub = dbUser.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) (session.user as any).id = token.sub;
      return session;
    }
  },
  pages: {
    signIn: "/login"
  },
  secret: process.env.NEXTAUTH_SECRET
};
