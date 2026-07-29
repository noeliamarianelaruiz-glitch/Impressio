import { AuthCard } from "@/components/ui/auth-card"
import { RegisterForm } from "@/components/register-form"
import { Toaster } from "sonner"

export const metadata = {
  title: "Register",
  description: "Create your Impressio account",
}

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 px-4 py-8">
      <Toaster richColors position="top-right" />
      <AuthCard
        title="Create your account"
        description="Start your journey with Impressio"
      >
        <RegisterForm />
      </AuthCard>
      <div className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <a
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </a>
      </div>
    </main>
  )
}