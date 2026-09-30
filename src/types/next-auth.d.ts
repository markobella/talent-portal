import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "TALENT" | "PARTNER" | "ADMIN";
      name?: string | null;
      email?: string | null;
    };
  }

  interface User {
    role: "TALENT" | "PARTNER" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: "TALENT" | "PARTNER" | "ADMIN";
  }
}
