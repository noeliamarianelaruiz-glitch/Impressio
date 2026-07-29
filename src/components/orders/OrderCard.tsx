import * as React from "react"
import Link from "next/link"
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge"

type OrderStatus = "PENDING" | "CONFIRMED" | "IN_PRODUCTION" | "PRINTING" | "READY" | "SHIPPED" | "CANCELLED"

interface Order {
  id: string
  orderNumber: string
  customerName: string
  status: OrderStatus
  totalAmount: string
  date: string
}

interface OrderCardProps {
  order: Order
}

export function OrderCard({ order }: OrderCardProps) {
  return (
    <Link href={`/orders/${order.id}`} className="block">
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-colors hover:bg-accent/30 dark:border-white/5 dark:bg-white/[0.03]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">{order.orderNumber}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{order.customerName}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">{order.totalAmount}</span>
          <span className="text-[10px] text-muted-foreground">{order.date}</span>
        </div>
      </div>
    </Link>
  )
}