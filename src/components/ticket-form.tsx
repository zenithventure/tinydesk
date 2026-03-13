"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"

interface TicketFormProps {
  products: { value: string; label: string }[]
  onSuccess?: (publicId: string) => void
}

export function TicketForm({ products, onSuccess }: TicketFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    productSlug: products[0]?.value || "",
    submitterEmail: "",
    submitterName: "",
    subject: "",
    body: "",
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to submit ticket")
        return
      }

      const data = await res.json()
      onSuccess?.(data.publicId)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
          {error}
        </div>
      )}

      {products.length > 1 && (
        <Select
          id="product"
          label="Product"
          options={products}
          value={formData.productSlug}
          onChange={(e) => setFormData({ ...formData, productSlug: e.target.value })}
        />
      )}

      <Input
        id="email"
        label="Email"
        type="email"
        required
        placeholder="you@example.com"
        value={formData.submitterEmail}
        onChange={(e) => setFormData({ ...formData, submitterEmail: e.target.value })}
      />

      <Input
        id="name"
        label="Name (optional)"
        placeholder="Your name"
        value={formData.submitterName}
        onChange={(e) => setFormData({ ...formData, submitterName: e.target.value })}
      />

      <Input
        id="subject"
        label="Subject"
        required
        placeholder="Brief summary of the issue"
        value={formData.subject}
        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
      />

      <Textarea
        id="body"
        label="Description"
        required
        rows={5}
        placeholder="Describe the issue in detail..."
        value={formData.body}
        onChange={(e) => setFormData({ ...formData, body: e.target.value })}
      />

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Submitting..." : "Submit Ticket"}
      </Button>
    </form>
  )
}
