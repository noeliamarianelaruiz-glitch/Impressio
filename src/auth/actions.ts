"use server"

import { auth, signIn, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import { type OrderStatus, type ProductionTaskStatus, type PaymentMethod } from "@prisma/client"
import bcrypt from "bcryptjs"
import { registerSchema, loginSchema } from "./validation"
import { revalidatePath } from "next/cache"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { error: firstError.message }
  }

  const result = await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirect: false,
  })

  if (result?.error) {
    return { error: "Invalid email or password" }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function register(formData: FormData) {
  const parsed = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  })

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { error: firstError.message }
  }

  const { firstName, lastName, email, password } = parsed.data

  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    return { error: "Email already in use" }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: "CLIENT",
    },
  })

  await signIn("credentials", {
    email,
    password,
    redirect: false,
  })

  revalidatePath("/dashboard")
  return { success: true }
}

export async function logout() {
  await signOut({ redirectTo: "/login" })
  revalidatePath("/")
}

export async function updateOrderStatus(
  orderId: string,
  newStatus: OrderStatus
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  })

  if (!order) {
    return { error: "Order not found" }
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus },
  })

  await prisma.orderHistory.create({
    data: {
      orderId,
      status: newStatus,
      note: `Status changed to ${newStatus}`,
    },
  })

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/orders")
  revalidatePath("/dashboard/kanban")
  revalidatePath(`/dashboard/orders/${orderId}`)
  return { success: true }
}

export async function addOrderNote(orderId: string, content: string, isInternal: boolean = true) {
  const session = await auth()
  if (!session?.user?.id) {
    return { error: "Unauthorized" }
  }

  if (!content.trim()) {
    return { error: "Note content cannot be empty" }
  }

  await prisma.orderNote.create({
    data: {
      orderId,
      userId: session.user.id,
      content,
      isInternal,
    },
  })

  const order = await prisma.order.findUnique({ where: { id: orderId } })
  if (order) {
    await prisma.orderHistory.create({
      data: {
        orderId,
        status: order.status,
        note: `Note added by ${session.user.name || "Staff"}`,
      },
    })
  }

  revalidatePath(`/dashboard/orders/${orderId}`)
  return { success: true }
}

export async function addOrderHistory(orderId: string, status: OrderStatus, note?: string) {
  await prisma.orderHistory.create({
    data: {
      orderId,
      status,
      note,
    },
  })

  await prisma.order.update({
    where: { id: orderId },
    data: { status },
  })

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/orders")
  revalidatePath("/dashboard/kanban")
  revalidatePath("/dashboard/production")
  revalidatePath(`/dashboard/orders/${orderId}`)
  return { success: true }
}

export async function updateProductionTaskStatus(taskId: string, newStatusStr: string) {
  const newStatus = newStatusStr as ProductionTaskStatus
  const task = await prisma.productionTask.findUnique({
    where: { id: taskId },
    include: { order: true },
  })

  if (!task) {
    return { error: "Production task not found" }
  }

  await prisma.productionTask.update({
    where: { id: taskId },
    data: { status: newStatus },
  })

  let orderStatus: OrderStatus = task.order.status
  if (newStatus === "PENDING") orderStatus = "PENDING"
  else if (newStatus === "DESIGN_REVIEW") orderStatus = "CONFIRMED"
  else if (newStatus === "PRINTING") orderStatus = "PRINTING"
  else if (newStatus === "SUBLIMATION" || newStatus === "CUTTING_FINISHING") orderStatus = "IN_PRODUCTION"
  else if (newStatus === "READY") orderStatus = "READY"
  else if (newStatus === "COMPLETED") orderStatus = "DELIVERED"

  await prisma.order.update({
    where: { id: task.orderId },
    data: { status: orderStatus },
  })

  await prisma.orderHistory.create({
    data: {
      orderId: task.orderId,
      status: orderStatus,
      note: `Production task status updated to ${newStatus.replace(/_/g, " ")}`,
    },
  })

  revalidatePath("/dashboard/production")
  revalidatePath("/dashboard/orders")
  revalidatePath("/dashboard/kanban")
  revalidatePath(`/dashboard/orders/${task.orderId}`)
  return { success: true }
}

export async function createConversation(data: {
  subject?: string
  customerId?: string
  orderId?: string
}) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const companyId = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { companyId: true },
  })

  if (!companyId?.companyId) return { error: "No company association" }

  const conversation = await prisma.conversation.create({
    data: {
      subject: data.subject,
      companyId: companyId.companyId,
      customerId: data.customerId,
      orderId: data.orderId,
    },
  })

  revalidatePath("/dashboard/messages")
  revalidatePath("/client/messages")
  return { success: true, conversationId: conversation.id }
}

export async function sendMessage(conversationId: string, content: string, fileData?: { url: string; name: string; size: number }) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  if (!content.trim() && !fileData) return { error: "Message content is empty" }

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: session.user.id,
      content: content.trim() || fileData?.name || "",
      fileUrl: fileData?.url,
      fileName: fileData?.name,
      fileSize: fileData?.size,
    },
  })

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  })

  revalidatePath("/dashboard/messages")
  revalidatePath("/client/messages")
  return { success: true, message }
}

export async function getConversations() {
  const session = await auth()
  if (!session?.user?.id) return []

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { companyId: true, role: true, id: true },
  })

  if (!user) return []

  const where: Record<string, unknown> = { companyId: user.companyId! }

  if (user.role === "CLIENT") {
    const customer = await prisma.customer.findFirst({
      where: { userId: user.id },
      select: { id: true },
    })
    if (!customer) return []
    where.customerId = customer.id
  }

  return prisma.conversation.findMany({
    where,
    include: {
      customer: { select: { name: true, email: true } },
      assignedTo: { select: { name: true } },
      order: { select: { orderNumber: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { sender: { select: { name: true } } },
      },
    },
    orderBy: { updatedAt: "desc" },
  })
}

export async function getConversationMessages(conversationId: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { name: true, id: true } } },
      },
      customer: { select: { name: true } },
      assignedTo: { select: { name: true } },
      order: { select: { orderNumber: true } },
    },
  })

  if (!conversation) return null

  // Mark unread messages as read if receiver is viewing
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  if (user) {
    const isStaff = user.role !== "CLIENT"
    await prisma.message.updateMany({
      where: {
        conversationId,
        read: false,
        ...(isStaff ? { sender: { role: "CLIENT" } } : {}),
      },
      data: { read: true },
    })
  }

  return conversation
}

export async function getUnreadMessageCount() {
  const session = await auth()
  if (!session?.user?.id) return 0

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { companyId: true, role: true },
  })

  if (!user?.companyId) return 0

  const conversations = await prisma.conversation.findMany({
    where: { companyId: user.companyId },
    select: { id: true },
  })

  const conversationIds = conversations.map((c) => c.id)
  if (conversationIds.length === 0) return 0

  return prisma.message.count({
    where: {
      conversationId: { in: conversationIds },
      read: false,
      senderId: { not: session.user.id },
    },
  })
}

// ── Real-time polling helpers ──────────────────────────────────────────

export async function uploadFile(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { companyId: true },
  })
  if (!user?.companyId) return { error: "No company association" }

  const file = formData.get("file") as File | null
  if (!file) return { error: "No file provided" }

  const uploadDir = path.join(process.cwd(), "public", "uploads")
  await mkdir(uploadDir, { recursive: true })

  const ext = path.extname(file.name)
  const safeName = `${crypto.randomUUID()}${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const outputPath = path.join(uploadDir, safeName)
  await writeFile(outputPath, buffer)

  const record = await prisma.uploadedFile.create({
    data: {
      companyId: user.companyId,
      name: safeName,
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      url: `/uploads/${safeName}`,
      uploadedById: session.user.id,
    },
  })

  return { success: true, url: record.url, name: file.name, size: file.size }
}

export async function getUpdatedMessages(conversationId: string, after: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  const afterDate = new Date(after)

  const messages = await prisma.message.findMany({
    where: {
      conversationId,
      createdAt: { gt: afterDate },
    },
    include: { sender: { select: { name: true, id: true } } },
    orderBy: { createdAt: "asc" },
  })

  // Mark unread as read for the viewer
  const viewer = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  if (viewer) {
    const isStaff = viewer.role !== "CLIENT"
    await prisma.message.updateMany({
      where: {
        conversationId,
        read: false,
        senderId: { not: session.user.id },
        ...(isStaff ? { sender: { role: "CLIENT" } } : {}),
      },
      data: { read: true },
    })
  }

  return messages.map((m) => ({
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

export async function getConversationsWithLastMessages() {
  const session = await auth()
  if (!session?.user?.id) return []

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { companyId: true, role: true, id: true },
  })

  if (!user?.companyId) return []

  const where: Record<string, unknown> = { companyId: user.companyId }

  if (user.role === "CLIENT") {
    const customer = await prisma.customer.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!customer) return []
    where.customerId = customer.id
  }

  const conversations = await prisma.conversation.findMany({
    where,
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

  return conversations.map((c) => ({
    id: c.id,
    subject: c.subject,
    customerName: c.customer?.name ?? c.assignedTo?.name ?? null,
    lastMessage: c.messages[0]?.content ?? null,
    lastMessageDate: c.messages[0]?.createdAt.toISOString() ?? c.updatedAt.toISOString(),
    unread: c._count.messages > 0,
    orderNumber: c.order?.orderNumber ?? null,
  }))
}

// ── Payment server actions ─────────────────────────────────────────────

export async function createPayment(
  orderId: string,
  method: string,
  provider?: string
) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
  })

  if (!order) return { error: "Order not found" }
  if (order.payment) return { error: "Payment already exists for this order" }

  const customer = await prisma.customer.findFirst({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (!customer && session.user.role === "CLIENT") {
    return { error: "Customer profile not found" }
  }

  const payment = await prisma.payment.create({
    data: {
      orderId,
      companyId: order.companyId,
      clientId: customer?.id ?? order.customerId,
      method: method as PaymentMethod,
      provider: provider ?? null,
      amount: order.totalAmount,
      currency: order.currency,
    },
  })

  return { success: true, payment }
}

export async function uploadPaymentReceipt(paymentId: string, receiptUrl: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
  if (!payment) return { error: "Payment not found" }

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      receiptUrl,
      status: "RECEIPT_UPLOADED",
    },
  })

  revalidatePath("/dashboard/payments")
  revalidatePath("/client/payments")
  return { success: true }
}

export async function reviewPayment(
  paymentId: string,
  status: "PAID" | "REJECTED",
  notes?: string
) {
  const session = await auth()
  if (!session?.user?.id) return { error: "Unauthorized" }

  const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
  if (!payment) return { error: "Payment not found" }

  const data: Record<string, unknown> = {
    status,
    reviewedById: session.user.id,
    reviewedAt: new Date(),
    notes: notes || null,
  }

  if (status === "PAID") {
    data.paidAt = new Date()
  }

  await prisma.payment.update({
    where: { id: paymentId },
    data,
  })

  revalidatePath("/dashboard/payments")
  revalidatePath("/client/payments")
  return { success: true }
}

export async function getPayments() {
  const session = await auth()
  if (!session?.user?.id) return []

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { companyId: true, role: true },
  })

  if (!user?.companyId) return []

  const where: Record<string, unknown> = { companyId: user.companyId }

  if (user.role === "CLIENT") {
    const customer = await prisma.customer.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    })
    if (!customer) return []
    where.clientId = customer.id
  }

  return prisma.payment.findMany({
    where,
    include: {
      order: { select: { orderNumber: true } },
      client: { select: { name: true } },
      reviewer: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getPaymentDetails(paymentId: string) {
  const session = await auth()
  if (!session?.user?.id) return null

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      order: { select: { orderNumber: true } },
      client: { select: { name: true } },
      reviewer: { select: { name: true } },
    },
  })

  return payment
}

export async function getBankInformation() {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { companyId: true },
  })

  if (!user?.companyId) return null

  const setting = await prisma.companySetting.findUnique({
    where: { companyId_key: { companyId: user.companyId, key: "bank_info" } },
  })

  if (!setting) {
    // Return default placeholder until bank info is configured
    return {
      bankName: "---",
      accountHolder: "---",
      accountType: "---",
      accountNumber: "---",
      cbu: "---",
      alias: "---",
      cuit: "---",
    }
  }

  return setting.value as {
    bankName: string
    accountHolder: string
    accountType: string
    accountNumber: string
    cbu: string
    alias: string
    cuit: string
  }
}