import { cn } from "@/lib/utils"

type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED" | "PARTIAL"

const paymentConfig: Record<PaymentStatus, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  COMPLETED: { label: "Completed", color: "bg-green-500/10 text-green-500 border-green-500/20" },
  FAILED: { label: "Failed", color: "bg-red-500/10 text-red-500 border-red-500/20" },
  REFUNDED: { label: "Refunded", color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
  PARTIAL: { label: "Partial", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus
}

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  const config = paymentConfig[status]
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        config.color
      )}
    >
      {config.label}
    </span>
  )
}