import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Lazy load prisma and bcrypt to avoid edge runtime issues
const getPrisma = async () => {
  const prismaModule = await import("@/lib/prisma");
  return prismaModule.default;
};

const getBcrypt = async () => {
  const bcryptModule = await import("bcryptjs");
  return bcryptModule.default;
};

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET || "fallback-secret-for-development",
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("=== AUTHORIZE CALLED ===");
        console.log("Email provided:", credentials?.email ? "Yes" : "No");
        
        if (!credentials?.email || !credentials?.password) {
          console.log("Auth: Missing credentials");
          return null;
        }

        try {
          console.log("Auth: Loading Prisma and bcrypt...");
          const prisma = await getPrisma();
          const bcrypt = await getBcrypt();
          console.log("Auth: Prisma and bcrypt loaded successfully");
          
          const email = String(credentials.email).trim().toLowerCase();
          const password = String(credentials.password);

          console.log("Auth: Looking up user:", email);
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            console.log("Auth: User not found for email:", email);
            return null;
          }

          console.log("Auth: User found:", { id: user.id, email: user.email, hasPassword: !!user.password });

          if (!user.password) {
            console.log("Auth: User has no password");
            return null;
          }

          console.log("Auth: Comparing password...");
          const isValid = await bcrypt.compare(
            password,
            user.password
          );

          console.log("Auth: Password comparison result:", isValid);

          if (!isValid) {
            console.log("Auth: Password mismatch");
            return null;
          }

          console.log("Auth: Success! Authenticating user:", user.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
          };
        } catch (error: any) {
          console.error("Auth error:", error);
          console.error("Auth error details:", {
            message: error?.message,
            stack: error?.stack?.split('\n').slice(0, 10).join('\n'),
            name: error?.name,
          });
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});

