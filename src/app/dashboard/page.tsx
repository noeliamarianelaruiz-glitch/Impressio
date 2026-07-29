import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { StatsGrid } from "@/components/dashboard/StatsGrid"
import { QuickActions } from "@/components/dashboard/QuickActions"
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs"

export const metadata = {
  title: "Dashboard",
  description: "Welcome to your Impressio dashboard",
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const stats = {
    totalOrders: 0,
    totalQuotes: 0,
    totalRevenue: "$0",
    pendingRequests: 0,
  }

  const quickActions = [
    { label: "New Order", href: "/orders/new", variant: "default" as const },
    { label: "New Quote", href: "/quotes/new", variant: "secondary" as const },
  ]

  return (
    <main className="flex-1 p-4 lg:p-6">
      <Breadcrumbs items={[{ label: "Dashboard" }]} />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Welcome back, {session.user.name ?? session.user.email}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here is an overview of your account.
          </p>
        </div>
      </div>

      <div className="mt-6">
        <StatsGrid
          stats={[
            {
              title: "Total Orders",
              value: stats.totalOrders,
              description: "All time orders",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
              ),
            },
            {
              title: "Total Quotes",
              value: stats.totalQuotes,
              description: "All time quotes",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
                </svg>
              ),
            },
            {
              title: "Revenue",
              value: stats.totalRevenue,
              description: "Total revenue",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              ),
            },
            {
              title: "Pending",
              value: stats.pendingRequests,
              description: "Awaiting action",
              icon: (
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
              ),
            },
          ]}
        />
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-medium text-foreground">Quick Actions</h2>
        <QuickActions actions={quickActions} />
      </div>
    </main>
  )
}