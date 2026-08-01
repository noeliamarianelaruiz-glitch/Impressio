"use client"

import { PaymentStatusBadge } from "./PaymentStatusBadge"

interface PaymentCardProps {
  id: string
  orderNumber: string
  amount: number
  currency: string
  method: string
  status: string
  createdAt: string
  customerName?: string | null
  onClick?: () => void
}

export function PaymentCard({
  orderNumber,
  amount,
  currency,
  method,
  status,
  createdAt,
  customerName,
  onClick,
}: PaymentCardProps) {
  const methodLabel =
    method === "TRANSFER" || method === "BANK_TRANSFER"
      ? "Bank Transfer"
      : method === "MERCADOPAGO"
        ? "Mercado Pago"
        : method

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-4 text-left transition-colors hover:bg-white/[0.06] dark:border-white/5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Order #{orderNumber}</span>
            {customerName && (
              <span className="text-xs text-muted-foreground truncate">{customerName}</span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span>{methodLabel}</span>
            <span>{new Date(createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-sm font-semibold text-foreground">
            {new Intl.NumberFormat("es-AR", { style: "currency", currency }).format(amount)}
          </span>
          <PaymentStatusBadge status={status} />
        </div>
      </div>
    </button>
  )
}
