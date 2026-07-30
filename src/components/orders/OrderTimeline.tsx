import { cn } from "@/lib/utils"

interface TimelineStep {
  label: string
  completed: boolean
  date?: string
}

interface OrderTimelineProps {
  steps: TimelineStep[]
}

export function OrderTimeline({ steps }: OrderTimelineProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03]">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Timeline</h3>
      <ol className="relative space-y-0 border-l border-white/10 dark:border-white/5">
        {steps.map((step, index) => (
          <li key={index} className="relative ml-4 pb-4 last:pb-0">
            <span
              className={cn(
                "absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2",
                step.completed
                  ? "bg-primary border-primary"
                  : "border-muted bg-background"
              )}
            />
            <div className="flex items-baseline justify-between">
              <span
                className={cn(
                  "text-sm",
                  step.completed ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
              {step.date && (
                <span className="text-xs text-muted-foreground">
                  {step.date}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}