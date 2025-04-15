import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="container max-w-2xl mx-auto py-8 px-4 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        <p className="text-muted-foreground">Loading poll creator...</p>
      </div>
    </div>
  )
}
