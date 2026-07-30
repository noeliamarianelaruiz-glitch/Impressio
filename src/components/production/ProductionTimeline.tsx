interface HistoryEvent {
  id: string
  orderNumber: string
  status: string
  note?: string | null
  createdAt: string
}

interface ProductionTimelineProps {
  events: HistoryEvent[]
}

export function ProductionTimeline({ events }: ProductionTimelineProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03]">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Recent Production Activity</h3>
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recent activity recorded.</p>
      ) : (
        <ul className="space-y-3">
          {events.slice(0, 5).map((event) => (
            <li key={event.id} className="flex items-start justify-between text-xs border-b border-white/5 pb-2 last:border-0">
              <div>
                <span className="font-semibold text-primary">{event.orderNumber}</span>
                <span className="text-foreground ml-2">→ Status: {event.status}</span>
                {event.note && <p className="text-muted-foreground mt-0.5">{event.note}</p>}
              </div>
              <span className="text-muted-foreground whitespace-nowrap ml-4">
                {new Date(event.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
