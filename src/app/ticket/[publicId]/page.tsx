"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { PipelineProgress } from "@/components/pipeline-progress"
import { TicketStatusBadge } from "@/components/ticket-status-badge"
import { Timeline } from "@/components/timeline"
import { Skeleton } from "@/components/ui/skeleton"
import { LastUpdated } from "@/components/last-updated"
import { useAutoRefresh } from "@/hooks/use-auto-refresh"
import type { TicketPublic, TimelineEventPublic } from "@/types"

const POLL_INTERVAL = 20_000 // 20 seconds

interface PublicTicketData extends TicketPublic {
  screenshots?: string[] | null
}

export default function PublicTicketPage() {
  const params = useParams()
  const publicId = params.publicId as string

  const [ticket, setTicket] = useState<PublicTicketData | null>(null)
  const [events, setEvents] = useState<TimelineEventPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true)
    try {
      const [ticketRes, eventsRes] = await Promise.all([
        fetch(`/api/tickets/${publicId}`),
        fetch(`/api/tickets/${publicId}/events`),
      ])

      if (ticketRes.status === 404) {
        setNotFound(true)
        return
      }

      const [ticketData, eventsData] = await Promise.all([
        ticketRes.json(),
        eventsRes.json(),
      ])

      setTicket(ticketData)
      setEvents(eventsData)
      setLastUpdated(new Date())
    } catch {
      // On silent refresh failures, keep stale data
      if (!silent) setNotFound(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [publicId])

  // Initial load
  useEffect(() => {
    fetchData(false)
  }, [fetchData])

  // Background polling
  useAutoRefresh(() => fetchData(true), POLL_INTERVAL)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="border-b bg-white">
          <div className="max-w-3xl mx-auto px-6 h-14 flex items-center">
            <Link href="/" className="text-lg font-bold text-emerald-600">
              Tiny<span className="text-gray-900">Desk</span>
            </Link>
          </div>
        </nav>
        <div className="max-w-3xl mx-auto px-6 py-8 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
        </div>
      </div>
    )
  }

  if (notFound || !ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ticket not found</h1>
          <p className="text-gray-500">The ticket you&apos;re looking for doesn&apos;t exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white">
        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center">
          <Link href="/" className="text-lg font-bold text-emerald-600">
            Tiny<span className="text-gray-900">Desk</span>
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-gray-500">{ticket.publicId}</span>
            <TicketStatusBadge status={ticket.status} />
          </div>
          <LastUpdated timestamp={lastUpdated} refreshing={refreshing} />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">{ticket.subject}</h1>
        <p className="text-sm text-gray-500 mb-6">
          {ticket.productName} &middot; Submitted {new Date(ticket.createdAt).toLocaleDateString()}
        </p>

        {/* Pipeline Progress */}
        <div className="bg-white rounded-xl border p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Resolution Progress</h2>
          <PipelineProgress status={ticket.status} />
        </div>

        {/* Screenshots */}
        {Array.isArray(ticket.screenshots) && ticket.screenshots.length > 0 && (
          <div className="bg-white rounded-xl border p-6 mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Screenshots</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(ticket.screenshots as string[]).map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={url}
                    alt={`Screenshot ${i + 1}`}
                    className="rounded-lg border w-full object-cover max-h-64 hover:opacity-90 transition"
                  />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        {(ticket.issueUrl || ticket.prUrl || ticket.deploymentUrl) && (
          <div className="bg-white rounded-xl border p-6 mb-6">
            <h2 className="text-sm font-medium text-gray-700 mb-3">Links</h2>
            <div className="space-y-2 text-sm">
              {ticket.issueUrl && (
                <div>
                  <span className="text-gray-500">Issue: </span>
                  <a href={ticket.issueUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                    {ticket.issueUrl}
                  </a>
                </div>
              )}
              {ticket.prUrl && (
                <div>
                  <span className="text-gray-500">Pull Request: </span>
                  <a href={ticket.prUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                    {ticket.prUrl}
                  </a>
                </div>
              )}
              {ticket.deploymentUrl && (
                <div>
                  <span className="text-gray-500">Deployment: </span>
                  <a href={ticket.deploymentUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">
                    {ticket.deploymentUrl}
                  </a>
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
    </div>
  )
}
