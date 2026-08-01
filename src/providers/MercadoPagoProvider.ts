import { type PaymentProvider, type ProcessPaymentParams, type PaymentResult } from "./PaymentProvider"

export class MercadoPagoProvider implements PaymentProvider {
  readonly name = "mercadopago"
  readonly method = "MERCADO_PAGO" as const

  async processPayment(_params: ProcessPaymentParams): Promise<PaymentResult> {
    // TODO: Integrate Mercado Pago API
    // 1. Create preference → get checkout URL
    // 2. Redirect user to Mercado Pago
    // 3. Handle webhook callback
    // 4. Update payment status accordingly
    return {
      success: false,
      error: "Mercado Pago API integration not yet implemented. See docs/mercadopago.md.",
    }
  }

  async refundPayment(_transactionReference: string): Promise<PaymentResult> {
    return {
      success: false,
      error: "Mercado Pago API integration not yet implemented.",
    }
  }
}
