import * as React from "react"
import { cn } from "@/lib/utils"

interface AuthCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
}

export function AuthCard({
  title,
  description,
  children,
  className,
  ...props
}: AuthCardProps) {
  return (
    <div
      className={cn(
        "w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-xl",
        "dark:border-white/5 dark:bg-white/[0.03]",
        className
      )}
      {...props}
    >
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {children}
    </div>
  )
}