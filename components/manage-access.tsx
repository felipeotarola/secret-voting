"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { UserSearch } from "@/components/user-search"
import { Badge } from "@/components/ui/badge"
import { Users, X } from "lucide-react"
import { getPollAccessUsers, addUserToPoll, removeUserFromPoll } from "@/lib/actions"
import type { Profile } from "@/lib/database.types"
import { toast } from "@/components/ui/use-toast"

interface ManageAccessProps {
  pollId: string
}

export function ManageAccess({ pollId }: ManageAccessProps) {
  const [open, setOpen] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<Profile[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadAccessUsers()
    }
  }, [open])

  const loadAccessUsers = async () => {
    setIsLoading(true)
    try {
      const users = await getPollAccessUsers(pollId)
      setSelectedUsers(users)
    } catch (error) {
      console.error("Failed to load access users:", error)
      toast({
        title: "Error",
        description: "Failed to load users with access",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserSelect = async (user: Profile) => {
    try {
      await addUserToPoll(pollId, user.id)
      setSelectedUsers((prev) => [...prev, user])
      toast({
        title: "User added",
        description: `${user.name || user.username || user.email} now has access to this poll`,
      })
    } catch (error) {
      console.error("Failed to add user:", error)
      toast({
        title: "Error",
        description: "Failed to add user to poll",
        variant: "destructive",
      })
    }
  }

  const handleUserRemove = async (userId: string) => {
    try {
      await removeUserFromPoll(pollId, userId)
      setSelectedUsers((prev) => prev.filter((user) => user.id !== userId))
      toast({
        title: "User removed",
        description: "User's access to this poll has been revoked",
      })
    } catch (error) {
      console.error("Failed to remove user:", error)
      toast({
        title: "Error",
        description: "Failed to remove user from poll",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Manage Access
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Poll Access</DialogTitle>
          <DialogDescription>Add or remove users who can access this private poll.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-4 text-center">Loading users...</div>
        ) : (
          <>
            <div className="mt-4">
              <UserSearch
                selectedUsers={selectedUsers}
                onUserSelect={handleUserSelect}
                onUserRemove={handleUserRemove}
              />
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Users with access ({selectedUsers.length})</h4>
              {selectedUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No users have been added yet. Only you can access this poll.
                </p>
              ) : (
                <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map((user) => (
                      <Badge
                        key={user.id}
                        variant="secondary"
                        className="flex items-center gap-1 px-2 py-1 bg-violet-100 text-violet-800"
                      >
                        <span className="max-w-[150px] truncate">
                          {user.name || user.username || user.email || "User"}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0 text-violet-800 hover:bg-violet-200 rounded-full"
                          onClick={() => handleUserRemove(user.id)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
