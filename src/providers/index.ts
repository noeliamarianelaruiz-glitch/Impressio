import { PaymentProvider } from "./PaymentProvider"
import { BankTransferProvider } from "./BankTransferProvider"
import { MercadoPagoProvider } from "./MercadoPagoProvider"

const providers: Record<string, PaymentProvider> = {
  bank_transfer: new BankTransferProvider(),
  mercadopago: new MercadoPagoProvider(),
}

export function getPaymentProvider(name: string): PaymentProvider | undefined {
  return providers[name]
}

export function getAvailableProviders(): PaymentProvider[] {
  return Object.values(providers)
}

export { BankTransferProvider, MercadoPagoProvider }
