import * as React from "react"

interface Customer {
  id: string
  name: string
  email: string
  company?: string
  phone?: string
  createdAt: string
}

interface CustomerTableProps {
  customers: Customer[]
}

export function CustomerTable({ customers }: CustomerTableProps) {
  if (customers.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03]">
        <p className="text-sm text-muted-foreground">No customers found</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03]">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10 dark:border-white/5">
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Customer</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Email</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Company</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Phone</th>
              <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-accent/30">
                <td className="px-4 py-3 text-sm font-medium text-foreground">{customer.name}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{customer.email}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{customer.company ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{customer.phone ?? "—"}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{customer.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}