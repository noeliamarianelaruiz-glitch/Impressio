"use client"

import * as React from "react"
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
} from "@dnd-kit/core"
import { KanbanColumn } from "@/components/kanban/KanbanColumn"
import { KanbanCard } from "@/components/kanban/KanbanCard"
import type { OrderStatus } from "@prisma/client"

export interface KanbanItem {
  id: string
  title: string
  description?: string
  status: OrderStatus
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
  onCardMove?: (itemId: string, newStatus: string) => Promise<void>
  onCardClick?: (item: KanbanItem) => void
}

export function KanbanBoard({ columns, onCardMove, onCardClick }: KanbanBoardProps) {
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event

    if (!over || active.id === over.id) return

    const activeIdStr = active.id as string
    const overId = over.id as string

    const sourceColumn = columns.find((col) =>
      col.items.some((item) => item.id === activeIdStr)
    )
    const targetColumn = columns.find((col) =>
      col.items.some((item) => item.id === overId)
    )

    if (sourceColumn && targetColumn && onCardMove) {
      await onCardMove(activeIdStr, targetColumn.id)
    }
  }

  const activeItem = columns.flatMap((col) => col.items).find((item) => item.id === activeId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
      <DragOverlay>
        {activeItem ? (
          <KanbanCard item={activeItem} />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}