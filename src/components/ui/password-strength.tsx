"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface PasswordStrengthProps {
  password: string
}

interface Criterion {
  label: string
  met: boolean
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const criteria: Criterion[] = React.useMemo(() => {
    return [
      { label: "At least 8 characters", met: password.length >= 8 },
      { label: "One uppercase letter", met: /[A-Z]/.test(password) },
      { label: "One lowercase letter", met: /[a-z]/.test(password) },
      { label: "One number", met: /[0-9]/.test(password) },
      { label: "One special character", met: /[^A-Za-z0-9]/.test(password) },
    ]
  }, [password])

  const metCount = criteria.filter((c) => c.met).length

  const strength = React.useMemo(() => {
    if (password.length === 0) return null
    if (metCount <= 2) return { label: "Weak", color: "bg-destructive" }
    if (metCount <= 3) return { label: "Medium", color: "bg-yellow-500" }
    return { label: "Strong", color: "bg-green-500" }
  }, [metCount, password.length])

  if (password.length === 0) return null

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full transition-all duration-300",
              strength?.color ?? "bg-muted",
              metCount <= 2 && "w-1/3",
              metCount === 3 && "w-2/3",
              metCount >= 4 && "w-full"
            )}
          />
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {strength?.label}
        </span>
      </div>
      <ul className="space-y-1">
        {criteria.map((criterion, index) => (
          <li key={index} className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full transition-colors",
                criterion.met ? "bg-green-500" : "bg-muted-foreground"
              )}
            />
            <span
              className={cn(
                "transition-colors",
                criterion.met ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {criterion.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}