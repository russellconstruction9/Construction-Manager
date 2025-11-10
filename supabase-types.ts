export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          app_id: number
          name: string
          email: string | null
          role: string | null
          hourly_rate: number | null
          phone: string | null
          is_clocked_in: boolean | null
          avatar_url: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          app_id?: number
          name: string
          email?: string | null
          role?: string | null
          hourly_rate?: number | null
          phone?: string | null
          is_clocked_in?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          app_id?: number
          name?: string
          email?: string | null
          role?: string | null
          hourly_rate?: number | null
          phone?: string | null
          is_clocked_in?: boolean | null
          avatar_url?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      projects: {
        Row: {
          id: string
          app_id: number
          name: string
          description: string | null
          status: string | null
          start_date: string | null
          end_date: string | null
          budget: number | null
          client_name: string | null
          client_email: string | null
          client_phone: string | null
          address: string | null
          progress_percentage: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          app_id?: number
          name: string
          description?: string | null
          status?: string | null
          start_date?: string | null
          end_date?: string | null
          budget?: number | null
          client_name?: string | null
          client_email?: string | null
          client_phone?: string | null
          address?: string | null
          progress_percentage?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          app_id?: number
          name?: string
          description?: string | null
          status?: string | null
          start_date?: string | null
          end_date?: string | null
          budget?: number | null
          client_name?: string | null
          client_email?: string | null
          client_phone?: string | null
          address?: string | null
          progress_percentage?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      tasks: {
        Row: {
          id: string
          app_id: number
          title: string
          description: string | null
          status: string | null
          priority: string | null
          project_id: string | null
          assigned_to: string | null
          due_date: string | null
          estimated_hours: number | null
          actual_hours: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          app_id?: number
          title: string
          description?: string | null
          status?: string | null
          priority?: string | null
          project_id?: string | null
          assigned_to?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          app_id?: number
          title?: string
          description?: string | null
          status?: string | null
          priority?: string | null
          project_id?: string | null
          assigned_to?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      time_logs: {
        Row: {
          id: string
          app_id: number
          user_id: string
          project_id: string | null
          task_id: string | null
          clock_in: string
          clock_out: string | null
          duration_ms: number | null
          cost: number | null
          notes: string | null
          break_duration_ms: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          app_id?: number
          user_id: string
          project_id?: string | null
          task_id?: string | null
          clock_in: string
          clock_out?: string | null
          duration_ms?: number | null
          cost?: number | null
          notes?: string | null
          break_duration_ms?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          app_id?: number
          user_id?: string
          project_id?: string | null
          task_id?: string | null
          clock_in?: string
          clock_out?: string | null
          duration_ms?: number | null
          cost?: number | null
          notes?: string | null
          break_duration_ms?: number | null
          created_at?: string | null
        }
      }
      inventory: {
        Row: {
          id: string
          app_id: number
          name: string
          description: string | null
          quantity: number
          unit: string | null
          cost_per_unit: number | null
          supplier: string | null
          category: string | null
          location: string | null
          min_quantity: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          app_id?: number
          name: string
          description?: string | null
          quantity?: number
          unit?: string | null
          cost_per_unit?: number | null
          supplier?: string | null
          category?: string | null
          location?: string | null
          min_quantity?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          app_id?: number
          name?: string
          description?: string | null
          quantity?: number
          unit?: string | null
          cost_per_unit?: number | null
          supplier?: string | null
          category?: string | null
          location?: string | null
          min_quantity?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      project_photos: {
        Row: {
          id: string
          app_id: number
          project_id: string
          user_id: string
          filename: string
          url: string
          description: string | null
          tags: string[] | null
          created_at: string | null
        }
        Insert: {
          id?: string
          app_id?: number
          project_id: string
          user_id: string
          filename: string
          url: string
          description?: string | null
          tags?: string[] | null
          created_at?: string | null
        }
        Update: {
          id?: string
          app_id?: number
          project_id?: string
          user_id?: string
          filename?: string
          url?: string
          description?: string | null
          tags?: string[] | null
          created_at?: string | null
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

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
