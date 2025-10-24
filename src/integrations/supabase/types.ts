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
      assurance_coverage: {
        Row: {
          assurance_by_internal_audit_score: number | null
          assurance_by_third_party_score: number | null
          assurance_score: number | null
          auditable_area_id: string
          comments: string | null
          coverage_level: Database["public"]["Enums"]["coverage_level_type"]
          created_at: string | null
          id: string
          last_assurance_date: string | null
          provider_type: Database["public"]["Enums"]["provider_type"]
          updated_at: string | null
          weight: number | null
          weight_ref: string | null
        }
        Insert: {
          assurance_by_internal_audit_score?: number | null
          assurance_by_third_party_score?: number | null
          assurance_score?: number | null
          auditable_area_id: string
          comments?: string | null
          coverage_level: Database["public"]["Enums"]["coverage_level_type"]
          created_at?: string | null
          id?: string
          last_assurance_date?: string | null
          provider_type?: Database["public"]["Enums"]["provider_type"]
          updated_at?: string | null
          weight?: number | null
          weight_ref?: string | null
        }
        Update: {
          assurance_by_internal_audit_score?: number | null
          assurance_by_third_party_score?: number | null
          assurance_score?: number | null
          auditable_area_id?: string
          comments?: string | null
          coverage_level?: Database["public"]["Enums"]["coverage_level_type"]
          created_at?: string | null
          id?: string
          last_assurance_date?: string | null
          provider_type?: Database["public"]["Enums"]["provider_type"]
          updated_at?: string | null
          weight?: number | null
          weight_ref?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assurance_coverage_auditable_area_id_fkey"
            columns: ["auditable_area_id"]
            isOneToOne: false
            referencedRelation: "auditable_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_assurance_coverage_auditable_area"
            columns: ["auditable_area_id"]
            isOneToOne: false
            referencedRelation: "auditable_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_assurance_coverage_weight_ref"
            columns: ["weight_ref"]
            isOneToOne: false
            referencedRelation: "risk_weights"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_trail: {
        Row: {
          after_value: string | null
          before_value: string | null
          change_type: Database["public"]["Enums"]["change_type"]
          entity_id: string
          entity_type: string
          id: string
          justification: string | null
          timestamp: string | null
          user_name: string
        }
        Insert: {
          after_value?: string | null
          before_value?: string | null
          change_type: Database["public"]["Enums"]["change_type"]
          entity_id: string
          entity_type: string
          id?: string
          justification?: string | null
          timestamp?: string | null
          user_name: string
        }
        Update: {
          after_value?: string | null
          before_value?: string | null
          change_type?: Database["public"]["Enums"]["change_type"]
          entity_id?: string
          entity_type?: string
          id?: string
          justification?: string | null
          timestamp?: string | null
          user_name?: string
        }
        Relationships: []
      }
      auditable_areas: {
        Row: {
          business_unit: string
          category: Database["public"]["Enums"]["category_type"]
          comments: string | null
          created_at: string | null
          entity_id: string
          id: string
          last_audit_date: string | null
          last_audit_result:
            | Database["public"]["Enums"]["last_audit_result_type"]
            | null
          name: string
          priority_level: number | null
          proposed_audit_year: number | null
          regulation: string | null
          regulatory_requirement: boolean | null
          responsible_c_level: string | null
          updated_at: string | null
        }
        Insert: {
          business_unit: string
          category: Database["public"]["Enums"]["category_type"]
          comments?: string | null
          created_at?: string | null
          entity_id: string
          id?: string
          last_audit_date?: string | null
          last_audit_result?:
            | Database["public"]["Enums"]["last_audit_result_type"]
            | null
          name: string
          priority_level?: number | null
          proposed_audit_year?: number | null
          regulation?: string | null
          regulatory_requirement?: boolean | null
          responsible_c_level?: string | null
          updated_at?: string | null
        }
        Update: {
          business_unit?: string
          category?: Database["public"]["Enums"]["category_type"]
          comments?: string | null
          created_at?: string | null
          entity_id?: string
          id?: string
          last_audit_date?: string | null
          last_audit_result?:
            | Database["public"]["Enums"]["last_audit_result_type"]
            | null
          name?: string
          priority_level?: number | null
          proposed_audit_year?: number | null
          regulation?: string | null
          regulatory_requirement?: boolean | null
          responsible_c_level?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auditable_areas_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_auditable_areas_entity"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          created_at: string | null
          id: string
          name: string
          parent_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entities_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_entities_parent"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
      }
      priority_results: {
        Row: {
          auditable_area_id: string
          created_at: string | null
          id: string
          justification: string | null
          overridden: boolean | null
          priority_level: number
          proposed_audit_year: number
          timestamp: string | null
          updated_at: string | null
        }
        Insert: {
          auditable_area_id: string
          created_at?: string | null
          id?: string
          justification?: string | null
          overridden?: boolean | null
          priority_level: number
          proposed_audit_year: number
          timestamp?: string | null
          updated_at?: string | null
        }
        Update: {
          auditable_area_id?: string
          created_at?: string | null
          id?: string
          justification?: string | null
          overridden?: boolean | null
          priority_level?: number
          proposed_audit_year?: number
          timestamp?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_priority_results_auditable_area"
            columns: ["auditable_area_id"]
            isOneToOne: false
            referencedRelation: "auditable_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "priority_results_auditable_area_id_fkey"
            columns: ["auditable_area_id"]
            isOneToOne: false
            referencedRelation: "auditable_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_factors: {
        Row: {
          assurance_haircut: number | null
          auditable_area_id: string
          c_level_concerns: Database["public"]["Enums"]["risk_level"]
          combined_residual_risk: number | null
          combined_residual_risk_level:
            | Database["public"]["Enums"]["risk_level"]
            | null
          created_at: string | null
          erm_residual_risk: Database["public"]["Enums"]["risk_level"]
          financial_impact: Database["public"]["Enums"]["risk_level"]
          id: string
          inherent_risk_score: number | null
          internal_audit_residual_risk: Database["public"]["Enums"]["risk_level"]
          legal_compliance_impact: Database["public"]["Enums"]["risk_level"]
          new_process_system: Database["public"]["Enums"]["risk_level"]
          stakeholder_impact: Database["public"]["Enums"]["risk_level"]
          strategic_significance: Database["public"]["Enums"]["risk_level"]
          technological_cyber_impact: Database["public"]["Enums"]["risk_level"]
          updated_at: string | null
        }
        Insert: {
          assurance_haircut?: number | null
          auditable_area_id: string
          c_level_concerns?: Database["public"]["Enums"]["risk_level"]
          combined_residual_risk?: number | null
          combined_residual_risk_level?:
            | Database["public"]["Enums"]["risk_level"]
            | null
          created_at?: string | null
          erm_residual_risk?: Database["public"]["Enums"]["risk_level"]
          financial_impact?: Database["public"]["Enums"]["risk_level"]
          id?: string
          inherent_risk_score?: number | null
          internal_audit_residual_risk?: Database["public"]["Enums"]["risk_level"]
          legal_compliance_impact?: Database["public"]["Enums"]["risk_level"]
          new_process_system?: Database["public"]["Enums"]["risk_level"]
          stakeholder_impact?: Database["public"]["Enums"]["risk_level"]
          strategic_significance?: Database["public"]["Enums"]["risk_level"]
          technological_cyber_impact?: Database["public"]["Enums"]["risk_level"]
          updated_at?: string | null
        }
        Update: {
          assurance_haircut?: number | null
          auditable_area_id?: string
          c_level_concerns?: Database["public"]["Enums"]["risk_level"]
          combined_residual_risk?: number | null
          combined_residual_risk_level?:
            | Database["public"]["Enums"]["risk_level"]
            | null
          created_at?: string | null
          erm_residual_risk?: Database["public"]["Enums"]["risk_level"]
          financial_impact?: Database["public"]["Enums"]["risk_level"]
          id?: string
          inherent_risk_score?: number | null
          internal_audit_residual_risk?: Database["public"]["Enums"]["risk_level"]
          legal_compliance_impact?: Database["public"]["Enums"]["risk_level"]
          new_process_system?: Database["public"]["Enums"]["risk_level"]
          stakeholder_impact?: Database["public"]["Enums"]["risk_level"]
          strategic_significance?: Database["public"]["Enums"]["risk_level"]
          technological_cyber_impact?: Database["public"]["Enums"]["risk_level"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_risk_factors_auditable_area"
            columns: ["auditable_area_id"]
            isOneToOne: true
            referencedRelation: "auditable_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_factors_auditable_area_id_fkey"
            columns: ["auditable_area_id"]
            isOneToOne: true
            referencedRelation: "auditable_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_weights: {
        Row: {
          category: Database["public"]["Enums"]["weight_category"]
          created_at: string | null
          description: string | null
          factor_name: string
          id: string
          updated_at: string | null
          weight: number
        }
        Insert: {
          category: Database["public"]["Enums"]["weight_category"]
          created_at?: string | null
          description?: string | null
          factor_name: string
          id?: string
          updated_at?: string | null
          weight: number
        }
        Update: {
          category?: Database["public"]["Enums"]["weight_category"]
          created_at?: string | null
          description?: string | null
          factor_name?: string
          id?: string
          updated_at?: string | null
          weight?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_assurance_haircut: {
        Args: { area_id: string }
        Returns: number
      }
      calculate_assurance_score: {
        Args: { coverage: Database["public"]["Enums"]["coverage_level_type"] }
        Returns: number
      }
      calculate_inherent_risk_score: {
        Args: { risk_factor_id: string }
        Returns: number
      }
      calculate_priority_level: {
        Args: { p_auditable_area_id: string }
        Returns: number
      }
      calculate_proposed_audit_year: {
        Args: { p_priority_level: number }
        Returns: number
      }
      calculate_residual_risks: {
        Args: { risk_factor_id: string }
        Returns: {
          erm_residual: Database["public"]["Enums"]["risk_level"]
          internal_audit_residual: Database["public"]["Enums"]["risk_level"]
        }[]
      }
      coverage_level_to_score: {
        Args: { level: Database["public"]["Enums"]["coverage_level_type"] }
        Returns: number
      }
      erm_risk_level_to_score: {
        Args: { level: Database["public"]["Enums"]["risk_level"] }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_authenticated: { Args: never; Returns: boolean }
      numeric_to_risk_level: {
        Args: { score: number }
        Returns: Database["public"]["Enums"]["risk_level"]
      }
      risk_level_to_score: {
        Args: { level: Database["public"]["Enums"]["risk_level"] }
        Returns: number
      }
      update_audit_priority: {
        Args: { p_auditable_area_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "auditor" | "viewer"
      category_type: "Operational" | "Financial" | "IT" | "Compliance" | "HR"
      change_type: "Create" | "Update" | "Delete"
      coverage_level_type: "Comprehensive" | "Moderate" | "Limited"
      last_audit_result_type:
        | "None"
        | "No findings"
        | "Medium findings"
        | "High findings"
      provider_type: "InternalAudit" | "ThirdParty"
      risk_level: "Low" | "Medium" | "High"
      weight_category: "RiskFactor" | "AssuranceCoverage" | "ResidualRisk"
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
      app_role: ["admin", "auditor", "viewer"],
      category_type: ["Operational", "Financial", "IT", "Compliance", "HR"],
      change_type: ["Create", "Update", "Delete"],
      coverage_level_type: ["Comprehensive", "Moderate", "Limited"],
      last_audit_result_type: [
        "None",
        "No findings",
        "Medium findings",
        "High findings",
      ],
      provider_type: ["InternalAudit", "ThirdParty"],
      risk_level: ["Low", "Medium", "High"],
      weight_category: ["RiskFactor", "AssuranceCoverage", "ResidualRisk"],
    },
  },
} as const
