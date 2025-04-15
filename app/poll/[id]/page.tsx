"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Users, Eye, EyeOff, AlertCircle, ArrowLeft, CheckCircle } from "lucide-react"
import { getPoll, votePoll, toggleVisibility, checkPollAccess } from "@/lib/actions"
import type { PollWithVotes } from "@/lib/types"
import { CountdownTimer } from "@/components/countdown-timer"
import { useAuth } from "@/context/auth-context"
import Image from "next/image"
import { SharePoll } from "@/components/share-poll"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { motion, AnimatePresence } from "framer-motion"
import { ManageAccess } from "@/components/manage-access"

export default function PollPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user, profile, isLoading: authLoading } = useAuth()
  const [poll, setPoll] = useState<PollWithVotes | null>(null)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [hasVoted, setHasVoted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [accessStatus, setAccessStatus] = useState<{
    hasAccess: boolean
    isCreator: boolean
    isPrivate: boolean
    isChecking: boolean
  }>({
    hasAccess: false,
    isCreator: false,
    isPrivate: false,
    isChecking: true,
  })

  // Use a ref to track if we're currently fetching to prevent multiple simultaneous requests
  const isFetchingRef = useRef(false)
  // Use a ref to track the last successful poll data
  const lastPollDataRef = useRef<PollWithVotes | null>(null)

  const fetchPoll = useCallback(async () => {
    // If we're already fetching, don't start another fetch
    if (isFetchingRef.current) return

    isFetchingRef.current = true
    setLoading(true)

    try {
      const pollData = await getPoll(params.id)

      // Only update state if we got valid data
      if (pollData && pollData.id) {
        setPoll(pollData)
        lastPollDataRef.current = pollData

        // Check if user has already voted
        if (user && pollData.votes.some((vote) => vote.userId === user.id)) {
          setHasVoted(true)
        }
        setError(null)
      } else if (lastPollDataRef.current) {
        // If we got invalid data but have previous data, keep using the previous data
        console.log("Using cached poll data due to invalid response")
      }
    } catch (error: any) {
      console.error("Failed to fetch poll:", error)

      // Only show error if we don't have any previous data
      if (!lastPollDataRef.current) {
        setError(error.message || "Poll not found or has been removed")
      }
    } finally {
      setLoading(false)
      isFetchingRef.current = false
    }
  }, [params.id, user])

  const checkAccess = useCallback(async () => {
    if (!user) return

    try {
      const status = await checkPollAccess(params.id)
      setAccessStatus({
        ...status,
        isChecking: false,
      })
    } catch (error) {
      console.error("Failed to check poll access:", error)
      setAccessStatus({
        hasAccess: false,
        isCreator: false,
        isPrivate: true,
        isChecking: false,
      })
    }
  }, [params.id, user])

  // Create a stable callback for the timer completion
  const handleTimerComplete = useCallback(() => {
    fetchPoll()
  }, [fetchPoll])

  useEffect(() => {
    if (!authLoading) {
      fetchPoll()
      checkAccess()
    }

    // Set up a polling interval to refresh data (every 30 seconds)
    const intervalId = setInterval(() => {
      if (!isFetchingRef.current) {
        fetchPoll()
      }
    }, 30000)

    return () => {
      clearInterval(intervalId)
    }
  }, [fetchPoll, authLoading, checkAccess])

  const handleVote = async () => {
    if (!poll || !selectedOption || !user) {
      if (!user) {
        router.push("/login?redirect=/poll/" + params.id)
      }
      return
    }

    setIsSubmitting(true)

    try {
      const updatedPoll = await votePoll(poll.id, selectedOption)
      setPoll(updatedPoll)
      lastPollDataRef.current = updatedPoll
      setHasVoted(true)
      setError(null)
      setShowSuccessMessage(true)

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccessMessage(false)
      }, 3000)
    } catch (error: any) {
      console.error("Failed to submit vote:", error)
      setError(error.message || "Failed to submit vote")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleVisibility = async () => {
    if (!poll || !user) return

    try {
      const updatedPoll = await toggleVisibility(poll.id)
      setPoll(updatedPoll)
      lastPollDataRef.current = updatedPoll
      setError(null)
    } catch (error: any) {
      console.error("Failed to toggle visibility:", error)
      setError(error.message || "Failed to toggle visibility")
    }
  }

  // Use the poll data or the cached data
  const displayPoll = poll || lastPollDataRef.current

  const isPollActive = displayPoll && new Date(displayPoll.endsAt) > new Date()
  const isAdmin = displayPoll?.createdBy === user?.id
  const showResults = displayPoll && (!displayPoll.secretVoting || !isPollActive || hasVoted || isAdmin)

  const getTotalVotes = () => {
    if (!displayPoll) return 0
    return displayPoll.votes.length
  }

  const getOptionVotes = (optionIndex: number) => {
    if (!displayPoll) return 0
    return displayPoll.votes.filter((vote) => vote.optionIndex === optionIndex).length
  }

  const getVotePercentage = (optionIndex: number) => {
    const totalVotes = getTotalVotes()
    if (totalVotes === 0) return 0
    return (getOptionVotes(optionIndex) / totalVotes) * 100
  }

  // Show a loading skeleton while initial data is loading
  if ((authLoading || loading) && !displayPoll) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card className="border-2 shadow-lg animate-pulse">
          <CardHeader>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="h-10 bg-gray-200 rounded w-full"></div>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!accessStatus.isChecking && !accessStatus.hasAccess && displayPoll) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Card className="enhanced-card overflow-hidden">
          <CardHeader>
            <CardTitle className="text-2xl text-red-600">Access Denied</CardTitle>
            <CardDescription>This is a private poll. You don't have permission to view it.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              This poll is set to private by its creator. Only specific users can view and vote on it.
            </p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => router.push("/")} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (error && !displayPoll) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <div className="text-center">
          <Button onClick={() => router.push("/")} className="mr-4">
            Back to Home
          </Button>
          <Button onClick={() => fetchPoll()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  if (!displayPoll) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4 text-center">
        <p>Poll not found or has been removed.</p>
        <Button onClick={() => router.push("/")} className="mt-4">
          Back to Home
        </Button>
      </div>
    )
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4"
          >
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription>Your vote has been submitted successfully!</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="enhanced-card overflow-hidden">
          {displayPoll.imageUrl && (
            <div className="relative w-full h-64 overflow-hidden">
              <Image
                src={displayPoll.imageUrl || "/placeholder.svg"}
                alt={displayPoll.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              <div className="absolute bottom-4 left-4 right-4">
                <Badge
                  variant={isPollActive ? "default" : "secondary"}
                  className={`text-sm px-3 py-1 ${
                    isPollActive ? "bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0" : ""
                  }`}
                >
                  {isPollActive ? "Active" : "Closed"}
                </Badge>
              </div>
            </div>
          )}

          <CardHeader className={displayPoll.imageUrl ? "pt-5" : ""}>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl gradient-text">{displayPoll.title}</CardTitle>
                {displayPoll.question && displayPoll.question !== displayPoll.title && (
                  <p className="mt-2 text-lg">{displayPoll.question}</p>
                )}
                {displayPoll.description && (
                  <CardDescription className="mt-3 text-base">{displayPoll.description}</CardDescription>
                )}
              </div>
              {!displayPoll.imageUrl && (
                <Badge
                  variant={isPollActive ? "default" : "secondary"}
                  className={`text-sm px-3 py-1 ${
                    isPollActive ? "bg-gradient-to-r from-violet-600 to-pink-600 text-white border-0" : ""
                  }`}
                >
                  {isPollActive ? "Active" : "Closed"}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap gap-3 text-sm mt-6">
              <div className="flex items-center bg-gradient-to-r from-violet-50 to-pink-50 px-3 py-1.5 rounded-full">
                <CountdownTimer endTime={new Date(displayPoll.endsAt)} onComplete={handleTimerComplete} size="sm" />
              </div>
              <div className="flex items-center bg-gradient-to-r from-violet-50 to-pink-50 px-3 py-1.5 rounded-full">
                <Users className="mr-1.5 h-4 w-4 text-pink-500" />
                {getTotalVotes()} votes
              </div>
              {accessStatus.isPrivate && (
                <div className="flex items-center bg-gray-100 px-3 py-1.5 rounded-full">
                  <Eye className="mr-1.5 h-4 w-4 text-gray-600" />
                  Private Poll
                </div>
              )}
              {isAdmin && isPollActive && (
                <div className="flex items-center ml-auto bg-gradient-to-r from-violet-50 to-pink-50 px-3 py-1.5 rounded-full">
                  <span className="mr-2 text-sm">Show results</span>
                  <Switch
                    checked={!displayPoll.secretVoting}
                    onCheckedChange={handleToggleVisibility}
                    aria-label="Toggle results visibility"
                    className="data-[state=checked]:bg-violet-600"
                  />
                  {displayPoll.secretVoting ? (
                    <EyeOff className="ml-1.5 h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="ml-1.5 h-4 w-4 text-violet-600" />
                  )}
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent>
            {isPollActive && !hasVoted ? (
              <RadioGroup value={selectedOption || ""} onValueChange={setSelectedOption} className="space-y-3">
                {displayPoll.options && displayPoll.options.length > 0 ? (
                  displayPoll.options.map((option, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className={`flex items-center space-x-2 p-4 border-2 rounded-lg transition-all duration-200 ${
                        selectedOption === index.toString()
                          ? "option-selected border-violet-500 bg-violet-50"
                          : "hover:border-violet-300/50 hover:bg-violet-50/50"
                      }`}
                      onClick={() => setSelectedOption(index.toString())}
                    >
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} className="text-violet-600" />
                      <Label htmlFor={`option-${index}`} className="flex-grow text-base cursor-pointer">
                        {option.text}
                      </Label>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">No options available for this poll.</div>
                )}
              </RadioGroup>
            ) : (
              <div className="space-y-5 mt-2">
                {displayPoll.options && displayPoll.options.length > 0 ? (
                  displayPoll.options.map((option, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{option.text}</span>
                        {showResults && (
                          <span className="text-sm font-medium">
                            {getOptionVotes(index)} votes ({getVotePercentage(index).toFixed(1)}%)
                          </span>
                        )}
                      </div>
                      {showResults ? (
                        <div className="relative h-3 w-full overflow-hidden rounded-full bg-gray-100">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${getVotePercentage(index)}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-violet-500 to-pink-500"
                          />
                        </div>
                      ) : (
                        <div className="h-3 bg-muted rounded-full" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-muted-foreground">No options available for this poll.</div>
                )}

                {!showResults && displayPoll.options && displayPoll.options.length > 0 && (
                  <div className="text-center text-muted-foreground mt-8 p-4 bg-gradient-to-r from-violet-50 to-pink-50 rounded-lg">
                    Results will be visible when the poll ends
                  </div>
                )}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="border-2 border-gray-200 hover:bg-gray-50"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Polls
              </Button>
              <SharePoll pollId={displayPoll.id} pollTitle={displayPoll.title} />
              {accessStatus.isCreator && accessStatus.isPrivate && <ManageAccess pollId={displayPoll.id} />}
            </div>

            {isPollActive && !hasVoted && displayPoll.options && displayPoll.options.length > 0 && (
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={handleVote}
                  disabled={!selectedOption || isSubmitting || !user}
                  className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0 shadow-md"
                >
                  {!user ? "Login to Vote" : isSubmitting ? "Submitting..." : "Submit Vote"}
                </Button>
              </motion.div>
            )}

            {hasVoted && (
              <Badge
                variant="outline"
                className="ml-auto border-2 border-violet-500 text-violet-600 px-3 py-1.5 flex items-center"
              >
                <CheckCircle className="mr-1.5 h-4 w-4" />
                You voted
              </Badge>
            )}
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  )
}
