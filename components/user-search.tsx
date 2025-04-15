"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Search, X, UserPlus, Check } from "lucide-react"
import { searchUsers } from "@/lib/actions"
import type { Profile } from "@/lib/database.types"

interface UserSearchProps {
  selectedUsers: Profile[]
  onUserSelect: (user: Profile) => void
  onUserRemove: (userId: string) => void
}

export function UserSearch({ selectedUsers, onUserSelect, onUserRemove }: UserSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<Profile[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.trim().length >= 2) {
        setIsSearching(true)
        try {
          const results = await searchUsers(searchTerm)
          // Filter out already selected users
          const filteredResults = results.filter(
            (user) => !selectedUsers.some((selectedUser) => selectedUser.id === user.id),
          )
          setSearchResults(filteredResults)
        } catch (error) {
          console.error("Error searching users:", error)
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
      }
    }, 500)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, selectedUsers])

  const handleUserSelect = (user: Profile) => {
    onUserSelect(user)
    setSearchTerm("")
    setSearchResults([])
  }

  const isUserSelected = (userId: string) => {
    return selectedUsers.some((user) => user.id === userId)
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Search users by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 border-2 focus-visible:ring-violet-500"
        />
        {searchTerm && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 text-muted-foreground"
            onClick={() => setSearchTerm("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Selected users */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedUsers.map((user) => (
            <Badge
              key={user.id}
              variant="secondary"
              className="flex items-center gap-1 px-2 py-1 bg-violet-100 text-violet-800 hover:bg-violet-200"
            >
              <span className="max-w-[150px] truncate">{user.name || user.username || user.email || "User"}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 text-violet-800 hover:bg-violet-200 rounded-full"
                onClick={() => onUserRemove(user.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search results */}
      {isSearching && <div className="text-sm text-muted-foreground">Searching...</div>}

      {searchResults.length > 0 && (
        <div className="border rounded-md overflow-hidden mt-2">
          <div className="max-h-60 overflow-y-auto">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-3 hover:bg-violet-50 cursor-pointer border-b last:border-b-0"
                onClick={() => handleUserSelect(user)}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar_url || ""} alt={user.name || "User"} />
                    <AvatarFallback className="bg-violet-200 text-violet-800">
                      {(user.name?.charAt(0) || user.username?.charAt(0) || "U").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{user.name || user.username || "User"}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-violet-600 hover:bg-violet-100"
                >
                  {isUserSelected(user.id) ? <Check className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {searchTerm.trim().length >= 2 && searchResults.length === 0 && !isSearching && (
        <div className="text-sm text-muted-foreground p-2">No users found matching "{searchTerm}"</div>
      )}
    </div>
  )
}
