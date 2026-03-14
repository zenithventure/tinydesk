"use client"

import Link from "next/link"
import { TicketStatusBadge } from "./ticket-status-badge"
import { Flag } from "lucide-react"
import type { DashboardTicket } from "@/types"

interface TicketTableProps {
  tickets: DashboardTicket[]
}

export function TicketTable({ tickets }: TicketTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="pb-3 font-medium text-gray-500">ID</th>
            <th className="pb-3 font-medium text-gray-500">Subject</th>
            <th className="pb-3 font-medium text-gray-500 hidden md:table-cell">Product</th>
            <th className="pb-3 font-medium text-gray-500 hidden sm:table-cell">Submitter</th>
            <th className="pb-3 font-medium text-gray-500">Status</th>
            <th className="pb-3 font-medium text-gray-500 hidden lg:table-cell">Date</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id} className="border-b hover:bg-gray-50 transition">
              <td className="py-3 pr-4">
                <Link href={`/dashboard/tickets/${ticket.id}`} className="font-mono text-emerald-600 hover:underline text-xs">
                  {ticket.publicId}
                </Link>
                {ticket.humanFlagged && <Flag className="w-3 h-3 text-red-500 inline ml-1" />}
              </td>
              <td className="py-3 pr-4 max-w-[200px] truncate">
                <Link href={`/dashboard/tickets/${ticket.id}`} className="hover:text-emerald-600">
                  {ticket.subject}
                </Link>
              </td>
              <td className="py-3 pr-4 text-gray-500 hidden md:table-cell">{ticket.productName}</td>
              <td className="py-3 pr-4 text-gray-500 hidden sm:table-cell text-xs">{ticket.submitterEmail}</td>
              <td className="py-3 pr-4">
                <TicketStatusBadge status={ticket.status} />
              </td>
              <td className="py-3 text-gray-400 text-xs hidden lg:table-cell">
                {new Date(ticket.createdAt).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
