"use client"

import * as React from "react"
import { ConversationList } from "@/components/messages/ConversationList"
import { ChatWindow } from "@/components/messages/ChatWindow"
import { getConversationMessages, getConversationsWithLastMessages } from "@/auth/actions"

interface ConversationSummary {
  id: string
  subject: string | null
  customerName: string | null
  lastMessage: string | null
  lastMessageDate: string
  unread: boolean
  orderNumber: string | null
}

interface SerializedMessage {
  id: string
  content: string
  senderId: string
  senderName: string
  createdAt: string
  read: boolean
  fileName: string | null
  fileUrl: string | null
  fileSize: number | null
}

interface MessagesClientProps {
  conversations: ConversationSummary[]
  currentUserId: string
  initialActiveId?: string | null
  initialMessages?: SerializedMessage[]
}

export function MessagesClient({
  conversations: initialConvs,
  currentUserId,
  initialActiveId,
  initialMessages: initialMsgs = [],
}: MessagesClientProps) {
  const [activeId, setActiveId] = React.useState<string | null>(initialActiveId ?? null)
  const [messages, setMessages] = React.useState(initialMsgs)
  const [loading, setLoading] = React.useState(false)
  const [convList, setConvList] = React.useState(initialConvs)

  React.useEffect(() => {
    const interval = setInterval(async () => {
      const updated = await getConversationsWithLastMessages()
      if (updated && updated.length > 0) {
        setConvList(updated)
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleSelectConversation = async (id: string) => {
    setActiveId(id)
    setLoading(true)
    const data = await getConversationMessages(id)
    setLoading(false)
    if (data) {
      setMessages(
        data.messages.map((m: { id: string; content: string; senderId: string; sender: { name: string | null }; createdAt: Date; read: boolean; fileName: string | null; fileUrl: string | null; fileSize: number | null }) => ({
          id: m.id,
          content: m.content,
          senderId: m.senderId,
          senderName: m.sender?.name ?? "Unknown",
          createdAt: (m.createdAt as Date).toISOString(),
          read: m.read,
          fileName: m.fileName,
          fileUrl: m.fileUrl,
          fileSize: m.fileSize,
        }))
      )
    }
  }

  const activeConversation = convList.find((c) => c.id === activeId)

  return (
    <div className="flex flex-1 overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03]">
      <div className="w-72 shrink-0 border-r border-white/10 p-3 dark:border-white/5 overflow-y-auto">
        <ConversationList
          conversations={convList}
          activeId={activeId ?? undefined}
          onSelect={handleSelectConversation}
        />
      </div>
      <div className="flex-1 flex flex-col">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading messages...
            </div>
          </div>
        ) : activeId ? (
          <ChatWindow
            conversationId={activeId}
            currentUserId={currentUserId}
            initialMessages={messages}
            title={activeConversation?.subject ?? "Conversation"}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Select a conversation.</p>
          </div>
        )}
      </div>
    </div>
  )
}
