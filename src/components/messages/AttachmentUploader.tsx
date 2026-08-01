"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { uploadFile } from "@/auth/actions"

interface AttachmentUploaderProps {
  onFileAttached: (data: { url: string; name: string; size: number }) => void
}

export function AttachmentUploader({ onFileAttached }: AttachmentUploaderProps) {
  const fileRef = React.useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = React.useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    const result = await uploadFile(formData)
    setUploading(false)

    if (result.success && result.url) {
      onFileAttached({ url: result.url, name: result.name ?? file.name, size: result.size ?? file.size })
    }

    if (fileRef.current) fileRef.current.value = ""
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
        {uploading && <span className="ml-1 text-xs">Uploading...</span>}
      </Button>
    </div>
  )
}
