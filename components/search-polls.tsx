"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Search, X } from "lucide-react"
import { searchPolls } from "@/lib/actions"
import type { PollWithVotes } from "@/lib/types"
import { CountdownTimer } from "@/components/countdown-timer"
import Image from "next/image"
import Link from "next/link"
import { useDebounce } from "@/hooks/use-debounce"

export function SearchPolls() {
  const [searchTerm, setSearchTerm] = useState("")
  const [polls, setPolls] = useState<PollWithVotes[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setPolls([])
      setSearched(false)
      return
    }

    setLoading(true)
    try {
      const results = await searchPolls(query)
      setPolls(results)
      setSearched(true)
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debouncedSearchTerm) {
      handleSearch(debouncedSearchTerm)
    } else {
      setPolls([])
      setSearched(false)
    }
  }, [debouncedSearchTerm, handleSearch])

  const clearSearch = () => {
    setSearchTerm("")
    setPolls([])
    setSearched(false)
  }

  return (
    <div className="w-full">
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Search polls by title or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-10 border-2 focus-visible:ring-vibrant-purple"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 text-muted-foreground"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {loading && <div className="text-center py-4">Searching...</div>}

      {searched && polls.length === 0 && !loading && (
        <div className="text-center py-8 bg-secondary/30 rounded-lg">
          <p className="text-muted-foreground">No polls found matching "{searchTerm}"</p>
        </div>
      )}

      {polls.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-4">Search Results</h3>
          <div className="grid gap-6 md:grid-cols-2">
            {polls.map((poll) => {
              const isPollActive = new Date(poll.endsAt) > new Date()

              return (
                <Card key={poll.id} className="flex flex-col card-hover border-2">
                  {poll.imageUrl && (
                    <div className="relative w-full h-40 overflow-hidden rounded-t-lg">
                      <Image src={poll.imageUrl || "/placeholder.svg"} alt={poll.title} fill className="object-cover" />
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
                        <CountdownTimer endTime={new Date(poll.endsAt)} size="sm" showDetails={false} />
                      </div>
                      <div className="flex items-center bg-secondary/50 px-3 py-1.5 rounded-full">
                        <Users className="mr-1.5 h-4 w-4 text-vibrant-pink" />
                        {poll.votes.length} votes
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      asChild
                      className={`w-full ${isPollActive ? "gradient-bg text-white border-0 hover:opacity-90 shadow-vibrant" : "bg-secondary hover:bg-secondary/80"}`}
                    >
                      <Link href={`/poll/${poll.id}`}>{isPollActive ? "Vote Now" : "View Results"}</Link>
                    </Button>
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
