import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge"
import { PaymentStatusBadge } from "@/components/orders/PaymentStatusBadge"

interface ClientOrderStatusProps {
  orderStatus: string
  paymentStatus?: string | null
  showLabel?: boolean
}

export function ClientOrderStatus({ orderStatus, paymentStatus, showLabel }: ClientOrderStatusProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-1.5">
        {showLabel && <span className="text-[10px] text-muted-foreground uppercase">Order:</span>}
        <OrderStatusBadge status={orderStatus} />
      </div>
      {paymentStatus && (
        <div className="flex items-center gap-1.5">
          {showLabel && <span className="text-[10px] text-muted-foreground uppercase">Payment:</span>}
          <PaymentStatusBadge status={paymentStatus as "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED" | "PARTIAL"} />
        </div>
      )}
    </div>
  )
}
