"use client"

import { PaymentStatusBadge } from "./PaymentStatusBadge"

interface BankInfo {
  bankName: string
  accountHolder: string
  accountType: string
  accountNumber: string
  cbu: string
  alias: string
  cuit: string
}

interface PaymentDetailsProps {
  id: string
  orderNumber: string
  amount: number
  currency: string
  method: string
  status: string
  createdAt: string
  updatedAt: string
  transactionReference?: string | null
  receiptUrl?: string | null
  notes?: string | null
  customerName?: string | null
  reviewerName?: string | null
  reviewedAt?: string | null
  bankInfo?: BankInfo | null
}

export function PaymentDetails({
  orderNumber,
  amount,
  currency,
  method,
  status,
  createdAt,
  updatedAt,
  transactionReference,
  receiptUrl,
  notes,
  customerName,
  reviewerName,
  reviewedAt,
}: PaymentDetailsProps) {
  const methodLabel =
    method === "TRANSFER" || method === "BANK_TRANSFER"
      ? "Bank Transfer"
      : method === "MERCADOPAGO"
        ? "Mercado Pago"
        : method

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Order #{orderNumber}</h3>
          {customerName && (
            <p className="text-sm text-muted-foreground">{customerName}</p>
          )}
        </div>
        <PaymentStatusBadge status={status} />
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Amount</span>
          <p className="font-medium text-foreground">
            {new Intl.NumberFormat("es-AR", { style: "currency", currency }).format(amount)}
          </p>
        </div>
        <div>
          <span className="text-muted-foreground">Method</span>
          <p className="font-medium text-foreground">{methodLabel}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Created</span>
          <p className="font-medium text-foreground">{new Date(createdAt).toLocaleString()}</p>
        </div>
        <div>
          <span className="text-muted-foreground">Updated</span>
          <p className="font-medium text-foreground">{new Date(updatedAt).toLocaleString()}</p>
        </div>
        {transactionReference && (
          <div className="col-span-2">
            <span className="text-muted-foreground">Transaction Reference</span>
            <p className="font-mono text-xs text-foreground">{transactionReference}</p>
          </div>
        )}
        {reviewerName && (
          <div className="col-span-2">
            <span className="text-muted-foreground">Reviewed by</span>
            <p className="font-medium text-foreground">
              {reviewerName}
              {reviewedAt && <> &middot; {new Date(reviewedAt).toLocaleString()}</>}
            </p>
          </div>
        )}
      </div>

      {receiptUrl && (
        <div>
          <span className="text-sm text-muted-foreground">Payment Receipt</span>
          <div className="mt-1">
            <a
              href={receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm transition-colors hover:bg-white/5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
              </svg>
              View Receipt
            </a>
          </div>
        </div>
      )}

      {notes && (
        <div>
          <span className="text-sm text-muted-foreground">Notes</span>
          <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">{notes}</p>
        </div>
      )}
    </div>
  )
}
