import { requireAuth } from "@/lib/auth"
import { StatsGrid } from "@/components/dashboard/StatsGrid"
import { QuickActions } from "@/components/dashboard/QuickActions"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { DashboardCard } from "@/components/dashboard/DashboardCard"
import { KanbanBoard } from "@/components/kanban/KanbanBoard"

export const metadata = {
  title: "Dashboard",
  description: "Welcome to your Impressio dashboard",
}

export default async function DashboardPage() {
  const session = await requireAuth()

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

  const kanbanColumns = [
    { id: "pending", title: "Pending", items: [], color: "bg-yellow-500" },
    { id: "confirmed", title: "Confirmed", items: [], color: "bg-blue-500" },
    { id: "production", title: "In Production", items: [], color: "bg-purple-500" },
    { id: "printing", title: "Printing", items: [], color: "bg-orange-500" },
    { id: "ready", title: "Ready", items: [], color: "bg-green-500" },
  ]

  const recentOrders = [
    { id: "1", orderNumber: "ORD-001", customerName: "Acme Corp", status: "PENDING", totalAmount: "$1,200.00", date: "2026-07-29" },
    { id: "2", orderNumber: "ORD-002", customerName: "TechCo", status: "PRINTING", totalAmount: "$3,400.00", date: "2026-07-28" },
  ]

  const recentQuotes = [
    { id: "1", quoteNumber: "QTE-001", customerName: "Acme Corp", status: "PENDING", totalAmount: "$800.00", date: "2026-07-29" },
    { id: "2", quoteNumber: "QTE-002", customerName: "TechCo", status: "ACCEPTED", totalAmount: "$1,500.00", date: "2026-07-25" },
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
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-lg font-medium text-foreground">Production Pipeline</h2>
        <KanbanBoard columns={kanbanColumns} />
      </div>

      <div className="mt-8 flex flex-col gap-6 lg:flex-row">
        <div className="flex-1">
          <h2 className="mb-4 text-lg font-medium text-foreground">Recent Orders</h2>
          <DashboardCard>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-accent/50">
                  <div>
                    <p className="text-sm font-medium text-foreground">{order.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{order.customerName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">{order.totalAmount}</span>
                    <span className="text-[10px] text-muted-foreground">{order.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>

        <div className="flex-1">
          <h2 className="mb-4 text-lg font-medium text-foreground">Recent Quotes</h2>
          <DashboardCard>
            <div className="space-y-3">
              {recentQuotes.map((quote) => (
                <div key={quote.id} className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-accent/50">
                  <div>
                    <p className="text-sm font-medium text-foreground">{quote.quoteNumber}</p>
                    <p className="text-xs text-muted-foreground">{quote.customerName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">{quote.totalAmount}</span>
                    <span className="text-[10px] text-muted-foreground">{quote.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </div>
    </main>
  )
}