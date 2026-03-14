"use client"

import { useState, useRef } from "react"
import { ImagePlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"

interface TicketFormProps {
  products: { value: string; label: string }[]
  onSuccess?: (publicId: string) => void
}

const MAX_SCREENSHOTS = 3
const MAX_FILE_SIZE = 5 * 1024 * 1024

export function TicketForm({ products, onSuccess }: TicketFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    productSlug: products[0]?.value || "",
    submitterEmail: "",
    submitterName: "",
    subject: "",
    body: "",
  })

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || [])
    const remaining = MAX_SCREENSHOTS - files.length
    const toAdd = selected.slice(0, remaining)

    for (const file of toAdd) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`"${file.name}" exceeds 5MB limit`)
        return
      }
      if (!file.type.startsWith("image/")) {
        setError(`"${file.name}" is not an image`)
        return
      }
    }

    setError(null)
    const newFiles = [...files, ...toAdd]
    setFiles(newFiles)
    setPreviews(newFiles.map((f) => URL.createObjectURL(f)))

    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  function removeFile(index: number) {
    URL.revokeObjectURL(previews[index])
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    setPreviews(newFiles.map((f) => URL.createObjectURL(f)))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let screenshots: string[] | undefined

      // Upload screenshots first if any
      if (files.length > 0) {
        const uploadData = new FormData()
        files.forEach((f) => uploadData.append("files", f))

        const uploadRes = await fetch("/api/tickets/upload", {
          method: "POST",
          body: uploadData,
        })

        if (!uploadRes.ok) {
          const data = await uploadRes.json()
          setError(data.error || "Failed to upload screenshots")
          return
        }

        const uploadResult = await uploadRes.json()
        screenshots = uploadResult.urls
      }

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, screenshots }),
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

      {/* Screenshots */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Screenshots (optional, max {MAX_SCREENSHOTS})
        </label>

        {previews.length > 0 && (
          <div className="flex gap-2 mb-2">
            {previews.map((src, i) => (
              <div key={i} className="relative w-20 h-20 rounded-lg border overflow-hidden group">
                <img src={src} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {files.length < MAX_SCREENSHOTS && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-emerald-400 hover:text-emerald-600 transition"
          >
            <ImagePlus className="w-4 h-4" />
            Add screenshot
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Submitting..." : "Submit Ticket"}
      </Button>
    </form>
  )
}
