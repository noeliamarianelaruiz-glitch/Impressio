import { requireAuth } from "@/lib/auth"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { KanbanBoard, KanbanColumnData } from "@/components/kanban/KanbanBoard"

export const metadata = {
  title: "Production Pipeline",
  description: "Manage production workflow with Kanban board",
}

export default async function KanbanPage() {
  await requireAuth()

  const columns: KanbanColumnData[] = [
    { id: "pending", title: "Pending", items: [], color: "bg-yellow-500" },
    { id: "confirmed", title: "Confirmed", items: [], color: "bg-blue-500" },
    { id: "production", title: "In Production", items: [], color: "bg-purple-500" },
    { id: "printing", title: "Printing", items: [], color: "bg-orange-500" },
    { id: "ready", title: "Ready", items: [], color: "bg-green-500" },
  ]

  return (
    <main className="flex-1 p-4 lg:p-6">
      <PageHeader
        title="Production Pipeline"
        description="Manage your printing workflow with the Kanban board."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Production Pipeline" }]}
      />
      <div className="mt-6">
        <KanbanBoard columns={columns} />
      </div>
    </main>
  )
}