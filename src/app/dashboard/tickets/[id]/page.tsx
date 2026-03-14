"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, ExternalLink, Flag, Clock, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { PipelineProgress } from "@/components/pipeline-progress"
import { TicketStatusBadge } from "@/components/ticket-status-badge"
import { Timeline } from "@/components/timeline"
import { LastUpdated } from "@/components/last-updated"
import { useAutoRefresh } from "@/hooks/use-auto-refresh"
import { LocalDateTime } from "@/components/local-date-time"
import { STATUS_ORDER } from "@/lib/constants"
import type { TicketStatus, TimelineEventPublic } from "@/types"

const POLL_INTERVAL = 20_000 // 20 seconds

const statusOptions = STATUS_ORDER.map((s) => ({
  value: s,
  label: s.replace(/_/g, " "),
}))

interface TicketDetail {
  id: string
  publicId: string
  subject: string
  body: string
  submitterEmail: string
  submitterName?: string | null
  status: TicketStatus
  humanFlagged: boolean
  screenshots?: string[] | null
  issueUrl?: string | null
  prUrl?: string | null
  deploymentUrl?: string | null
  product: { name: string }
  createdAt: string
  updatedAt: string
}

export default function TicketDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [ticket, setTicket] = useState<TicketDetail | null>(null)
  const [events, setEvents] = useState<TimelineEventPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [reissuing, setReissuing] = useState(false)
  const [reissueMessage, setReissueMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const fetchData = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true)
    }
    try {
      const res = await fetch(`/api/dashboard/tickets/${params.id}`)
      if (res.status === 404) {
        router.push("/dashboard/tickets")
        return
      }
      const data = await res.json()
      setTicket(data)

      // Fetch events using publicId from fetched ticket
      const eventsRes = await fetch(`/api/tickets/${data.publicId}/events`)
      const eventsData = await eventsRes.json()
      setEvents(eventsData)

      setLastUpdated(new Date())
    } catch {
      if (!silent) router.push("/dashboard/tickets")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [params.id, router])

  // Initial load
  useEffect(() => {
    fetchData(false)
  }, [fetchData])

  // Background polling — skip if user is mid-update
  useAutoRefresh(() => {
    if (!updating) fetchData(true)
  }, POLL_INTERVAL)

  async function handleStatusChange(newStatus: string) {
    if (!ticket || newStatus === ticket.status) return
    setUpdating(true)
    try {
      const res = await fetch(`/api/dashboard/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        const updated = await res.json()
        setTicket(updated)
        // Refresh events
        const eventsRes = await fetch(`/api/tickets/${ticket.publicId}/events`)
        const eventsData = await eventsRes.json()
        setEvents(eventsData)
        setLastUpdated(new Date())
      }
    } finally {
      setUpdating(false)
    }
  }

  async function toggleFlag() {
    if (!ticket) return
    const res = await fetch(`/api/dashboard/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ humanFlagged: !ticket.humanFlagged }),
    })
    if (res.ok) {
      const updated = await res.json()
      setTicket(updated)
      setLastUpdated(new Date())
    }
  }

  async function handleReissue() {
    if (!ticket) return
    setReissuing(true)
    setReissueMessage(null)
    try {
      const res = await fetch(`/api/dashboard/tickets/${ticket.id}/reissue`, { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        setReissueMessage({ type: "success", text: data.message ?? "GitHub issue created" })
        // Refresh ticket data to show the new issueUrl
        await fetchData(true)
      } else {
        setReissueMessage({ type: "error", text: data.error ?? "Failed to reissue ticket" })
      }
    } catch {
      setReissueMessage({ type: "error", text: "Network error — please try again" })
    } finally {
      setReissuing(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (!ticket) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Link href="/dashboard/tickets" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="w-4 h-4" /> Back to tickets
        </Link>
        <LastUpdated timestamp={lastUpdated} refreshing={refreshing} />
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono text-sm text-gray-500">{ticket.publicId}</span>
            <TicketStatusBadge status={ticket.status} />
            {ticket.humanFlagged && <Badge variant="danger">Flagged</Badge>}
          </div>
          <h1 className="text-xl font-bold text-gray-900">{ticket.subject}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {ticket.product.name} &middot; {ticket.submitterEmail}
            {ticket.submitterName && ` (${ticket.submitterName})`}
          </p>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Created: <LocalDateTime value={ticket.createdAt} />
            </span>
            {ticket.updatedAt !== ticket.createdAt && (
              <span className="flex items-center gap-1">
                Updated: <LocalDateTime value={ticket.updatedAt} />
              </span>
            )}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={toggleFlag}>
          <Flag className={`w-4 h-4 ${ticket.humanFlagged ? "text-red-500 fill-red-500" : "text-gray-400"}`} />
        </Button>
      </div>

      {/* Pipeline */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <PipelineProgress status={ticket.status} />
      </div>

      {/* Actions */}
      <div className="bg-white rounded-xl border p-4 mb-6 flex items-center gap-4">
        <div className="flex-1">
          <Select
            label="Change Status"
            options={statusOptions}
            value={ticket.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={updating}
          />
        </div>
        {!ticket.issueUrl && (
          <div className="flex flex-col items-end gap-1">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReissue}
              disabled={reissuing}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${reissuing ? "animate-spin" : ""}`} />
              {reissuing ? "Creating…" : "Reissue Ticket"}
            </Button>
            {reissueMessage && (
              <p className={`text-xs ${reissueMessage.type === "success" ? "text-emerald-600" : "text-red-500"}`}>
                {reissueMessage.text}
              </p>
            )}
          </div>
        )}
        <Link
          href={`/ticket/${ticket.publicId}`}
          target="_blank"
          className="text-sm text-emerald-600 hover:underline flex items-center gap-1"
        >
          Public page <ExternalLink className="w-3 h-3" />
        </Link>
      </div>

      {/* Description */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h2 className="text-sm font-medium text-gray-700 mb-3">Description</h2>
        <p className="text-sm text-gray-600 whitespace-pre-wrap">{ticket.body}</p>
        {Array.isArray(ticket.screenshots) && ticket.screenshots.length > 0 && (
          <div className="mt-4">
            <h3 className="text-xs font-medium text-gray-500 mb-2">Screenshots</h3>
            <div className="flex gap-2">
              {(ticket.screenshots as string[]).map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img src={url} alt={`Screenshot ${i + 1}`} className="rounded-lg border w-32 h-24 object-cover hover:opacity-90 transition" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Links */}
      {(ticket.issueUrl || ticket.prUrl || ticket.deploymentUrl) && (
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Links</h2>
          <div className="space-y-2 text-sm">
            {ticket.issueUrl && (
              <div>
                <span className="text-gray-500">Issue: </span>
                <a href={ticket.issueUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">{ticket.issueUrl}</a>
              </div>
            )}
            {ticket.prUrl && (
              <div>
                <span className="text-gray-500">PR: </span>
                <a href={ticket.prUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">{ticket.prUrl}</a>
              </div>
            )}
            {ticket.deploymentUrl && (
              <div>
                <span className="text-gray-500">Deploy: </span>
                <a href={ticket.deploymentUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">{ticket.deploymentUrl}</a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-sm font-medium text-gray-700 mb-4">Timeline</h2>
        <Timeline events={events} />
      </div>
    </div>
  )
}
