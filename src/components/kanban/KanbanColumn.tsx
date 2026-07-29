"use client"

import * as React from "react"
import { KanbanItem, KanbanColumnData } from "@/components/kanban/KanbanBoard"
import { KanbanCard } from "@/components/kanban/KanbanCard"
import { cn } from "@/lib/utils"

interface KanbanColumnProps {
  column: KanbanColumnData
  onCardMove?: (itemId: string, newStatus: string) => void
  onCardClick?: (item: KanbanItem) => void
}

export function KanbanColumn({ column, onCardMove, onCardClick }: KanbanColumnProps) {
  return (
    <div className="flex min-w-[280px] flex-1 flex-col rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03]">
      <div className="flex items-center justify-between border-b border-white/10 p-4 dark:border-white/5">
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full", column.color)} />
          <h3 className="text-sm font-semibold text-foreground">{column.title}</h3>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {column.items.length}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        {column.items.length === 0 ? (
          <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-white/10 p-4 text-sm text-muted-foreground dark:border-white/5">
            No items
          </div>
        ) : (
          column.items.map((item) => (
            <KanbanCard
              key={item.id}
              item={item}
              onClick={() => onCardClick?.(item)}
            />
          ))
        )}
      </div>
      <div className="border-t border-white/10 p-2 dark:border-white/5">
        <button
          onClick={() => onCardMove?.(column.id, column.id)}
          className="flex w-full items-center justify-center gap-1 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add item
        </button>
      </div>
    </div>
  )
}