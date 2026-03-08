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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_events: {
        Row: {
          city: string | null
          confidence: number
          created_at: string
          event_type: string
          id: string
          location: string | null
          node_id: string | null
          node_name: string | null
          raw_extraction: Json | null
          severity: string
          signal_count: number
          source_handle: string | null
          source_platform: string
          source_query: string | null
          source_snippet: string | null
          source_url: string | null
          state: string | null
        }
        Insert: {
          city?: string | null
          confidence?: number
          created_at?: string
          event_type: string
          id?: string
          location?: string | null
          node_id?: string | null
          node_name?: string | null
          raw_extraction?: Json | null
          severity?: string
          signal_count?: number
          source_handle?: string | null
          source_platform?: string
          source_query?: string | null
          source_snippet?: string | null
          source_url?: string | null
          state?: string | null
        }
        Update: {
          city?: string | null
          confidence?: number
          created_at?: string
          event_type?: string
          id?: string
          location?: string | null
          node_id?: string | null
          node_name?: string | null
          raw_extraction?: Json | null
          severity?: string
          signal_count?: number
          source_handle?: string | null
          source_platform?: string
          source_query?: string | null
          source_snippet?: string | null
          source_url?: string | null
          state?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_events_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      grid_events: {
        Row: {
          city: string | null
          created_at: string
          event_type: string
          id: string
          node_id: string | null
          node_name: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string
          event_type: string
          id?: string
          node_id?: string | null
          node_name?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string
          event_type?: string
          id?: string
          node_id?: string | null
          node_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grid_events_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      grid_status: {
        Row: {
          id: string
          intermittent_nodes: number
          outage_nodes: number
          powered_nodes: number
          status: string
          total_nodes: number
          updated_at: string
        }
        Insert: {
          id?: string
          intermittent_nodes?: number
          outage_nodes?: number
          powered_nodes?: number
          status?: string
          total_nodes?: number
          updated_at?: string
        }
        Update: {
          id?: string
          intermittent_nodes?: number
          outage_nodes?: number
          powered_nodes?: number
          status?: string
          total_nodes?: number
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          city: string | null
          created_at: string
          id: string
          latitude: number
          lga: string | null
          longitude: number
          name: string
          population_estimate: number | null
          state: string
          type: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          latitude: number
          lga?: string | null
          longitude: number
          name: string
          population_estimate?: number | null
          state: string
          type?: string
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          latitude?: number
          lga?: string | null
          longitude?: number
          name?: string
          population_estimate?: number | null
          state?: string
          type?: string
        }
        Relationships: []
      }
      nodes: {
        Row: {
          area_type: string
          avg_supply_hours: number
          band: string
          city: string
          confidence: number
          created_at: string
          disco: string
          id: string
          last_outage: string | null
          latitude: number
          location_id: string | null
          longitude: number
          name: string
          report_count: number
          severity: string
          state: string
          station_type: string
          status: string
          tariff_per_kwh: number
          tcn_region: string
          updated_at: string
          voltage_class: string
        }
        Insert: {
          area_type: string
          avg_supply_hours?: number
          band: string
          city: string
          confidence?: number
          created_at?: string
          disco: string
          id?: string
          last_outage?: string | null
          latitude: number
          location_id?: string | null
          longitude: number
          name: string
          report_count?: number
          severity?: string
          state: string
          station_type?: string
          status?: string
          tariff_per_kwh?: number
          tcn_region?: string
          updated_at?: string
          voltage_class?: string
        }
        Update: {
          area_type?: string
          avg_supply_hours?: number
          band?: string
          city?: string
          confidence?: number
          created_at?: string
          disco?: string
          id?: string
          last_outage?: string | null
          latitude?: number
          location_id?: string | null
          longitude?: number
          name?: string
          report_count?: number
          severity?: string
          state?: string
          station_type?: string
          status?: string
          tariff_per_kwh?: number
          tcn_region?: string
          updated_at?: string
          voltage_class?: string
        }
        Relationships: [
          {
            foreignKeyName: "nodes_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          id: string
          node_id: string
          report_type: string
          session_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          node_id: string
          report_type: string
          session_id: string
        }
        Update: {
          created_at?: string
          id?: string
          node_id?: string
          report_type?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_node_id_fkey"
            columns: ["node_id"]
            isOneToOne: false
            referencedRelation: "nodes"
            referencedColumns: ["id"]
          },
        ]
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
