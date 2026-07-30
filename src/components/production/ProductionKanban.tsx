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
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { ProductionCard, type ProductionItem } from "@/components/production/ProductionCard"
import { cn } from "@/lib/utils"

export interface ProductionColumnData {
  id: string
  title: string
  status: string
  color: string
  items: ProductionItem[]
}

interface ProductionKanbanProps {
  columns: ProductionColumnData[]
  onCardMove?: (taskId: string, newStatus: string) => Promise<void>
  onCardClick?: (item: ProductionItem) => void
}

export function ProductionKanban({ columns, onCardMove, onCardClick }: ProductionKanbanProps) {
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

    if (!over) return

    const activeIdStr = active.id as string
    const overId = over.id as string

    let targetColumn = columns.find((col) => col.id === overId)
    if (!targetColumn) {
      targetColumn = columns.find((col) => col.items.some((item) => item.id === overId))
    }

    if (targetColumn && onCardMove) {
      const sourceColumn = columns.find((col) => col.items.some((item) => item.id === activeIdStr))
      if (sourceColumn && sourceColumn.id !== targetColumn.id) {
        await onCardMove(activeIdStr, targetColumn.id)
      }
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex flex-col rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03] min-w-[260px]"
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/10 dark:border-white/5">
              <div className="flex items-center gap-2">
                <span className={cn("h-2.5 w-2.5 rounded-full", column.color)} />
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">{column.title}</h3>
              </div>
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                {column.items.length}
              </span>
            </div>

            <SortableContext items={column.items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
              <div className="flex-1 space-y-3 min-h-[200px]" id={column.id}>
                {column.items.map((item) => (
                  <ProductionCard key={item.id} item={item} onClick={onCardClick} />
                ))}
                {column.items.length === 0 && (
                  <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-white/10 text-xs text-muted-foreground">
                    No jobs
                  </div>
                )}
              </div>
            </SortableContext>
          </div>
        ))}
      </div>

      <DragOverlay>
        {activeItem ? <ProductionCard item={activeItem} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
