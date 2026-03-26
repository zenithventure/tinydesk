"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface ProductData {
  id?: string
  name: string
  slug: string
  repoOwner: string
  repoName: string
  defaultAssignee: string
  supportEmail: string
  webhookSecret: string
}

interface ProductFormProps {
  onSuccess: () => void
  onCancel: () => void
  initialData?: ProductData
}

export function ProductForm({ onSuccess, onCancel, initialData }: ProductFormProps) {
  const isEditing = !!initialData?.id
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<ProductData>({
    name: initialData?.name ?? "",
    slug: initialData?.slug ?? "",
    repoOwner: initialData?.repoOwner ?? "",
    repoName: initialData?.repoName ?? "",
    defaultAssignee: initialData?.defaultAssignee ?? "",
    supportEmail: initialData?.supportEmail ?? "",
    webhookSecret: initialData?.webhookSecret ?? "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = isEditing
        ? `/api/dashboard/products/${initialData!.id}`
        : "/api/dashboard/products"
      const method = isEditing ? "PATCH" : "POST"
      const payload = isEditing
        ? {
            name: formData.name,
            repoOwner: formData.repoOwner,
            repoName: formData.repoName,
            defaultAssignee: formData.defaultAssignee,
            supportEmail: formData.supportEmail,
            webhookSecret: formData.webhookSecret,
          }
        : formData

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || `Failed to ${isEditing ? "update" : "create"} product`)
        return
      }

      onSuccess()
    } catch {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  function handleNameChange(name: string) {
    if (isEditing) {
      setFormData({ ...formData, name })
    } else {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
      setFormData({ ...formData, name, slug })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>
      )}

      <Input
        id="name"
        label="Product Name"
        required
        placeholder="e.g. TinyCal"
        value={formData.name}
        onChange={(e) => handleNameChange(e.target.value)}
      />

      <Input
        id="slug"
        label="Slug"
        required
        disabled={isEditing}
        placeholder="e.g. tinycal"
        value={formData.slug}
        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          id="repoOwner"
          label="GitHub Owner"
          placeholder="e.g. myorg"
          value={formData.repoOwner}
          onChange={(e) => setFormData({ ...formData, repoOwner: e.target.value })}
        />
        <Input
          id="repoName"
          label="GitHub Repo"
          placeholder="e.g. tinycal"
          value={formData.repoName}
          onChange={(e) => setFormData({ ...formData, repoName: e.target.value })}
        />
      </div>

      <Input
        id="defaultAssignee"
        label="Default Assignee (optional)"
        placeholder="GitHub username, e.g. szewong"
        value={formData.defaultAssignee}
        onChange={(e) => setFormData({ ...formData, defaultAssignee: e.target.value })}
      />

      <Input
        id="supportEmail"
        label="Support Email (optional)"
        type="email"
        placeholder="support@example.com"
        value={formData.supportEmail}
        onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
      />

      <Input
        id="webhookSecret"
        label="GitHub Webhook Secret (optional)"
        placeholder="whsec_..."
        value={formData.webhookSecret}
        onChange={(e) => setFormData({ ...formData, webhookSecret: e.target.value })}
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? (isEditing ? "Saving..." : "Creating...") : (isEditing ? "Save Changes" : "Create Product")}
        </Button>
      </div>
    </form>
  )
}
