"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Ticket } from "lucide-react"
import { TicketTable } from "@/components/ticket-table"
import { Pagination } from "@/components/pagination"
import { EmptyState } from "@/components/empty-state"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { LastUpdated } from "@/components/last-updated"
import { useAutoRefresh } from "@/hooks/use-auto-refresh"
import { STATUS_ORDER } from "@/lib/constants"
import type { DashboardTicket, PaginatedResponse } from "@/types"

const POLL_INTERVAL = 30_000 // 30 seconds

const statusOptions = [
  { value: "", label: "All Statuses" },
  ...STATUS_ORDER.map((s) => ({ value: s, label: s.replace(/_/g, " ") })),
]

export default function TicketListPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<PaginatedResponse<DashboardTicket> | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const isFirstLoad = useRef(true)

  const page = parseInt(searchParams.get("page") || "1", 10)
  const status = searchParams.get("status") || ""
  const search = searchParams.get("search") || ""

  const fetchTickets = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }

    const params = new URLSearchParams()
    params.set("page", String(page))
    if (status) params.set("status", status)
    if (search) params.set("search", search)

    try {
      const res = await fetch(`/api/dashboard/tickets?${params}`)
      const json = await res.json()
      setData(json)
      setLastUpdated(new Date())
    } catch {
      setData(null)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [page, status, search])

  // Initial load + re-fetch when params change
  useEffect(() => {
    isFirstLoad.current = true
    fetchTickets(false)
    isFirstLoad.current = false
  }, [fetchTickets])

  // Background polling — silent refresh (no loading flash)
  useAutoRefresh(() => fetchTickets(true), POLL_INTERVAL)

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    }
    if (updates.status !== undefined || updates.search !== undefined) {
      params.set("page", "1")
    }
    router.push(`/dashboard/tickets?${params}`)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
        <LastUpdated timestamp={lastUpdated} refreshing={refreshing} />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search tickets..."
            defaultValue={search}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                updateParams({ search: (e.target as HTMLInputElement).value })
              }
            }}
          />
        </div>
        <div className="w-48">
          <Select
            options={statusOptions}
            value={status}
            onChange={(e) => updateParams({ status: e.target.value })}
          />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No tickets yet"
          description="Tickets will appear here once customers submit them."
        />
      ) : (
        <>
          <TicketTable tickets={data.data} />
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onPageChange={(p) => updateParams({ page: String(p) })}
          />
        </>
      )}
    </div>
  )
}
