import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Poll, Vote } from "./database.types"
import type { PollWithVotes, PollOption } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTimeLeft(endTime: Date): string {
  const now = new Date()
  const diff = endTime.getTime() - now.getTime()

  if (diff <= 0) {
    return "Ended"
  }

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  if (hours > 0) {
    return `${hours}h ${minutes}m left`
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s left`
  } else {
    return `${seconds}s left`
  }
}

// Add the convertPollToFrontend function to utils.ts
export function convertPollToFrontend(
  poll: Poll,
  votes: Vote[] = [],
  creatorName?: string | null,
  creatorAvatar?: string | null,
): PollWithVotes {
  // Ensure options is a valid array
  let options: PollOption[] = []

  try {
    if (typeof poll.options === "string") {
      // If options is a string, try to parse it
      const parsedOptions = JSON.parse(poll.options)
      options = Array.isArray(parsedOptions) ? parsedOptions : []
    } else if (Array.isArray(poll.options)) {
      // If options is already an array, use it
      options = poll.options as PollOption[]
    } else if (poll.options && typeof poll.options === "object") {
      // If options is an object (from Supabase JSONB), convert it
      const optionsObj = poll.options as any
      if (Array.isArray(optionsObj)) {
        options = optionsObj
      }
    }
  } catch (error) {
    console.error("Error parsing poll options:", error, "Raw options:", poll.options)
    // Default to empty array if parsing fails
    options = []
  }

  // Ensure options is an array and each option has a text property
  if (!Array.isArray(options)) {
    options = []
  }

  // Ensure each option has a text property
  options = options.map((opt) => {
    if (typeof opt === "string") {
      return { text: opt }
    }
    if (typeof opt === "object" && opt !== null) {
      return { text: opt.text || "Option" }
    }
    return { text: "Option" }
  })

  return {
    id: poll.id,
    title: poll.title,
    question: poll.question || poll.title, // Use title as fallback if question is missing
    description: poll.description || "",
    options: options,
    createdAt: poll.created_at,
    endsAt: poll.ends_at,
    secretVoting: poll.secret_voting !== undefined ? poll.secret_voting : true, // Default to true if not present
    isActive: poll.is_active,
    createdBy: poll.created_by,
    creatorName: creatorName || "",
    creatorAvatar: creatorAvatar || "",
    imageUrl: poll.image_url,
    votes: votes.map((vote) => ({
      id: vote.id,
      pollId: vote.poll_id,
      userId: vote.user_id,
      optionIndex: vote.option_index,
      timestamp: vote.created_at,
    })),
    isPrivate: poll.is_private !== undefined ? poll.is_private : false,
  }
}
