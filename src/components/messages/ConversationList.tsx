"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ConversationSummary {
  id: string
  subject?: string | null
  customerName?: string | null
  lastMessage?: string | null
  lastMessageDate?: string
  unread: boolean
  orderNumber?: string | null
}

interface ConversationListProps {
  conversations: ConversationSummary[]
  activeId?: string
  onSelect: (id: string) => void
}

export function ConversationList({ conversations, activeId, onSelect }: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">No conversations yet.</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {conversations.map((conv) => (
        <button
          key={conv.id}
          onClick={() => onSelect(conv.id)}
          className={cn(
            "w-full rounded-lg px-3 py-3 text-left transition-colors hover:bg-accent/50",
            activeId === conv.id ? "bg-accent/30" : ""
          )}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground truncate">
                  {conv.customerName || "Conversation"}
                </span>
                {conv.unread && (
                  <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                )}
              </div>
              {conv.subject && (
                <p className="mt-0.5 text-xs text-muted-foreground">{conv.subject}</p>
              )}
              {conv.lastMessage && (
                <p className="mt-0.5 text-xs text-muted-foreground truncate">
                  {conv.lastMessage}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
              {conv.lastMessageDate && (
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {conv.lastMessageDate}
                </span>
              )}
              {conv.orderNumber && (
                <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                  {conv.orderNumber}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
