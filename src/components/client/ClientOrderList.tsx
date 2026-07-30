import { ClientOrderCard, type ClientOrderData } from "@/components/client/ClientOrderCard"
import { DashboardCard } from "@/components/dashboard/DashboardCard"

interface ClientOrderListProps {
  orders: ClientOrderData[]
  title?: string
}

export function ClientOrderList({ orders, title = "My Orders" }: ClientOrderListProps) {
  if (orders.length === 0) {
    return (
      <DashboardCard title={title}>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
            </svg>
          </div>
          <p className="text-sm text-muted-foreground">No orders found yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">Your orders will appear here once placed.</p>
        </div>
      </DashboardCard>
    )
  }

  return (
    <DashboardCard title={title}>
      <div className="space-y-3">
        {orders.map((order) => (
          <ClientOrderCard key={order.id} order={order} />
        ))}
      </div>
    </DashboardCard>
  )
}
