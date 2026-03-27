"use client"

import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const WEBHOOK_URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/github`

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
  const [copied, setCopied] = useState(false)
  const [webhookStatus, setWebhookStatus] = useState<"auto" | "manual" | null>(null)
  const [formData, setFormData] = useState<ProductData>({
    name: initialData?.name ?? "",
    slug: initialData?.slug ?? "",
    repoOwner: initialData?.repoOwner ?? "",
    repoName: initialData?.repoName ?? "",
    defaultAssignee: initialData?.defaultAssignee ?? "",
    supportEmail: initialData?.supportEmail ?? "",
    webhookSecret: initialData?.webhookSecret ?? "",
  })

  const hasRepo = formData.repoOwner.trim() && formData.repoName.trim()

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

      const data = await res.json()
      if (data.webhookAutoConfigured === true) {
        setWebhookStatus("auto")
      } else if (data.webhookAutoConfigured === false) {
        setWebhookStatus("manual")
      } else {
        onSuccess()
      }
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

  async function copyWebhookUrl() {
    try {
      await navigator.clipboard.writeText(WEBHOOK_URL)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API may be unavailable
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">{error}</div>
      )}

      {webhookStatus === "auto" && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-700">
          Webhook was automatically configured for this repository.
        </div>
      )}
      {webhookStatus === "manual" && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-700">
          Automatic webhook setup was not possible for this repository. Please configure it manually using the instructions below.
        </div>
      )}

      {webhookStatus ? (
        <>
          <WebhookInfoCallout webhookUrl={WEBHOOK_URL} copied={copied} onCopy={copyWebhookUrl} />
          <div className="flex justify-end pt-2">
            <Button type="button" onClick={onSuccess}>Done</Button>
          </div>
        </>
      ) : (
        <>
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

          {hasRepo && (
            <WebhookInfoCallout webhookUrl={WEBHOOK_URL} copied={copied} onCopy={copyWebhookUrl} />
          )}

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
            placeholder="Auto-generated if left blank"
            value={formData.webhookSecret}
            onChange={(e) => setFormData({ ...formData, webhookSecret: e.target.value })}
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading ? (isEditing ? "Saving..." : "Creating...") : (isEditing ? "Save Changes" : "Create Product")}
            </Button>
          </div>
        </>
      )}
    </form>
  )
}

function WebhookInfoCallout({
  webhookUrl,
  copied,
  onCopy,
}: {
  webhookUrl: string
  copied: boolean
  onCopy: () => void
}) {
  return (
    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
      <p className="font-medium text-blue-900 mb-2">GitHub Webhook Setup</p>
      <div className="space-y-1.5">
        <div>
          <span className="text-blue-700">URL: </span>
          <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">{webhookUrl}</code>
          <button
            type="button"
            onClick={onCopy}
            className="inline-flex items-center ml-1.5 text-blue-600 hover:text-blue-800"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div>
          <span className="text-blue-700">Content type: </span>
          <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">application/json</code>
        </div>
        <div>
          <span className="text-blue-700">Events: </span>
          <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">issues</code>{" "}
          <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">pull_request</code>{" "}
          <code className="bg-blue-100 px-1.5 py-0.5 rounded text-xs">pull_request_review</code>
        </div>
      </div>
    </div>
  )
}
