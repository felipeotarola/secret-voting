"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AlertCircle, CheckCircle, User } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/context/auth-context"
import { ImageUpload } from "@/components/image-upload"
import { toast } from "@/components/ui/use-toast"

export default function SettingsPage() {
  const { profile, updateProfile, isLoading: authLoading } = useAuth()
  const router = useRouter()

  const [formData, setFormData] = useState({
    username: "",
    avatar_url: "",
  })

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || "",
        avatar_url: profile.avatar_url || "",
      })
    }
  }, [profile])

  if (authLoading) {
    return (
      <div className="container max-w-2xl mx-auto py-8 px-4 text-center">
        <p>Loading settings...</p>
      </div>
    )
  }

  if (!profile) {
    router.push("/login?redirect=/settings")
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageUploaded = (url: string) => {
    setFormData((prev) => ({ ...prev, avatar_url: url }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      // Validate username
      if (formData.username.trim() === "") {
        setError("Username cannot be empty")
        setIsLoading(false)
        return
      }

      const { error, success } = await updateProfile({
        username: formData.username,
        avatar_url: formData.avatar_url,
      })

      if (error) {
        setError(error.message)
        return
      }

      if (success) {
        setSuccess(true)
        toast({
          title: "Settings updated",
          description: "Your profile has been updated successfully",
          variant: "success",
        })
        setTimeout(() => {
          setSuccess(false)
        }, 3000)
      }
    } catch (err) {
      setError("An unexpected error occurred")
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Card className="border-2 shadow-lg">
        <CardHeader>
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-24 w-24 ring-4 ring-violet-100">
                <AvatarImage src={formData.avatar_url || ""} alt={profile.name || "User"} />
                <AvatarFallback className="text-3xl bg-gradient-to-br from-violet-600 to-pink-600 text-white">
                  {profile.name?.charAt(0) || profile.username?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-violet-100 rounded-full flex items-center justify-center">
                <User className="h-3 w-3 text-violet-600" />
              </div>
            </div>
            <div className="text-center">
              <CardTitle className="text-2xl gradient-text">Account Settings</CardTitle>
              <CardDescription className="text-base">Update your profile information</CardDescription>
            </div>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 text-green-800 border-green-200">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>Settings updated successfully!</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="username" className="text-base">
                Username
              </Label>
              <Input
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="border-2 focus-visible:ring-violet-500"
                placeholder="Enter your username"
              />
              <p className="text-xs text-muted-foreground">
                This is your public username that will be displayed on polls you create
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-base">Profile Picture</Label>
              <div className="mt-2">
                <ImageUpload
                  onImageUploaded={handleImageUploaded}
                  onError={(error) => setError(error)}
                  initialImage={profile.avatar_url || ""}
                />
              </div>
              <p className="text-xs text-muted-foreground">Upload a profile picture to personalize your account</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="border-2"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="gradient-bg text-white border-0 hover:opacity-90 shadow-vibrant"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
