"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Plus, Clock, AlertCircle } from "lucide-react"
import { getUserPolls } from "@/lib/actions"
import type { PollWithVotes } from "@/lib/types"
import { CountdownTimer } from "@/components/countdown-timer"
import { useAuth } from "@/context/auth-context"
import Image from "next/image"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function MyPollsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [polls, setPolls] = useState<PollWithVotes[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Use a ref to track if we're currently fetching
  const isFetchingRef = useRef(false)
  // Use a ref to track the last successful polls data
  const lastPollsDataRef = useRef<PollWithVotes[]>([])

  const fetchUserPolls = useCallback(async () => {
    // If we're already fetching, don't start another fetch
    if (isFetchingRef.current) return

    isFetchingRef.current = true
    setLoading(true)

    try {
      const userPolls = await getUserPolls()

      // Only update state if we got valid data
      if (Array.isArray(userPolls)) {
        setPolls(userPolls)
        lastPollsDataRef.current = userPolls
        setError(null)
      } else if (lastPollsDataRef.current.length > 0) {
        // If we got invalid data but have previous data, keep using the previous data
        console.log("Using cached polls data due to invalid response")
      }
    } catch (error: any) {
      console.error("Failed to fetch user polls:", error)

      // Only show error if we don't have any previous data
      if (lastPollsDataRef.current.length === 0) {
        setError(error.message || "Failed to fetch your polls")
      }
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [])

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push("/login?redirect=/my-polls")
      return
    }

    if (!authLoading && user) {
      fetchUserPolls()
    }

    // Set up a polling interval to refresh data (every 30 seconds)
    const intervalId = setInterval(() => {
      if (!isFetchingRef.current && user) {
        fetchUserPolls()
      }
    }, 30000)

    return () => {
      clearInterval(intervalId)
    }
  }, [user, authLoading, router, fetchUserPolls])

  // Use the polls data or the cached data
  const displayPolls = polls.length > 0 ? polls : lastPollsDataRef.current

  // Show a loading skeleton while initial data is loading
  if ((authLoading || loading) && displayPolls.length === 0) {
    return (
      <div className="container max-w-4xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-8">
          <div className="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-1/4 animate-pulse"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="border-2 shadow-lg animate-pulse">
              <div className="h-40 bg-gray-200 rounded-t-lg"></div>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
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
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold gradient-text">My Polls</h1>
        <Button asChild className="gradient-bg text-white border-0 hover:opacity-90 shadow-vibrant">
          <Link href="/create">
            <Plus className="mr-2 h-4 w-4" />
            Create New Poll
          </Link>
        </Button>
      </div>

      {error && displayPolls.length === 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {displayPolls.length === 0 ? (
        <div className="text-center py-12 bg-secondary/50 rounded-xl">
          <p className="text-muted-foreground mb-6 text-lg">You haven't created any polls yet.</p>
          <Button asChild className="gradient-bg text-white border-0 hover:opacity-90 shadow-vibrant">
            <Link href="/create">Create Your First Poll</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {displayPolls.map((poll) => {
            const isPollActive = new Date(poll.endsAt) > new Date()
            const totalVotes = poll.votes.length

            return (
              <Card key={poll.id} className="flex flex-col card-hover border-2">
                {poll.imageUrl && (
                  <div className="relative w-full h-40 overflow-hidden rounded-t-lg">
                    <Image
                      src={poll.imageUrl || "/placeholder.svg"}
                      alt={poll.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                )}
                <CardHeader className={`pb-2 ${poll.imageUrl ? "pt-3" : ""}`}>
                  <div className="flex justify-between items-start">
                    <CardTitle className="line-clamp-1">{poll.title}</CardTitle>
                    <Badge
                      variant={isPollActive ? "default" : "secondary"}
                      className={isPollActive ? "bg-vibrant-purple text-white" : ""}
                    >
                      {isPollActive ? "Active" : "Closed"}
                    </Badge>
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
                    <div className="flex items-center bg-secondary/50 px-3 py-1.5 rounded-full">
                      <Clock className="mr-1.5 h-4 w-4 text-vibrant-purple" />
                      {isPollActive ? (
                        <CountdownTimer
                          endTime={new Date(poll.endsAt)}
                          onComplete={fetchUserPolls}
                          size="sm"
                          showDetails={false}
                        />
                      ) : (
                        <span>Ended</span>
                      )}
                    </div>
                    <div className="flex items-center bg-secondary/50 px-3 py-1.5 rounded-full">
                      <Users className="mr-1.5 h-4 w-4 text-vibrant-pink" />
                      {totalVotes} {totalVotes === 1 ? "vote" : "votes"}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button asChild variant="outline" className="flex-1 border-2">
                    <Link href={`/poll/${poll.id}`}>View Results</Link>
                  </Button>
                  {isPollActive && (
                    <Button asChild className="flex-1 gradient-bg text-white border-0 hover:opacity-90 shadow-vibrant">
                      <Link href={`/poll/${poll.id}`}>Vote Now</Link>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
