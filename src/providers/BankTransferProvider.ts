import { type PaymentProvider, type ProcessPaymentParams, type PaymentResult } from "./PaymentProvider"

export class BankTransferProvider implements PaymentProvider {
  readonly name = "bank_transfer"
  readonly method = "BANK_TRANSFER" as const

  async processPayment(params: ProcessPaymentParams): Promise<PaymentResult> {
    // Bank Transfer is an offline method — payment is tracked via receipt upload.
    // No external API call. Status moves through: PENDING → RECEIPT_UPLOADED → UNDER_REVIEW → PAID/REJECTED
    return {
      success: true,
      transactionReference: `BT-${params.orderId}-${Date.now()}`,
    }
  }

  async refundPayment(_transactionReference: string): Promise<PaymentResult> {
    return { success: true }
  }
}
