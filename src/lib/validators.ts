import { z } from "zod"

export const createTicketSchema = z.object({
  productSlug: z.string().min(1, "Product is required"),
  submitterEmail: z.string().email("Valid email is required"),
  submitterName: z.string().optional(),
  subject: z.string().min(1, "Subject is required").max(200, "Subject too long"),
  body: z.string().min(1, "Description is required").max(5000, "Description too long"),
})

export const updateTicketSchema = z.object({
  status: z
    .enum([
      "RECEIVED",
      "ISSUE_CREATED",
      "FIX_IN_PROGRESS",
      "PR_OPEN",
      "CHANGES_REQUESTED",
      "MERGED",
      "DEPLOYED",
      "CLOSED",
    ])
    .optional(),
  humanFlagged: z.boolean().optional(),
  issueNumber: z.number().optional(),
  issueUrl: z.string().url().optional(),
  prNumber: z.number().optional(),
  prUrl: z.string().url().optional(),
})

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(50)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  repoOwner: z.string().optional(),
  repoName: z.string().optional(),
  defaultAssignee: z.string().optional(),
  supportEmail: z.string().email().optional().or(z.literal("")),
  webhookSecret: z.string().optional(),
})

export const ticketListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  status: z
    .enum([
      "RECEIVED",
      "ISSUE_CREATED",
      "FIX_IN_PROGRESS",
      "PR_OPEN",
      "CHANGES_REQUESTED",
      "MERGED",
      "DEPLOYED",
      "CLOSED",
    ])
    .optional(),
  productId: z.string().optional(),
  search: z.string().optional(),
})
