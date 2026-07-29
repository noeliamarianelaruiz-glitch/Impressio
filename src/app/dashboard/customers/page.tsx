import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { CustomerTable } from "@/components/customers/CustomerTable"
import { EmptyState } from "@/components/dashboard/EmptyState"

export const metadata = {
  title: "Customers",
  description: "Manage your customer relationships",
}

export default async function CustomersPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const customers: Array<{ id: string; name: string; email: string; company?: string; phone?: string; createdAt: string }> = []

  return (
    <main className="flex-1 p-4 lg:p-6">
      <PageHeader
        title="Customers"
        description="Manage your customer relationships and track orders."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Customers" }]}
      />
      <div className="mt-6">
        {customers.length === 0 ? (
          <EmptyState
            title="No customers yet"
            description="Start by adding your first customer."
          />
        ) : (
          <CustomerTable customers={customers} />
        )}
      </div>
    </main>
  )
}