import { AuthCard } from "@/components/ui/auth-card"
import { Toaster } from "sonner"

export const metadata = {
  title: "Forgot password",
  description: "Reset your Impressio password",
}

export default function ForgotPasswordPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 px-4 py-8">
      <Toaster richColors position="top-right" />
      <AuthCard
        title="Forgot your password?"
        description="Enter your email and we'll send you a reset link."
      >
        <p className="text-sm text-muted-foreground text-center">
          This feature is not yet implemented. Please contact your
          administrator for assistance.
        </p>
      </AuthCard>
      <div className="mt-6 text-center text-sm text-muted-foreground">
        <a
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Back to sign in
        </a>
      </div>
    </main>
  )
}