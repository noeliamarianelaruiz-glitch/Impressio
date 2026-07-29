import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/dashboard/PageHeader"

export const metadata = {
  title: "Order Detail",
  description: "View order details",
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const { id } = await params

  return (
    <main className="flex-1 p-4 lg:p-6">
      <PageHeader
        title="Order Detail"
        description={`Order ${id}`}
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Orders", href: "/orders" },
          { label: id },
        ]}
      />

      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03]">
        <p className="text-sm text-muted-foreground">Order detail view under construction.</p>
      </div>
    </main>
  )
}