import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { DashboardCard } from "@/components/dashboard/DashboardCard"
import { ClientOrderList } from "@/components/client/ClientOrderList"
import type { ClientOrderData } from "@/components/client/ClientOrderCard"

export const metadata = {
  title: "Client Dashboard",
  description: "View your orders and production status",
}

export default async function ClientDashboardPage() {
  const session = await requireAuth()

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    include: {
      payment: { select: { status: true } },
      productionTasks: { select: { status: true }, take: 1, orderBy: { updatedAt: "desc" } },
      items: {
        include: { product: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const activeCount = orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status)).length
  const completedCount = orders.filter((o) => o.status === "DELIVERED").length

  const orderList: ClientOrderData[] = orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    totalAmount: Number(order.totalAmount),
    currency: order.currency,
    quantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
    productType: order.items.map((i) => i.product?.name).filter(Boolean).join(", ") || "Custom Print",
    createdAt: order.createdAt.toISOString().split("T")[0],
    paymentStatus: order.payment?.status ?? null,
    productionStatus: order.productionTasks[0]?.status ?? null,
  }))

  return (
    <main className="flex-1 p-4 lg:p-6 space-y-6">
      <PageHeader
        title="My Dashboard"
        description={`Welcome back${session.user.name ? `, ${session.user.name}` : ""}`}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Client Dashboard" },
        ]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashboardCard
          title="Total Orders"
          value={orders.length}
          description="All orders placed"
        />
        <DashboardCard
          title="Active Orders"
          value={activeCount}
          description="In progress or pending"
        />
        <DashboardCard
          title="Completed"
          value={completedCount}
          description="Delivered orders"
        />
      </div>

      <ClientOrderList orders={orderList} />
    </main>
  )
}
