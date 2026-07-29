import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { UserRole } from "@prisma/client"

export async function currentUser() {
  const session = await auth()
  if (!session?.user?.id) return null

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  return user
}

export async function currentRole() {
  const session = await auth()
  return (session?.user as { role?: UserRole })?.role ?? null
}