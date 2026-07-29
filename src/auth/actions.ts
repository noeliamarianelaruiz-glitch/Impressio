"use server"

import { signIn, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { registerSchema, loginSchema } from "./validation"
import { revalidatePath } from "next/cache"

export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: "Invalid input" }
  }

  const result = await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirect: false,
  })

  if (result?.error) {
    return { error: result.error }
  }

  revalidatePath("/dashboard")
  return { success: true }
}

export async function register(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  })

  if (!parsed.success) {
    return { error: "Invalid input" }
  }

  const { name, email, password } = parsed.data

  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    return { error: "Email already in use" }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      name,
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