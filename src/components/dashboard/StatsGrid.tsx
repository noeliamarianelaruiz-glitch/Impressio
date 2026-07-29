import * as React from "react"
import { DashboardCard } from "@/components/dashboard/DashboardCard"

interface Stat {
  title: string
  value: string | number
  description?: string
  icon: React.ReactNode
}

interface StatsGridProps {
  stats: Stat[]
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <DashboardCard
          key={stat.title}
          title={stat.title}
          value={stat.value}
          description={stat.description}
          icon={stat.icon}
        />
      ))}
    </div>
  )
}