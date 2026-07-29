import { cn } from "@/lib/utils"

type OrderStatus = "PENDING" | "CONFIRMED" | "IN_PRODUCTION" | "PRINTING" | "READY" | "SHIPPED" | "CANCELLED"

const statusConfig: Record<OrderStatus, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
  CONFIRMED: { label: "Confirmed", color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  IN_PRODUCTION: { label: "In Production", color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  PRINTING: { label: "Printing", color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
  READY: { label: "Ready", color: "bg-green-500/10 text-green-500 border-green-500/20" },
  SHIPPED: { label: "Shipped", color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  CANCELLED: { label: "Cancelled", color: "bg-red-500/10 text-red-500 border-red-500/20" },
}

interface OrderStatusBadgeProps {
  status: OrderStatus
}

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  const config = statusConfig[status]
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