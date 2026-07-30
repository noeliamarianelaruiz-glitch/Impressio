import { requireAuth } from "@/lib/auth"
import { PageHeader } from "@/components/dashboard/PageHeader"

export const metadata = {
  title: "Profile",
  description: "Manage your profile settings",
}

export default async function ProfilePage() {
  const session = await requireAuth()

  return (
    <main className="flex-1 p-4 lg:p-6">
      <PageHeader
        title="Profile"
        description="Manage your profile settings."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Profile" }]}
      />

      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03]">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase">Name</label>
            <p className="mt-1 text-foreground">{session.user.name ?? "N/A"}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase">Email</label>
            <p className="mt-1 text-foreground">{session.user.email ?? "N/A"}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase">Role</label>
            <p className="mt-1 text-foreground capitalize">{session.user.role ?? "N/A"}</p>
          </div>
        </div>
      </div>
    </main>
  )
}
