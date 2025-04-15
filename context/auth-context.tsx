"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"
import type { Profile } from "@/lib/database.types"
import { withRetry, getCachedResponse } from "@/lib/request-utils"

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  isLoading: boolean
  signIn: (
    email: string,
    password: string,
  ) => Promise<{
    error: Error | null
    success: boolean
  }>
  signUp: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{
    error: Error | null
    success: boolean
  }>
  signOut: () => Promise<void>
  updateProfile: (profile: Partial<Profile>) => Promise<{
    error: Error | null
    success: boolean
  }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // Use a ref to track if we're currently fetching profile
  const isFetchingProfileRef = useRef(false)
  // Use a ref to track the last successful profile data
  const lastProfileDataRef = useRef<Profile | null>(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setIsLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setIsLoading(false)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId: string) => {
    // If we're already fetching, don't start another fetch
    if (isFetchingProfileRef.current) return

    isFetchingProfileRef.current = true

    try {
      // Check cache first
      const cacheKey = `profile_${userId}`
      const cachedProfile = getCachedResponse<Profile>(cacheKey)

      if (cachedProfile) {
        setProfile(cachedProfile)
        lastProfileDataRef.current = cachedProfile
        return
      }

      // Fetch with retry and caching
      const profile = await withRetry(
        async () => {
          const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

          if (error) {
            throw error
          }

          return data as Profile
        },
        {
          key: `fetchProfile_${userId}`,
          cacheKey,
          cacheTtl: 300000, // 5 minutes
          retries: 2,
        },
      )

      setProfile(profile)
      lastProfileDataRef.current = profile
    } catch (error) {
      console.error("Error fetching profile:", error)

      // If we have previous profile data, keep using it
      if (lastProfileDataRef.current) {
        console.log("Using cached profile data due to fetch error")
      } else {
        // Create a minimal profile to prevent UI issues
        const minimalProfile: Profile = {
          id: userId,
          username: user?.email?.split("@")[0] || null,
          name: user?.email?.split("@")[0] || null,
          email: user?.email || null,
          avatar_url: null,
          bio: null,
          status: null,
          last_logged_in: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          fcm_token: null,
        }

        setProfile(minimalProfile)
        lastProfileDataRef.current = minimalProfile
      }
    } finally {
      setIsLoading(false)
      isFetchingProfileRef.current = false
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error, success: false }
      }

      // Update last_logged_in
      if (data.user) {
        try {
          await supabase.from("profiles").update({ last_logged_in: new Date().toISOString() }).eq("id", data.user.id)
        } catch (updateError) {
          console.error("Error updating last_logged_in:", updateError)
          // Continue even if this fails
        }
      }

      return { error: null, success: true }
    } catch (error) {
      return { error: error as Error, success: false }
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      if (error) {
        return { error, success: false }
      }

      if (data.user) {
        // Create a profile for the new user
        try {
          const { error: profileError } = await supabase.from("profiles").insert({
            id: data.user.id,
            email,
            name,
            username: email.split("@")[0],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_logged_in: new Date().toISOString(),
          })

          if (profileError) {
            console.error("Error creating profile:", profileError)
            return { error: profileError, success: false }
          }
        } catch (profileError) {
          console.error("Error creating profile:", profileError)
          return { error: profileError as Error, success: false }
        }
      }

      return { error: null, success: true }
    } catch (error) {
      return { error: error as Error, success: false }
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    router.push("/login")
  }

  const updateProfile = async (profileData: Partial<Profile>) => {
    if (!user) {
      return { error: new Error("Not authenticated"), success: false }
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)

      if (error) {
        return { error, success: false }
      }

      // Refresh profile data
      await fetchProfile(user.id)
      return { error: null, success: true }
    } catch (error) {
      return { error: error as Error, success: false }
    }
  }

  const value = {
    user,
    profile,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
