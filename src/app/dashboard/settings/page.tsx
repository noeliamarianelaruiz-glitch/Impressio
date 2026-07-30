import { requireAuth } from "@/lib/auth"
import { PageHeader } from "@/components/dashboard/PageHeader"

export const metadata = {
  title: "Settings",
  description: "Manage your account settings",
}

export default async function SettingsPage() {
  await requireAuth()

  return (
    <main className="flex-1 p-4 lg:p-6">
      <PageHeader
        title="Settings"
        description="Manage your account and preferences."
        breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Settings" }]}
      />

      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03]">
        <p className="text-sm text-muted-foreground">
          Settings page is under construction. Additional configuration options will be available soon.
        </p>
      </div>
    </main>
  )
}
