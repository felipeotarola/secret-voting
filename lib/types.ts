export interface PollOption {
  text: string
}

export interface PollWithVotes {
  id: string
  title: string
  question: string
  description: string | null
  options: PollOption[]
  createdAt: string
  endsAt: string
  secretVoting: boolean
  isActive: boolean
  createdBy: string
  creatorName?: string
  creatorAvatar?: string
  imageUrl?: string | null
  votes: VoteWithUser[]
  isPrivate: boolean
  allowedUsers?: string[]
}

export interface VoteWithUser {
  id: string
  pollId: string
  userId: string
  optionIndex: number
  timestamp: string
  userName?: string
  userAvatar?: string
}
