"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Share, Copy, Check, Twitter, Facebook, Linkedin, Mail } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface SharePollProps {
  pollId: string
  pollTitle: string
}

export function SharePoll({ pollId, pollTitle }: SharePollProps) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)
  const pollUrl = typeof window !== "undefined" ? `${window.location.origin}/poll/${pollId}` : `/poll/${pollId}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pollUrl)
      setCopied(true)
      toast({
        title: "URL copied to clipboard",
        description: "You can now paste the poll link anywhere",
        duration: 3000,
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy URL:", err)
      // Fallback method for browsers that don't support clipboard API
      try {
        // Create a temporary input element
        const tempInput = document.createElement("input")
        tempInput.value = pollUrl
        document.body.appendChild(tempInput)
        tempInput.select()
        document.execCommand("copy")
        document.body.removeChild(tempInput)

        setCopied(true)
        toast({
          title: "URL copied to clipboard",
          description: "You can now paste the poll link anywhere",
          duration: 3000,
        })
        setTimeout(() => setCopied(false), 2000)
      } catch (fallbackErr) {
        console.error("Fallback copy method failed:", fallbackErr)
        toast({
          title: "Failed to copy URL",
          description: "Please try selecting and copying manually",
          variant: "destructive",
          duration: 3000,
        })
      }
    }
  }

  const shareViaTwitter = () => {
    const text = `Vote on "${pollTitle}" in this poll on PollPulse!`
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(pollUrl)}`,
      "_blank",
    )
  }

  const shareViaFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pollUrl)}`, "_blank")
  }

  const shareViaLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pollUrl)}`, "_blank")
  }

  const shareViaEmail = () => {
    const subject = `Vote on "${pollTitle}" in this poll on PollPulse!`
    const body = `Check out this poll: ${pollUrl}`
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Share className="h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share poll</DialogTitle>
          <DialogDescription>Share this poll with your friends and colleagues to get more votes.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center space-x-2 mt-4">
          <div className="grid flex-1 gap-2">
            <Input
              value={pollUrl}
              readOnly
              className="border-2 focus-visible:ring-violet-500"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
          </div>
          <Button
            size="sm"
            className={`px-3 ${copied ? "bg-green-600 hover:bg-green-700" : "bg-violet-600 hover:bg-violet-700"}`}
            onClick={handleCopy}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span className="sr-only">Copy</span>
          </Button>
        </div>
        <div className="flex justify-center gap-4 mt-4">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
            onClick={shareViaTwitter}
          >
            <Twitter className="h-4 w-4" />
            <span className="sr-only">Share on Twitter</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full hover:bg-blue-50 hover:text-blue-800 hover:border-blue-200"
            onClick={shareViaFacebook}
          >
            <Facebook className="h-4 w-4" />
            <span className="sr-only">Share on Facebook</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
            onClick={shareViaLinkedIn}
          >
            <Linkedin className="h-4 w-4" />
            <span className="sr-only">Share on LinkedIn</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="rounded-full hover:bg-red-50 hover:text-red-600 hover:border-red-200"
            onClick={shareViaEmail}
          >
            <Mail className="h-4 w-4" />
            <span className="sr-only">Share via Email</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
