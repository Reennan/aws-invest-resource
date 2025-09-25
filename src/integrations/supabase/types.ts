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
      clusters: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
          used: boolean | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          token: string
          used?: boolean | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used?: boolean | null
        }
        Relationships: []
      }
      resources_created: {
        Row: {
          account_name: string | null
          cluster_id: string | null
          console_link: string | null
          created_at: string | null
          id: string
          manage_status: string | null
          name: string | null
          raw: Json | null
          run_id: string | null
          type: string | null
        }
        Insert: {
          account_name?: string | null
          cluster_id?: string | null
          console_link?: string | null
          created_at?: string | null
          id?: string
          manage_status?: string | null
          name?: string | null
          raw?: Json | null
          run_id?: string | null
          type?: string | null
        }
        Update: {
          account_name?: string | null
          cluster_id?: string | null
          console_link?: string | null
          created_at?: string | null
          id?: string
          manage_status?: string | null
          name?: string | null
          raw?: Json | null
          run_id?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_created_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_created_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
        ]
      }
      resources_unused: {
        Row: {
          account_name: string | null
          cluster_id: string | null
          console_link: string | null
          days_without_use: number | null
          empty_receives: number | null
          id: string
          invocations: number | null
          messages_not_visible: number | null
          messages_received: number | null
          messages_sent: number | null
          method: string | null
          metrics: Json | null
          name: string | null
          raw: Json | null
          resource_id: string | null
          route: string | null
          run_id: string | null
          status: string | null
          total_requests: number | null
          type: string | null
        }
        Insert: {
          account_name?: string | null
          cluster_id?: string | null
          console_link?: string | null
          days_without_use?: number | null
          empty_receives?: number | null
          id?: string
          invocations?: number | null
          messages_not_visible?: number | null
          messages_received?: number | null
          messages_sent?: number | null
          method?: string | null
          metrics?: Json | null
          name?: string | null
          raw?: Json | null
          resource_id?: string | null
          route?: string | null
          run_id?: string | null
          status?: string | null
          total_requests?: number | null
          type?: string | null
        }
        Update: {
          account_name?: string | null
          cluster_id?: string | null
          console_link?: string | null
          days_without_use?: number | null
          empty_receives?: number | null
          id?: string
          invocations?: number | null
          messages_not_visible?: number | null
          messages_received?: number | null
          messages_sent?: number | null
          method?: string | null
          metrics?: Json | null
          name?: string | null
          raw?: Json | null
          resource_id?: string | null
          route?: string | null
          run_id?: string | null
          status?: string | null
          total_requests?: number | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_unused_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_unused_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "runs"
            referencedColumns: ["id"]
          },
        ]
      }
      runs: {
        Row: {
          cluster_id: string | null
          created_count: number
          error: Json | null
          id: string
          region: string
          resource_created_days: number
          resource_unused_days: number
          run_ts: string
          succeeded: boolean | null
          unused_count: number
        }
        Insert: {
          cluster_id?: string | null
          created_count: number
          error?: Json | null
          id?: string
          region: string
          resource_created_days: number
          resource_unused_days: number
          run_ts: string
          succeeded?: boolean | null
          unused_count: number
        }
        Update: {
          cluster_id?: string | null
          created_count?: number
          error?: Json | null
          id?: string
          region?: string
          resource_created_days?: number
          resource_unused_days?: number
          run_ts?: string
          succeeded?: boolean | null
          unused_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "runs_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      user_cluster_permissions: {
        Row: {
          can_view: boolean | null
          cluster_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          can_view?: boolean | null
          cluster_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          can_view?: boolean | null
          cluster_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_cluster_permissions_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "clusters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_cluster_permissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users_profile"
            referencedColumns: ["id"]
          },
        ]
      }
      users_profile: {
        Row: {
          auth_user_id: string | null
          can_manage_users: boolean | null
          can_view_clusters: boolean | null
          can_view_dashboard: boolean | null
          can_view_reports: boolean | null
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          last_login: string | null
          name: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          auth_user_id?: string | null
          can_manage_users?: boolean | null
          can_view_clusters?: boolean | null
          can_view_dashboard?: boolean | null
          can_view_reports?: boolean | null
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          auth_user_id?: string | null
          can_manage_users?: boolean | null
          can_view_clusters?: boolean | null
          can_view_dashboard?: boolean | null
          can_view_reports?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_login?: string | null
          name?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
    }
    Views: {
      v_dashboard_totals: {
        Row: {
          clusters_disponiveis: number | null
          generated_at: string | null
          recursos_criados_periodo: number | null
          recursos_sem_uso_periodo: number | null
        }
        Relationships: []
      }
      v_unused_by_type: {
        Row: {
          total: number | null
          type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_profile_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_editor: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      user_role: "viewer" | "admin" | "editor"
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
      user_role: ["viewer", "admin", "editor"],
    },
  },
} as const
