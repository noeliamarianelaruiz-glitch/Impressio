import * as React from "react"
import { cn } from "@/lib/utils"

interface EmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03]",
        className
      )}
    >
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
        </svg>
      </div>
      <h3 className="mb-1 text-sm font-medium text-foreground">{title}</h3>
      {description && (
        <p className="mb-4 text-xs text-muted-foreground">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}