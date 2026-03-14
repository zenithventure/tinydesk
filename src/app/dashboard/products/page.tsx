"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Package, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Modal } from "@/components/ui/modal"
import { EmptyState } from "@/components/empty-state"
import { Skeleton } from "@/components/ui/skeleton"
import { ProductForm } from "@/components/product-form"
import { useAuth } from "@/lib/contexts/auth-context"

interface Product {
  id: string
  name: string
  slug: string
  repoOwner: string | null
  repoName: string | null
  supportEmail: string | null
  _count: { tickets: number }
}

export default function ProductsPage() {
  const router = useRouter()
  const { isAdmin, isProductOwner, isLoading: authLoading } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  // Redirect regular users (non-admin, non-product-owner) away from this page.
  useEffect(() => {
    if (!authLoading && !isAdmin && !isProductOwner) {
      router.replace("/dashboard")
    }
  }, [authLoading, isAdmin, isProductOwner, router])

  async function fetchProducts() {
    try {
      const res = await fetch("/api/dashboard/products")
      const data = await res.json()
      setProducts(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  // Don't render the page while we're checking auth or if user lacks access.
  if (authLoading || (!isAdmin && !isProductOwner)) {
    return null
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Button onClick={() => setShowCreate(true)} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Add Product
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-20" />)}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products"
          description="Register a product to start receiving support tickets."
          action={
            <Button onClick={() => setShowCreate(true)} size="sm">
              <Plus className="w-4 h-4 mr-1" /> Add Product
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-xl border p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500 font-mono">{product.slug}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{product._count.tickets}</p>
                  <p className="text-xs text-gray-500">tickets</p>
                </div>
              </div>
              {(product.repoOwner || product.repoName) && (
                <p className="text-xs text-gray-400 mt-2">
                  GitHub: {product.repoOwner}/{product.repoName}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Register Product">
        <ProductForm
          onSuccess={() => {
            setShowCreate(false)
            setLoading(true)
            fetchProducts()
          }}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>
    </div>
  )
}
