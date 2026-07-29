import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/DashboardShell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  )
}