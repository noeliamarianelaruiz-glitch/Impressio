import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { StatsGrid } from "@/components/dashboard/StatsGrid"
import { QuickActions } from "@/components/dashboard/QuickActions"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { DashboardCard } from "@/components/dashboard/DashboardCard"

export const metadata = {
  title: "Dashboard",
  description: "Welcome to your Impressio dashboard",
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const stats = [
    {
      title: "Total Orders",
      value: 0,
      description: "All time orders",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
    {
      title: "Total Quotes",
      value: 0,
      description: "All time quotes",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
        </svg>
      ),
    },
    {
      title: "Revenue",
      value: "$0",
      description: "Total revenue",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </svg>
      ),
    },
    {
      title: "Pending",
      value: 0,
      description: "Awaiting action",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
  ]

  const quickActions = [
    { label: "New Order", href: "/orders/new", variant: "default" as const },
    { label: "New Quote", href: "/quotes/new", variant: "secondary" as const },
  ]

  const recentOrders = [
    { id: "1", orderNumber: "ORD-001", status: "Pending", date: "2026-07-29" },
    { id: "2", orderNumber: "ORD-002", status: "Completed", date: "2026-07-28" },
    { id: "3", orderNumber: "ORD-003", status: "In Progress", date: "2026-07-27" },
  ]

  const recentQuotes = [
    { id: "1", quoteNumber: "QTE-001", status: "Pending", date: "2026-07-29" },
    { id: "2", quoteNumber: "QTE-002", status: "Accepted", date: "2026-07-25" },
    { id: "3", quoteNumber: "QTE-003", status: "Expired", date: "2026-07-20" },
  ]

  return (
    <main className="flex-1 p-4 lg:p-6">
      <PageHeader
        title="Welcome back"
        description={`Signed in as ${session.user.email ?? session.user.name ?? "user"}`}
      />

      <div className="mt-6">
        <StatsGrid stats={stats} />
      </div>

      <div className="mt-8 flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <h2 className="mb-4 text-lg font-medium text-foreground">Quick Actions</h2>
          <QuickActions actions={quickActions} />
        </div>

        <div className="flex-1">
          <h2 className="mb-4 text-lg font-medium text-foreground">Recent Orders</h2>
          <DashboardCard>
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent orders</p>
            ) : (
              <ul className="space-y-2">
                {recentOrders.map((order) => (
                  <li key={order.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-accent/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">{order.orderNumber}</p>
                      <p className="text-xs text-muted-foreground">{order.date}</p>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{order.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </DashboardCard>
        </div>

        <div className="flex-1">
          <h2 className="mb-4 text-lg font-medium text-foreground">Recent Quotes</h2>
          <DashboardCard>
            {recentQuotes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent quotes</p>
            ) : (
              <ul className="space-y-2">
                {recentQuotes.map((quote) => (
                  <li key={quote.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-accent/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">{quote.quoteNumber}</p>
                      <p className="text-xs text-muted-foreground">{quote.date}</p>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">{quote.status}</span>
                  </li>
                ))}
              </ul>
            )}
          </DashboardCard>
        </div>
      </div>
    </main>
  )
}