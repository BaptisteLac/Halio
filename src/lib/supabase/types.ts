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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      catches: {
        Row: {
          caught_at: string
          coefficient: number | null
          created_at: string | null
          fishing_score: number | null
          id: string
          lure_or_bait: string | null
          moon_phase: number | null
          notes: string | null
          photo_url: string | null
          pressure: number | null
          released: boolean | null
          size_cm: number | null
          species_id: string
          spot_id: string
          technique: string | null
          tide_hour: number | null
          tide_phase: string | null
          user_id: string
          water_temp: number | null
          weight_kg: number | null
          wind_direction: number | null
          wind_speed: number | null
        }
        Insert: {
          caught_at?: string
          coefficient?: number | null
          created_at?: string | null
          fishing_score?: number | null
          id?: string
          lure_or_bait?: string | null
          moon_phase?: number | null
          notes?: string | null
          photo_url?: string | null
          pressure?: number | null
          released?: boolean | null
          size_cm?: number | null
          species_id: string
          spot_id: string
          technique?: string | null
          tide_hour?: number | null
          tide_phase?: string | null
          user_id: string
          water_temp?: number | null
          weight_kg?: number | null
          wind_direction?: number | null
          wind_speed?: number | null
        }
        Update: {
          caught_at?: string
          coefficient?: number | null
          created_at?: string | null
          fishing_score?: number | null
          id?: string
          lure_or_bait?: string | null
          moon_phase?: number | null
          notes?: string | null
          photo_url?: string | null
          pressure?: number | null
          released?: boolean | null
          size_cm?: number | null
          species_id?: string
          spot_id?: string
          technique?: string | null
          tide_hour?: number | null
          tide_phase?: string | null
          user_id?: string
          water_temp?: number | null
          weight_kg?: number | null
          wind_direction?: number | null
          wind_speed?: number | null
        }
        Relationships: []
      }
      coach_usage: {
        Row: {
          messages_today: number
          reset_date: string
          user_id: string
        }
        Insert: {
          messages_today?: number
          reset_date?: string
          user_id: string
        }
        Update: {
          messages_today?: number
          reset_date?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          display_name: string | null
          favorite_species: string[] | null
          favorite_spots: string[] | null
          home_port: string | null
          notification_days: number[] | null
          notification_horizons: number[] | null
          preferred_techniques: string[] | null
          push_notifications_enabled: boolean | null
          subscribed_zones: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          favorite_species?: string[] | null
          favorite_spots?: string[] | null
          home_port?: string | null
          notification_days?: number[] | null
          notification_horizons?: number[] | null
          preferred_techniques?: string[] | null
          push_notifications_enabled?: boolean | null
          subscribed_zones?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          favorite_species?: string[] | null
          favorite_spots?: string[] | null
          home_port?: string | null
          notification_days?: number[] | null
          notification_horizons?: number[] | null
          preferred_techniques?: string[] | null
          push_notifications_enabled?: boolean | null
          subscribed_zones?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      zones: {
        Row: {
          id: string
          name: string
          latitude: number
          longitude: number
          timezone: string
          active: boolean
        }
        Insert: {
          id: string
          name: string
          latitude: number
          longitude: number
          timezone?: string
          active?: boolean
        }
        Update: {
          id?: string
          name?: string
          latitude?: number
          longitude?: number
          timezone?: string
          active?: boolean
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          created_at?: string
        }
        Relationships: []
      }
      notification_rules: {
        Row: {
          id: string
          user_id: string
          zone_id: string
          type: 'species_score' | 'global_score' | 'wind_speed' | 'coefficient' | 'tide_phase' | 'pressure_trend'
          species_id: string | null
          operator: '>' | '<' | '>=' | '<=' | '='
          value: string
          enabled: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          zone_id?: string
          type: 'species_score' | 'global_score' | 'wind_speed' | 'coefficient' | 'tide_phase' | 'pressure_trend'
          species_id?: string | null
          operator: '>' | '<' | '>=' | '<=' | '='
          value: string
          enabled?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          zone_id?: string
          type?: 'species_score' | 'global_score' | 'wind_speed' | 'coefficient' | 'tide_phase' | 'pressure_trend'
          species_id?: string | null
          operator?: '>' | '<' | '>=' | '<=' | '='
          value?: string
          enabled?: boolean
          created_at?: string
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          id: string
          user_id: string
          zone_id: string
          target_date: string
          horizon_days: number
          triggered_at: string
          scores_snapshot: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          zone_id: string
          target_date: string
          horizon_days: number
          triggered_at?: string
          scores_snapshot?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          zone_id?: string
          target_date?: string
          horizon_days?: number
          triggered_at?: string
          scores_snapshot?: Json | null
        }
        Relationships: []
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

// Aliases pratiques
export type CatchRow = Database['public']['Tables']['catches']['Row']
export type CatchInsert = Database['public']['Tables']['catches']['Insert']
export type CatchUpdate = Database['public']['Tables']['catches']['Update']
export type UserSettingsRow = Database['public']['Tables']['user_settings']['Row']
export type ZoneRow = Database['public']['Tables']['zones']['Row']
export type PushSubscriptionRow = Database['public']['Tables']['push_subscriptions']['Row']
export type NotificationRuleRow = Database['public']['Tables']['notification_rules']['Row']
export type NotificationRuleInsert = Database['public']['Tables']['notification_rules']['Insert']
export type NotificationLogInsert = Database['public']['Tables']['notification_log']['Insert']
