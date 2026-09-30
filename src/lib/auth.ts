import bcrypt from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { legacyEmailFromPublicUsername } from "@/lib/public-usernames";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username?.toLowerCase().trim();
        const password = credentials?.password ?? "";

        if (!username || !password) return null;

        const user =
          (await prisma.user.findUnique({ where: { email: username } })) ??
          (await prisma.user.findUnique({ where: { email: legacyEmailFromPublicUsername(username) ?? "" } }));
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = (user as unknown as { role?: "TALENT" | "PARTNER" | "ADMIN" }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid ?? "";
        session.user.role = (token.role as "TALENT" | "PARTNER" | "ADMIN") ?? "TALENT";
      }
      return session;
    },
  },
};
