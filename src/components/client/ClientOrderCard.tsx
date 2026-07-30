import Link from "next/link"
import { cn } from "@/lib/utils"
import { ClientOrderStatus } from "@/components/client/ClientOrderStatus"

export interface ClientOrderData {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  currency: string
  quantity: number
  productType: string
  createdAt: string
  paymentStatus?: string | null
  productionStatus?: string | null
}

interface ClientOrderCardProps {
  order: ClientOrderData
}

export function ClientOrderCard({ order }: ClientOrderCardProps) {
  return (
    <Link
      href={`/dashboard/orders/${order.id}`}
      className={cn(
        "block rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03]",
        "transition-all hover:bg-accent/50 hover:border-white/20"
      )}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold text-primary">{order.orderNumber}</h3>
            <ClientOrderStatus orderStatus={order.status} paymentStatus={order.paymentStatus} />
          </div>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {order.productType}
          </p>
          <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
            <span>{order.quantity} units</span>
            {order.productionStatus && (
              <span>Production: {order.productionStatus.replace(/_/g, " ")}</span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className="text-sm font-semibold text-foreground">
            {order.currency} {order.totalAmount.toFixed(2)}
          </span>
          <span className="text-[10px] text-muted-foreground">{order.createdAt}</span>
        </div>
      </div>
    </Link>
  )
}
