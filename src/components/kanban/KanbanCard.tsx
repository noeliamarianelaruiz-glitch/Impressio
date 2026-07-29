"use client"

import * as React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import { KanbanItem } from "@/components/kanban/KanbanBoard"

const priorityColors = {
  low: "bg-green-500/10 text-green-500",
  medium: "bg-yellow-500/10 text-yellow-500",
  high: "bg-orange-500/10 text-orange-500",
  urgent: "bg-red-500/10 text-red-500",
}

interface KanbanCardProps {
  item: KanbanItem
  onClick?: (item: KanbanItem) => void
}

export function KanbanCard({ item, onClick }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick?.(item)}
      className={cn(
        "w-full rounded-lg border border-white/10 bg-white/5 p-3 text-left transition-colors hover:bg-accent/50 dark:border-white/5 dark:bg-white/[0.03]",
        onClick && "cursor-pointer"
      )}
    >
      {item.orderNumber && (
        <p className="text-xs font-medium text-primary">{item.orderNumber}</p>
      )}
      <h4 className="mt-1 text-sm font-medium text-foreground">{item.title}</h4>
      {item.description && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {item.description}
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {item.priority && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
              priorityColors[item.priority] ?? "bg-muted text-muted-foreground"
            )}
          >
            {item.priority}
          </span>
        )}
        {item.customerName && (
          <span className="text-[10px] text-muted-foreground">
            {item.customerName}
          </span>
        )}
      </div>
      {item.dueDate && (
        <p className="mt-2 text-[10px] text-muted-foreground">Due: {item.dueDate}</p>
      )}
    </button>
  )
}