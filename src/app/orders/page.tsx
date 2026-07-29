import { requireAuth } from "@/lib/auth"
import Link from "next/link"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { OrderCard } from "@/components/orders/OrderCard"
import { EmptyState } from "@/components/dashboard/EmptyState"

export const metadata = {
  title: "Orders",
  description: "View and manage printing orders",
}

export default async function OrdersPage() {
  await requireAuth()

  const orders: Array<{ id: string; orderNumber: string; customerName: string; status: "PENDING" | "CONFIRMED" | "IN_PRODUCTION" | "PRINTING" | "READY" | "SHIPPED" | "CANCELLED"; totalAmount: string; date: string }> = []

  return (
    <main className="flex-1 p-4 lg:p-6">
      <PageHeader
        title="Orders"
        description="View and manage your printing orders."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Orders" }]}
      />

      <div className="mt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/orders/new" className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            New Order
          </Link>
        </div>
      </div>

      <div className="mt-6">
        {orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="Create your first printing order."
            action={
              <Link
                href="/orders/new"
                className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Create Order
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}