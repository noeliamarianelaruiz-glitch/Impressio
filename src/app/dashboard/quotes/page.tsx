import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs"
import { EmptyState } from "@/components/dashboard/EmptyState"

export const metadata = {
  title: "Quotes",
  description: "View and manage your quotes",
}

export default async function QuotesPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  return (
    <main className="flex-1 p-4 lg:p-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Quotes" }]} />

      <div className="mt-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Quotes</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          View and manage your quotes.
        </p>
      </div>

      <div className="mt-6">
        <EmptyState
          title="No quotes yet"
          description="You haven't created any quotes yet."
          action={
            <a
              href="/quotes/new"
              className="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Create a quote
            </a>
          }
        />
      </div>
    </main>
  )
}