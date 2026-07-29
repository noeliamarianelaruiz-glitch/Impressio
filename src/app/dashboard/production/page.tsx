import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { KanbanBoard, KanbanColumnData } from "@/components/kanban/KanbanBoard"
import { DashboardCard } from "@/components/dashboard/DashboardCard"

export const metadata = {
  title: "Production",
  description: "Production management and tracking",
}

export default async function ProductionPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  const columns: KanbanColumnData[] = [
    {
      id: "queued",
      title: "Queued",
      items: [],
      color: "bg-gray-500",
    },
    {
      id: "in-progress",
      title: "In Progress",
      items: [],
      color: "bg-blue-500",
    },
    {
      id: "printing",
      title: "Printing",
      items: [],
      color: "bg-orange-500",
    },
    {
      id: "qc",
      title: "Quality Control",
      items: [],
      color: "bg-purple-500",
    },
    {
      id: "completed",
      title: "Completed",
      items: [],
      color: "bg-green-500",
    },
  ]

  return (
    <main className="flex-1 p-4 lg:p-6">
      <PageHeader
        title="Production"
        description="Track and manage your production workflow."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Production" }]}
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {columns.map((col) => (
          <DashboardCard
            key={col.id}
            title={col.title}
            value={col.items.length}
          />
        ))}
      </div>

      <div className="mt-8">
        <KanbanBoard columns={columns} />
      </div>
    </main>
  )
}