import * as React from "react"
import Link from "next/link"

interface Customer {
  id: string
  name: string
  email: string
  company?: string
  phone?: string
}

interface CustomerCardProps {
  customer: Customer
}

export function CustomerCard({ customer }: CustomerCardProps) {
  return (
    <Link href={`/customers/${customer.id}`}>
      <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition-colors hover:bg-accent/30 dark:border-white/5 dark:bg-white/[0.03]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">
            {customer.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{customer.name}</p>
            <p className="truncate text-xs text-muted-foreground">{customer.email}</p>
          </div>
        </div>
        {customer.company && (
          <p className="mt-2 text-xs text-muted-foreground">{customer.company}</p>
        )}
      </div>
    </Link>
  )
}