"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { AttachmentUploader } from "@/components/messages/AttachmentUploader"

interface MessageInputProps {
  onSend: (content: string, fileData?: { url: string; name: string; size: number }) => Promise<void>
  disabled?: boolean
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [text, setText] = React.useState("")
  const [pendingFile, setPendingFile] = React.useState<{ url: string; name: string; size: number } | null>(null)
  const inputRef = React.useRef<HTMLTextAreaElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() && !pendingFile) return
    await onSend(text.trim(), pendingFile ?? undefined)
    setText("")
    setPendingFile(null)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleFileAttached = (fileData: { url: string; name: string; size: number }) => {
    setPendingFile(fileData)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-white/10 bg-white/5 p-4 dark:border-white/5 dark:bg-white/[0.02]">
      <AttachmentUploader onFileAttached={handleFileAttached} />
      <div className="flex-1">
        {pendingFile && (
          <div className="mb-2 flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs">
            <span className="truncate">{pendingFile.name}</span>
            <button type="button" onClick={() => setPendingFile(null)} className="text-muted-foreground hover:text-foreground ml-auto">&times;</button>
          </div>
        )}
        <textarea
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="w-full resize-none rounded-xl border border-white/10 bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:border-white/5"
          disabled={disabled}
        />
      </div>
      <Button type="submit" size="sm" disabled={disabled || (!text.trim() && !pendingFile)}>
        Send
      </Button>
    </form>
  )
}
