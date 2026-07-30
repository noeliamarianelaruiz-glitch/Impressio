import { cn } from "@/lib/utils"

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "bg-green-500/10 text-green-500" },
  medium: { label: "Medium", color: "bg-yellow-500/10 text-yellow-500" },
  high: { label: "High", color: "bg-orange-500/10 text-orange-500" },
  urgent: { label: "Urgent", color: "bg-red-500/10 text-red-500" },
}

interface PriorityBadgeProps {
  priority?: string
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const normalized = priority?.toLowerCase() || "medium"
  const config = priorityConfig[normalized] || priorityConfig.medium
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
        config.color
      )}
    >
      {config.label}
    </span>
  )
}