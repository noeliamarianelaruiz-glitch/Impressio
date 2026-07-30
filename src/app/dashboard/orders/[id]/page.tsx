import Link from "next/link"
import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { EmptyState } from "@/components/dashboard/EmptyState"
import { OrderHeader } from "@/components/orders/OrderHeader"
import { OrderInformation } from "@/components/orders/OrderInformation"
import { OrderTimeline } from "@/components/orders/OrderTimeline"
import { OrderFiles } from "@/components/orders/OrderFiles"
import { OrderNotes } from "@/components/orders/OrderNotes"
import { OrderActions } from "@/components/orders/OrderActions"

export const metadata = {
  title: "Order Detail",
  description: "View order details",
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAuth()

  const { id } = await params

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: { select: { name: true, email: true } },
      assignee: { select: { name: true } },
      items: {
        include: {
          product: { select: { name: true } },
          variant: { select: { name: true } },
          material: { select: { name: true } },
          technique: { select: { name: true } },
        },
      },
      history: { orderBy: { createdAt: "desc" } },
      orderNotes: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      },
      payment: { select: { status: true, amount: true } },
      quote: { select: { id: true, status: true } },
    },
  })

  if (!order) {
    return (
      <main className="flex-1 p-4 lg:p-6">
        <PageHeader
          title="Order Not Found"
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Orders", href: "/dashboard/orders" },
            { label: "Not Found" },
          ]}
        />
        <div className="mt-6">
          <EmptyState
            title="Order not found"
            description="The order you are looking for does not exist or has been removed."
            action={
              <Link
                href="/dashboard/orders"
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Back to Orders
              </Link>
            }
          />
        </div>
      </main>
    )
  }

  const timelineSteps = [
    { label: "Order created", completed: true, date: order.createdAt.toLocaleDateString() },
    { label: "Quote approved", completed: order.quoteId !== null || order.quote?.status === "ACCEPTED", date: order.quote?.status === "ACCEPTED" ? "Approved" : undefined },
    { label: "Production started", completed: ["IN_PRODUCTION", "PRINTING", "READY", "SHIPPED", "DELIVERED"].includes(order.status), date: undefined },
    { label: "Quality check", completed: ["READY", "SHIPPED", "DELIVERED"].includes(order.status), date: undefined },
    { label: "Ready", completed: ["READY", "SHIPPED", "DELIVERED"].includes(order.status), date: undefined },
    { label: "Completed", completed: order.status === "DELIVERED", date: undefined },
  ]

  const files = [] as Array<{ id: string; name: string; type: string; url: string; createdAt: string }>

  const notes = order.orderNotes.map((note) => ({
    id: note.id,
    content: note.content,
    author: note.user?.name ?? "Staff",
    isInternal: note.isInternal,
    createdAt: note.createdAt.toISOString(),
  }))

  const orderItems = order.items.map((item) => ({
    id: item.id,
    productName: item.product?.name ?? "Unknown Product",
    variantName: item.variant?.name,
    materialName: item.material?.name,
    techniqueName: item.technique?.name,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    totalPrice: Number(item.totalPrice),
  }))

  return (
    <main className="flex-1 p-4 lg:p-6">
      <PageHeader
        title={order.orderNumber}
        description="Order details, workflow, and items"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Orders", href: "/dashboard/orders" },
          { label: order.orderNumber },
        ]}
      />

      <div className="mt-6 space-y-6">
        <OrderHeader
          orderNumber={order.orderNumber}
          status={order.status}
          priority="medium"
          customerName={order.customer.name}
          createdAt={order.createdAt.toISOString()}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <OrderInformation
              customer={order.customer.name}
              customerEmail={order.customer.email}
              items={orderItems}
              quantity={order.items.reduce((sum, item) => sum + item.quantity, 0)}
              total={`${order.currency} ${order.totalAmount}`}
              currency={order.currency}
              assignedTo={order.assignee?.name ?? undefined}
              paymentStatus={order.payment?.status}
            />

            <OrderTimeline steps={timelineSteps} />

            <OrderFiles files={files} />

            <OrderNotes orderId={order.id} notes={notes} />
          </div>

          <div className="space-y-6">
            <OrderActions orderId={order.id} currentStatus={order.status} />
          </div>
        </div>
      </div>
    </main>
  )
}
