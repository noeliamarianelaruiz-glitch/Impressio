import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Breadcrumbs } from "@/components/dashboard/Breadcrumbs"

export const metadata = {
  title: "Profile",
  description: "Manage your profile settings",
}

export default async function ProfilePage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect("/login")
  }

  return (
    <main className="flex-1 p-4 lg:p-6">
      <Breadcrumbs items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Profile" }]} />

      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03]">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Profile</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This feature is not yet fully implemented.
        </p>

        <div className="mt-4 space-y-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase">Name</span>
            <span className="text-foreground">{session.user.name ?? "N/A"}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-muted-foreground uppercase">Email</span>
            <span className="text-foreground">{session.user.email ?? "N/A"}</span>
          </div>
        </div>
      </div>
    </main>
  )
}