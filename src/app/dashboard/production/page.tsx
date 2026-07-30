import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { updateProductionTaskStatus } from "@/auth/actions"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { ProductionKanban, type ProductionColumnData } from "@/components/production/ProductionKanban"
import { ProductionStats } from "@/components/production/ProductionStats"
import { ProductionTimeline } from "@/components/production/ProductionTimeline"
import type { ProductionTaskStatus } from "@prisma/client"

export const metadata = {
  title: "Production Management",
  description: "Manage printing and sublimation workflow",
}

const columnConfig: Array<{ id: string; title: string; color: string; status: ProductionTaskStatus }> = [
  { id: "PENDING", title: "Pending", color: "bg-yellow-500", status: "PENDING" },
  { id: "DESIGN_REVIEW", title: "Design Review", color: "bg-blue-500", status: "DESIGN_REVIEW" },
  { id: "PRINTING", title: "Printing", color: "bg-orange-500", status: "PRINTING" },
  { id: "SUBLIMATION", title: "Sublimation", color: "bg-purple-500", status: "SUBLIMATION" },
  { id: "CUTTING_FINISHING", title: "Cutting / Finishing", color: "bg-indigo-500", status: "CUTTING_FINISHING" },
  { id: "READY", title: "Ready for Delivery", color: "bg-green-500", status: "READY" },
  { id: "COMPLETED", title: "Completed", color: "bg-emerald-500", status: "COMPLETED" },
]

export default async function ProductionPage() {
  await requireAuth()

  const orders = await prisma.order.findMany({
    where: { status: { not: "CANCELLED" } },
    include: {
      customer: { select: { name: true } },
      assignee: { select: { name: true } },
      items: {
        include: {
          product: { select: { name: true } },
        },
      },
      productionTasks: true,
    },
    orderBy: { createdAt: "desc" },
  })

  for (const order of orders) {
    if (order.productionTasks.length === 0) {
      let initialTaskStatus: ProductionTaskStatus = "PENDING"
      if (order.status === "CONFIRMED") initialTaskStatus = "DESIGN_REVIEW"
      else if (order.status === "PRINTING") initialTaskStatus = "PRINTING"
      else if (order.status === "IN_PRODUCTION") initialTaskStatus = "SUBLIMATION"
      else if (order.status === "READY") initialTaskStatus = "READY"
      else if (order.status === "DELIVERED") initialTaskStatus = "COMPLETED"

      await prisma.productionTask.create({
        data: {
          orderId: order.id,
          status: initialTaskStatus,
          priority: "medium",
          assignedTo: order.assignee?.name,
          dueDate: new Date(),
        },
      })
    }
  }

  const ordersWithTasks = await prisma.order.findMany({
    where: { status: { not: "CANCELLED" } },
    include: {
      customer: { select: { name: true } },
      assignee: { select: { name: true } },
      items: {
        include: {
          product: { select: { name: true } },
        },
      },
      productionTasks: true,
    },
    orderBy: { createdAt: "desc" },
  })

  const recentHistory = await prisma.orderHistory.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      order: { select: { orderNumber: true } },
    },
  })

  const tasks = ordersWithTasks.flatMap((order) =>
    order.productionTasks.map((task) => ({
      id: task.id,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customer.name,
      productType: order.items.map((i) => i.product?.name).filter(Boolean).join(", ") || "Custom Print",
      quantity: order.items.reduce((sum, i) => sum + i.quantity, 0),
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.toISOString().split("T")[0] : undefined,
      status: task.status,
      assignedOperator: task.assignedTo || order.assignee?.name || undefined,
    }))
  )

  const columns: ProductionColumnData[] = columnConfig.map((col) => ({
    ...col,
    items: tasks.filter((task) => task.status === col.status),
  }))

  const inProductionCount = tasks.filter((t) => ["PRINTING", "SUBLIMATION", "CUTTING_FINISHING"].includes(t.status)).length
  const pendingCount = tasks.filter((t) => ["PENDING", "DESIGN_REVIEW"].includes(t.status)).length
  const todayStr = new Date().toISOString().split("T")[0]
  const completedTodayCount = ordersWithTasks.filter(
    (o) => o.status === "DELIVERED" && o.updatedAt.toISOString().split("T")[0] === todayStr
  ).length
  const delayedCount = tasks.filter((t) => t.dueDate && t.dueDate < todayStr && t.status !== "COMPLETED").length

  async function handleCardMove(taskId: string, newStatus: string) {
    "use server"
    await updateProductionTaskStatus(taskId, newStatus)
  }

  return (
    <main className="flex-1 p-4 lg:p-6 space-y-6">
      <PageHeader
        title="Production Management"
        description="Monitor printing, sublimation, cutting, and finishing pipelines."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Production" }]}
      />

      <ProductionStats
        inProductionCount={inProductionCount}
        pendingCount={pendingCount}
        completedTodayCount={completedTodayCount}
        delayedCount={delayedCount}
      />

      <div className="mt-6">
        <ProductionKanban columns={columns} onCardMove={handleCardMove} />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2" />
        <div>
          <ProductionTimeline
            events={recentHistory.map((h) => ({
              id: h.id,
              orderNumber: h.order.orderNumber,
              status: h.status,
              note: h.note,
              createdAt: h.createdAt.toISOString(),
            }))}
          />
        </div>
      </div>
    </main>
  )
}
