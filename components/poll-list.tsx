"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, ArrowRight } from "lucide-react"
import { getAllPolls } from "@/lib/actions"
import type { PollWithVotes } from "@/lib/types"
import { CountdownTimer } from "@/components/countdown-timer"
import Image from "next/image"
import { motion } from "framer-motion"

export function PollList() {
  const [polls, setPolls] = useState<PollWithVotes[]>([])
  const [loading, setLoading] = useState(true)
  // Use a ref to track if we're currently fetching
  const isFetchingRef = useRef(false)
  // Use a ref to track the last successful polls data
  const lastPollsDataRef = useRef<PollWithVotes[]>([])
  // Use a ref to track if the component is mounted
  const isMountedRef = useRef(true)

  // Use useCallback to memoize the fetchPolls function
  const fetchPolls = useCallback(async () => {
    // If we're already fetching, don't start another fetch
    if (isFetchingRef.current) return

    isFetchingRef.current = true

    try {
      const pollsData = await getAllPolls()

      if (isMountedRef.current) {
        if (Array.isArray(pollsData)) {
          setPolls(pollsData)
          lastPollsDataRef.current = pollsData
          setLoading(false)
        } else if (lastPollsDataRef.current.length > 0) {
          // If we got invalid data but have previous data, keep using the previous data
          console.log("Using cached polls data due to invalid response")
        }
      }
    } catch (error) {
      console.error("Failed to fetch polls:", error)
      if (isMountedRef.current && lastPollsDataRef.current.length === 0) {
        setLoading(false)
      }
    } finally {
      isFetchingRef.current = false
    }
  }, [])

  // Create a stable callback for the timer completion
  const handleTimerComplete = useCallback(() => {
    if (!isFetchingRef.current) {
      fetchPolls()
    }
  }, [fetchPolls])

  useEffect(() => {
    // Set mounted ref to true
    isMountedRef.current = true

    // Initial fetch
    fetchPolls()

    // Set up a refresh interval (every 30 seconds)
    const interval = setInterval(() => {
      if (!isFetchingRef.current) {
        fetchPolls()
      }
    }, 30000)

    // Cleanup function
    return () => {
      isMountedRef.current = false
      clearInterval(interval)
    }
  }, [fetchPolls]) // Only depend on the stable fetchPolls function

  // Use the polls data or the cached data
  const displayPolls = polls.length > 0 ? polls : lastPollsDataRef.current

  if (loading && displayPolls.length === 0) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="flex flex-col border-2 animate-pulse">
            <div className="h-40 bg-gray-200 rounded-t-lg"></div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-200 rounded w-1/6"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mt-2"></div>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex gap-2">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (displayPolls.length === 0) {
    return (
      <div className="text-center py-12 bg-gradient-to-r from-violet-50 to-pink-50 rounded-xl">
        <p className="text-muted-foreground mb-6 text-lg">No polls available. Create one to get started!</p>
        <Button
          asChild
          className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0 shadow-md"
        >
          <Link href="/create">Create a Poll</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {displayPolls.map((poll, index) => {
        const isPollActive = new Date(poll.endsAt) > new Date()

        return (
          <motion.div
            key={poll.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card className="flex flex-col enhanced-card overflow-hidden h-full">
              {poll.imageUrl && (
                <div className="relative w-full h-40 overflow-hidden">
                  <Image
                    src={poll.imageUrl || "/placeholder.svg"}
                    alt={poll.title}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    priority
                  />
                  {isPollActive && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0">Active</Badge>
                    </div>
                  )}
                </div>
              )}
              <CardHeader className={`pb-2 ${poll.imageUrl ? "pt-3" : ""}`}>
                <div className="flex justify-between items-start">
                  <CardTitle className="line-clamp-1 text-lg font-bold">{poll.title}</CardTitle>
                  <div className="flex gap-1">
                    {poll.isPrivate && <Badge className="bg-gray-200 text-gray-700 border-0">Private</Badge>}
                    {!poll.imageUrl && (
                      <Badge
                        variant={isPollActive ? "default" : "secondary"}
                        className={
                          isPollActive ? "bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0" : ""
                        }
                      >
                        {isPollActive ? "Active" : "Closed"}
                      </Badge>
                    )}
                  </div>
                </div>
                {poll.question && poll.question !== poll.title && (
                  <p className="line-clamp-1 mt-1 text-sm font-medium">{poll.question}</p>
                )}
                <CardDescription className="line-clamp-2 mt-1">
                  {poll.description || `Poll with ${poll.options.length} options`}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <div className="flex items-center bg-gradient-to-r from-violet-50 to-pink-50 px-3 py-1.5 rounded-full">
                    <CountdownTimer
                      endTime={new Date(poll.endsAt)}
                      onComplete={handleTimerComplete}
                      size="sm"
                      showDetails={false}
                    />
                  </div>
                  <div className="flex items-center bg-gradient-to-r from-violet-50 to-pink-50 px-3 py-1.5 rounded-full">
                    <Users className="mr-1.5 h-4 w-4 text-pink-500" />
                    {poll.votes.length} votes
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  asChild
                  className={`w-full ${
                    isPollActive
                      ? "bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0 shadow-md"
                      : "bg-gradient-to-r from-gray-200 to-gray-300 hover:from-gray-300 hover:to-gray-400 text-gray-700"
                  }`}
                >
                  <Link href={`/poll/${poll.id}`} className="flex items-center justify-center">
                    {isPollActive ? "Vote Now" : "View Results"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}
