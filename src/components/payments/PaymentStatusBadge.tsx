"use client"

import { cn } from "@/lib/utils"

const statusStyles: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
  RECEIPT_UPLOADED: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  UNDER_REVIEW: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  PAID: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
  REJECTED: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  REFUNDED: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  CANCELLED: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
}

const statusLabels: Record<string, string> = {
  PENDING: "Pending",
  RECEIPT_UPLOADED: "Receipt Uploaded",
  UNDER_REVIEW: "Under Review",
  PAID: "Paid",
  REJECTED: "Rejected",
  REFUNDED: "Refunded",
  CANCELLED: "Cancelled",
}

interface PaymentStatusBadgeProps {
  status: string
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        statusStyles[status] || "bg-gray-500/10 text-gray-600 border-gray-500/20"
      )}
    >
      <span
        className={cn(
          "mr-1.5 h-1.5 w-1.5 rounded-full",
          status === "PAID" && "bg-green-500",
          status === "REJECTED" && "bg-red-500",
          status === "PENDING" && "bg-yellow-500",
          status === "RECEIPT_UPLOADED" && "bg-blue-500",
          status === "UNDER_REVIEW" && "bg-purple-500",
          status === "REFUNDED" && "bg-orange-500",
          status === "CANCELLED" && "bg-gray-500"
        )}
      />
      {statusLabels[status] || status}
    </span>
  )
}
