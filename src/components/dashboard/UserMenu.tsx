"use client"

import * as React from "react"
import { signOut } from "@/auth"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function UserMenu() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setOpen(false)
    await signOut({ redirectTo: "/login" })
    router.push("/login")
    router.refresh()
    toast.success("Signed out")
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-full px-2 py-1 transition-colors hover:bg-accent"
        aria-label="User menu"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-medium">
          U
        </div>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-white/5 p-2 shadow-xl backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03]">
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-foreground">User</p>
            <p className="text-xs text-muted-foreground">user@example.com</p>
          </div>
          <div className="my-1 border-t border-white/10 dark:border-white/5" />
          <button
            onClick={handleLogout}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}