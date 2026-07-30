"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { addOrderNote } from "@/auth/actions"
import { useRouter } from "next/navigation"

interface OrderNote {
  id: string
  content: string
  author: string
  isInternal: boolean
  createdAt: string
}

interface OrderNotesProps {
  orderId: string
  notes: OrderNote[]
}

export function OrderNotes({ orderId, notes }: OrderNotesProps) {
  const [content, setContent] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setLoading(true)
    const res = await addOrderNote(orderId, content, true)
    setLoading(false)
    if (res.success) {
      setContent("")
      router.refresh()
    }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03]">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Notes & Comments</h3>
      
      <form onSubmit={handleSubmit} className="mb-4 space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add an internal note..."
          className="w-full rounded-lg border border-white/10 bg-background p-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          rows={3}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={loading || !content.trim()}>
            {loading ? "Adding..." : "Add Note"}
          </Button>
        </div>
      </form>

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes yet</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li key={note.id} className="rounded-lg px-3 py-2 hover:bg-accent/30 bg-white/[0.02] border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">
                  {note.author}
                </span>
                <div className="flex items-center gap-2">
                  {note.isInternal && (
                    <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Internal
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <p className="mt-1 text-sm text-foreground/80">{note.content}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
