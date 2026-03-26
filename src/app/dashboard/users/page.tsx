"use client"

import { useEffect, useState } from "react"
import { Users, Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/empty-state"
import { useAuth } from "@/lib/contexts/auth-context"
import { useToast } from "@/components/ui/toast"

interface OwnedProduct {
  product: { id: string; name: string }
}

interface User {
  id: string
  name: string | null
  email: string
  image: string | null
  role: "ADMIN" | "VIEWER"
  createdAt: string
  ownedProducts: OwnedProduct[]
}

interface Product {
  id: string
  name: string
}

const roleOptions = [
  { value: "ADMIN", label: "Admin" },
  { value: "VIEWER", label: "Viewer" },
]

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  async function fetchData() {
    try {
      const [usersRes, productsRes] = await Promise.all([
        fetch("/api/dashboard/users"),
        fetch("/api/dashboard/products"),
      ])
      const usersData = await usersRes.json()
      const productsData = await productsRes.json()
      setUsers(Array.isArray(usersData) ? usersData : [])
      setProducts(Array.isArray(productsData) ? productsData : [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function handleRoleChange(userId: string, newRole: string) {
    setUpdatingId(userId)
    try {
      const body: { role: string; ownedProductIds?: string[] } = { role: newRole }
      // When promoting to ADMIN, product ownership is cleared server-side
      if (newRole === "ADMIN") {
        body.ownedProductIds = []
      }

      const res = await fetch(`/api/dashboard/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        toast(data.error || "Failed to update role", "error")
        return
      }

      const updated = await res.json()
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)))
      toast("Role updated", "success")
    } catch {
      toast("Failed to update role", "error")
    } finally {
      setUpdatingId(null)
    }
  }

  async function handleProductToggle(userId: string, productId: string, currentOwned: string[]) {
    setUpdatingId(userId)
    const newOwned = currentOwned.includes(productId)
      ? currentOwned.filter((id) => id !== productId)
      : [...currentOwned, productId]

    try {
      const res = await fetch(`/api/dashboard/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownedProductIds: newOwned }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast(data.error || "Failed to update products", "error")
        return
      }

      const updated = await res.json()
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)))
    } catch {
      toast("Failed to update products", "error")
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Users</h1>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No users"
          description="Users will appear here once they log in."
        />
      ) : (
        <div className="grid gap-4">
          {users.map((user) => {
            const isSelf = user.id === currentUser?.userId
            const ownedIds = user.ownedProducts.map((op) => op.product.id)
            const isUpdating = updatingId === user.id

            return (
              <div key={user.id} className="bg-white rounded-xl border p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {user.name || user.email}
                      </h3>
                      <Badge variant={user.role === "ADMIN" ? "info" : "secondary"}>
                        {user.role}
                      </Badge>
                      {isSelf && (
                        <span className="text-xs text-gray-400">(you)</span>
                      )}
                    </div>
                    {user.name && (
                      <p className="text-sm text-gray-500">{user.email}</p>
                    )}
                  </div>

                  <div className="w-32 flex-shrink-0">
                    <Select
                      options={roleOptions}
                      value={user.role}
                      disabled={isSelf || isUpdating}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                    />
                  </div>
                </div>

                {user.role === "ADMIN" ? (
                  <p className="text-xs text-gray-400 mt-3">
                    Has access to all products
                  </p>
                ) : (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">
                      Product access {ownedIds.length > 0 && (
                        <span className="text-gray-400 font-normal">
                          ({ownedIds.length} of {products.length} assigned)
                        </span>
                      )}
                    </p>
                    {products.length === 0 ? (
                      <p className="text-xs text-gray-400">No products available</p>
                    ) : (
                      <div className="space-y-1">
                        {products.map((product) => {
                          const isOwned = ownedIds.includes(product.id)
                          return (
                            <label
                              key={product.id}
                              className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer transition ${
                                isOwned
                                  ? "text-gray-900"
                                  : "text-gray-400"
                              } ${isUpdating ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}`}
                            >
                              <span
                                className={`flex items-center justify-center w-4 h-4 rounded border transition ${
                                  isOwned
                                    ? "bg-emerald-500 border-emerald-500"
                                    : "border-gray-300"
                                }`}
                              >
                                {isOwned && <Check className="w-3 h-3 text-white" />}
                              </span>
                              <input
                                type="checkbox"
                                checked={isOwned}
                                disabled={isUpdating}
                                onChange={() => handleProductToggle(user.id, product.id, ownedIds)}
                                className="sr-only"
                              />
                              {product.name}
                            </label>
                          )
                        })}
                      </div>
                    )}
                    {ownedIds.length === 0 && products.length > 0 && (
                      <p className="text-xs text-gray-400 mt-2">
                        No products assigned — user can only see their own tickets
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
