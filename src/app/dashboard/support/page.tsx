"use client"

import { useState } from "react"
import Link from "next/link"
import { CheckCircle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/contexts/auth-context"

export default function SupportPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productSlug: "tinydesk",
          submitterEmail: user?.email,
          submitterName: user?.name,
          subject,
          body,
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
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Support</h1>
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
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Support</h1>
      <p className="text-sm text-gray-500 mb-6">
        Found a bug or need help with TinyDesk? Submit a ticket and we&apos;ll track it through our pipeline.
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

          <Input
            id="subject"
            label="Subject"
            required
            placeholder="Brief summary of the issue"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />

          <Textarea
            id="body"
            label="Description"
            required
            rows={5}
            placeholder="Describe the issue in detail..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Submitting..." : "Submit Ticket"}
          </Button>
        </form>
      </div>
    </div>
  )
}
