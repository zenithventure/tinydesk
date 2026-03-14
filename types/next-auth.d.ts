import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
      /** Product IDs for which this user is a product owner. */
      ownedProductIds?: string[]
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string
    role?: string
    /** Product IDs for which this user is a product owner. */
    ownedProductIds?: string[]
  }
}
