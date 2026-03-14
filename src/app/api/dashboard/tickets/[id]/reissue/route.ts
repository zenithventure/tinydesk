import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { isGitHubAppConfigured } from "@/lib/github-app"
import { reissueGitHubIssue } from "@/lib/tickets"

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: { product: { select: { repoOwner: true, repoName: true, defaultAssignee: true } } },
  })

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
  }

  if (!ticket.product.repoOwner || !ticket.product.repoName) {
    return NextResponse.json(
      { error: "This product does not have a linked GitHub repository" },
      { status: 422 }
    )
  }

  if (!isGitHubAppConfigured()) {
    return NextResponse.json(
      { error: "GitHub App is not configured on this installation" },
      { status: 422 }
    )
  }

  try {
    const result = await reissueGitHubIssue(ticket)

    if (result.alreadyExists) {
      return NextResponse.json(
        { message: "A GitHub issue is already linked to this ticket", issueUrl: result.issueUrl },
        { status: 200 }
      )
    }

    if (!result.issueUrl) {
      return NextResponse.json(
        { error: "GitHub issue creation failed — check server logs for details" },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: "GitHub issue created", issueUrl: result.issueUrl }, { status: 201 })
  } catch (error) {
    console.error("[dashboard/tickets/reissue] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
