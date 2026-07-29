import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { EmptyState } from "@/components/dashboard/EmptyState"

export const metadata = {
  title: "Pedidos",
  description: "View and manage your orders",
}

export default async function OrdersPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  return (
    <main className="flex-1 p-4 lg:p-6">
      <PageHeader
        title="Pedidos"
        description="View and manage your orders."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Pedidos" }]}
      />

      <div className="mt-6">
        <EmptyState
          title="No orders yet"
          description="You haven't placed any orders yet."
          action={
          <Link
                href="/orders/new"
                className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Create Order
              </Link>
          }
        />
      </div>
    </main>
  )
}