import { requireAuth } from "@/lib/auth"
import Link from "next/link"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { EmptyState } from "@/components/dashboard/EmptyState"

export const metadata = {
  title: "Quotes",
  description: "View and manage your quotes",
}

export default async function QuotesPage() {
  await requireAuth()

  return (
    <main className="flex-1 p-4 lg:p-6">
      <PageHeader
        title="Quotes"
        description="View and manage your quotes."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Quotes" }]}
      />

      <div className="mt-6">
        <EmptyState
          title="No quotes yet"
          description="You haven't created any quotes yet."
          action={
            <Link
              href="/quotes/new"
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Create a quote
            </Link>
          }
        />
      </div>
    </main>
  )
}
