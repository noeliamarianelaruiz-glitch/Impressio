import { requireAuth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { PageHeader } from "@/components/dashboard/PageHeader"
import { MessagesClient } from "./MessagesClient"

export const metadata = {
  title: "Messages",
  description: "Customer conversations and support",
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

export default async function DashboardMessagesPage() {
  const session = await requireAuth()

  const conversations = await prisma.conversation.findMany({
    where: { companyId: session.user.companyId! },
    include: {
      customer: { select: { name: true, email: true } },
      assignedTo: { select: { name: true } },
      order: { select: { orderNumber: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { sender: { select: { name: true, id: true } } },
      },
      _count: {
        select: {
          messages: { where: { read: false, senderId: { not: session.user.id } } },
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  })

  const initialList = conversations.map((c) => ({
    id: c.id,
    subject: c.subject,
    customerName: c.customer?.name ?? null,
    lastMessage: c.messages[0]?.content ?? null,
    lastMessageDate: c.messages[0]?.createdAt.toISOString() ?? c.updatedAt.toISOString(),
    unread: c._count.messages > 0,
    orderNumber: c.order?.orderNumber ?? null,
  }))

  let initialActiveId: string | null = null
  let initialMessages: SerializedMessage[] = []

  if (conversations.length > 0) {
    initialActiveId = conversations[0].id
    const firstMessages = await prisma.message.findMany({
      where: { conversationId: conversations[0].id },
      include: { sender: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    })
    initialMessages = firstMessages.map((m) => ({
      id: m.id,
      content: m.content,
      senderId: m.senderId,
      senderName: m.sender?.name ?? "Unknown",
      createdAt: m.createdAt.toISOString(),
      read: m.read,
      fileName: m.fileName,
      fileUrl: m.fileUrl,
      fileSize: m.fileSize,
    }))
  }

  return (
    <main className="flex-1 p-4 lg:p-6 flex flex-col">
      <PageHeader
        title="Messages"
        description="Manage customer conversations and support tickets."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Messages" }]}
      />
      <div className="mt-6 flex-1 flex flex-col">
        <MessagesClient
          conversations={initialList}
          currentUserId={session.user.id}
          initialActiveId={initialActiveId}
          initialMessages={initialMessages}
        />
      </div>
    </main>
  )
}
