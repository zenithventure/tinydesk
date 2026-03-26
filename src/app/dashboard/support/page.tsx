"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { CheckCircle, ExternalLink, ImagePlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/contexts/auth-context"

const MAX_SCREENSHOTS = 3
const MAX_FILE_SIZE = 5 * 1024 * 1024

interface ProductOption {
  id: string
  name: string
  slug: string
}

export default function SupportPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [products, setProducts] = useState<ProductOption[]>([])
  const [selectedSlug, setSelectedSlug] = useState("")
  const [productsLoading, setProductsLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/dashboard/products/list")
        if (res.ok) {
          const data: ProductOption[] = await res.json()
          setProducts(data)
          if (data.length === 1) {
            setSelectedSlug(data[0].slug)
          }
        }
      } catch {
        // Products will just be empty — user sees a message
      } finally {
        setProductsLoading(false)
      }
    }
    fetchProducts()
  }, [])

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
    if (!selectedSlug) {
      setError("Please select a project")
      return
    }
    setLoading(true)
    setError(null)

    try {
      let screenshots: string[] | undefined

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
        body: JSON.stringify({
          productSlug: selectedSlug,
          submitterEmail: user?.email,
          submitterName: user?.name,
          subject,
          body,
          screenshots,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to submit ticket")
        return
      }

      const data = await res.json()
      setSubmitted(data.publicId)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Submit a Ticket</h1>
        <div className="bg-white rounded-xl border p-8 text-center max-w-md mx-auto">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Ticket submitted</h2>
          <p className="text-sm text-gray-500 mb-4">
            Your ticket <span className="font-mono font-medium text-gray-900">{submitted}</span> has been created.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href={`/ticket/${submitted}`}
              target="_blank"
              className="text-sm text-emerald-600 hover:underline inline-flex items-center justify-center gap-1"
            >
              View status page <ExternalLink className="w-3 h-3" />
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSubmitted(null)
                setSubject("")
                setBody("")
                setFiles([])
                setPreviews([])
              }}
            >
              Submit another ticket
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Submit a Ticket</h1>
      <p className="text-sm text-gray-500 mb-6">
        Submit a ticket for any project and we&apos;ll track it through our pipeline.
      </p>

      <div className="bg-white rounded-xl border p-6 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
              {error}
            </div>
          )}

          <Input
            id="email"
            label="Email"
            type="email"
            value={user?.email || ""}
            disabled
          />

          {/* Project selector */}
          <div>
            <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">
              Project
            </label>
            {productsLoading ? (
              <div className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-400">
                Loading projects...
              </div>
            ) : products.length === 0 ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-700">
                No projects available. Ask an admin to add your project first.
              </div>
            ) : (
              <select
                id="project"
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
                required
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">Select a project...</option>
                {products.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <Input
            id="subject"
            label="Subject"
            required
            placeholder="Brief summary of the request"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <Textarea
            id="body"
            label="Description"
            required
            rows={5}
            placeholder="Describe what you need in detail..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
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

          <Button type="submit" disabled={loading || products.length === 0} className="w-full">
            {loading ? "Submitting..." : "Submit Ticket"}
          </Button>
        </form>
      </div>
    </div>
  )
}
