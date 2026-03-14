"use client"

import { useSession, signOut as nextAuthSignOut } from "next-auth/react"

export function useAuth() {
  const { data: session, status } = useSession()

  const isLoading = status === "loading"
  const isAuthenticated = status === "authenticated"

  const user = session?.user
    ? {
        userId: session.user.id ?? "",
        email: session.user.email ?? "",
        name: session.user.name ?? undefined,
        role: session.user.role ?? "VIEWER",
        ownedProductIds: session.user.ownedProductIds ?? [],
      }
    : null

  /** True if the logged-in user is a product owner for at least one product. */
  const isProductOwner = (user?.ownedProductIds?.length ?? 0) > 0

  /** True if the logged-in user is a system admin. */
  const isAdmin = user?.role === "ADMIN"

  const logout = async () => {
    await nextAuthSignOut({ callbackUrl: "/login" })
  }

  return {
    user,
    isAuthenticated,
    isLoading,
    isAdmin,
    isProductOwner,
    logout,
  }
}
