import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import prisma from "@/lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile?.email) {
        let user = await prisma.user.findUnique({
          where: { email: profile.email },
        })
        if (!user) {
          user = await prisma.user.create({
            data: {
              email: profile.email,
              name: profile.name ?? null,
              image: (profile as any).picture ?? null,
              // New users default to VIEWER; grant ADMIN/product-owner access explicitly.
              role: "VIEWER",
            },
          })
        }
        token.userId = user.id
        token.role = user.role

        // Fetch the product IDs this user owns so we can gate visibility client-side.
        const owned = await prisma.productOwner.findMany({
          where: { userId: user.id },
          select: { productId: true },
        })
        token.ownedProductIds = owned.map((o) => o.productId)
      }
      return token
    },
    async session({ session, token }) {
      if (token.userId) {
        session.user.id = token.userId as string
        session.user.role = token.role as string
        session.user.ownedProductIds = (token.ownedProductIds as string[]) ?? []
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})
