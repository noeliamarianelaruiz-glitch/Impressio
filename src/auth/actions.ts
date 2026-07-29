"use server"

import { signIn, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import { type OrderStatus } from "@prisma/client"
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

  revalidatePath("/dashboard")
  return { success: true }
}