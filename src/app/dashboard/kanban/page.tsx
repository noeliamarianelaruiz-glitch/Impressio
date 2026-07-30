import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { updateOrderStatus } from "@/auth/actions"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { KanbanBoard, type KanbanColumnData } from "@/components/kanban/KanbanBoard"
import type { OrderStatus } from "@prisma/client"

export const metadata = {
  title: "Production Pipeline",
  description: "Manage production workflow with Kanban board",
}

const statusMap: Record<string, OrderStatus> = {
  pending: "PENDING",
  confirmed: "CONFIRMED",
  production: "IN_PRODUCTION",
  printing: "PRINTING",
  ready: "READY",
}

export default async function KanbanPage() {
  await requireAuth()

  const orders = await prisma.order.findMany({
    where: { status: { not: "CANCELLED" } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      totalAmount: true,
      customer: { select: { name: true } },
      createdAt: true,
    },
  })

  const columnConfig = [
    { id: "pending", title: "Pending", color: "bg-yellow-500", status: "PENDING" as OrderStatus },
    { id: "confirmed", title: "Confirmed", color: "bg-blue-500", status: "CONFIRMED" as OrderStatus },
    { id: "production", title: "In Production", color: "bg-purple-500", status: "IN_PRODUCTION" as OrderStatus },
    { id: "printing", title: "Printing", color: "bg-orange-500", status: "PRINTING" as OrderStatus },
    { id: "ready", title: "Ready", color: "bg-green-500", status: "READY" as OrderStatus },
  ]

  const columns: KanbanColumnData[] = columnConfig.map((config) => ({
    ...config,
    items: orders
      .filter((order) => order.status === config.status)
      .map((order) => ({
        id: order.id,
        title: order.orderNumber,
        description: order.customer?.name,
        status: order.status,
        orderNumber: order.orderNumber,
        customerName: order.customer?.name ?? undefined,
        dueDate: order.createdAt.toISOString().split("T")[0],
      })),
  }))

  async function handleCardMove(
    itemId: string,
    newStatusId: string
  ) {
    "use server"
    const newStatus = statusMap[newStatusId]
    if (newStatus) {
      await updateOrderStatus(itemId, newStatus)
    }
  }

  return (
    <main className="flex-1 p-4 lg:p-6">
      <PageHeader
        title="Production Pipeline"
        description="Manage your printing workflow with the Kanban board."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Production Pipeline" }]}
      />
      <div className="mt-6">
        <KanbanBoard columns={columns} onCardMove={handleCardMove} />
      </div>
    </main>
  )
}
