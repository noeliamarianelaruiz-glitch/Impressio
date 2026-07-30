"use server"

import { auth, signIn, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import { type OrderStatus, type ProductionTaskStatus } from "@prisma/client"
import bcrypt from "bcryptjs"
import { registerSchema, loginSchema } from "./validation"
import { revalidatePath } from "next/cache"

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