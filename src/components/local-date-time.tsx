"use client"

/**
 * LocalDateTime - renders an ISO timestamp in the user's browser local timezone.
 *
 * Use this component in server component trees where you can't call
 * toLocaleString() directly (server timezone ≠ user timezone).
 */
interface LocalDateTimeProps {
  value: string | Date
  dateStyle?: Intl.DateTimeFormatOptions["dateStyle"]
  timeStyle?: Intl.DateTimeFormatOptions["timeStyle"]
  className?: string
}

export function LocalDateTime({
  value,
  dateStyle = "medium",
  timeStyle = "short",
  className,
}: LocalDateTimeProps) {
  const formatted = new Date(value).toLocaleString(undefined, {
    dateStyle,
    timeStyle,
  })
  return <span className={className}>{formatted}</span>
}
