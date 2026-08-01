"use client"

import { PaymentStatusBadge } from "./PaymentStatusBadge"

interface HistoryEntry {
  status: string
  createdAt: string
  note?: string | null
}

interface PaymentHistoryProps {
  entries: HistoryEntry[]
}

const statusLabels: Record<string, string> = {
  PENDING: "Payment created",
  RECEIPT_UPLOADED: "Receipt uploaded",
  UNDER_REVIEW: "Payment under review",
  PAID: "Payment approved",
  REJECTED: "Payment rejected",
  REFUNDED: "Payment refunded",
  CANCELLED: "Payment cancelled",
}

export function PaymentHistory({ entries }: PaymentHistoryProps) {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No history available.</p>
  }

  return (
    <div className="relative">
      {entries.map((entry, i) => (
        <div key={i} className="flex gap-4 pb-6 last:pb-0">
          <div className="flex flex-col items-center">
            <div className="h-2.5 w-2.5 rounded-full border-2 border-primary bg-background" />
            {i < entries.length - 1 && <div className="mt-1 w-px flex-1 bg-white/10" />}
          </div>
          <div className="flex-1 pb-2">
            <div className="flex items-center gap-2">
              <PaymentStatusBadge status={entry.status} />
              <span className="text-xs text-muted-foreground">
                {new Date(entry.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="mt-1 text-sm text-foreground">
              {statusLabels[entry.status] || entry.status}
            </p>
            {entry.note && (
              <p className="mt-0.5 text-xs text-muted-foreground">{entry.note}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
