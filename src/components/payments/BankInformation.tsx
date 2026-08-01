"use client"

interface BankInfo {
  bankName: string
  accountHolder: string
  accountType: string
  accountNumber: string
  cbu: string
  alias: string
  cuit: string
}

interface BankInformationProps {
  info: BankInfo
}

export function BankInformation({ info }: BankInformationProps) {
  const rows = [
    { label: "Bank", value: info.bankName },
    { label: "Account Holder", value: info.accountHolder },
    { label: "Account Type", value: info.accountType },
    { label: "Account Number", value: info.accountNumber },
    { label: "CBU", value: info.cbu, mono: true },
    { label: "Alias", value: info.alias, mono: true },
    { label: "CUIT", value: info.cuit, mono: true },
  ]

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 dark:border-white/5">
      <h4 className="mb-4 text-sm font-semibold text-foreground">Bank Transfer Information</h4>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4">
            <span className="text-xs text-muted-foreground shrink-0">{row.label}</span>
            <span
              className={`text-xs font-medium text-foreground text-right ${row.mono ? "font-mono" : ""}`}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
