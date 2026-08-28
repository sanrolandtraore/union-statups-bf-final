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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      ai_job_recommendations: {
        Row: {
          created_at: string
          id: string
          is_viewed: boolean | null
          job_id: string
          match_details: Json | null
          match_score: number
          talent_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_viewed?: boolean | null
          job_id: string
          match_details?: Json | null
          match_score: number
          talent_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_viewed?: boolean | null
          job_id?: string
          match_details?: Json | null
          match_score?: number
          talent_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_job_recommendations_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string
          category_id: string | null
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          reading_time_min: number | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          category_id?: string | null
          content: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time_min?: number | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          category_id?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time_min?: number | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      boost_analytics: {
        Row: {
          boost_id: string
          created_at: string
          event_type: string
          id: string
          viewer_id: string | null
        }
        Insert: {
          boost_id: string
          created_at?: string
          event_type: string
          id?: string
          viewer_id?: string | null
        }
        Update: {
          boost_id?: string
          created_at?: string
          event_type?: string
          id?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boost_analytics_boost_id_fkey"
            columns: ["boost_id"]
            isOneToOne: false
            referencedRelation: "boosts"
            referencedColumns: ["id"]
          },
        ]
      }
      boosts: {
        Row: {
          boost_type: string
          created_at: string
          ends_at: string
          id: string
          price_paid: number
          starts_at: string
          status: string
          stripe_payment_id: string | null
          target_id: string | null
          user_id: string
        }
        Insert: {
          boost_type: string
          created_at?: string
          ends_at?: string
          id?: string
          price_paid?: number
          starts_at?: string
          status?: string
          stripe_payment_id?: string | null
          target_id?: string | null
          user_id: string
        }
        Update: {
          boost_type?: string
          created_at?: string
          ends_at?: string
          id?: string
          price_paid?: number
          starts_at?: string
          status?: string
          stripe_payment_id?: string | null
          target_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      client_error_logs: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          message: string
          stack: string | null
          url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          message: string
          stack?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          message?: string
          stack?: string | null
          url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      coaching_sessions: {
        Row: {
          created_at: string
          duration_minutes: number | null
          feedback: string | null
          id: string
          meeting_url: string | null
          mentee_id: string
          mentor_id: string
          notes: string | null
          price: number | null
          rating: number | null
          scheduled_at: string
          session_type: string | null
          status: string | null
          topic: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          feedback?: string | null
          id?: string
          meeting_url?: string | null
          mentee_id: string
          mentor_id: string
          notes?: string | null
          price?: number | null
          rating?: number | null
          scheduled_at: string
          session_type?: string | null
          status?: string | null
          topic?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          feedback?: string | null
          id?: string
          meeting_url?: string | null
          mentee_id?: string
          mentor_id?: string
          notes?: string | null
          price?: number | null
          rating?: number | null
          scheduled_at?: string
          session_type?: string | null
          status?: string | null
          topic?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "coaching_sessions_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      commitments: {
        Row: {
          amount: number
          contract_url: string | null
          created_at: string
          deal_id: string
          id: string
          member_id: string
          signed_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          contract_url?: string | null
          created_at?: string
          deal_id: string
          id?: string
          member_id: string
          signed_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          contract_url?: string | null
          created_at?: string
          deal_id?: string
          id?: string
          member_id?: string
          signed_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commitments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commitments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "syndicate_members"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          receiver_id: string
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          receiver_id: string
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          receiver_id?: string
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      deal_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          answered_by: string | null
          asked_by: string
          created_at: string
          deal_id: string
          id: string
          is_public: boolean | null
          question: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          asked_by: string
          created_at?: string
          deal_id: string
          id?: string
          is_public?: boolean | null
          question: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          asked_by?: string
          created_at?: string
          deal_id?: string
          id?: string
          is_public?: boolean | null
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_questions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          cap_table: Json | null
          city: string | null
          created_at: string
          deadline: string | null
          description: string | null
          equity_percentage: number | null
          id: string
          kpi_data: Json | null
          min_commitment: number | null
          pitch_deck_url: string | null
          raised_amount: number | null
          sector: string | null
          stage: string | null
          startup_name: string | null
          status: string
          syndicate_id: string
          target_amount: number
          term_sheet_url: string | null
          title: string
          updated_at: string
          valuation: number | null
        }
        Insert: {
          cap_table?: Json | null
          city?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          equity_percentage?: number | null
          id?: string
          kpi_data?: Json | null
          min_commitment?: number | null
          pitch_deck_url?: string | null
          raised_amount?: number | null
          sector?: string | null
          stage?: string | null
          startup_name?: string | null
          status?: string
          syndicate_id: string
          target_amount: number
          term_sheet_url?: string | null
          title: string
          updated_at?: string
          valuation?: number | null
        }
        Update: {
          cap_table?: Json | null
          city?: string | null
          created_at?: string
          deadline?: string | null
          description?: string | null
          equity_percentage?: number | null
          id?: string
          kpi_data?: Json | null
          min_commitment?: number | null
          pitch_deck_url?: string | null
          raised_amount?: number | null
          sector?: string | null
          stage?: string | null
          startup_name?: string | null
          status?: string
          syndicate_id?: string
          target_amount?: number
          term_sheet_url?: string | null
          title?: string
          updated_at?: string
          valuation?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_syndicate_id_fkey"
            columns: ["syndicate_id"]
            isOneToOne: false
            referencedRelation: "syndicates"
            referencedColumns: ["id"]
          },
        ]
      }
      distribution_details: {
        Row: {
          amount: number
          created_at: string
          distribution_id: string
          id: string
          member_id: string
          percentage: number | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          distribution_id: string
          id?: string
          member_id: string
          percentage?: number | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          distribution_id?: string
          id?: string
          member_id?: string
          percentage?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "distribution_details_distribution_id_fkey"
            columns: ["distribution_id"]
            isOneToOne: false
            referencedRelation: "distributions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "distribution_details_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "syndicate_members"
            referencedColumns: ["id"]
          },
        ]
      }
      distributions: {
        Row: {
          carry_amount: number
          created_at: string
          deal_id: string
          distributed_at: string | null
          id: string
          net_amount: number
          status: string
          total_amount: number
        }
        Insert: {
          carry_amount: number
          created_at?: string
          deal_id: string
          distributed_at?: string | null
          id?: string
          net_amount: number
          status?: string
          total_amount: number
        }
        Update: {
          carry_amount?: number
          created_at?: string
          deal_id?: string
          distributed_at?: string | null
          id?: string
          net_amount?: number
          status?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "distributions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      due_diligence_reports: {
        Row: {
          campaign_id: string | null
          compliance_checklist: Json
          compliance_score: number
          created_at: string
          finance_score: number
          financial_analysis: string
          id: string
          investor_user_id: string
          market_analysis: string
          market_score: number
          overall_score: number
          recommendations: string[]
          risk_flags: string[]
          risk_score: number
          startup_name: string
          team_analysis: string
          team_score: number
        }
        Insert: {
          campaign_id?: string | null
          compliance_checklist?: Json
          compliance_score: number
          created_at?: string
          finance_score: number
          financial_analysis: string
          id?: string
          investor_user_id: string
          market_analysis: string
          market_score: number
          overall_score: number
          recommendations?: string[]
          risk_flags?: string[]
          risk_score: number
          startup_name: string
          team_analysis: string
          team_score: number
        }
        Update: {
          campaign_id?: string | null
          compliance_checklist?: Json
          compliance_score?: number
          created_at?: string
          finance_score?: number
          financial_analysis?: string
          id?: string
          investor_user_id?: string
          market_analysis?: string
          market_score?: number
          overall_score?: number
          recommendations?: string[]
          risk_flags?: string[]
          risk_score?: number
          startup_name?: string
          team_analysis?: string
          team_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "due_diligence_reports_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "fundraising_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      faq_items: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          is_published: boolean
          question: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          id?: string
          is_published?: boolean
          question: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          is_published?: boolean
          question?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      fundraising_campaigns: {
        Row: {
          city: string | null
          company_name: string | null
          created_at: string
          description: string | null
          equity_offered: number | null
          id: string
          is_featured: boolean | null
          min_ticket: number | null
          pitch_deck_url: string | null
          raised_so_far: number | null
          revenue_monthly: number | null
          sector: string | null
          stage: string | null
          status: string
          target_amount: number
          team_size: number | null
          timeline: string | null
          title: string
          traction: string | null
          updated_at: string
          use_of_funds: string | null
          user_id: string
          valuation: number | null
        }
        Insert: {
          city?: string | null
          company_name?: string | null
          created_at?: string
          description?: string | null
          equity_offered?: number | null
          id?: string
          is_featured?: boolean | null
          min_ticket?: number | null
          pitch_deck_url?: string | null
          raised_so_far?: number | null
          revenue_monthly?: number | null
          sector?: string | null
          stage?: string | null
          status?: string
          target_amount?: number
          team_size?: number | null
          timeline?: string | null
          title: string
          traction?: string | null
          updated_at?: string
          use_of_funds?: string | null
          user_id: string
          valuation?: number | null
        }
        Update: {
          city?: string | null
          company_name?: string | null
          created_at?: string
          description?: string | null
          equity_offered?: number | null
          id?: string
          is_featured?: boolean | null
          min_ticket?: number | null
          pitch_deck_url?: string | null
          raised_so_far?: number | null
          revenue_monthly?: number | null
          sector?: string | null
          stage?: string | null
          status?: string
          target_amount?: number
          team_size?: number | null
          timeline?: string | null
          title?: string
          traction?: string | null
          updated_at?: string
          use_of_funds?: string | null
          user_id?: string
          valuation?: number | null
        }
        Relationships: []
      }
      fundraising_interests: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          investor_user_id: string
          message: string | null
          proposed_amount: number | null
          status: string
          updated_at: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          investor_user_id: string
          message?: string | null
          proposed_amount?: number | null
          status?: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          investor_user_id?: string
          message?: string | null
          proposed_amount?: number | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fundraising_interests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "fundraising_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_media: {
        Row: {
          created_at: string
          description: string | null
          file_url: string | null
          id: string
          is_published: boolean
          media_type: string
          sort_order: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          uploaded_by: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          media_type?: string
          sort_order?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          uploaded_by?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          media_type?: string
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      incubation_data_room: {
        Row: {
          created_at: string
          document_type: string
          file_url: string | null
          id: string
          review_note: string | null
          reviewed_by: string | null
          status: string
          title: string
          track_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_type: string
          file_url?: string | null
          id?: string
          review_note?: string | null
          reviewed_by?: string | null
          status?: string
          title: string
          track_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_type?: string
          file_url?: string | null
          id?: string
          review_note?: string | null
          reviewed_by?: string | null
          status?: string
          title?: string
          track_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incubation_data_room_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "incubation_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      incubation_diagnostics: {
        Row: {
          ai_summary: string | null
          answers: Json
          created_at: string
          id: string
          maturity_level: string
          recommendations: string[]
          score: number
          user_id: string
        }
        Insert: {
          ai_summary?: string | null
          answers?: Json
          created_at?: string
          id?: string
          maturity_level: string
          recommendations?: string[]
          score?: number
          user_id: string
        }
        Update: {
          ai_summary?: string | null
          answers?: Json
          created_at?: string
          id?: string
          maturity_level?: string
          recommendations?: string[]
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      incubation_kpis: {
        Row: {
          burn_rate_fcfa: number
          created_at: string
          customers: number
          funding_raised_fcfa: number
          id: string
          notes: string | null
          period_month: string
          revenue_fcfa: number
          runway_months: number | null
          team_size: number
          track_id: string
          updated_at: string
        }
        Insert: {
          burn_rate_fcfa?: number
          created_at?: string
          customers?: number
          funding_raised_fcfa?: number
          id?: string
          notes?: string | null
          period_month: string
          revenue_fcfa?: number
          runway_months?: number | null
          team_size?: number
          track_id: string
          updated_at?: string
        }
        Update: {
          burn_rate_fcfa?: number
          created_at?: string
          customers?: number
          funding_raised_fcfa?: number
          id?: string
          notes?: string | null
          period_month?: string
          revenue_fcfa?: number
          runway_months?: number | null
          team_size?: number
          track_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incubation_kpis_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "incubation_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      incubation_session_reports: {
        Row: {
          created_at: string
          id: string
          mentor_user_id: string
          next_actions: string[]
          rating: number | null
          recommendations: string[]
          session_id: string | null
          summary: string
          track_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mentor_user_id: string
          next_actions?: string[]
          rating?: number | null
          recommendations?: string[]
          session_id?: string | null
          summary: string
          track_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mentor_user_id?: string
          next_actions?: string[]
          rating?: number | null
          recommendations?: string[]
          session_id?: string | null
          summary?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incubation_session_reports_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "coaching_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incubation_session_reports_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "incubation_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      incubation_stage_progress: {
        Row: {
          created_at: string
          id: string
          review_note: string | null
          sort_order: number
          stage_template_id: string
          started_at: string | null
          status: string
          submitted_at: string | null
          track_id: string
          updated_at: string
          validated_at: string | null
          validated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          review_note?: string | null
          sort_order?: number
          stage_template_id: string
          started_at?: string | null
          status?: string
          submitted_at?: string | null
          track_id: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          review_note?: string | null
          sort_order?: number
          stage_template_id?: string
          started_at?: string | null
          status?: string
          submitted_at?: string | null
          track_id?: string
          updated_at?: string
          validated_at?: string | null
          validated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "incubation_stage_progress_stage_template_id_fkey"
            columns: ["stage_template_id"]
            isOneToOne: false
            referencedRelation: "incubation_stage_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incubation_stage_progress_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "incubation_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      incubation_stage_templates: {
        Row: {
          created_at: string
          description: string | null
          duration_weeks: number
          id: string
          is_active: boolean
          maturity_level: string
          objectives: string[]
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_weeks?: number
          id?: string
          is_active?: boolean
          maturity_level: string
          objectives?: string[]
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_weeks?: number
          id?: string
          is_active?: boolean
          maturity_level?: string
          objectives?: string[]
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      incubation_task_progress: {
        Row: {
          completed_at: string | null
          created_at: string
          deliverable_url: string | null
          id: string
          notes: string | null
          review_note: string | null
          reviewed_by: string | null
          status: string
          task_template_id: string
          track_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deliverable_url?: string | null
          id?: string
          notes?: string | null
          review_note?: string | null
          reviewed_by?: string | null
          status?: string
          task_template_id: string
          track_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deliverable_url?: string | null
          id?: string
          notes?: string | null
          review_note?: string | null
          reviewed_by?: string | null
          status?: string
          task_template_id?: string
          track_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incubation_task_progress_task_template_id_fkey"
            columns: ["task_template_id"]
            isOneToOne: false
            referencedRelation: "incubation_task_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incubation_task_progress_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "incubation_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      incubation_task_templates: {
        Row: {
          created_at: string
          description: string | null
          estimated_hours: number | null
          id: string
          is_deliverable: boolean
          program_id: string | null
          resource_url: string | null
          sort_order: number
          stage_template_id: string
          task_type: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          is_deliverable?: boolean
          program_id?: string | null
          resource_url?: string | null
          sort_order?: number
          stage_template_id: string
          task_type?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          id?: string
          is_deliverable?: boolean
          program_id?: string | null
          resource_url?: string | null
          sort_order?: number
          stage_template_id?: string
          task_type?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "incubation_task_templates_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "startup_school_programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incubation_task_templates_stage_template_id_fkey"
            columns: ["stage_template_id"]
            isOneToOne: false
            referencedRelation: "incubation_stage_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      incubation_tracks: {
        Row: {
          company_name: string | null
          completed_at: string | null
          created_at: string
          diagnostic_id: string | null
          id: string
          maturity_level: string
          mentor_id: string | null
          progress_percentage: number
          started_at: string
          status: string
          target_end_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          completed_at?: string | null
          created_at?: string
          diagnostic_id?: string | null
          id?: string
          maturity_level: string
          mentor_id?: string | null
          progress_percentage?: number
          started_at?: string
          status?: string
          target_end_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          completed_at?: string | null
          created_at?: string
          diagnostic_id?: string | null
          id?: string
          maturity_level?: string
          mentor_id?: string | null
          progress_percentage?: number
          started_at?: string
          status?: string
          target_end_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incubation_tracks_diagnostic_id_fkey"
            columns: ["diagnostic_id"]
            isOneToOne: false
            referencedRelation: "incubation_diagnostics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incubation_tracks_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_profiles: {
        Row: {
          created_at: string
          fund_name: string | null
          id: string
          investment_focus: string[] | null
          max_ticket: number | null
          min_ticket: number | null
          portfolio_count: number | null
          preferred_stages: string[] | null
          thesis: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fund_name?: string | null
          id?: string
          investment_focus?: string[] | null
          max_ticket?: number | null
          min_ticket?: number | null
          portfolio_count?: number | null
          preferred_stages?: string[] | null
          thesis?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          fund_name?: string | null
          id?: string
          investment_focus?: string[] | null
          max_ticket?: number | null
          min_ticket?: number | null
          portfolio_count?: number | null
          preferred_stages?: string[] | null
          thesis?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          ai_match_details: Json | null
          ai_match_score: number | null
          applicant_id: string
          cover_message: string | null
          created_at: string
          id: string
          job_id: string
          status: string
          updated_at: string
        }
        Insert: {
          ai_match_details?: Json | null
          ai_match_score?: number | null
          applicant_id: string
          cover_message?: string | null
          created_at?: string
          id?: string
          job_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          ai_match_details?: Json | null
          ai_match_score?: number | null
          applicant_id?: string
          cover_message?: string | null
          created_at?: string
          id?: string
          job_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          ai_analysis: Json | null
          applications_count: number | null
          city: string | null
          company_name: string | null
          created_at: string
          description: string | null
          equity_offered: string | null
          experience_min: number | null
          funding_stage: string | null
          id: string
          is_active: boolean | null
          job_type: Database["public"]["Enums"]["job_type"]
          remote_ok: boolean | null
          salary_range: string | null
          sector: string | null
          skills_required: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          applications_count?: number | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          description?: string | null
          equity_offered?: string | null
          experience_min?: number | null
          funding_stage?: string | null
          id?: string
          is_active?: boolean | null
          job_type?: Database["public"]["Enums"]["job_type"]
          remote_ok?: boolean | null
          salary_range?: string | null
          sector?: string | null
          skills_required?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          applications_count?: number | null
          city?: string | null
          company_name?: string | null
          created_at?: string
          description?: string | null
          equity_offered?: string | null
          experience_min?: number | null
          funding_stage?: string | null
          id?: string
          is_active?: boolean | null
          job_type?: Database["public"]["Enums"]["job_type"]
          remote_ok?: boolean | null
          salary_range?: string | null
          sector?: string | null
          skills_required?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      legal_documents: {
        Row: {
          created_at: string
          creator_user_id: string
          document_type: string
          id: string
          params: Json
          party_a_name: string
          party_b_name: string
          storage_path: string | null
        }
        Insert: {
          created_at?: string
          creator_user_id: string
          document_type: string
          id?: string
          params?: Json
          party_a_name: string
          party_b_name: string
          storage_path?: string | null
        }
        Update: {
          created_at?: string
          creator_user_id?: string
          document_type?: string
          id?: string
          params?: Json
          party_a_name?: string
          party_b_name?: string
          storage_path?: string | null
        }
        Relationships: []
      }
      legal_pages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_published: boolean
          meta_description: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_published?: boolean
          meta_description?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_published?: boolean
          meta_description?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      mentor_profiles: {
        Row: {
          availability: string | null
          bio: string | null
          company_name: string | null
          created_at: string
          experience_years: number | null
          id: string
          specialty: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          experience_years?: number | null
          id?: string
          specialty?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          availability?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          experience_years?: number | null
          id?: string
          specialty?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mentors: {
        Row: {
          achievements: string | null
          availability: string | null
          bio: string | null
          company_name: string | null
          created_at: string
          experience_years: number | null
          hourly_rate: number | null
          id: string
          is_approved: boolean | null
          is_featured: boolean | null
          linkedin_url: string | null
          rating: number | null
          specialty: string[] | null
          total_sessions: number | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          achievements?: string | null
          availability?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          experience_years?: number | null
          hourly_rate?: number | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          linkedin_url?: string | null
          rating?: number | null
          specialty?: string[] | null
          total_sessions?: number | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          achievements?: string | null
          availability?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          experience_years?: number | null
          hourly_rate?: number | null
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          linkedin_url?: string | null
          rating?: number | null
          specialty?: string[] | null
          total_sessions?: number | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      partner_profiles: {
        Row: {
          company_name: string | null
          created_at: string
          description: string | null
          expertise: string[] | null
          id: string
          portfolio_url: string | null
          service_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          description?: string | null
          expertise?: string[] | null
          id?: string
          portfolio_url?: string | null
          service_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          description?: string | null
          expertise?: string[] | null
          id?: string
          portfolio_url?: string | null
          service_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          billing_cycle: string
          created_at: string
          currency: string
          id: string
          operator_id: string | null
          payment_method: string | null
          payment_url: string | null
          plan_id: string
          provider: string
          raw_response: Json | null
          status: string
          transaction_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          billing_cycle: string
          created_at?: string
          currency?: string
          id?: string
          operator_id?: string | null
          payment_method?: string | null
          payment_url?: string | null
          plan_id: string
          provider?: string
          raw_response?: Json | null
          status?: string
          transaction_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          billing_cycle?: string
          created_at?: string
          currency?: string
          id?: string
          operator_id?: string | null
          payment_method?: string | null
          payment_url?: string | null
          plan_id?: string
          provider?: string
          raw_response?: Json | null
          status?: string
          transaction_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      pitch_room_message_votes: {
        Row: {
          created_at: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pitch_room_message_votes_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "pitch_room_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      pitch_room_messages: {
        Row: {
          created_at: string
          id: string
          is_anonymous: boolean
          is_answered: boolean
          is_pinned: boolean
          message: string
          message_type: string
          parent_id: string | null
          room_id: string
          upvotes: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_anonymous?: boolean
          is_answered?: boolean
          is_pinned?: boolean
          message: string
          message_type?: string
          parent_id?: string | null
          room_id: string
          upvotes?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_anonymous?: boolean
          is_answered?: boolean
          is_pinned?: boolean
          message?: string
          message_type?: string
          parent_id?: string | null
          room_id?: string
          upvotes?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pitch_room_messages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "pitch_room_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pitch_room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "pitch_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      pitch_room_participants: {
        Row: {
          can_publish_audio: boolean
          can_publish_video: boolean
          created_at: string
          hand_raised: boolean
          hand_raised_at: string | null
          id: string
          joined_at: string | null
          left_at: string | null
          role: string
          room_id: string
          status: string
          user_id: string
        }
        Insert: {
          can_publish_audio?: boolean
          can_publish_video?: boolean
          created_at?: string
          hand_raised?: boolean
          hand_raised_at?: string | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          role?: string
          room_id: string
          status?: string
          user_id: string
        }
        Update: {
          can_publish_audio?: boolean
          can_publish_video?: boolean
          created_at?: string
          hand_raised?: boolean
          hand_raised_at?: string | null
          id?: string
          joined_at?: string | null
          left_at?: string | null
          role?: string
          room_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pitch_room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "pitch_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      pitch_rooms: {
        Row: {
          cover_image_url: string | null
          created_at: string
          creator_id: string
          description: string | null
          ended_at: string | null
          format: string
          id: string
          is_locked: boolean
          is_recording: boolean
          livekit_room_name: string | null
          max_participants: number
          recording_url: string | null
          scheduled_at: string | null
          settings: Json
          started_at: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          ended_at?: string | null
          format?: string
          id?: string
          is_locked?: boolean
          is_recording?: boolean
          livekit_room_name?: string | null
          max_participants?: number
          recording_url?: string | null
          scheduled_at?: string | null
          settings?: Json
          started_at?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          ended_at?: string | null
          format?: string
          id?: string
          is_locked?: boolean
          is_recording?: boolean
          livekit_room_name?: string | null
          max_participants?: number
          recording_url?: string | null
          scheduled_at?: string | null
          settings?: Json
          started_at?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      pitch_videos: {
        Row: {
          created_at: string
          description: string | null
          duration_seconds: number | null
          file_size_bytes: number | null
          id: string
          is_published: boolean
          owner_id: string
          storage_path: string
          thumbnail_path: string | null
          title: string
          updated_at: string
          views_count: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          is_published?: boolean
          owner_id: string
          storage_path: string
          thumbnail_path?: string | null
          title: string
          updated_at?: string
          views_count?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          id?: string
          is_published?: boolean
          owner_id?: string
          storage_path?: string
          thumbnail_path?: string | null
          title?: string
          updated_at?: string
          views_count?: number
        }
        Relationships: []
      }
      private_calls: {
        Row: {
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          initiator_id: string
          livekit_room_name: string | null
          recipient_id: string
          requested_at: string
          started_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          initiator_id: string
          livekit_room_name?: string | null
          recipient_id: string
          requested_at?: string
          started_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          initiator_id?: string
          livekit_room_name?: string | null
          recipient_id?: string
          requested_at?: string
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      pitch_audits: {
        Row: {
          ask_clarity: number
          business_model: number
          created_at: string
          id: string
          market_size: number
          overall_score: number
          problem_clarity: number
          recommendations: string[]
          source_filename: string
          storage_path: string | null
          storytelling: number
          strengths: string[]
          summary: string | null
          team_strength: number
          traction: number
          user_id: string
          weaknesses: string[]
        }
        Insert: {
          ask_clarity: number
          business_model: number
          created_at?: string
          id?: string
          market_size: number
          overall_score: number
          problem_clarity: number
          recommendations?: string[]
          source_filename: string
          storage_path?: string | null
          storytelling: number
          strengths?: string[]
          summary?: string | null
          team_strength: number
          traction: number
          user_id: string
          weaknesses?: string[]
        }
        Update: {
          ask_clarity?: number
          business_model?: number
          created_at?: string
          id?: string
          market_size?: number
          overall_score?: number
          problem_clarity?: number
          recommendations?: string[]
          source_filename?: string
          storage_path?: string | null
          storytelling?: number
          strengths?: string[]
          summary?: string | null
          team_strength?: number
          traction?: number
          user_id?: string
          weaknesses?: string[]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          badge_type: string | null
          bio: string | null
          city: string | null
          created_at: string
          full_name: string | null
          id: string
          is_verified: boolean
          kyc_document_url: string | null
          kyc_status: string
          last_seen_at: string | null
          linkedin_url: string | null
          preferences: Json
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          badge_type?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_verified?: boolean
          kyc_document_url?: string | null
          kyc_status?: string
          last_seen_at?: string | null
          linkedin_url?: string | null
          preferences?: Json
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          badge_type?: string | null
          bio?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_verified?: boolean
          kyc_document_url?: string | null
          kyc_status?: string
          last_seen_at?: string | null
          linkedin_url?: string | null
          preferences?: Json
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      program_enrollments: {
        Row: {
          completed_at: string | null
          completed_modules: string[] | null
          enrolled_at: string
          id: string
          program_id: string
          progress_percentage: number | null
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_modules?: string[] | null
          enrolled_at?: string
          id?: string
          program_id: string
          progress_percentage?: number | null
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_modules?: string[] | null
          enrolled_at?: string
          id?: string
          program_id?: string
          progress_percentage?: number | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "startup_school_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      project_access_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          nda_accepted: boolean
          nda_accepted_at: string | null
          owner_user_id: string
          project_id: string
          requester_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          nda_accepted?: boolean
          nda_accepted_at?: string | null
          owner_user_id: string
          project_id: string
          requester_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          nda_accepted?: boolean
          nda_accepted_at?: string | null
          owner_user_id?: string
          project_id?: string
          requester_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_access_requests_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      project_security: {
        Row: {
          created_at: string
          nda_required: boolean
          owner_user_id: string
          project_id: string
          updated_at: string
          visibility: string
        }
        Insert: {
          created_at?: string
          nda_required?: boolean
          owner_user_id: string
          project_id: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          created_at?: string
          nda_required?: boolean
          owner_user_id?: string
          project_id?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_security_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          advancement_stage: string
          city: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          looking_for: string[] | null
          moderated_at: string | null
          moderated_by: string | null
          moderation_note: string | null
          moderation_status: string
          sector: string | null
          skills_needed: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          advancement_stage?: string
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          looking_for?: string[] | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_note?: string | null
          moderation_status?: string
          sector?: string | null
          skills_needed?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          advancement_stage?: string
          city?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          looking_for?: string[] | null
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_note?: string | null
          moderation_status?: string
          sector?: string | null
          skills_needed?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limit_hits: {
        Row: {
          bucket_key: string
          created_at: string
          id: number
        }
        Insert: {
          bucket_key: string
          created_at?: string
          id?: number
        }
        Update: {
          bucket_key?: string
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      resources: {
        Row: {
          content: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          external_url: string | null
          file_url: string | null
          id: string
          is_published: boolean
          resource_type: string
          sort_order: number | null
          target_role: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          resource_type?: string
          sort_order?: number | null
          target_role?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean
          resource_type?: string
          sort_order?: number | null
          target_role?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      room_annotations: {
        Row: {
          action: Json
          created_at: string
          id: string
          room_id: string
          user_id: string
        }
        Insert: {
          action: Json
          created_at?: string
          id?: string
          room_id: string
          user_id: string
        }
        Update: {
          action?: Json
          created_at?: string
          id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_annotations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "pitch_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_recordings: {
        Row: {
          created_at: string
          duration_seconds: number | null
          egress_id: string | null
          ended_at: string | null
          id: string
          organizer_id: string
          room_id: string
          started_at: string
          status: string
          storage_path: string | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          egress_id?: string | null
          ended_at?: string | null
          id?: string
          organizer_id: string
          room_id: string
          started_at?: string
          status?: string
          storage_path?: string | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          egress_id?: string | null
          ended_at?: string | null
          id?: string
          organizer_id?: string
          room_id?: string
          started_at?: string
          status?: string
          storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_recordings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "pitch_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          company_name: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          message: string | null
          phone: string | null
          service_type: string
          status: string
          user_id: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          message?: string | null
          phone?: string | null
          service_type?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          phone?: string | null
          service_type?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      safe_agreements: {
        Row: {
          campaign_id: string | null
          company_legal_name: string
          created_at: string
          discount_rate: number | null
          governing_law: string
          has_mfn: boolean
          id: string
          investor_name: string
          investor_user_id: string | null
          purchase_amount: number
          startup_user_id: string
          status: string
          storage_path: string | null
          updated_at: string
          valuation_cap: number | null
        }
        Insert: {
          campaign_id?: string | null
          company_legal_name: string
          created_at?: string
          discount_rate?: number | null
          governing_law?: string
          has_mfn?: boolean
          id?: string
          investor_name: string
          investor_user_id?: string | null
          purchase_amount: number
          startup_user_id: string
          status?: string
          storage_path?: string | null
          updated_at?: string
          valuation_cap?: number | null
        }
        Update: {
          campaign_id?: string | null
          company_legal_name?: string
          created_at?: string
          discount_rate?: number | null
          governing_law?: string
          has_mfn?: boolean
          id?: string
          investor_name?: string
          investor_user_id?: string | null
          purchase_amount?: number
          startup_user_id?: string
          status?: string
          storage_path?: string | null
          updated_at?: string
          valuation_cap?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "safe_agreements_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "fundraising_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_kyc_submissions: {
        Row: {
          company_legal_name: string
          created_at: string
          id: string
          ifu_number: string | null
          incorporation_document_url: string | null
          legal_rep_full_name: string
          legal_rep_id_document_url: string | null
          rccm_document_url: string | null
          rccm_number: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company_legal_name: string
          created_at?: string
          id?: string
          ifu_number?: string | null
          incorporation_document_url?: string | null
          legal_rep_full_name: string
          legal_rep_id_document_url?: string | null
          rccm_document_url?: string | null
          rccm_number: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company_legal_name?: string
          created_at?: string
          id?: string
          ifu_number?: string | null
          incorporation_document_url?: string | null
          legal_rep_full_name?: string
          legal_rep_id_document_url?: string | null
          rccm_document_url?: string | null
          rccm_number?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      startup_profiles: {
        Row: {
          company_name: string | null
          created_at: string
          founded_year: number | null
          funding_stage: string | null
          id: string
          looking_for: string[] | null
          pitch: string | null
          pitch_deck_url: string | null
          sector: string | null
          team_size: number | null
          updated_at: string
          user_id: string
          website_url: string | null
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          founded_year?: number | null
          funding_stage?: string | null
          id?: string
          looking_for?: string[] | null
          pitch?: string | null
          pitch_deck_url?: string | null
          sector?: string | null
          team_size?: number | null
          updated_at?: string
          user_id: string
          website_url?: string | null
        }
        Update: {
          company_name?: string | null
          created_at?: string
          founded_year?: number | null
          funding_stage?: string | null
          id?: string
          looking_for?: string[] | null
          pitch?: string | null
          pitch_deck_url?: string | null
          sector?: string | null
          team_size?: number | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      startup_school_content: {
        Row: {
          author_id: string | null
          category: string | null
          content: string | null
          content_type: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          mentor_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
          video_url: string | null
          views_count: number | null
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content?: string | null
          content_type?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          mentor_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          video_url?: string | null
          views_count?: number | null
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string | null
          content_type?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          mentor_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          video_url?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "startup_school_content_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_school_modules: {
        Row: {
          content: string | null
          content_type: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          is_free: boolean | null
          program_id: string
          sort_order: number | null
          title: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          content_type?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_free?: boolean | null
          program_id: string
          sort_order?: number | null
          title: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          content_type?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_free?: boolean | null
          program_id?: string
          sort_order?: number | null
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "startup_school_modules_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "startup_school_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      startup_school_programs: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          difficulty_level: string | null
          duration_hours: number | null
          enrolled_count: number | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          mentor_id: string | null
          modules_count: number | null
          price: number | null
          program_type: string
          rating: number | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          duration_hours?: number | null
          enrolled_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          mentor_id?: string | null
          modules_count?: number | null
          price?: number | null
          program_type?: string
          rating?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          duration_hours?: number | null
          enrolled_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          mentor_id?: string | null
          modules_count?: number | null
          price?: number | null
          program_type?: string
          rating?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "startup_school_programs_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "mentors"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          features: Json
          id: string
          is_active: boolean
          limits: Json
          name: string
          price_monthly: number
          price_yearly: number
          sort_order: number
          stripe_price_monthly_id: string | null
          stripe_price_yearly_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          features?: Json
          id?: string
          is_active?: boolean
          limits?: Json
          name: string
          price_monthly?: number
          price_yearly?: number
          sort_order?: number
          stripe_price_monthly_id?: string | null
          stripe_price_yearly_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          features?: Json
          id?: string
          is_active?: boolean
          limits?: Json
          name?: string
          price_monthly?: number
          price_yearly?: number
          sort_order?: number
          stripe_price_monthly_id?: string | null
          stripe_price_yearly_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      syndicate_audit_logs: {
        Row: {
          action: string
          created_at: string
          deal_id: string | null
          details: Json | null
          id: string
          syndicate_id: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          deal_id?: string | null
          details?: Json | null
          id?: string
          syndicate_id?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          deal_id?: string | null
          details?: Json | null
          id?: string
          syndicate_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "syndicate_audit_logs_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "syndicate_audit_logs_syndicate_id_fkey"
            columns: ["syndicate_id"]
            isOneToOne: false
            referencedRelation: "syndicates"
            referencedColumns: ["id"]
          },
        ]
      }
      syndicate_documents: {
        Row: {
          created_at: string
          deal_id: string | null
          document_type: string
          file_url: string | null
          id: string
          is_confidential: boolean | null
          syndicate_id: string | null
          title: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          deal_id?: string | null
          document_type?: string
          file_url?: string | null
          id?: string
          is_confidential?: boolean | null
          syndicate_id?: string | null
          title: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          deal_id?: string | null
          document_type?: string
          file_url?: string | null
          id?: string
          is_confidential?: boolean | null
          syndicate_id?: string | null
          title?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "syndicate_documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "syndicate_documents_syndicate_id_fkey"
            columns: ["syndicate_id"]
            isOneToOne: false
            referencedRelation: "syndicates"
            referencedColumns: ["id"]
          },
        ]
      }
      syndicate_members: {
        Row: {
          created_at: string
          id: string
          invited_email: string | null
          joined_at: string | null
          kyc_status: string | null
          nda_signed: boolean | null
          role: string
          status: string
          syndicate_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_email?: string | null
          joined_at?: string | null
          kyc_status?: string | null
          nda_signed?: boolean | null
          role?: string
          status?: string
          syndicate_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_email?: string | null
          joined_at?: string | null
          kyc_status?: string | null
          nda_signed?: boolean | null
          role?: string
          status?: string
          syndicate_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "syndicate_members_syndicate_id_fkey"
            columns: ["syndicate_id"]
            isOneToOne: false
            referencedRelation: "syndicates"
            referencedColumns: ["id"]
          },
        ]
      }
      syndicate_transactions: {
        Row: {
          amount: number
          commitment_id: string | null
          created_at: string
          deal_id: string
          id: string
          metadata: Json | null
          payment_method: string | null
          payment_provider: string | null
          reference: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          commitment_id?: string | null
          created_at?: string
          deal_id: string
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          payment_provider?: string | null
          reference?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          commitment_id?: string | null
          created_at?: string
          deal_id?: string
          id?: string
          metadata?: Json | null
          payment_method?: string | null
          payment_provider?: string | null
          reference?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "syndicate_transactions_commitment_id_fkey"
            columns: ["commitment_id"]
            isOneToOne: false
            referencedRelation: "commitments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "syndicate_transactions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      syndicates: {
        Row: {
          carry_percentage: number
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          is_private: boolean | null
          lead_investor_id: string
          management_fee_percentage: number | null
          min_ticket: number
          name: string
          status: string
          target_size: number | null
          thesis: string | null
          updated_at: string
          vehicle_duration_months: number | null
        }
        Insert: {
          carry_percentage?: number
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          lead_investor_id: string
          management_fee_percentage?: number | null
          min_ticket?: number
          name: string
          status?: string
          target_size?: number | null
          thesis?: string | null
          updated_at?: string
          vehicle_duration_months?: number | null
        }
        Update: {
          carry_percentage?: number
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_private?: boolean | null
          lead_investor_id?: string
          management_fee_percentage?: number | null
          min_ticket?: number
          name?: string
          status?: string
          target_size?: number | null
          thesis?: string | null
          updated_at?: string
          vehicle_duration_months?: number | null
        }
        Relationships: []
      }
      talent_profiles: {
        Row: {
          availability: string | null
          created_at: string
          desired_salary: string | null
          education: string | null
          experience_years: number | null
          github_url: string | null
          id: string
          resume_url: string | null
          skills: string[] | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: string | null
          created_at?: string
          desired_salary?: string | null
          education?: string | null
          experience_years?: number | null
          github_url?: string | null
          id?: string
          resume_url?: string | null
          skills?: string[] | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          availability?: string | null
          created_at?: string
          desired_salary?: string | null
          education?: string | null
          experience_years?: number | null
          github_url?: string | null
          id?: string
          resume_url?: string | null
          skills?: string[] | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          action_type: string
          count: number
          created_at: string
          id: string
          period_start: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_type: string
          count?: number
          created_at?: string
          id?: string
          period_start?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_type?: string
          count?: number
          created_at?: string
          id?: string
          period_start?: string
          updated_at?: string
          user_id?: string
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
      user_subscriptions: {
        Row: {
          billing_cycle: string
          cancelled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle?: string
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle?: string
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_review_incubation: {
        Args: { _track_id: string; _user_id: string }
        Returns: boolean
      }
      can_view_contact_info: {
        Args: { p_target_user_id: string }
        Returns: boolean
      }
      can_view_project: {
        Args: { _project_id: string; _viewer_id: string }
        Returns: boolean
      }
      get_public_platform_stats: {
        Args: never
        Returns: {
          coaching_sessions: number
          content_hours: number
          investors: number
          jobs: number
          mentors: number
          partners: number
          pitch_rooms: number
          programs: number
          projects: number
          startups: number
          talents: number
          verified_profiles: number
        }[]
      }
      get_public_profile: {
        Args: { p_user_id: string }
        Returns: {
          avatar_url: string
          badge_type: string
          bio: string
          city: string
          contact_info_locked: boolean
          full_name: string
          is_verified: boolean
          linkedin_url: string
          user_id: string
          website: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_video_views: { Args: { video_id: string }; Returns: undefined }
      is_incubation_mentor: {
        Args: { _track_id: string; _user_id: string }
        Returns: boolean
      }
      is_incubation_owner: {
        Args: { _track_id: string; _user_id: string }
        Returns: boolean
      }
      is_syndicate_lead: {
        Args: { _syndicate_id: string; _user_id: string }
        Returns: boolean
      }
      is_syndicate_member: {
        Args: { _syndicate_id: string; _user_id: string }
        Returns: boolean
      }
      project_access_state: {
        Args: { _project_id: string; _viewer_id: string }
        Returns: {
          can_view: boolean
          nda_required: boolean
          request_status: string
          requester_nda_accepted: boolean
          visibility: string
        }[]
      }
      search_projects: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_sector?: string
          p_stage?: string
        }
        Returns: {
          advancement_stage: string
          city: string
          created_at: string
          description: string
          id: string
          looking_for: string[]
          owner_avatar: string
          owner_name: string
          sector: string
          skills_needed: string[]
          title: string
          total_count: number
          user_id: string
        }[]
      }
      search_projects_safe: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_sector?: string
          p_stage?: string
        }
        Returns: {
          advancement_stage: string
          city: string
          created_at: string
          description: string
          id: string
          is_protected: boolean
          looking_for: string[]
          nda_required: boolean
          owner_avatar: string
          owner_name: string
          sector: string
          skills_needed: string[]
          title: string
          total_count: number
          user_id: string
          visibility: string
        }[]
      }
      search_talents: {
        Args: {
          p_city?: string
          p_limit?: number
          p_offset?: number
          p_search?: string
          p_skill?: string
        }
        Returns: {
          availability: string
          avatar_url: string
          badge_type: string
          bio: string
          city: string
          experience_years: number
          full_name: string
          is_verified: boolean
          skills: string[]
          title: string
          total_count: number
          user_id: string
        }[]
      }
    }
    Enums: {
      app_role: "talent" | "startup" | "investor" | "partner" | "admin" | "mentor"
      job_type: "emploi" | "mission" | "stage" | "cofounder" | "advisory"
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
      app_role: ["talent", "startup", "investor", "partner", "admin", "mentor"],
      job_type: ["emploi", "mission", "stage", "cofounder", "advisory"],
    },
  },
} as const
