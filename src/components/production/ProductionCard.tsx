"use client"

import * as React from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"

export interface ProductionItem {
  id: string // ProductionTask id
  orderId: string
  orderNumber: string
  customerName: string
  productType: string
  quantity: number
  priority: string
  dueDate?: string
  status: string
  assignedOperator?: string | null
}

const priorityColors: Record<string, string> = {
  low: "bg-green-500/10 text-green-500",
  medium: "bg-yellow-500/10 text-yellow-500",
  high: "bg-orange-500/10 text-orange-500",
  urgent: "bg-red-500/10 text-red-500",
}

interface ProductionCardProps {
  item: ProductionItem
  onClick?: (item: ProductionItem) => void
}

export function ProductionCard({ item, onClick }: ProductionCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onClick?.(item)}
      className={cn(
        "w-full rounded-lg border border-white/10 bg-white/5 p-3 text-left transition-colors hover:bg-accent/50 dark:border-white/5 dark:bg-white/[0.03] space-y-2 cursor-grab active:cursor-grabbing",
        onClick && "cursor-pointer"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-primary">{item.orderNumber}</span>
        {item.priority && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
              priorityColors[item.priority.toLowerCase()] ?? "bg-muted text-muted-foreground"
            )}
          >
            {item.priority}
          </span>
        )}
      </div>

      <div>
        <h4 className="text-sm font-medium text-foreground">{item.customerName}</h4>
        <p className="text-xs text-muted-foreground line-clamp-1">{item.productType} ({item.quantity} units)</p>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-white/5">
        <span>Operator: {item.assignedOperator || "Unassigned"}</span>
        {item.dueDate && <span>Due: {item.dueDate}</span>}
      </div>
    </div>
  )
}
