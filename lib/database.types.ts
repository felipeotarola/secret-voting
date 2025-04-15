export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string | null
          avatar_url: string | null
          bio: string | null
          status: string | null
          last_logged_in: string | null
          created_at: string | null
          updated_at: string | null
          email: string | null
          fcm_token: string | null
          name: string | null
        }
        Insert: {
          id: string
          username?: string | null
          avatar_url?: string | null
          bio?: string | null
          status?: string | null
          last_logged_in?: string | null
          created_at?: string | null
          updated_at?: string | null
          email?: string | null
          fcm_token?: string | null
          name?: string | null
        }
        Update: {
          id?: string
          username?: string | null
          avatar_url?: string | null
          bio?: string | null
          status?: string | null
          last_logged_in?: string | null
          created_at?: string | null
          updated_at?: string | null
          email?: string | null
          fcm_token?: string | null
          name?: string | null
        }
      }
      polls: {
        Row: {
          id: string
          title: string
          question: string
          description: string | null
          options: Json
          created_at: string
          ends_at: string
          secret_voting: boolean
          is_active: boolean
          created_by: string
          image_url: string | null
          is_private: boolean
        }
        Insert: {
          id?: string
          title: string
          question: string
          description?: string | null
          options: Json
          created_at?: string
          ends_at: string
          secret_voting?: boolean
          is_active?: boolean
          created_by: string
          image_url?: string | null
          is_private?: boolean
        }
        Update: {
          id?: string
          title?: string
          question?: string
          description?: string | null
          options?: Json
          created_at?: string
          ends_at?: string
          secret_voting?: boolean
          is_active?: boolean
          created_by?: string
          image_url?: string | null
          is_private?: boolean
        }
      }
      votes: {
        Row: {
          id: string
          poll_id: string
          user_id: string
          option_index: number
          created_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          user_id: string
          option_index: number
          created_at?: string
        }
        Update: {
          id?: string
          poll_id?: string
          user_id?: string
          option_index?: number
          created_at?: string
        }
      }
      poll_access: {
        Row: {
          id: string
          poll_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          poll_id?: string
          user_id?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"]
export type Poll = Database["public"]["Tables"]["polls"]["Row"]
export type Vote = Database["public"]["Tables"]["votes"]["Row"]
export type PollAccess = Database["public"]["Tables"]["poll_access"]["Row"]
