import * as React from "react"
import { cn } from "@/lib/utils"

interface DashboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  value?: string | number
  description?: string
  icon?: React.ReactNode
}

export function DashboardCard({
  title,
  value,
  description,
  icon,
  className,
  children,
  ...props
}: DashboardCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03]",
        className
      )}
      {...props}
    >
      {(title || value) && (
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            {title && (
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
            )}
            {value !== undefined && (
              <p className="text-2xl font-semibold tracking-tight text-foreground">
                {value}
              </p>
            )}
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
          {icon && (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
          )}
        </div>
      )}
      {children && <div className="mt-4">{children}</div>}
    </div>
  )
}