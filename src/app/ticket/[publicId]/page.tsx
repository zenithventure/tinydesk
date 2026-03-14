import Link from "next/link"
import { notFound } from "next/navigation"
import prisma from "@/lib/prisma"
import { PipelineProgress } from "@/components/pipeline-progress"
import { TicketStatusBadge } from "@/components/ticket-status-badge"
import { Timeline } from "@/components/timeline"
import { LocalDateTime } from "@/components/local-date-time"

interface PageProps {
  params: { publicId: string }
}

export default async function PublicTicketPage({ params }: PageProps) {
  const ticket = await prisma.ticket.findUnique({
    where: { publicId: params.publicId },
    include: {
      product: { select: { name: true } },
      timelineEvents: {
        where: { public: true },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          eventType: true,
          actor: true,
          summary: true,
          createdAt: true,
        },
      },
    },
  })

  if (!ticket) {
    notFound()
  }

  const events = ticket.timelineEvents.map((e) => ({
    ...e,
    createdAt: e.createdAt.toISOString(),
  }))

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
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm font-mono text-gray-500">{ticket.publicId}</span>
          <TicketStatusBadge status={ticket.status} />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-1">{ticket.subject}</h1>
        <p className="text-sm text-gray-500 mb-6">
          {ticket.product.name} &middot; Submitted <LocalDateTime value={ticket.createdAt.toISOString()} />
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
