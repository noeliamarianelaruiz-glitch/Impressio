import { AuthCard } from "@/components/ui/auth-card"
import { LoginForm } from "@/components/auth/LoginForm"
import { Toaster } from "sonner"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export const metadata = {
  title: "Sign in",
  description: "Sign in to your Impressio account",
}

export default async function LoginPage() {
  const session = await auth()
  if (session?.user?.id) {
    redirect("/dashboard")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 px-4 py-8">
      <Toaster richColors position="top-right" />
      <AuthCard
        title="Welcome back"
        description="Sign in to your Impressio account"
      >
        <LoginForm />
      </AuthCard>
      <div className="mt-6 text-center text-sm text-muted-foreground">
        Don&#39;t have an account?{" "}
        <a
          href="/register"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Create one
        </a>
      </div>
    </main>
  )
}