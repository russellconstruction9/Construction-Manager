export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      estimate_items: {
        Row: {
          created_at: string
          description: string
          estimate_id: string
          estimated_hours: number | null
          id: string
          item_type: string
          organization_id: string
          quantity: number
          total_cost: number
          unit: string
          unit_cost: number
        }
        Insert: {
          created_at?: string
          description: string
          estimate_id: string
          estimated_hours?: number | null
          id?: string
          item_type: string
          organization_id: string
          quantity: number
          total_cost: number
          unit: string
          unit_cost: number
        }
        Update: {
          created_at?: string
          description?: string
          estimate_id?: string
          estimated_hours?: number | null
          id?: string
          item_type?: string
          organization_id?: string
          quantity?: number
          total_cost?: number
          unit?: string
          unit_cost?: number
        }
        Relationships: []
      }
      estimates: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          organization_id: string
          project_id: string
          status: string
          total_amount: number
          total_estimated_hours: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          organization_id: string
          project_id: string
          status?: string
          total_amount?: number
          total_estimated_hours?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          organization_id?: string
          project_id?: string
          status?: string
          total_amount?: number
          total_estimated_hours?: number
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          created_by: string | null
          description: string
          expense_date: string
          id: string
          organization_id: string
          project_id: string
          receipt_url: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string
          created_by?: string | null
          description: string
          expense_date: string
          id?: string
          organization_id: string
          project_id: string
          receipt_url?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string
          expense_date?: string
          id?: string
          organization_id?: string
          project_id?: string
          receipt_url?: string | null
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          created_at: string
          id: string
          low_stock_threshold: number | null
          name: string
          organization_id: string
          quantity: number
          unit: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          low_stock_threshold?: number | null
          name: string
          organization_id: string
          quantity?: number
          unit: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          low_stock_threshold?: number | null
          name?: string
          organization_id?: string
          quantity?: number
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_list: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          inventory_item_id: string | null
          item_type: string
          manual_item_name: string | null
          organization_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_item_id?: string | null
          item_type: string
          manual_item_name?: string | null
          organization_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          inventory_item_id?: string | null
          item_type?: string
          manual_item_name?: string | null
          organization_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          settings: Json | null
          slug: string
          subscription_plan: string | null
          subscription_status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          settings?: Json | null
          slug: string
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          settings?: Json | null
          slug?: string
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          organization_id: string | null
          role_title: string
          role_type: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          hourly_rate?: number | null
          id: string
          is_active?: boolean | null
          organization_id?: string | null
          role_title: string
          role_type: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          role_title?: string
          role_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_photos: {
        Row: {
          created_at: string
          description: string | null
          id: string
          organization_id: string
          project_id: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          organization_id: string
          project_id: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          organization_id?: string
          project_id?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          address: string
          budget: number
          created_at: string
          created_by: string | null
          end_date: string
          id: string
          name: string
          organization_id: string
          project_type: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          address: string
          budget?: number
          created_at?: string
          created_by?: string | null
          end_date: string
          id?: string
          name: string
          organization_id: string
          project_type: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string
          budget?: number
          created_at?: string
          created_by?: string | null
          end_date?: string
          id?: string
          name?: string
          organization_id?: string
          project_type?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      punch_list_items: {
        Row: {
          created_at: string
          id: string
          is_complete: boolean | null
          organization_id: string
          project_id: string
          text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_complete?: boolean | null
          organization_id: string
          project_id: string
          text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_complete?: boolean | null
          organization_id?: string
          project_id?: string
          text?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_id: string | null
          created_at: string
          description: string | null
          due_date: string
          id: string
          organization_id: string
          project_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          organization_id: string
          project_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          organization_id?: string
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      time_logs: {
        Row: {
          clock_in: string
          clock_in_location: Json | null
          clock_in_map_image: string | null
          clock_out: string | null
          clock_out_location: Json | null
          clock_out_map_image: string | null
          cost: number | null
          created_at: string
          duration_ms: number | null
          id: string
          organization_id: string
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          clock_in: string
          clock_in_location?: Json | null
          clock_in_map_image?: string | null
          clock_out?: string | null
          clock_out_location?: Json | null
          clock_out_map_image?: string | null
          cost?: number | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          organization_id: string
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          clock_in?: string
          clock_in_location?: Json | null
          clock_in_map_image?: string | null
          clock_out?: string | null
          clock_out_location?: Json | null
          clock_out_map_image?: string | null
          cost?: number | null
          created_at?: string
          duration_ms?: number | null
          id?: string
          organization_id?: string
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_organization_id: { Args: Record<string, never>; Returns: string }
      is_user_admin: { Args: Record<string, never>; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
