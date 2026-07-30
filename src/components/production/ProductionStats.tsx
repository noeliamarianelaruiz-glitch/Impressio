import { DashboardCard } from "@/components/dashboard/DashboardCard"

interface ProductionStatsProps {
  inProductionCount: number
  pendingCount: number
  completedTodayCount: number
  delayedCount: number
}

export function ProductionStats({
  inProductionCount,
  pendingCount,
  completedTodayCount,
  delayedCount,
}: ProductionStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <DashboardCard title="In Production" value={inProductionCount} description="Active printing & finishing" />
      <DashboardCard title="Pending Jobs" value={pendingCount} description="Awaiting design / start" />
      <DashboardCard title="Completed Today" value={completedTodayCount} description="Finished orders" />
      <DashboardCard title="Delayed Orders" value={delayedCount} description="Exceeded due date" />
    </div>
  )
}
