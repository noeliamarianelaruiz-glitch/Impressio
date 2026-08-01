"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface MessageBubbleProps {
  content: string
  senderName: string
  isOwn: boolean
  createdAt: string
  read: boolean
  fileName?: string | null
  fileUrl?: string | null
  fileSize?: number | null
}

export function MessageBubble({
  content,
  senderName,
  isOwn,
  createdAt,
  read,
  fileName,
  fileUrl,
  fileSize,
}: MessageBubbleProps) {
  return (
    <div className={cn("flex flex-col", isOwn ? "items-end" : "items-start")}>
      <span className="mb-1 text-[10px] text-muted-foreground px-1">
        {isOwn ? "You" : senderName}
      </span>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isOwn
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-white/10 text-foreground dark:bg-white/[0.06] rounded-bl-sm"
        )}
      >
        <p className="whitespace-pre-wrap break-words">{content}</p>

        {fileUrl && (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "mt-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors",
              isOwn
                ? "border-primary-foreground/20 hover:bg-primary-foreground/10"
                : "border-white/10 hover:bg-white/5"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="flex-1 truncate">{fileName || "File"}</span>
            {fileSize && <span className="text-[10px] opacity-60">{(fileSize / 1024).toFixed(1)} KB</span>}
          </a>
        )}
      </div>

      <div className="mt-1 flex items-center gap-2 px-1">
        <span className="text-[10px] text-muted-foreground">
          {new Date(createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
        {isOwn && (
          <span className="text-[10px] text-muted-foreground">
            {read ? "✓✓" : "✓"}
          </span>
        )}
      </div>
    </div>
  )
}
