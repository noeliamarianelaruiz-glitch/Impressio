
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge"
import { PriorityBadge } from "@/components/orders/PriorityBadge"

interface OrderHeaderProps {
  orderNumber: string
  status: string
  priority?: string
  customerName: string
  createdAt: string
  dueDate?: string
}

export function OrderHeader({
  orderNumber,
  status,
  priority,
  customerName,
  createdAt,
  dueDate,
}: OrderHeaderProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {orderNumber}
            </h1>
            <OrderStatusBadge status={status} />
            <PriorityBadge priority={priority ?? "medium"} />
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span>Customer: {customerName}</span>
            <span className="text-muted-foreground/50">|</span>
            <span>Created: {new Date(createdAt).toLocaleDateString()}</span>
            {dueDate && (
              <>
                <span className="text-muted-foreground/50">|</span>
                <span>Due: {new Date(dueDate).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}