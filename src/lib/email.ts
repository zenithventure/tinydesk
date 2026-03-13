import { Resend } from "resend"
import { absoluteUrl } from "./utils"

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

const FROM = process.env.EMAIL_FROM || "TinyDesk <noreply@tinydesk.io>"

export async function sendTicketReceipt(to: string, publicId: string, subject: string) {
  const statusUrl = absoluteUrl(`/ticket/${publicId}`)
  try {
    await getResend().emails.send({
      from: FROM,
      to,
      subject: `[${publicId}] We received your ticket: ${subject}`,
      html: `
        <h2>We've received your support ticket</h2>
        <p><strong>Ticket ID:</strong> ${publicId}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p>You can track the status of your ticket at any time:</p>
        <p><a href="${statusUrl}">${statusUrl}</a></p>
        <p>We'll email you when there are updates.</p>
        <p>— The TinyDesk Team</p>
      `,
    })
  } catch (error) {
    console.error("[email] Failed to send ticket receipt:", error)
  }
}

export async function sendStatusUpdate(
  to: string,
  publicId: string,
  subject: string,
  newStatus: string,
  summary: string
) {
  const statusUrl = absoluteUrl(`/ticket/${publicId}`)
  try {
    await getResend().emails.send({
      from: FROM,
      to,
      subject: `[${publicId}] Update: ${summary}`,
      html: `
        <h2>Your ticket has been updated</h2>
        <p><strong>Ticket:</strong> ${publicId} — ${subject}</p>
        <p><strong>New Status:</strong> ${newStatus}</p>
        <p><strong>Update:</strong> ${summary}</p>
        <p><a href="${statusUrl}">View full timeline</a></p>
        <p>— The TinyDesk Team</p>
      `,
    })
  } catch (error) {
    console.error("[email] Failed to send status update:", error)
  }
}
