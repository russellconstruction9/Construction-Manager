export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
          updated_at: string
          subscription_status: 'trial' | 'active' | 'cancelled' | 'past_due'
          subscription_plan: 'starter' | 'professional' | 'enterprise'
          settings: Json
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
          updated_at?: string
          subscription_status?: 'trial' | 'active' | 'cancelled' | 'past_due'
          subscription_plan?: 'starter' | 'professional' | 'enterprise'
          settings?: Json
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
          updated_at?: string
          subscription_status?: 'trial' | 'active' | 'cancelled' | 'past_due'
          subscription_plan?: 'starter' | 'professional' | 'enterprise'
          settings?: Json
        }
      }
      profiles: {
        Row: {
          id: string
          organization_id: string
          email: string
          full_name: string
          avatar_url: string | null
          role_title: string
          role_type: 'Admin' | 'Employee'
          hourly_rate: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id: string
          email: string
          full_name: string
          avatar_url?: string | null
          role_title: string
          role_type: 'Admin' | 'Employee'
          hourly_rate?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          role_title?: string
          role_type?: 'Admin' | 'Employee'
          hourly_rate?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          organization_id: string
          name: string
          address: string
          project_type: 'New Construction' | 'Renovation' | 'Demolition' | 'Interior Fit-Out'
          status: 'In Progress' | 'Completed' | 'On Hold'
          start_date: string
          end_date: string
          budget: number
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          address: string
          project_type: 'New Construction' | 'Renovation' | 'Demolition' | 'Interior Fit-Out'
          status?: 'In Progress' | 'Completed' | 'On Hold'
          start_date: string
          end_date: string
          budget?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          address?: string
          project_type?: 'New Construction' | 'Renovation' | 'Demolition' | 'Interior Fit-Out'
          status?: 'In Progress' | 'Completed' | 'On Hold'
          start_date?: string
          end_date?: string
          budget?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      tasks: {
        Row: {
          id: string
          organization_id: string
          project_id: string
          title: string
          description: string | null
          assignee_id: string | null
          due_date: string
          status: 'To Do' | 'In Progress' | 'Done'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          project_id: string
          title: string
          description?: string | null
          assignee_id?: string | null
          due_date: string
          status?: 'To Do' | 'In Progress' | 'Done'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          project_id?: string
          title?: string
          description?: string | null
          assignee_id?: string | null
          due_date?: string
          status?: 'To Do' | 'In Progress' | 'Done'
          created_at?: string
          updated_at?: string
        }
      }
      time_logs: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          project_id: string
          clock_in: string
          clock_out: string | null
          duration_ms: number | null
          cost: number | null
          clock_in_location: Json | null
          clock_out_location: Json | null
          clock_in_map_image: string | null
          clock_out_map_image: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          project_id: string
          clock_in: string
          clock_out?: string | null
          duration_ms?: number | null
          cost?: number | null
          clock_in_location?: Json | null
          clock_out_location?: Json | null
          clock_in_map_image?: string | null
          clock_out_map_image?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          project_id?: string
          clock_in?: string
          clock_out?: string | null
          duration_ms?: number | null
          cost?: number | null
          clock_in_location?: Json | null
          clock_out_location?: Json | null
          clock_in_map_image?: string | null
          clock_out_map_image?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      punch_list_items: {
        Row: {
          id: string
          organization_id: string
          project_id: string
          text: string
          is_complete: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          project_id: string
          text: string
          is_complete?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          project_id?: string
          text?: string
          is_complete?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      project_photos: {
        Row: {
          id: string
          organization_id: string
          project_id: string
          storage_path: string
          description: string | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          project_id: string
          storage_path: string
          description?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          project_id?: string
          storage_path?: string
          description?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
      }
      inventory_items: {
        Row: {
          id: string
          organization_id: string
          name: string
          quantity: number
          unit: string
          low_stock_threshold: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          quantity?: number
          unit: string
          low_stock_threshold?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          quantity?: number
          unit?: string
          low_stock_threshold?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      estimates: {
        Row: {
          id: string
          organization_id: string
          project_id: string
          name: string
          status: 'Draft' | 'Approved' | 'Rejected'
          total_amount: number
          total_estimated_hours: number
          created_at: string
          updated_at: string
          created_by: string | null
        }
        Insert: {
          id?: string
          organization_id: string
          project_id: string
          name: string
          status?: 'Draft' | 'Approved' | 'Rejected'
          total_amount?: number
          total_estimated_hours?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
        Update: {
          id?: string
          organization_id?: string
          project_id?: string
          name?: string
          status?: 'Draft' | 'Approved' | 'Rejected'
          total_amount?: number
          total_estimated_hours?: number
          created_at?: string
          updated_at?: string
          created_by?: string | null
        }
      }
      estimate_items: {
        Row: {
          id: string
          organization_id: string
          estimate_id: string
          item_type: 'Labor' | 'Material' | 'Subcontractor' | 'Equipment' | 'Other'
          description: string
          quantity: number
          unit: string
          unit_cost: number
          total_cost: number
          estimated_hours: number | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          estimate_id: string
          item_type: 'Labor' | 'Material' | 'Subcontractor' | 'Equipment' | 'Other'
          description: string
          quantity: number
          unit: string
          unit_cost: number
          total_cost: number
          estimated_hours?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          estimate_id?: string
          item_type?: 'Labor' | 'Material' | 'Subcontractor' | 'Equipment' | 'Other'
          description?: string
          quantity?: number
          unit?: string
          unit_cost?: number
          total_cost?: number
          estimated_hours?: number | null
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          organization_id: string
          project_id: string
          description: string
          amount: number
          expense_date: string
          category: 'Labor' | 'Material' | 'Subcontractor' | 'Equipment' | 'Other'
          receipt_url: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          project_id: string
          description: string
          amount: number
          expense_date: string
          category: 'Labor' | 'Material' | 'Subcontractor' | 'Equipment' | 'Other'
          receipt_url?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          project_id?: string
          description?: string
          amount?: number
          expense_date?: string
          category?: 'Labor' | 'Material' | 'Subcontractor' | 'Equipment' | 'Other'
          receipt_url?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_organization_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
