import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import prisma from "@/lib/prisma"
import { requireAdmin } from "@/lib/auth"
import { updateProductSchema } from "@/lib/validators"
import { createGitHubWebhook, checkGitHubWebhookExists, isGitHubAppConfigured } from "@/lib/github-app"
import { absoluteUrl } from "@/lib/utils"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  try {
    const body = await req.json()
    const parsed = updateProductSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const existing = await prisma.product.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: parsed.data.name ?? undefined,
        repoOwner: parsed.data.repoOwner !== undefined ? (parsed.data.repoOwner || null) : undefined,
        repoName: parsed.data.repoName !== undefined ? (parsed.data.repoName || null) : undefined,
        defaultAssignee: parsed.data.defaultAssignee !== undefined ? (parsed.data.defaultAssignee || null) : undefined,
        supportEmail: parsed.data.supportEmail !== undefined ? (parsed.data.supportEmail || null) : undefined,
        webhookSecret: parsed.data.webhookSecret !== undefined ? (parsed.data.webhookSecret || null) : undefined,
      },
    })

    let webhookAutoConfigured: boolean | undefined
    if (product.repoOwner && product.repoName && isGitHubAppConfigured()) {
      const webhookUrl = absoluteUrl("/api/webhooks/github")

      // Check if webhook already exists on the repo
      const exists = await checkGitHubWebhookExists({
        owner: product.repoOwner,
        repo: product.repoName,
        webhookUrl,
      })

      if (exists) {
        webhookAutoConfigured = true
        if (!product.webhookConfigured) {
          await prisma.product.update({
            where: { id: product.id },
            data: { webhookConfigured: true },
          })
        }
      } else {
        // Try to auto-create
        const secret = product.webhookSecret || randomBytes(32).toString("hex")
        if (!product.webhookSecret) {
          await prisma.product.update({
            where: { id: product.id },
            data: { webhookSecret: secret },
          })
        }
        const result = await createGitHubWebhook({
          owner: product.repoOwner,
          repo: product.repoName,
          webhookUrl,
          secret,
        })
        webhookAutoConfigured = result.success
        if (result.success) {
          await prisma.product.update({
            where: { id: product.id },
            data: { webhookConfigured: true },
          })
        } else {
          await prisma.product.update({
            where: { id: product.id },
            data: { webhookConfigured: false },
          })
          console.log("[dashboard/products] Webhook auto-create failed (expected for external repos):", result.error)
        }
      }
    }

    return NextResponse.json({ ...product, webhookAutoConfigured })
  } catch (error) {
    console.error("[dashboard/products/[id]] Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
