"use server"

import { cookies } from "next/headers"
import { createServerSupabaseClient } from "./supabase"
import type { PollOption } from "./types"
import { convertPollToFrontend } from "./utils"
import { withRetry, checkRateLimit } from "./request-utils"

export async function createPoll(pollData: {
  title: string
  question: string
  description: string
  options: PollOption[]
  endsAt: string
  secretVoting: boolean
  isPrivate?: boolean
  imageUrl?: string
  creatorName?: string
  creatorAvatar?: string
}) {
  const supabase = createServerSupabaseClient()
  const cookieStore = cookies()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error("Not authenticated")
  }

  try {
    // Ensure options is a valid array
    const validOptions = Array.isArray(pollData.options) ? pollData.options : []

    // Insert poll into database with retry
    const poll = await withRetry(
      async () => {
        const { data, error } = await supabase
          .from("polls")
          .insert({
            title: pollData.title,
            question: pollData.question,
            description: pollData.description,
            options: validOptions,
            created_at: new Date().toISOString(),
            ends_at: pollData.endsAt,
            secret_voting: pollData.secretVoting,
            is_active: true,
            created_by: session.user.id,
            image_url: pollData.imageUrl || null,
            is_private: pollData.isPrivate || false,
          })
          .select()
          .single()

        if (error) {
          console.error("Error creating poll:", error)
          throw new Error(`Failed to create poll: ${error.message}`)
        }

        return data
      },
      {
        key: `createPoll_${session.user.id}`,
        retries: 2,
      },
    )

    // Instead of fetching creator info again, use the provided data
    return convertPollToFrontend(
      poll,
      [],
      pollData.creatorName || session.user.email?.split("@")[0] || "User",
      pollData.creatorAvatar,
    )
  } catch (error) {
    console.error("Error in createPoll:", error)
    throw new Error(`Failed to create poll: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function getAllPolls() {
  const supabase = createServerSupabaseClient()

  try {
    // Get all polls with retry
    const polls = await withRetry(
      async () => {
        const { data, error } = await supabase.from("polls").select("*").order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching polls:", error)
          throw new Error("Failed to fetch polls")
        }

        return data
      },
      {
        key: "getAllPolls",
        cacheKey: "all_polls",
        cacheTtl: 30000, // 30 seconds
        retries: 2,
      },
    )

    // Get all votes with retry
    const votes = await withRetry(
      async () => {
        const { data, error } = await supabase.from("votes").select("*")

        if (error) {
          console.error("Error fetching votes:", error)
          throw new Error("Failed to fetch votes")
        }

        return data
      },
      {
        key: "getAllVotes",
        cacheKey: "all_votes",
        cacheTtl: 30000, // 30 seconds
        retries: 2,
      },
    )

    // Get creator profiles - only if we have a reasonable number of creators
    const creatorIds = [...new Set(polls.map((poll) => poll.created_by))]

    let creators = []
    if (creatorIds.length > 0 && creatorIds.length <= 10) {
      try {
        const { data: creatorsData, error: creatorsError } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", creatorIds)

        if (!creatorsError) {
          creators = creatorsData || []
        }
      } catch (error) {
        console.error("Error fetching creators:", error)
        // Continue without creator info
      }
    }

    // Convert polls to frontend format
    return polls.map((poll) => {
      const pollVotes = votes.filter((vote) => vote.poll_id === poll.id)
      const creator = creators.find((c) => c?.id === poll.created_by)
      return convertPollToFrontend(poll, pollVotes, creator?.name, creator?.avatar_url)
    })
  } catch (error) {
    console.error("Error in getAllPolls:", error)
    return [] // Return empty array on error
  }
}

export async function getPoll(id: string) {
  const supabase = createServerSupabaseClient()
  const cookieStore = cookies()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  try {
    // Get poll with retry and caching
    const poll = await withRetry(
      async () => {
        const { data, error } = await supabase.from("polls").select("*").eq("id", id).single()

        if (error) {
          console.error("Error fetching poll:", error)
          throw new Error("Poll not found")
        }

        return data
      },
      {
        key: `getPoll_${id}`,
        cacheKey: `poll_${id}`,
        cacheTtl: 30000, // 30 seconds
        retries: 2,
      },
    )

    // Check if poll is private and user has access
    if (poll.is_private && session) {
      // Creator always has access
      if (poll.created_by !== session.user.id) {
        // Check if user has been granted access
        const { data: access, error: accessError } = await supabase
          .from("poll_access")
          .select("id")
          .eq("poll_id", id)
          .eq("user_id", session.user.id)
          .maybeSingle()

        if (accessError || !access) {
          // User doesn't have access to this private poll
          // We still return the poll data for the frontend to handle access control
        }
      }
    }

    // Get votes for this poll with retry and caching
    const votes = await withRetry(
      async () => {
        const { data, error } = await supabase.from("votes").select("*").eq("poll_id", id)

        if (error) {
          console.error("Error fetching votes:", error)
          throw new Error("Failed to fetch votes")
        }

        return data || []
      },
      {
        key: `getVotes_${id}`,
        cacheKey: `votes_${id}`,
        cacheTtl: 30000, // 30 seconds
        retries: 2,
      },
    )

    // Try to get creator profile, but handle errors gracefully
    let creatorName = null
    let creatorAvatar = null

    try {
      // Check if we're under rate limit before fetching creator
      if (checkRateLimit(`getCreator_${poll.created_by}`, 3, 10000)) {
        const { data: creator, error: creatorError } = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("id", poll.created_by)
          .single()

        if (!creatorError && creator) {
          creatorName = creator.name
          creatorAvatar = creator.avatar_url
        }
      }
    } catch (creatorError) {
      console.error("Error fetching creator:", creatorError)
      // Continue without creator info
    }

    return convertPollToFrontend(poll, votes, creatorName, creatorAvatar)
  } catch (error) {
    console.error("Error in getPoll:", error)
    throw new Error(`Failed to fetch poll: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function votePoll(pollId: string, optionIndex: string) {
  const supabase = createServerSupabaseClient()
  const cookieStore = cookies()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error("Not authenticated")
  }

  try {
    // Get poll with retry
    const poll = await withRetry(
      async () => {
        const { data, error } = await supabase.from("polls").select("*").eq("id", pollId).single()

        if (error) {
          console.error("Error fetching poll:", error)
          throw new Error("Poll not found")
        }

        return data
      },
      {
        key: `getPoll_${pollId}`,
        cacheKey: `poll_${pollId}`,
        cacheTtl: 30000, // 30 seconds
        retries: 2,
      },
    )

    // Check if poll is still active
    if (new Date(poll.ends_at) < new Date()) {
      throw new Error("Poll has ended")
    }

    // Check if user has already voted
    const existingVote = await withRetry(
      async () => {
        const { data, error } = await supabase
          .from("votes")
          .select("*")
          .eq("poll_id", pollId)
          .eq("user_id", session.user.id)
          .maybeSingle()

        if (error) {
          console.error("Error checking existing vote:", error)
          throw new Error("Failed to check if you've already voted")
        }

        return data
      },
      {
        key: `checkVote_${session.user.id}_${pollId}`,
        retries: 2,
      },
    )

    if (existingVote) {
      throw new Error("You have already voted")
    }

    // Add vote with retry
    await withRetry(
      async () => {
        const { data, error } = await supabase
          .from("votes")
          .insert({
            poll_id: pollId,
            user_id: session.user.id,
            option_index: Number.parseInt(optionIndex),
            created_at: new Date().toISOString(),
          })
          .select()
          .single()

        if (error) {
          console.error("Error submitting vote:", error)
          throw new Error("Failed to submit vote")
        }

        return data
      },
      {
        key: `addVote_${session.user.id}_${pollId}`,
        retries: 2,
      },
    )

    // Get all votes for this poll with retry
    const votes = await withRetry(
      async () => {
        const { data, error } = await supabase.from("votes").select("*").eq("poll_id", pollId)

        if (error) {
          console.error("Error fetching votes:", error)
          throw new Error("Failed to fetch votes")
        }

        return data || []
      },
      {
        key: `getVotes_${pollId}`,
        retries: 2,
      },
    )

    // Try to get creator profile, but handle errors gracefully
    let creatorName = null
    let creatorAvatar = null

    try {
      // Check if we're under rate limit before fetching creator
      if (checkRateLimit(`getCreator_${poll.created_by}`, 3, 10000)) {
        const { data: creator, error: creatorError } = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("id", poll.created_by)
          .single()

        if (!creatorError && creator) {
          creatorName = creator.name
          creatorAvatar = creator.avatar_url
        }
      }
    } catch (creatorError) {
      console.error("Error fetching creator:", creatorError)
      // Continue without creator info
    }

    return convertPollToFrontend(poll, votes, creatorName, creatorAvatar)
  } catch (error) {
    console.error("Error in votePoll:", error)
    throw new Error(`Failed to vote: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function toggleVisibility(pollId: string) {
  const supabase = createServerSupabaseClient()
  const cookieStore = cookies()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error("Not authenticated")
  }

  try {
    // Get poll with retry
    const poll = await withRetry(
      async () => {
        const { data, error } = await supabase.from("polls").select("*").eq("id", pollId).single()

        if (error) {
          console.error("Error fetching poll:", error)
          throw new Error("Poll not found")
        }

        return data
      },
      {
        key: `getPoll_${pollId}`,
        cacheKey: `poll_${pollId}`,
        cacheTtl: 30000, // 30 seconds
        retries: 2,
      },
    )

    // Check if user is the creator
    if (poll.created_by !== session.user.id) {
      throw new Error("Not authorized")
    }

    // Toggle secret_voting with retry
    const updatedPoll = await withRetry(
      async () => {
        const { data, error } = await supabase
          .from("polls")
          .update({ secret_voting: !poll.secret_voting })
          .eq("id", pollId)
          .select()
          .single()

        if (error) {
          console.error("Error updating poll:", error)
          throw new Error("Failed to update poll")
        }

        return data
      },
      {
        key: `updatePoll_${pollId}`,
        retries: 2,
      },
    )

    // Get votes for this poll with retry
    const votes = await withRetry(
      async () => {
        const { data, error } = await supabase.from("votes").select("*").eq("poll_id", pollId)

        if (error) {
          console.error("Error fetching votes:", error)
          throw new Error("Failed to fetch votes")
        }

        return data || []
      },
      {
        key: `getVotes_${pollId}`,
        retries: 2,
      },
    )

    // Try to get creator profile, but handle errors gracefully
    let creatorName = null
    let creatorAvatar = null

    try {
      // Check if we're under rate limit before fetching creator
      if (checkRateLimit(`getCreator_${updatedPoll.created_by}`, 3, 10000)) {
        const { data: creator, error: creatorError } = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("id", updatedPoll.created_by)
          .single()

        if (!creatorError && creator) {
          creatorName = creator.name
          creatorAvatar = creator.avatar_url
        }
      }
    } catch (creatorError) {
      console.error("Error fetching creator:", creatorError)
      // Continue without creator info
    }

    return convertPollToFrontend(updatedPoll, votes, creatorName, creatorAvatar)
  } catch (error) {
    console.error("Error in toggleVisibility:", error)
    throw new Error(`Failed to toggle visibility: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export async function getUserPolls() {
  const supabase = createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error("Not authenticated")
  }

  try {
    // Get all polls created by the user with retry and caching
    const polls = await withRetry(
      async () => {
        const { data, error } = await supabase
          .from("polls")
          .select("*")
          .eq("created_by", session.user.id)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching user polls:", error)
          throw new Error("Failed to fetch your polls")
        }

        return data
      },
      {
        key: `getUserPolls_${session.user.id}`,
        cacheKey: `user_polls_${session.user.id}`,
        cacheTtl: 30000, // 30 seconds
        retries: 2,
      },
    )

    // Get all votes for these polls
    const pollIds = polls.map((poll) => poll.id)

    let votes = []
    if (pollIds.length > 0) {
      try {
        const votesData = await withRetry(
          async () => {
            const { data, error } = await supabase.from("votes").select("*").in("poll_id", pollIds)

            if (error) {
              console.error("Error fetching votes:", error)
              throw error
            }

            return data || []
          },
          {
            key: `getUserVotes_${session.user.id}`,
            cacheKey: `user_votes_${session.user.id}`,
            cacheTtl: 30000, // 30 seconds
            retries: 2,
          },
        )

        votes = votesData
      } catch (error) {
        console.error("Error fetching votes:", error)
        // Continue without votes
      }
    }

    // Try to get creator profile, but handle errors gracefully
    let creatorName = null
    let creatorAvatar = null

    try {
      // Check if we're under rate limit before fetching creator
      if (checkRateLimit(`getCreator_${session.user.id}`, 3, 10000)) {
        const { data: creator, error: creatorError } = await supabase
          .from("profiles")
          .select("name, avatar_url")
          .eq("id", session.user.id)
          .single()

        if (!creatorError && creator) {
          creatorName = creator.name
          creatorAvatar = creator.avatar_url
        }
      } else {
        // Use user email as fallback
        creatorName = session.user.email?.split("@")[0] || "User"
      }
    } catch (creatorError) {
      console.error("Error fetching creator:", creatorError)
      // Continue without creator info
      creatorName = session.user.email?.split("@")[0] || "User"
    }

    // Convert polls to frontend format
    return polls.map((poll) => {
      const pollVotes = votes.filter((vote) => vote.poll_id === poll.id)
      return convertPollToFrontend(poll, pollVotes, creatorName, creatorAvatar)
    })
  } catch (error) {
    console.error("Error in getUserPolls:", error)
    return [] // Return empty array on error
  }
}

export async function searchPolls(query: string) {
  const supabase = createServerSupabaseClient()

  try {
    // Search polls by title, description, or question with retry and caching
    const polls = await withRetry(
      async () => {
        const { data, error } = await supabase
          .from("polls")
          .select("*")
          .or(`title.ilike.%${query}%,description.ilike.%${query}%,question.ilike.%${query}%`)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error searching polls:", error)
          throw new Error("Failed to search polls")
        }

        return data
      },
      {
        key: `searchPolls_${query}`,
        cacheKey: `search_${query}`,
        cacheTtl: 60000, // 1 minute
        retries: 2,
      },
    )

    // Get all votes with retry and caching
    const votes = await withRetry(
      async () => {
        const { data, error } = await supabase.from("votes").select("*")

        if (error) {
          console.error("Error fetching votes:", error)
          throw new Error("Failed to fetch votes")
        }

        return data || []
      },
      {
        key: "getAllVotes",
        cacheKey: "all_votes",
        cacheTtl: 30000, // 30 seconds
        retries: 2,
      },
    )

    // Get creator profiles - only if we have a reasonable number of creators
    const creatorIds = [...new Set(polls.map((poll) => poll.created_by))]

    let creators = []
    if (creatorIds.length > 0 && creatorIds.length <= 10) {
      try {
        // Check if we're under rate limit before fetching creators
        if (checkRateLimit("getCreators", 3, 10000)) {
          const { data: creatorsData, error: creatorsError } = await supabase
            .from("profiles")
            .select("id, name, avatar_url")
            .in("id", creatorIds)

          if (!creatorsError) {
            creators = creatorsData || []
          }
        }
      } catch (error) {
        console.error("Error fetching creators:", error)
        // Continue without creator info
      }
    }

    // Convert polls to frontend format
    return polls.map((poll) => {
      const pollVotes = votes.filter((vote) => vote.poll_id === poll.id)
      const creator = creators.find((c) => c?.id === poll.created_by)
      return convertPollToFrontend(poll, pollVotes, creator?.name, creator?.avatar_url)
    })
  } catch (error) {
    console.error("Error in searchPolls:", error)
    return [] // Return empty array on error
  }
}

export async function searchUsers(query: string) {
  const supabase = createServerSupabaseClient()
  const cookieStore = cookies()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error("Not authenticated")
  }

  try {
    // Search users by name, username, or email
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, username, email, avatar_url")
      .or(`name.ilike.%${query}%,username.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(10)

    if (error) {
      console.error("Error searching users:", error)
      throw new Error("Failed to search users")
    }

    return data || []
  } catch (error) {
    console.error("Error in searchUsers:", error)
    return []
  }
}

export async function addUserToPoll(pollId: string, userId: string) {
  const supabase = createServerSupabaseClient()
  const cookieStore = cookies()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error("Not authenticated")
  }

  try {
    // Get poll to check if user is the creator
    const { data: poll, error: pollError } = await supabase.from("polls").select("created_by").eq("id", pollId).single()

    if (pollError || !poll) {
      throw new Error("Poll not found")
    }

    if (poll.created_by !== session.user.id) {
      throw new Error("Not authorized to manage this poll")
    }

    // Add user to poll_access
    const { data, error } = await supabase
      .from("poll_access")
      .insert({
        poll_id: pollId,
        user_id: userId,
      })
      .select()

    if (error) {
      if (error.code === "23505") {
        // Unique violation
        return { success: true, message: "User already has access to this poll" }
      }
      throw new Error(`Failed to add user to poll: ${error.message}`)
    }

    return { success: true, data }
  } catch (error) {
    console.error("Error in addUserToPoll:", error)
    throw error
  }
}

export async function removeUserFromPoll(pollId: string, userId: string) {
  const supabase = createServerSupabaseClient()
  const cookieStore = cookies()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error("Not authenticated")
  }

  try {
    // Get poll to check if user is the creator
    const { data: poll, error: pollError } = await supabase.from("polls").select("created_by").eq("id", pollId).single()

    if (pollError || !poll) {
      throw new Error("Poll not found")
    }

    if (poll.created_by !== session.user.id) {
      throw new Error("Not authorized to manage this poll")
    }

    // Remove user from poll_access
    const { data, error } = await supabase.from("poll_access").delete().eq("poll_id", pollId).eq("user_id", userId)

    if (error) {
      throw new Error(`Failed to remove user from poll: ${error.message}`)
    }

    return { success: true }
  } catch (error) {
    console.error("Error in removeUserFromPoll:", error)
    throw error
  }
}

export async function getPollAccessUsers(pollId: string) {
  const supabase = createServerSupabaseClient()
  const cookieStore = cookies()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error("Not authenticated")
  }

  try {
    // Get poll to check if user is the creator
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("created_by, is_private")
      .eq("id", pollId)
      .single()

    if (pollError || !poll) {
      throw new Error("Poll not found")
    }

    if (poll.created_by !== session.user.id) {
      throw new Error("Not authorized to view this poll's access list")
    }

    if (!poll.is_private) {
      return []
    }

    // Get users with access to this poll
    const { data, error } = await supabase.from("poll_access").select("user_id").eq("poll_id", pollId)

    if (error) {
      throw new Error(`Failed to get poll access users: ${error.message}`)
    }

    if (!data || data.length === 0) {
      return []
    }

    const userIds = data.map((access) => access.user_id)

    // Get user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, name, username, email, avatar_url")
      .in("id", userIds)

    if (profilesError) {
      throw new Error(`Failed to get user profiles: ${profilesError.message}`)
    }

    return profiles || []
  } catch (error) {
    console.error("Error in getPollAccessUsers:", error)
    return []
  }
}

export async function checkPollAccess(pollId: string) {
  const supabase = createServerSupabaseClient()
  const cookieStore = cookies()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { hasAccess: false, isCreator: false, isPrivate: false }
  }

  try {
    // Get poll to check privacy and creator
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("created_by, is_private")
      .eq("id", pollId)
      .single()

    if (pollError || !poll) {
      throw new Error("Poll not found")
    }

    const isCreator = poll.created_by === session.user.id

    // If user is the creator or poll is public, they have access
    if (isCreator || !poll.is_private) {
      return { hasAccess: true, isCreator, isPrivate: poll.is_private }
    }

    // Check if user has been granted access
    const { data, error } = await supabase
      .from("poll_access")
      .select("id")
      .eq("poll_id", pollId)
      .eq("user_id", session.user.id)
      .maybeSingle()

    if (error) {
      throw new Error(`Failed to check poll access: ${error.message}`)
    }

    return {
      hasAccess: !!data,
      isCreator: false,
      isPrivate: poll.is_private,
    }
  } catch (error) {
    console.error("Error in checkPollAccess:", error)
    return { hasAccess: false, isCreator: false, isPrivate: true }
  }
}

// Add this new function to fetch only public polls
export async function getPublicPolls() {
  const supabase = createServerSupabaseClient()

  try {
    // Get only public polls with retry
    const polls = await withRetry(
      async () => {
        const { data, error } = await supabase
          .from("polls")
          .select("*")
          .eq("is_private", false) // Only fetch public polls
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching public polls:", error)
          throw new Error("Failed to fetch polls")
        }

        return data
      },
      {
        key: "getPublicPolls",
        cacheKey: "public_polls",
        cacheTtl: 30000, // 30 seconds
        retries: 2,
      },
    )

    // Get all votes with retry
    const votes = await withRetry(
      async () => {
        const { data, error } = await supabase.from("votes").select("*")

        if (error) {
          console.error("Error fetching votes:", error)
          throw new Error("Failed to fetch votes")
        }

        return data
      },
      {
        key: "getAllVotes",
        cacheKey: "all_votes",
        cacheTtl: 30000, // 30 seconds
        retries: 2,
      },
    )

    // Get creator profiles - only if we have a reasonable number of creators
    const creatorIds = [...new Set(polls.map((poll) => poll.created_by))]

    let creators = []
    if (creatorIds.length > 0 && creatorIds.length <= 10) {
      try {
        const { data: creatorsData, error: creatorsError } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", creatorIds)

        if (!creatorsError) {
          creators = creatorsData || []
        }
      } catch (error) {
        console.error("Error fetching creators:", error)
        // Continue without creator info
      }
    }

    // Convert polls to frontend format
    return polls.map((poll) => {
      const pollVotes = votes.filter((vote) => vote.poll_id === poll.id)
      const creator = creators.find((c) => c?.id === poll.created_by)
      return convertPollToFrontend(poll, pollVotes, creator?.name, creator?.avatar_url)
    })
  } catch (error) {
    console.error("Error in getPublicPolls:", error)
    return [] // Return empty array on error
  }
}
