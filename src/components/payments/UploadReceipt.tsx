"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { uploadFile } from "@/auth/actions"

interface UploadReceiptProps {
  paymentId: string
  onUploaded: (url: string) => void
}

export function UploadReceipt({ onUploaded }: UploadReceiptProps) {
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
      onUploaded(result.url)
    }

    if (fileRef.current) fileRef.current.value = ""
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-2"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        {uploading ? "Uploading..." : "Upload Receipt"}
      </Button>
    </div>
  )
}
