"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"

interface ProductionFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedPriority: string
  onPriorityChange: (priority: string) => void
}

export function ProductionFilters({
  searchQuery,
  onSearchChange,
  selectedPriority,
  onPriorityChange,
}: ProductionFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03]">
      <div className="flex-1 max-w-sm">
        <Input
          placeholder="Search by order number or customer..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="bg-background/50 border-white/10"
        />
      </div>

      <div className="flex items-center gap-3">
        <select
          value={selectedPriority}
          onChange={(e) => onPriorityChange(e.target.value)}
          className="rounded-lg border border-white/10 bg-background/50 px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="ALL">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>
    </div>
  )
}
