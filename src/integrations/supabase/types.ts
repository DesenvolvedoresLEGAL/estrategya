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
      ai_insights: {
        Row: {
          company_id: string
          created_at: string
          description: string
          id: string
          insight_type: Database["public"]["Enums"]["insight_type"]
          priority: Database["public"]["Enums"]["insight_priority"]
          related_objective_id: string | null
          status: Database["public"]["Enums"]["insight_status"]
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description: string
          id?: string
          insight_type: Database["public"]["Enums"]["insight_type"]
          priority?: Database["public"]["Enums"]["insight_priority"]
          related_objective_id?: string | null
          status?: Database["public"]["Enums"]["insight_status"]
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string
          id?: string
          insight_type?: Database["public"]["Enums"]["insight_type"]
          priority?: Database["public"]["Enums"]["insight_priority"]
          related_objective_id?: string | null
          status?: Database["public"]["Enums"]["insight_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_insights_related_objective_id_fkey"
            columns: ["related_objective_id"]
            isOneToOne: false
            referencedRelation: "strategic_objectives"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          id: string
          main_challenge: string | null
          mission: string | null
          model: string
          name: string
          owner_user_id: string
          region: string | null
          segment: string
          size_team: number | null
          updated_at: string
          values: string | null
          vision: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          main_challenge?: string | null
          mission?: string | null
          model: string
          name: string
          owner_user_id: string
          region?: string | null
          segment: string
          size_team?: number | null
          updated_at?: string
          values?: string | null
          vision?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          main_challenge?: string | null
          mission?: string | null
          model?: string
          name?: string
          owner_user_id?: string
          region?: string | null
          segment?: string
          size_team?: number | null
          updated_at?: string
          values?: string | null
          vision?: string | null
        }
        Relationships: []
      }
      execution_plan: {
        Row: {
          company_id: string
          created_at: string
          id: string
          mci: string
          review_cadence: Json | null
          scoreboard: Json | null
          updated_at: string
          weekly_actions: Json | null
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          mci: string
          review_cadence?: Json | null
          scoreboard?: Json | null
          updated_at?: string
          weekly_actions?: Json | null
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          mci?: string
          review_cadence?: Json | null
          scoreboard?: Json | null
          updated_at?: string
          weekly_actions?: Json | null
        }
        Relationships: []
      }
      financial_data: {
        Row: {
          company_id: string
          created_at: string
          customers_count: number | null
          expenses: number | null
          file_url: string | null
          id: string
          notes: string | null
          period: string
          profit: number | null
          revenue: number | null
          sales_volume: number | null
        }
        Insert: {
          company_id: string
          created_at?: string
          customers_count?: number | null
          expenses?: number | null
          file_url?: string | null
          id?: string
          notes?: string | null
          period: string
          profit?: number | null
          revenue?: number | null
          sales_volume?: number | null
        }
        Update: {
          company_id?: string
          created_at?: string
          customers_count?: number | null
          expenses?: number | null
          file_url?: string | null
          id?: string
          notes?: string | null
          period?: string
          profit?: number | null
          revenue?: number | null
          sales_volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_data_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      initiatives: {
        Row: {
          created_at: string
          description: string | null
          due_date: string | null
          effort: number | null
          id: string
          impact: number | null
          objective_id: string
          owner: string | null
          priority_quadrant: string | null
          status: string | null
          suggested_by_ai: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          effort?: number | null
          id?: string
          impact?: number | null
          objective_id: string
          owner?: string | null
          priority_quadrant?: string | null
          status?: string | null
          suggested_by_ai?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          due_date?: string | null
          effort?: number | null
          id?: string
          impact?: number | null
          objective_id?: string
          owner?: string | null
          priority_quadrant?: string | null
          status?: string | null
          suggested_by_ai?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "initiatives_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "strategic_objectives"
            referencedColumns: ["id"]
          },
        ]
      }
      metric_updates: {
        Row: {
          created_at: string
          created_by: string
          id: string
          metric_id: string
          notes: string | null
          recorded_at: string
          value: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          metric_id: string
          notes?: string | null
          recorded_at?: string
          value: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          metric_id?: string
          notes?: string | null
          recorded_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "metric_updates_metric_id_fkey"
            columns: ["metric_id"]
            isOneToOne: false
            referencedRelation: "metrics"
            referencedColumns: ["id"]
          },
        ]
      }
      metrics: {
        Row: {
          created_at: string
          current_value: string | null
          id: string
          name: string
          objective_id: string
          period: string | null
          source: string | null
          target: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_value?: string | null
          id?: string
          name: string
          objective_id: string
          period?: string | null
          source?: string | null
          target?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_value?: string | null
          id?: string
          name?: string
          objective_id?: string
          period?: string | null
          source?: string | null
          target?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "metrics_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "strategic_objectives"
            referencedColumns: ["id"]
          },
        ]
      }
      objective_updates: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          objective_id: string
          progress_percentage: number
          status: Database["public"]["Enums"]["objective_status"]
          updated_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          objective_id: string
          progress_percentage?: number
          status?: Database["public"]["Enums"]["objective_status"]
          updated_by: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          objective_id?: string
          progress_percentage?: number
          status?: Database["public"]["Enums"]["objective_status"]
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "objective_updates_objective_id_fkey"
            columns: ["objective_id"]
            isOneToOne: false
            referencedRelation: "strategic_objectives"
            referencedColumns: ["id"]
          },
        ]
      }
      ogsm: {
        Row: {
          company_id: string
          created_at: string
          id: string
          objective: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          objective: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          objective?: string
          updated_at?: string
        }
        Relationships: []
      }
      ogsm_goals: {
        Row: {
          created_at: string
          description: string | null
          id: string
          mensuravel: string | null
          ogsm_id: string
          order_position: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          mensuravel?: string | null
          ogsm_id: string
          order_position?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          mensuravel?: string | null
          ogsm_id?: string
          order_position?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ogsm_measures: {
        Row: {
          created_at: string
          id: string
          name: string
          o_que_medir: string | null
          strategy_id: string
          target: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          o_que_medir?: string | null
          strategy_id: string
          target?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          o_que_medir?: string | null
          strategy_id?: string
          target?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ogsm_strategies: {
        Row: {
          created_at: string
          description: string | null
          goal_id: string | null
          id: string
          ogsm_id: string
          order_position: number | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          goal_id?: string | null
          id?: string
          ogsm_id: string
          order_position?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          goal_id?: string | null
          id?: string
          ogsm_id?: string
          order_position?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      pestel_analysis: {
        Row: {
          company_id: string
          created_at: string
          economic: string | null
          environmental: string | null
          id: string
          legal: string | null
          political: string | null
          social: string | null
          technological: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          economic?: string | null
          environmental?: string | null
          id?: string
          legal?: string | null
          political?: string | null
          social?: string | null
          technological?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          economic?: string | null
          environmental?: string | null
          id?: string
          legal?: string | null
          political?: string | null
          social?: string | null
          technological?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      strategic_context: {
        Row: {
          company_id: string
          created_at: string
          ia_analysis: string | null
          id: string
          opportunities: string[] | null
          pestel_factors: Json | null
          strengths: string[] | null
          threats: string[] | null
          updated_at: string
          weaknesses: string[] | null
        }
        Insert: {
          company_id: string
          created_at?: string
          ia_analysis?: string | null
          id?: string
          opportunities?: string[] | null
          pestel_factors?: Json | null
          strengths?: string[] | null
          threats?: string[] | null
          updated_at?: string
          weaknesses?: string[] | null
        }
        Update: {
          company_id?: string
          created_at?: string
          ia_analysis?: string | null
          id?: string
          opportunities?: string[] | null
          pestel_factors?: Json | null
          strengths?: string[] | null
          threats?: string[] | null
          updated_at?: string
          weaknesses?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "strategic_context_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      strategic_objectives: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          horizon: string | null
          id: string
          perspective: string | null
          priority: number | null
          title: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          horizon?: string | null
          id?: string
          perspective?: string | null
          priority?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          horizon?: string | null
          id?: string
          perspective?: string | null
          priority?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "strategic_objectives_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
      insight_priority: "baixa" | "media" | "alta" | "critica"
      insight_status: "novo" | "visualizado" | "resolvido" | "ignorado"
      insight_type: "progresso" | "risco" | "oportunidade" | "recomendacao"
      objective_status:
        | "nao_iniciado"
        | "em_andamento"
        | "em_risco"
        | "concluido"
        | "pausado"
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
      insight_priority: ["baixa", "media", "alta", "critica"],
      insight_status: ["novo", "visualizado", "resolvido", "ignorado"],
      insight_type: ["progresso", "risco", "oportunidade", "recomendacao"],
      objective_status: [
        "nao_iniciado",
        "em_andamento",
        "em_risco",
        "concluido",
        "pausado",
      ],
    },
  },
} as const
