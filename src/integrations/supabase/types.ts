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
      audit_logs: {
        Row: {
          action: string
          actor: string | null
          id: string
          meta: Json | null
          target: string | null
          ts: string
        }
        Insert: {
          action: string
          actor?: string | null
          id?: string
          meta?: Json | null
          target?: string | null
          ts?: string
        }
        Update: {
          action?: string
          actor?: string | null
          id?: string
          meta?: Json | null
          target?: string | null
          ts?: string
        }
        Relationships: []
      }
      cron_execution_log: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          job_name: string
          metadata: Json | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          job_name: string
          metadata?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          job_name?: string
          metadata?: Json | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      evaluations: {
        Row: {
          actual_value: number | null
          brier_score: number | null
          created_at: string
          error: number | null
          evaluated_at: string
          id: string
          log_loss: number | null
          prediction_id: string
        }
        Insert: {
          actual_value?: number | null
          brier_score?: number | null
          created_at?: string
          error?: number | null
          evaluated_at?: string
          id?: string
          log_loss?: number | null
          prediction_id: string
        }
        Update: {
          actual_value?: number | null
          brier_score?: number | null
          created_at?: string
          error?: number | null
          evaluated_at?: string
          id?: string
          log_loss?: number | null
          prediction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "predictions"
            referencedColumns: ["id"]
          },
        ]
      }
      features: {
        Row: {
          computed_at: string
          created_at: string
          feature_set: Json
          game_id: string
          id: string
        }
        Insert: {
          computed_at?: string
          created_at?: string
          feature_set: Json
          game_id: string
          id?: string
        }
        Update: {
          computed_at?: string
          created_at?: string
          feature_set?: Json
          game_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "features_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          away_score: number | null
          away_team: string
          created_at: string
          home_score: number | null
          home_team: string
          id: string
          kickoff_time: string
          season: number
          status: string | null
          updated_at: string
          venue: string | null
          week: number
        }
        Insert: {
          away_score?: number | null
          away_team: string
          created_at?: string
          home_score?: number | null
          home_team: string
          id: string
          kickoff_time: string
          season: number
          status?: string | null
          updated_at?: string
          venue?: string | null
          week: number
        }
        Update: {
          away_score?: number | null
          away_team?: string
          created_at?: string
          home_score?: number | null
          home_team?: string
          id?: string
          kickoff_time?: string
          season?: number
          status?: string | null
          updated_at?: string
          venue?: string | null
          week?: number
        }
        Relationships: []
      }
      narratives: {
        Row: {
          content: string
          created_at: string
          game_id: string | null
          generated_at: string
          id: string
          is_cached: boolean | null
          is_economy_mode: boolean | null
          narrative_type: string
          source_hash: string | null
        }
        Insert: {
          content: string
          created_at?: string
          game_id?: string | null
          generated_at?: string
          id?: string
          is_cached?: boolean | null
          is_economy_mode?: boolean | null
          narrative_type: string
          source_hash?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          game_id?: string | null
          generated_at?: string
          id?: string
          is_cached?: boolean | null
          is_economy_mode?: boolean | null
          narrative_type?: string
          source_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "narratives_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      odds_snapshots: {
        Row: {
          bookmaker: string
          created_at: string
          game_id: string
          id: string
          market_type: string
          odds_data: Json
          snapshot_time: string
        }
        Insert: {
          bookmaker: string
          created_at?: string
          game_id: string
          id?: string
          market_type: string
          odds_data: Json
          snapshot_time?: string
        }
        Update: {
          bookmaker?: string
          created_at?: string
          game_id?: string
          id?: string
          market_type?: string
          odds_data?: Json
          snapshot_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "odds_snapshots_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          confidence: number
          created_at: string
          edge_vs_implied: number | null
          game_id: string
          id: string
          implied_probability: number | null
          market_type: string
          model_probability: number | null
          model_version: string | null
          predicted_at: string
          predicted_value: number
          provenance_hash: string | null
          uncertainty_band: Json | null
        }
        Insert: {
          confidence: number
          created_at?: string
          edge_vs_implied?: number | null
          game_id: string
          id?: string
          implied_probability?: number | null
          market_type: string
          model_probability?: number | null
          model_version?: string | null
          predicted_at?: string
          predicted_value: number
          provenance_hash?: string | null
          uncertainty_band?: Json | null
        }
        Update: {
          confidence?: number
          created_at?: string
          edge_vs_implied?: number | null
          game_id?: string
          id?: string
          implied_probability?: number | null
          market_type?: string
          model_probability?: number | null
          model_version?: string | null
          predicted_at?: string
          predicted_value?: number
          provenance_hash?: string | null
          uncertainty_band?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "predictions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      signals: {
        Row: {
          confidence: number | null
          content: Json
          content_hash: string | null
          created_at: string
          game_id: string | null
          id: string
          signal_type: string
          source: string
          timestamp: string
        }
        Insert: {
          confidence?: number | null
          content: Json
          content_hash?: string | null
          created_at?: string
          game_id?: string | null
          id?: string
          signal_type: string
          source: string
          timestamp: string
        }
        Update: {
          confidence?: number | null
          content?: Json
          content_hash?: string | null
          created_at?: string
          game_id?: string | null
          id?: string
          signal_type?: string
          source?: string
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "signals_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      source_registry: {
        Row: {
          consecutive_failures: number | null
          created_at: string
          id: string
          is_active: boolean | null
          last_failure: string | null
          last_robots_check: string | null
          last_success: string | null
          robots_compliant: boolean | null
          source_name: string
          source_type: string
          source_url: string
          updated_at: string
        }
        Insert: {
          consecutive_failures?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_failure?: string | null
          last_robots_check?: string | null
          last_success?: string | null
          robots_compliant?: boolean | null
          source_name: string
          source_type: string
          source_url: string
          updated_at?: string
        }
        Update: {
          consecutive_failures?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_failure?: string | null
          last_robots_check?: string | null
          last_success?: string | null
          robots_compliant?: boolean | null
          source_name?: string
          source_type?: string
          source_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_selections: {
        Row: {
          game_id: string
          id: string
          market_type: string
          note: string | null
          result: string | null
          saved_at: string
          selected_side: string
          user_id: string
        }
        Insert: {
          game_id: string
          id?: string
          market_type: string
          note?: string | null
          result?: string | null
          saved_at?: string
          selected_side: string
          user_id: string
        }
        Update: {
          game_id?: string
          id?: string
          market_type?: string
          note?: string | null
          result?: string | null
          saved_at?: string
          selected_side?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          favorite_games: string[] | null
          favorite_teams: string[] | null
          id: string
          market_prefs: Json | null
          notification_prefs: Json | null
          theme: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          favorite_games?: string[] | null
          favorite_teams?: string[] | null
          id?: string
          market_prefs?: Json | null
          notification_prefs?: Json | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          favorite_games?: string[] | null
          favorite_teams?: string[] | null
          id?: string
          market_prefs?: Json | null
          notification_prefs?: Json | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_shares: {
        Row: {
          created_at: string
          id: string
          moderated_at: string | null
          moderated_by: string | null
          rejection_reason: string | null
          source_domain: string | null
          status: string
          tags: string[] | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          rejection_reason?: string | null
          source_domain?: string | null
          status?: string
          tags?: string[] | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          rejection_reason?: string | null
          source_domain?: string | null
          status?: string
          tags?: string[] | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      trigger_edge_function: {
        Args: { function_name: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
