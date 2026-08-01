export type PaymentMethod = "BANK_TRANSFER" | "MERCADO_PAGO"

export type PaymentStatus =
  | "PENDING"
  | "RECEIPT_UPLOADED"
  | "UNDER_REVIEW"
  | "PAID"
  | "REJECTED"
  | "REFUNDED"
  | "CANCELLED"

export interface ProcessPaymentParams {
  orderId: string
  customerId: string
  companyId: string
  amount: number
  currency: string
}

export interface PaymentResult {
  success: boolean
  transactionReference?: string
  error?: string
}

export interface PaymentProvider {
  readonly name: string
  readonly method: PaymentMethod

  processPayment(params: ProcessPaymentParams): Promise<PaymentResult>
  refundPayment(transactionReference: string): Promise<PaymentResult>
}
