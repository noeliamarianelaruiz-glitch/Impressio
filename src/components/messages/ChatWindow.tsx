"use client"

import * as React from "react"
import { MessageBubble } from "@/components/messages/MessageBubble"
import { MessageInput } from "@/components/messages/MessageInput"
import { sendMessage, getUpdatedMessages } from "@/auth/actions"

interface MessageData {
  id: string
  content: string
  senderId: string
  senderName: string
  createdAt: string
  read: boolean
  fileName?: string | null
  fileUrl?: string | null
  fileSize?: number | null
}

interface ChatWindowProps {
  conversationId: string
  currentUserId: string
  initialMessages: MessageData[]
  title?: string
}

export function ChatWindow({
  conversationId,
  currentUserId,
  initialMessages,
  title,
}: ChatWindowProps) {
  const [messages, setMessages] = React.useState(initialMessages)
  const [sending, setSending] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const lastPollRef = React.useRef(
    initialMessages.length > 0
      ? initialMessages[initialMessages.length - 1].createdAt
      : new Date(0).toISOString()
  )

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  // Poll for new messages every 3s
  React.useEffect(() => {
    const interval = setInterval(async () => {
      const after = lastPollRef.current
      const newMsgs = await getUpdatedMessages(conversationId, after)
      if (newMsgs && newMsgs.length > 0) {
        lastPollRef.current = newMsgs[newMsgs.length - 1].createdAt
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id))
          const unique = newMsgs.filter((m) => !existingIds.has(m.id))
          if (unique.length === 0) return prev
          return [...prev, ...unique].map((m) => ({
            ...m,
            read: m.senderId === currentUserId ? m.read : true,
          }))
        })
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [conversationId, currentUserId])

  const handleSend = async (content: string, fileData?: { url: string; name: string; size: number }) => {
    setSending(true)
    const res = await sendMessage(conversationId, content, fileData)
    setSending(false)
    if (res.success && res.message) {
      const msg = {
        id: res.message.id,
        content: res.message.content,
        senderId: currentUserId,
        senderName: "You",
        createdAt: new Date().toISOString(),
        read: false,
        fileName: res.message.fileName,
        fileUrl: res.message.fileUrl,
        fileSize: res.message.fileSize,
      }
      lastPollRef.current = msg.createdAt
      setMessages((prev) => [...prev, msg])
    }
  }

  return (
    <div className="flex h-full flex-col">
      {title && (
        <div className="border-b border-white/10 px-5 py-3 dark:border-white/5">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        </div>
      )}

      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 p-5">
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            content={msg.content}
            senderName={msg.senderName}
            isOwn={msg.senderId === currentUserId}
            createdAt={msg.createdAt}
            read={msg.read}
            fileName={msg.fileName}
            fileUrl={msg.fileUrl}
            fileSize={msg.fileSize}
          />
        ))}
      </div>

      <MessageInput onSend={handleSend} disabled={sending} />
    </div>
  )
}
