interface OrderFile {
  id: string
  name: string
  type: string
  url: string
  createdAt: string
}

interface OrderFilesProps {
  files: OrderFile[]
}

export function OrderFiles({ files }: OrderFilesProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl dark:border-white/5 dark:bg-white/[0.03]">
      <h3 className="mb-4 text-sm font-semibold text-foreground">Files</h3>
      {files.length === 0 ? (
        <p className="text-sm text-muted-foreground">No files uploaded yet</p>
      ) : (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-accent/30"
            >
              <div className="flex items-center gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted-foreground"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{file.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {new Date(file.createdAt).toLocaleDateString()}
                </span>
                <a
                  href={file.url}
                  download
                  className="text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  Download
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}