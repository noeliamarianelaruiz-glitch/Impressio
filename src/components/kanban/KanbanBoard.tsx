"use client"

import * as React from "react"
import { KanbanColumn } from "@/components/kanban/KanbanColumn"

export interface KanbanItem {
  id: string
  title: string
  description?: string
  status: string
  orderNumber?: string
  customerName?: string
  priority?: "low" | "medium" | "high" | "urgent"
  dueDate?: string
  assignee?: string
  metadata?: Record<string, unknown>
}

export interface KanbanColumnData {
  id: string
  title: string
  items: KanbanItem[]
  color: string
}

interface KanbanBoardProps {
  columns: KanbanColumnData[]
  onCardMove?: (itemId: string, newStatus: string) => void
  onCardClick?: (item: KanbanItem) => void
}

export function KanbanBoard({ columns, onCardMove, onCardClick }: KanbanBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => (
        <KanbanColumn
          key={column.id}
          column={column}
          onCardMove={onCardMove}
          onCardClick={onCardClick}
        />
      ))}
    </div>
  )
}