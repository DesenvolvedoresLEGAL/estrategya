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
      activity_log: {
        Row: {
          action_type: string
          company_id: string
          created_at: string | null
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          action_type: string
          company_id: string
          created_at?: string | null
          details?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          action_type?: string
          company_id?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
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
      comments: {
        Row: {
          content: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          parent_comment_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          parent_comment_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          parent_comment_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          cnpj: string | null
          created_at: string
          id: string
          main_challenge: string | null
          mission: string | null
          model: string
          name: string
          owner_user_id: string
          region: string | null
          segment: string
          segment_specific_data: Json | null
          size_team: number | null
          updated_at: string
          values: string | null
          vision: string | null
          whatsapp_phone: string | null
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          id?: string
          main_challenge?: string | null
          mission?: string | null
          model: string
          name: string
          owner_user_id: string
          region?: string | null
          segment: string
          segment_specific_data?: Json | null
          size_team?: number | null
          updated_at?: string
          values?: string | null
          vision?: string | null
          whatsapp_phone?: string | null
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          id?: string
          main_challenge?: string | null
          mission?: string | null
          model?: string
          name?: string
          owner_user_id?: string
          region?: string | null
          segment?: string
          segment_specific_data?: Json | null
          size_team?: number | null
          updated_at?: string
          values?: string | null
          vision?: string | null
          whatsapp_phone?: string | null
        }
        Relationships: []
      }
      company_subscriptions: {
        Row: {
          cancelled_at: string | null
          company_id: string
          created_at: string | null
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          status: string
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          cancelled_at?: string | null
          company_id: string
          created_at?: string | null
          current_period_end: string
          current_period_start?: string
          id?: string
          plan_id: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          cancelled_at?: string | null
          company_id?: string
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
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
      execution_reminders: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          recipient_ids: string[] | null
          reminder_type: string
          scheduled_for: string
          sent: boolean | null
          sent_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          recipient_ids?: string[] | null
          reminder_type: string
          scheduled_for: string
          sent?: boolean | null
          sent_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          recipient_ids?: string[] | null
          reminder_type?: string
          scheduled_for?: string
          sent?: boolean | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "execution_reminders_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
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
          assigned_at: string | null
          assigned_to: string | null
          confidence_score: number | null
          created_at: string
          description: string | null
          due_date: string | null
          ease_score: number | null
          effort: number | null
          how: string | null
          how_much: number | null
          ice_score: number | null
          id: string
          impact: number | null
          impact_score: number | null
          objective_id: string
          owner: string | null
          priority_quadrant: string | null
          status: string | null
          suggested_by_ai: boolean | null
          title: string
          updated_at: string
          what: string | null
          when_deadline: string | null
          where_location: string | null
          who: string | null
          why: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          confidence_score?: number | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          ease_score?: number | null
          effort?: number | null
          how?: string | null
          how_much?: number | null
          ice_score?: number | null
          id?: string
          impact?: number | null
          impact_score?: number | null
          objective_id: string
          owner?: string | null
          priority_quadrant?: string | null
          status?: string | null
          suggested_by_ai?: boolean | null
          title: string
          updated_at?: string
          what?: string | null
          when_deadline?: string | null
          where_location?: string | null
          who?: string | null
          why?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          confidence_score?: number | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          ease_score?: number | null
          effort?: number | null
          how?: string | null
          how_much?: number | null
          ice_score?: number | null
          id?: string
          impact?: number | null
          impact_score?: number | null
          objective_id?: string
          owner?: string | null
          priority_quadrant?: string | null
          status?: string | null
          suggested_by_ai?: boolean | null
          title?: string
          updated_at?: string
          what?: string | null
          when_deadline?: string | null
          where_location?: string | null
          who?: string | null
          why?: string | null
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
      maturity_assessment: {
        Row: {
          company_id: string
          created_at: string
          evolution_roadmap: Json | null
          id: string
          overall_maturity_level: string | null
          people_analysis: string | null
          people_score: number | null
          processes_analysis: string | null
          processes_score: number | null
          strategy_analysis: string | null
          strategy_score: number | null
          technology_analysis: string | null
          technology_score: number | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          evolution_roadmap?: Json | null
          id?: string
          overall_maturity_level?: string | null
          people_analysis?: string | null
          people_score?: number | null
          processes_analysis?: string | null
          processes_score?: number | null
          strategy_analysis?: string | null
          strategy_score?: number | null
          technology_analysis?: string | null
          technology_score?: number | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          evolution_roadmap?: Json | null
          id?: string
          overall_maturity_level?: string | null
          people_analysis?: string | null
          people_score?: number | null
          processes_analysis?: string | null
          processes_score?: number | null
          strategy_analysis?: string | null
          strategy_score?: number | null
          technology_analysis?: string | null
          technology_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maturity_assessment_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
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
          key_impacts: string[] | null
          legal: string | null
          opportunities: string[] | null
          political: string | null
          social: string | null
          technological: string | null
          threats: string[] | null
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          economic?: string | null
          environmental?: string | null
          id?: string
          key_impacts?: string[] | null
          legal?: string | null
          opportunities?: string[] | null
          political?: string | null
          social?: string | null
          technological?: string | null
          threats?: string[] | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          economic?: string | null
          environmental?: string | null
          id?: string
          key_impacts?: string[] | null
          legal?: string | null
          opportunities?: string[] | null
          political?: string | null
          social?: string | null
          technological?: string | null
          threats?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      plan_validation_checks: {
        Row: {
          account_email: string
          checked: boolean
          company_id: string | null
          created_at: string | null
          expected_tier: string
          id: string
          test_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_email: string
          checked?: boolean
          company_id?: string | null
          created_at?: string | null
          expected_tier: string
          id?: string
          test_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_email?: string
          checked?: boolean
          company_id?: string | null
          created_at?: string | null
          expected_tier?: string
          id?: string
          test_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_validation_checks_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      porter_analysis: {
        Row: {
          buyer_power_analysis: string | null
          buyer_power_score: number | null
          company_id: string
          created_at: string
          id: string
          new_entrants_analysis: string | null
          new_entrants_score: number | null
          overall_competitiveness: string | null
          recommendations: string | null
          rivalry_analysis: string | null
          rivalry_score: number | null
          substitutes_analysis: string | null
          substitutes_score: number | null
          supplier_power_analysis: string | null
          supplier_power_score: number | null
          updated_at: string
        }
        Insert: {
          buyer_power_analysis?: string | null
          buyer_power_score?: number | null
          company_id: string
          created_at?: string
          id?: string
          new_entrants_analysis?: string | null
          new_entrants_score?: number | null
          overall_competitiveness?: string | null
          recommendations?: string | null
          rivalry_analysis?: string | null
          rivalry_score?: number | null
          substitutes_analysis?: string | null
          substitutes_score?: number | null
          supplier_power_analysis?: string | null
          supplier_power_score?: number | null
          updated_at?: string
        }
        Update: {
          buyer_power_analysis?: string | null
          buyer_power_score?: number | null
          company_id?: string
          created_at?: string
          id?: string
          new_entrants_analysis?: string | null
          new_entrants_score?: number | null
          overall_competitiveness?: string | null
          recommendations?: string | null
          rivalry_analysis?: string | null
          rivalry_score?: number | null
          substitutes_analysis?: string | null
          substitutes_score?: number | null
          supplier_power_analysis?: string | null
          supplier_power_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "porter_analysis_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      segment_templates: {
        Row: {
          created_at: string | null
          id: string
          is_premium: boolean | null
          segment: string
          template_data: Json
          template_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_premium?: boolean | null
          segment: string
          template_data: Json
          template_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_premium?: boolean | null
          segment?: string
          template_data?: Json
          template_type?: string
          updated_at?: string | null
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
          owner_id: string | null
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
          owner_id?: string | null
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
          owner_id?: string | null
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
      subscription_plans: {
        Row: {
          created_at: string | null
          features: Json
          id: string
          is_active: boolean | null
          limits: Json
          name: string
          price_annual: number | null
          price_monthly: number | null
          tier: Database["public"]["Enums"]["plan_tier"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          features: Json
          id?: string
          is_active?: boolean | null
          limits: Json
          name: string
          price_annual?: number | null
          price_monthly?: number | null
          tier: Database["public"]["Enums"]["plan_tier"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          features?: Json
          id?: string
          is_active?: boolean | null
          limits?: Json
          name?: string
          price_annual?: number | null
          price_monthly?: number | null
          tier?: Database["public"]["Enums"]["plan_tier"]
          updated_at?: string | null
        }
        Relationships: []
      }
      team_invites: {
        Row: {
          accepted: boolean | null
          accepted_at: string | null
          company_id: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invite_token: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          accepted?: boolean | null
          accepted_at?: string | null
          company_id: string
          created_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invite_token?: string
          invited_by: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          accepted?: boolean | null
          accepted_at?: string | null
          company_id?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invite_token?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: [
          {
            foreignKeyName: "team_invites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          accepted_at: string | null
          company_id: string
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["platform_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["platform_role"]
          user_id?: string
        }
        Relationships: []
      }
      weekly_checkins: {
        Row: {
          attendees: string[] | null
          blockers: string | null
          company_id: string
          completed_actions: string[] | null
          conducted_at: string | null
          conducted_by: string | null
          created_at: string | null
          execution_plan_id: string
          id: string
          mci_progress: number | null
          next_week_commitments: string | null
          notes: string | null
          week_number: number
          week_start_date: string
        }
        Insert: {
          attendees?: string[] | null
          blockers?: string | null
          company_id: string
          completed_actions?: string[] | null
          conducted_at?: string | null
          conducted_by?: string | null
          created_at?: string | null
          execution_plan_id: string
          id?: string
          mci_progress?: number | null
          next_week_commitments?: string | null
          notes?: string | null
          week_number: number
          week_start_date: string
        }
        Update: {
          attendees?: string[] | null
          blockers?: string | null
          company_id?: string
          completed_actions?: string[] | null
          conducted_at?: string | null
          conducted_by?: string | null
          created_at?: string | null
          execution_plan_id?: string
          id?: string
          mci_progress?: number | null
          next_week_commitments?: string | null
          notes?: string | null
          week_number?: number
          week_start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_checkins_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "weekly_checkins_execution_plan_id_fkey"
            columns: ["execution_plan_id"]
            isOneToOne: false
            referencedRelation: "execution_plan"
            referencedColumns: ["id"]
          },
        ]
      }
      wizard_progress: {
        Row: {
          company_id: string | null
          completed_steps: number[] | null
          created_at: string | null
          current_step: number
          id: string
          step_data: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          company_id?: string | null
          completed_steps?: number[] | null
          created_at?: string | null
          current_step?: number
          id?: string
          step_data?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          company_id?: string | null
          completed_steps?: number[] | null
          created_at?: string | null
          current_step?: number
          id?: string
          step_data?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wizard_progress_company_id_fkey"
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
      has_platform_role: {
        Args: {
          _role: Database["public"]["Enums"]["platform_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _company_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_company_admin: {
        Args: { _company_id: string; _user_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "owner" | "admin" | "editor" | "viewer"
      insight_priority: "baixa" | "media" | "alta" | "critica"
      insight_status: "novo" | "visualizado" | "resolvido" | "ignorado"
      insight_type: "progresso" | "risco" | "oportunidade" | "recomendacao"
      objective_status:
        | "nao_iniciado"
        | "em_andamento"
        | "em_risco"
        | "concluido"
        | "pausado"
      plan_tier: "free" | "pro" | "business" | "enterprise"
      platform_role: "platform_admin" | "platform_moderator"
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
      app_role: ["owner", "admin", "editor", "viewer"],
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
      plan_tier: ["free", "pro", "business", "enterprise"],
      platform_role: ["platform_admin", "platform_moderator"],
    },
  },
} as const
