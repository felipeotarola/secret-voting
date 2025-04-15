"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Trash, Plus, AlertCircle } from "lucide-react"
import { createPoll } from "@/lib/actions"
import { useAuth } from "@/context/auth-context"
import { ImageUpload } from "@/components/image-upload"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserSearch } from "@/components/user-search"
import type { Profile } from "@/lib/database.types"
import { addUserToPoll } from "@/lib/actions"

export default function CreatePoll() {
  const router = useRouter()
  const { user, profile, isLoading: authLoading } = useAuth()
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [options, setOptions] = useState(["", ""])
  const [duration, setDuration] = useState(60) // Default 60 minutes
  const [secretVoting, setSecretVoting] = useState(true)
  const [imageUrl, setImageUrl] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [question, setQuestion] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<Profile[]>([])

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !user) {
      router.push("/login?redirect=/create")
    }
  }, [user, authLoading, router])

  if (authLoading) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4 text-center">
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in useEffect
  }

  const addOption = () => {
    setOptions([...options, ""])
  }

  const removeOption = (index: number) => {
    if (options.length <= 2) return
    setOptions(options.filter((_, i) => i !== index))
  }

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const handleImageUploaded = (url: string) => {
    setImageUrl(url)
  }

  const handleImageError = (errorMessage: string) => {
    setError(errorMessage)
    // Clear error after 5 seconds
    setTimeout(() => setError(null), 5000)
  }

  const handleUserSelect = (user: Profile) => {
    setSelectedUsers((prev) => [...prev, user])
  }

  const handleUserRemove = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((user) => user.id !== userId))
  }

  const saveSelectedUsers = async (pollId: string) => {
    if (!isPrivate || selectedUsers.length === 0) return

    try {
      // Add each selected user to the poll access
      for (const user of selectedUsers) {
        await addUserToPoll(pollId, user.id)
      }
    } catch (error) {
      console.error("Failed to add users to poll:", error)
      // Continue anyway, the poll is created
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (title.trim() === "" || question.trim() === "" || options.some((opt) => opt.trim() === "")) {
      setError("Please fill in the title, question, and all options")
      setTimeout(() => setError(null), 5000)
      return
    }

    setIsSubmitting(true)

    try {
      const filteredOptions = options.filter((opt) => opt.trim() !== "")
      const pollData = {
        title,
        question,
        description,
        options: filteredOptions.map((text) => ({ text })),
        endsAt: new Date(Date.now() + duration * 60 * 1000).toISOString(),
        secretVoting,
        isPrivate,
        imageUrl: imageUrl || undefined,
        creatorName: profile?.name || "",
        creatorAvatar: profile?.avatar_url || "",
      }

      const newPoll = await createPoll(pollData)

      // If the poll is private, save the selected users
      if (isPrivate) {
        await saveSelectedUsers(newPoll.id)
      }

      router.push(`/poll/${newPoll.id}`)
    } catch (error: any) {
      console.error("Failed to create poll:", error)
      setError(error.message || "Failed to create poll")
      setTimeout(() => setError(null), 5000)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl gradient-text">Create a New Poll</CardTitle>
          <CardDescription className="text-lg mt-2">
            Set up your poll, add options, and define how long it should be open for voting.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title" className="text-base">
                Poll Title
              </Label>
              <Input
                id="title"
                placeholder="What would you like to ask?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="border-2 focus-visible:ring-vibrant-purple"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="question" className="text-base">
                Poll Question
              </Label>
              <Input
                id="question"
                placeholder="What do you want to ask?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
                className="border-2 focus-visible:ring-vibrant-purple"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-base">
                Description (Optional)
              </Label>
              <Textarea
                id="description"
                placeholder="Add more context to your question"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border-2 focus-visible:ring-vibrant-purple"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base">Poll Image (Optional)</Label>
              <ImageUpload onImageUploaded={handleImageUploaded} onError={handleImageError} className="mt-2" />
            </div>

            <div className="space-y-4">
              <Label className="text-base">Options</Label>
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    required
                    className="border-2 focus-visible:ring-vibrant-purple"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(index)}
                    disabled={options.length <= 2}
                    className="text-vibrant-purple hover:text-vibrant-pink hover:bg-secondary/50"
                  >
                    <Trash className="h-5 w-5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="w-full border-2 border-dashed border-vibrant-purple/50 text-vibrant-purple hover:bg-vibrant-purple/10"
                onClick={addOption}
              >
                <Plus className="h-5 w-5 mr-2" /> Add Option
              </Button>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label htmlFor="duration" className="text-base">
                  Poll Duration
                </Label>
                <span className="text-sm text-muted-foreground">
                  Ends: {new Date(Date.now() + duration * 60 * 1000).toLocaleString()}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-3">
                {[1, 5, 15, 30, 60, 120].map((mins) => (
                  <Button
                    key={mins}
                    type="button"
                    variant={duration === mins ? "default" : "outline"}
                    className={`${
                      duration === mins
                        ? "bg-vibrant-purple hover:bg-vibrant-purple/90 text-white"
                        : "hover:bg-secondary/80"
                    }`}
                    onClick={() => setDuration(mins)}
                  >
                    {mins < 60 ? `${mins} min` : `${mins / 60} hr`}
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <Label htmlFor="custom-duration" className="whitespace-nowrap">
                  Custom:
                </Label>
                <div className="flex-1 flex items-center">
                  <Input
                    id="custom-duration"
                    type="number"
                    min="1"
                    max="1440"
                    value={duration}
                    onChange={(e) => setDuration(Number.parseInt(e.target.value) || 1)}
                    className="border-2 focus-visible:ring-vibrant-purple"
                  />
                  <span className="ml-2 text-sm text-muted-foreground">minutes</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="secret-voting" className="text-base font-medium">
                  Secret Voting
                </Label>
                <p className="text-sm text-muted-foreground">Hide votes until the poll ends</p>
              </div>
              <Switch
                id="secret-voting"
                checked={secretVoting}
                onCheckedChange={setSecretVoting}
                className="data-[state=checked]:bg-vibrant-purple"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg mt-4">
              <div className="space-y-0.5">
                <Label htmlFor="private-poll" className="text-base font-medium">
                  Private Poll
                </Label>
                <p className="text-sm text-muted-foreground">Restrict access to specific users</p>
              </div>
              <Switch
                id="private-poll"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
                className="data-[state=checked]:bg-violet-600"
              />
            </div>

            {isPrivate && (
              <div className="mt-4 p-4 border-2 border-violet-100 rounded-lg bg-violet-50/50">
                <h3 className="text-base font-medium mb-3">Add Users with Access</h3>
                <UserSearch
                  selectedUsers={selectedUsers}
                  onUserSelect={handleUserSelect}
                  onUserRemove={handleUserRemove}
                />
                <p className="text-xs text-muted-foreground mt-3">
                  Only you and the users you add will be able to view and vote on this poll.
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full gradient-bg text-white border-0 hover:opacity-90 shadow-vibrant py-6 text-lg font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Poll"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
