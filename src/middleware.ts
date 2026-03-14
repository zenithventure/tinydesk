import { auth } from "@/auth"
import { NextResponse } from "next/server"

const publicRoutes = [
  "/",
  "/login",
  "/api/auth",
  "/api/tickets",
  "/api/webhooks",
]

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"))
}

function isPublicDynamicRoute(pathname: string): boolean {
  // /ticket/TD-XXXX public status pages
  if (pathname.startsWith("/ticket/")) return true
  return false
}

/** Routes that require admin or product-owner role. Regular users (VIEWER) are redirected. */
const adminOrOwnerRoutes = ["/dashboard/products"]

function isAdminOrOwnerRoute(pathname: string): boolean {
  return adminOrOwnerRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"))
}

export default auth((req: any) => {
  const { pathname } = req.nextUrl
  if (isPublicRoute(pathname) || isPublicDynamicRoute(pathname)) {
    return NextResponse.next()
  }
  if (!req.auth) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const url = new URL("/login", req.url)
    url.searchParams.set("redirect", pathname)
    return NextResponse.redirect(url)
  }

  // Restrict admin/owner-only routes: block VIEWER users who are not product owners.
  if (isAdminOrOwnerRoute(pathname)) {
    const role = req.auth?.user?.role as string | undefined
    const ownedProductIds = (req.auth?.user?.ownedProductIds as string[] | undefined) ?? []
    const isAdmin = role === "ADMIN"
    const isProductOwner = ownedProductIds.length > 0

    if (!isAdmin && !isProductOwner) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
