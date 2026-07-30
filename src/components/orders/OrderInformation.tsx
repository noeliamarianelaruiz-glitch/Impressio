interface OrderItemInfo {
  id: string
  productName: string
  variantName?: string | null
  materialName?: string | null
  techniqueName?: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface OrderInformationProps {
  customer: string
  customerEmail?: string | null
  items: OrderItemInfo[]
  quantity: number
  total: string
  currency: string
  assignedTo?: string
  estimatedCompletion?: string
  paymentStatus?: string
}

export function OrderInformation({
  customer,
  customerEmail,
  items,
  quantity,
  total,
  currency,
  assignedTo,
  estimatedCompletion,
  paymentStatus,
}: OrderInformationProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03] space-y-6">
      <div>
        <h3 className="mb-4 text-sm font-semibold text-foreground">Order Information</h3>
        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase">Customer</dt>
            <dd className="mt-1 text-sm text-foreground font-medium">{customer}</dd>
            {customerEmail && <dd className="text-xs text-muted-foreground">{customerEmail}</dd>}
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase">Total Amount</dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">{total}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase">Total Quantity</dt>
            <dd className="mt-1 text-sm text-foreground">{quantity} units</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase">Payment Status</dt>
            <dd className="mt-1 text-sm text-foreground">{paymentStatus ?? "PENDING"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase">Assigned To</dt>
            <dd className="mt-1 text-sm text-foreground">{assignedTo ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase">Est. Completion</dt>
            <dd className="mt-1 text-sm text-foreground">{estimatedCompletion ?? "—"}</dd>
          </div>
        </dl>
      </div>

      <div>
        <h4 className="mb-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Order Items & Products</h4>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No items found in this order.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-white/10 text-xs text-muted-foreground dark:border-white/5">
                <tr>
                  <th className="pb-2 font-medium">Product / Details</th>
                  <th className="pb-2 font-medium text-center">Qty</th>
                  <th className="pb-2 font-medium text-right">Unit Price</th>
                  <th className="pb-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-white/[0.02]">
                    <td className="py-3">
                      <p className="font-medium text-foreground">{item.productName}</p>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mt-0.5">
                        {item.variantName && <span>Variant: {item.variantName}</span>}
                        {item.materialName && <span>Material: {item.materialName}</span>}
                        {item.techniqueName && <span>Technique: {item.techniqueName}</span>}
                      </div>
                    </td>
                    <td className="py-3 text-center text-foreground">{item.quantity}</td>
                    <td className="py-3 text-right text-foreground">{currency} {item.unitPrice.toFixed(2)}</td>
                    <td className="py-3 text-right font-medium text-foreground">{currency} {item.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
