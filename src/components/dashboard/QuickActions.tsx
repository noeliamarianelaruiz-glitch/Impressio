import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface QuickAction {
  label: string
  href: string
  variant?: "default" | "secondary" | "outline" | "ghost"
}

interface QuickActionsProps {
  actions: QuickAction[]
  className?: string
}

export function QuickActions({ actions, className }: QuickActionsProps) {
  return (
    <div className={cn("flex flex-wrap gap-3", className)}>
      {actions.map((action) => (
        <Button key={action.label} variant={action.variant} asChild>
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ))}
    </div>
  )
}