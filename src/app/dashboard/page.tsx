"use client"

import { useEffect, useState } from "react"
import { Ticket, Package, AlertCircle, CheckCircle } from "lucide-react"
import { StatsCard } from "@/components/stats-card"
import { Skeleton } from "@/components/ui/skeleton"

interface Stats {
  totalTickets: number
  openTickets: number
  resolvedTickets: number
  products: number
}

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [ticketsRes, productsRes] = await Promise.all([
          fetch("/api/dashboard/tickets?pageSize=1"),
          fetch("/api/dashboard/products"),
        ])
        const ticketsData = await ticketsRes.json()
        const productsData = await productsRes.json()

        // Fetch resolved count
        const resolvedRes = await fetch("/api/dashboard/tickets?pageSize=1&status=CLOSED")
        const resolvedData = await resolvedRes.json()

        setStats({
          totalTickets: ticketsData.total || 0,
          openTickets: (ticketsData.total || 0) - (resolvedData.total || 0),
          resolvedTickets: resolvedData.total || 0,
          products: productsData.length || 0,
        })
      } catch {
        setStats({ totalTickets: 0, openTickets: 0, resolvedTickets: 0, products: 0 })
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Tickets" value={stats?.totalTickets ?? 0} icon={Ticket} />
          <StatsCard title="Open" value={stats?.openTickets ?? 0} icon={AlertCircle} />
          <StatsCard title="Resolved" value={stats?.resolvedTickets ?? 0} icon={CheckCircle} />
          <StatsCard title="Products" value={stats?.products ?? 0} icon={Package} />
        </div>
      )}
    </div>
  )
}
