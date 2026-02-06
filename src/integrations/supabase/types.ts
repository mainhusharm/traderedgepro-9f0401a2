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
      account_managers: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          id: string
          is_available: boolean | null
          name: string
          phone: string | null
          specialties: string[] | null
          specialty: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          id?: string
          is_available?: boolean | null
          name: string
          phone?: string | null
          specialties?: string[] | null
          specialty?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          id?: string
          is_available?: boolean | null
          name?: string
          phone?: string | null
          specialties?: string[] | null
          specialty?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      account_statement_uploads: {
        Row: {
          account_id: string | null
          balance_extracted: number | null
          created_at: string | null
          equity_extracted: number | null
          file_type: string | null
          file_url: string
          id: string
          parsed_data: Json | null
          parsing_status: string | null
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          balance_extracted?: number | null
          created_at?: string | null
          equity_extracted?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          parsed_data?: Json | null
          parsing_status?: string | null
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          balance_extracted?: number | null
          created_at?: string | null
          equity_extracted?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          parsed_data?: Json | null
          parsing_status?: string | null
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_activity_log: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      admin_agents: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: string
          invitation_accepted_at: string | null
          invitation_sent_at: string | null
          invitation_token: string | null
          is_online: boolean | null
          last_seen_at: string | null
          name: string | null
          permissions: Json | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          invitation_accepted_at?: string | null
          invitation_sent_at?: string | null
          invitation_token?: string | null
          is_online?: boolean | null
          last_seen_at?: string | null
          name?: string | null
          permissions?: Json | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          invitation_accepted_at?: string | null
          invitation_sent_at?: string | null
          invitation_token?: string | null
          is_online?: boolean | null
          last_seen_at?: string | null
          name?: string | null
          permissions?: Json | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      admin_broadcasts: {
        Row: {
          created_at: string | null
          id: string
          message: string
          notification_type: string | null
          sent_by: string | null
          target_plans: string[] | null
          target_user_ids: string[] | null
          title: string
          total_recipients: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          notification_type?: string | null
          sent_by?: string | null
          target_plans?: string[] | null
          target_user_ids?: string[] | null
          title: string
          total_recipients?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          notification_type?: string | null
          sent_by?: string | null
          target_plans?: string[] | null
          target_user_ids?: string[] | null
          title?: string
          total_recipients?: number | null
        }
        Relationships: []
      }
      admin_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          token: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
        }
        Relationships: []
      }
      affiliate_referrals: {
        Row: {
          affiliate_id: string
          commission_amount: number | null
          commission_status: string | null
          created_at: string
          id: string
          paid_at: string | null
          payment_id: string | null
          referred_user_id: string
        }
        Insert: {
          affiliate_id: string
          commission_amount?: number | null
          commission_status?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_id?: string | null
          referred_user_id: string
        }
        Update: {
          affiliate_id?: string
          commission_amount?: number | null
          commission_status?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          payment_id?: string | null
          referred_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_referrals_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          affiliate_code: string
          commission_rate: number | null
          created_at: string
          id: string
          paid_earnings: number | null
          payout_address: string | null
          payout_method: string | null
          pending_earnings: number | null
          status: string | null
          total_earnings: number | null
          total_referrals: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          affiliate_code: string
          commission_rate?: number | null
          created_at?: string
          id?: string
          paid_earnings?: number | null
          payout_address?: string | null
          payout_method?: string | null
          pending_earnings?: number | null
          status?: string | null
          total_earnings?: number | null
          total_referrals?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          affiliate_code?: string
          commission_rate?: number | null
          created_at?: string
          id?: string
          paid_earnings?: number | null
          payout_address?: string | null
          payout_method?: string | null
          pending_earnings?: number | null
          status?: string | null
          total_earnings?: number | null
          total_referrals?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      agent_availability: {
        Row: {
          agent_id: string
          created_at: string
          day_of_week: string
          end_time: string | null
          id: string
          is_available: boolean
          start_time: string | null
          updated_at: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          day_of_week: string
          end_time?: string | null
          id?: string
          is_available?: boolean
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          day_of_week?: string
          end_time?: string | null
          id?: string
          is_available?: boolean
          start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_availability_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "admin_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_clients: {
        Row: {
          access_token: string | null
          agent_id: string
          company: string | null
          created_at: string | null
          email: string
          id: string
          invite_accepted_at: string | null
          invite_sent_at: string | null
          name: string
          notes: string | null
          permissions: Json | null
          phone: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_token?: string | null
          agent_id: string
          company?: string | null
          created_at?: string | null
          email: string
          id?: string
          invite_accepted_at?: string | null
          invite_sent_at?: string | null
          name: string
          notes?: string | null
          permissions?: Json | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string | null
          agent_id?: string
          company?: string | null
          created_at?: string | null
          email?: string
          id?: string
          invite_accepted_at?: string | null
          invite_sent_at?: string | null
          name?: string
          notes?: string | null
          permissions?: Json | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_clients_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "admin_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_payment_methods: {
        Row: {
          agent_id: string
          created_at: string | null
          details: Json
          id: string
          is_primary: boolean | null
          method_type: string
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          details?: Json
          id?: string
          is_primary?: boolean | null
          method_type: string
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          details?: Json
          id?: string
          is_primary?: boolean | null
          method_type?: string
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_payment_methods_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "admin_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_salaries: {
        Row: {
          agent_id: string
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          paid_at: string | null
          payment_method_requested: string | null
          period_end: string | null
          period_start: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          paid_at?: string | null
          payment_method_requested?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          paid_at?: string | null
          payment_method_requested?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_salaries_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "admin_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_sessions: {
        Row: {
          agent_id: string
          created_at: string | null
          expires_at: string
          id: string
          ip_address: string | null
          session_token: string
          user_agent: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          session_token: string
          user_agent?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          session_token?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_sessions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "admin_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_signal_comments: {
        Row: {
          agent_id: string
          comment: string
          created_at: string | null
          id: string
          signal_id: string
        }
        Insert: {
          agent_id: string
          comment: string
          created_at?: string | null
          id?: string
          signal_id: string
        }
        Update: {
          agent_id?: string
          comment?: string
          created_at?: string | null
          id?: string
          signal_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_signal_comments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "admin_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_signal_comments_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_stats: {
        Row: {
          agent_id: string
          average_rating: number | null
          breakeven_signals: number | null
          chats_handled: number | null
          created_at: string | null
          id: string
          losing_signals: number | null
          signals_approved: number | null
          signals_rejected: number | null
          signals_reviewed: number | null
          total_ratings: number | null
          total_signals_posted: number | null
          updated_at: string | null
          winning_signals: number | null
        }
        Insert: {
          agent_id: string
          average_rating?: number | null
          breakeven_signals?: number | null
          chats_handled?: number | null
          created_at?: string | null
          id?: string
          losing_signals?: number | null
          signals_approved?: number | null
          signals_rejected?: number | null
          signals_reviewed?: number | null
          total_ratings?: number | null
          total_signals_posted?: number | null
          updated_at?: string | null
          winning_signals?: number | null
        }
        Update: {
          agent_id?: string
          average_rating?: number | null
          breakeven_signals?: number | null
          chats_handled?: number | null
          created_at?: string | null
          id?: string
          losing_signals?: number | null
          signals_approved?: number | null
          signals_rejected?: number | null
          signals_reviewed?: number | null
          total_ratings?: number | null
          total_signals_posted?: number | null
          updated_at?: string | null
          winning_signals?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_stats_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: true
            referencedRelation: "admin_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          is_pinned: boolean | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      bot_status: {
        Row: {
          bot_type: string
          created_at: string | null
          id: string
          is_running: boolean | null
          last_signal_at: string | null
          signals_sent_today: number | null
          started_at: string | null
          stopped_at: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          bot_type: string
          created_at?: string | null
          id?: string
          is_running?: boolean | null
          last_signal_at?: string | null
          signals_sent_today?: number | null
          started_at?: string | null
          stopped_at?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          bot_type?: string
          created_at?: string | null
          id?: string
          is_running?: boolean | null
          last_signal_at?: string | null
          signals_sent_today?: number | null
          started_at?: string | null
          stopped_at?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      client_sessions: {
        Row: {
          client_email: string
          created_at: string | null
          expires_at: string
          id: string
          ip_address: string | null
          session_token: string
          user_agent: string | null
        }
        Insert: {
          client_email: string
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          session_token: string
          user_agent?: string | null
        }
        Update: {
          client_email?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          session_token?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          current_uses: number | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          is_private: boolean | null
          max_uses: number | null
          min_purchase: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          is_private?: boolean | null
          max_uses?: number | null
          min_purchase?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          is_private?: boolean | null
          max_uses?: number | null
          min_purchase?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      customer_queries: {
        Row: {
          admin_response: string | null
          ai_response: string | null
          category: string | null
          conversation_history: Json | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          escalated_at: string | null
          escalated_to: string | null
          escalation_notes: string | null
          id: string
          query: string
          query_number: string
          resolution_notes: string | null
          resolved_at: string | null
          satisfaction_rating: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          admin_response?: string | null
          ai_response?: string | null
          category?: string | null
          conversation_history?: Json | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          escalated_at?: string | null
          escalated_to?: string | null
          escalation_notes?: string | null
          id?: string
          query: string
          query_number: string
          resolution_notes?: string | null
          resolved_at?: string | null
          satisfaction_rating?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_response?: string | null
          ai_response?: string | null
          category?: string | null
          conversation_history?: Json | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          escalated_at?: string | null
          escalated_to?: string | null
          escalation_notes?: string | null
          id?: string
          query?: string
          query_number?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          satisfaction_rating?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      daily_equity_confirmations: {
        Row: {
          account_id: string
          confirmed_at: string | null
          created_at: string | null
          date: string
          id: string
          reported_equity: number
          user_id: string
        }
        Insert: {
          account_id: string
          confirmed_at?: string | null
          created_at?: string | null
          date?: string
          id?: string
          reported_equity: number
          user_id: string
        }
        Update: {
          account_id?: string
          confirmed_at?: string | null
          created_at?: string | null
          date?: string
          id?: string
          reported_equity?: number
          user_id?: string
        }
        Relationships: []
      }
      daily_social_signal_posts: {
        Row: {
          confidence_score: number | null
          confluence_score: number | null
          created_at: string | null
          direction: string | null
          entry_price: number | null
          error_message: string | null
          id: string
          image_url: string | null
          platform: string
          post_content: string | null
          post_date: string
          posted: boolean | null
          posted_at: string | null
          signal_id: string | null
          signal_type: string
          success: boolean | null
          symbol: string
          tweet_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          confluence_score?: number | null
          created_at?: string | null
          direction?: string | null
          entry_price?: number | null
          error_message?: string | null
          id?: string
          image_url?: string | null
          platform: string
          post_content?: string | null
          post_date: string
          posted?: boolean | null
          posted_at?: string | null
          signal_id?: string | null
          signal_type: string
          success?: boolean | null
          symbol: string
          tweet_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          confluence_score?: number | null
          created_at?: string | null
          direction?: string | null
          entry_price?: number | null
          error_message?: string | null
          id?: string
          image_url?: string | null
          platform?: string
          post_content?: string | null
          post_date?: string
          posted?: boolean | null
          posted_at?: string | null
          signal_id?: string | null
          signal_type?: string
          success?: boolean | null
          symbol?: string
          tweet_id?: string | null
        }
        Relationships: []
      }
      daily_trading_checklists: {
        Row: {
          account_id: string | null
          checklist_items: Json | null
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          date: string
          id: string
          user_id: string
        }
        Insert: {
          account_id?: string | null
          checklist_items?: Json | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          date?: string
          id?: string
          user_id: string
        }
        Update: {
          account_id?: string | null
          checklist_items?: Json | null
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          date?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      dashboard_data: {
        Row: {
          account_size: number | null
          account_type: string | null
          average_loss: number | null
          average_win: number | null
          created_at: string
          current_drawdown: number | null
          current_equity: number | null
          daily_pnl: number | null
          id: string
          initial_balance: number | null
          last_active: string | null
          losing_trades: number | null
          max_drawdown: number | null
          profit_factor: number | null
          prop_firm: string | null
          questionnaire_id: string | null
          total_pnl: number | null
          total_trades: number | null
          updated_at: string
          user_id: string
          win_rate: number | null
          winning_trades: number | null
        }
        Insert: {
          account_size?: number | null
          account_type?: string | null
          average_loss?: number | null
          average_win?: number | null
          created_at?: string
          current_drawdown?: number | null
          current_equity?: number | null
          daily_pnl?: number | null
          id?: string
          initial_balance?: number | null
          last_active?: string | null
          losing_trades?: number | null
          max_drawdown?: number | null
          profit_factor?: number | null
          prop_firm?: string | null
          questionnaire_id?: string | null
          total_pnl?: number | null
          total_trades?: number | null
          updated_at?: string
          user_id: string
          win_rate?: number | null
          winning_trades?: number | null
        }
        Update: {
          account_size?: number | null
          account_type?: string | null
          average_loss?: number | null
          average_win?: number | null
          created_at?: string
          current_drawdown?: number | null
          current_equity?: number | null
          daily_pnl?: number | null
          id?: string
          initial_balance?: number | null
          last_active?: string | null
          losing_trades?: number | null
          max_drawdown?: number | null
          profit_factor?: number | null
          prop_firm?: string | null
          questionnaire_id?: string | null
          total_pnl?: number | null
          total_trades?: number | null
          updated_at?: string
          user_id?: string
          win_rate?: number | null
          winning_trades?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_data_questionnaire_id_fkey"
            columns: ["questionnaire_id"]
            isOneToOne: false
            referencedRelation: "questionnaires"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string
          email_type: string
          error_message: string | null
          id: string
          metadata: Json | null
          resend_id: string | null
          status: string
          subject: string
          to_email: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email_type: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          resend_id?: string | null
          status?: string
          subject: string
          to_email: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email_type?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          resend_id?: string | null
          status?: string
          subject?: string
          to_email?: string
          updated_at?: string
        }
        Relationships: []
      }
      guidance_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          sender_id: string
          sender_type: string
          session_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id: string
          sender_type: string
          session_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          sender_id?: string
          sender_type?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guidance_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "guidance_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      guidance_sessions: {
        Row: {
          admin_id: string | null
          assigned_agent_id: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          notes: string | null
          preferred_date: string | null
          scheduled_at: string | null
          session_number: string
          status: string
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_id?: string | null
          assigned_agent_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          preferred_date?: string | null
          scheduled_at?: string | null
          session_number: string
          status?: string
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_id?: string | null
          assigned_agent_id?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          notes?: string | null
          preferred_date?: string | null
          scheduled_at?: string | null
          session_number?: string
          status?: string
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guidance_sessions_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "admin_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      institutional_signals: {
        Row: {
          agent_approved: boolean | null
          ai_reasoning: string | null
          category: string | null
          confidence: number | null
          confidence_score: number | null
          confluence_score: number | null
          created_at: string | null
          direction: string | null
          entry_price: number
          id: string
          outcome: string | null
          pnl: number | null
          posted_to_discord: boolean | null
          posted_to_twitter: boolean | null
          signal_type: string
          status: string | null
          stop_loss: number | null
          symbol: string
          take_profit: number | null
          take_profit_1: number | null
          take_profit_2: number | null
          take_profit_3: number | null
          updated_at: string | null
        }
        Insert: {
          agent_approved?: boolean | null
          ai_reasoning?: string | null
          category?: string | null
          confidence?: number | null
          confidence_score?: number | null
          confluence_score?: number | null
          created_at?: string | null
          direction?: string | null
          entry_price: number
          id?: string
          outcome?: string | null
          pnl?: number | null
          posted_to_discord?: boolean | null
          posted_to_twitter?: boolean | null
          signal_type: string
          status?: string | null
          stop_loss?: number | null
          symbol: string
          take_profit?: number | null
          take_profit_1?: number | null
          take_profit_2?: number | null
          take_profit_3?: number | null
          updated_at?: string | null
        }
        Update: {
          agent_approved?: boolean | null
          ai_reasoning?: string | null
          category?: string | null
          confidence?: number | null
          confidence_score?: number | null
          confluence_score?: number | null
          created_at?: string | null
          direction?: string | null
          entry_price?: number
          id?: string
          outcome?: string | null
          pnl?: number | null
          posted_to_discord?: boolean | null
          posted_to_twitter?: boolean | null
          signal_type?: string
          status?: string | null
          stop_loss?: number | null
          symbol?: string
          take_profit?: number | null
          take_profit_1?: number | null
          take_profit_2?: number | null
          take_profit_3?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      kickstarter_verifications: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          user_id: string | null
          verification_status: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          user_id?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          user_id?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      launch_giveaway_entries: {
        Row: {
          created_at: string | null
          email: string
          entries_count: number | null
          id: string
          name: string | null
          referral_code: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          entries_count?: number | null
          id?: string
          name?: string | null
          referral_code?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          entries_count?: number | null
          id?: string
          name?: string | null
          referral_code?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      manager_agent_messages: {
        Row: {
          agent_id: string
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          manager_id: string
          sender_type: string
        }
        Insert: {
          agent_id: string
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          manager_id: string
          sender_type: string
        }
        Update: {
          agent_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          manager_id?: string
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "manager_agent_messages_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "admin_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "manager_agent_messages_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "managers"
            referencedColumns: ["id"]
          },
        ]
      }
      manager_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: string | null
          manager_id: string
          session_token: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          manager_id: string
          session_token: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          manager_id?: string
          session_token?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "manager_sessions_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "managers"
            referencedColumns: ["id"]
          },
        ]
      }
      managers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          is_online: boolean | null
          last_seen_at: string | null
          name: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          is_online?: boolean | null
          last_seen_at?: string | null
          name: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          is_online?: boolean | null
          last_seen_at?: string | null
          name?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      marketing_ai_automation: {
        Row: {
          agent_id: string | null
          agent_name: string | null
          automation_type: string | null
          config: Json | null
          created_at: string | null
          error_count: number | null
          failed_runs: number | null
          id: string
          interval_minutes: number | null
          is_active: boolean | null
          last_error: string | null
          last_run: string | null
          last_run_at: string | null
          next_run: string | null
          next_run_at: string | null
          results: Json | null
          success_count: number | null
          successful_runs: number | null
          total_runs: number | null
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          agent_name?: string | null
          automation_type?: string | null
          config?: Json | null
          created_at?: string | null
          error_count?: number | null
          failed_runs?: number | null
          id?: string
          interval_minutes?: number | null
          is_active?: boolean | null
          last_error?: string | null
          last_run?: string | null
          last_run_at?: string | null
          next_run?: string | null
          next_run_at?: string | null
          results?: Json | null
          success_count?: number | null
          successful_runs?: number | null
          total_runs?: number | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          agent_name?: string | null
          automation_type?: string | null
          config?: Json | null
          created_at?: string | null
          error_count?: number | null
          failed_runs?: number | null
          id?: string
          interval_minutes?: number | null
          is_active?: boolean | null
          last_error?: string | null
          last_run?: string | null
          last_run_at?: string | null
          next_run?: string | null
          next_run_at?: string | null
          results?: Json | null
          success_count?: number | null
          successful_runs?: number | null
          total_runs?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      marketing_ai_chats: {
        Row: {
          context: Json | null
          created_at: string | null
          employee_id: string | null
          employee_type: string | null
          id: string
          messages: Json | null
          updated_at: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          employee_id?: string | null
          employee_type?: string | null
          id?: string
          messages?: Json | null
          updated_at?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          employee_id?: string | null
          employee_type?: string | null
          id?: string
          messages?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      marketing_ai_conversations: {
        Row: {
          context: Json | null
          created_at: string | null
          employee_type: string
          id: string
          messages: Json | null
          session_id: string | null
          updated_at: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          employee_type: string
          id?: string
          messages?: Json | null
          session_id?: string | null
          updated_at?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          employee_type?: string
          id?: string
          messages?: Json | null
          session_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_ai_conversations_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "marketing_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_blog_posts: {
        Row: {
          ai_generated: boolean | null
          author_name: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          meta_description: string | null
          published_at: string | null
          scheduled_at: string | null
          seo_keywords: string[] | null
          slug: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          author_name?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          seo_keywords?: string[] | null
          slug?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          author_name?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          seo_keywords?: string[] | null
          slug?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      marketing_blog_posts_v2: {
        Row: {
          ai_generated: boolean | null
          author_name: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          meta_description: string | null
          published_at: string | null
          scheduled_at: string | null
          seo_keywords: string[] | null
          seo_score: number | null
          slug: string | null
          status: string | null
          target_keyword: string | null
          title: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          ai_generated?: boolean | null
          author_name?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          seo_keywords?: string[] | null
          seo_score?: number | null
          slug?: string | null
          status?: string | null
          target_keyword?: string | null
          title: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          ai_generated?: boolean | null
          author_name?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          seo_keywords?: string[] | null
          seo_score?: number | null
          slug?: string | null
          status?: string | null
          target_keyword?: string | null
          title?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: []
      }
      marketing_calendar: {
        Row: {
          all_day: boolean | null
          color: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          event_type: string | null
          id: string
          recurrence_pattern: string | null
          recurring: boolean | null
          start_date: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          all_day?: boolean | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          id?: string
          recurrence_pattern?: string | null
          recurring?: boolean | null
          start_date?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          all_day?: boolean | null
          color?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          event_type?: string | null
          id?: string
          recurrence_pattern?: string | null
          recurring?: boolean | null
          start_date?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      marketing_competitors: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          market_share: number | null
          name: string
          pricing_info: Json | null
          social_links: Json | null
          strengths: string[] | null
          updated_at: string | null
          weaknesses: string[] | null
          website: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          market_share?: number | null
          name: string
          pricing_info?: Json | null
          social_links?: Json | null
          strengths?: string[] | null
          updated_at?: string | null
          weaknesses?: string[] | null
          website?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          market_share?: number | null
          name?: string
          pricing_info?: Json | null
          social_links?: Json | null
          strengths?: string[] | null
          updated_at?: string | null
          weaknesses?: string[] | null
          website?: string | null
        }
        Relationships: []
      }
      marketing_compliance_reviews: {
        Row: {
          approved_at: string | null
          compliance_score: number | null
          content_id: string | null
          content_title: string | null
          content_type: string | null
          created_at: string | null
          id: string
          issues: Json | null
          reviewed_at: string | null
          reviewer_id: string | null
          reviewer_notes: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          compliance_score?: number | null
          content_id?: string | null
          content_title?: string | null
          content_type?: string | null
          created_at?: string | null
          id?: string
          issues?: Json | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          compliance_score?: number | null
          content_id?: string | null
          content_title?: string | null
          content_type?: string | null
          created_at?: string | null
          id?: string
          issues?: Json | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      marketing_emails: {
        Row: {
          ai_draft: string | null
          attachments: Json | null
          body: string | null
          cc_emails: string[] | null
          created_at: string | null
          error_message: string | null
          from_email: string | null
          id: string
          is_ai_generated: boolean | null
          scheduled_at: string | null
          sent_at: string | null
          status: string | null
          subject: string | null
          to_email: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          ai_draft?: string | null
          attachments?: Json | null
          body?: string | null
          cc_emails?: string[] | null
          created_at?: string | null
          error_message?: string | null
          from_email?: string | null
          id?: string
          is_ai_generated?: boolean | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          to_email?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_draft?: string | null
          attachments?: Json | null
          body?: string | null
          cc_emails?: string[] | null
          created_at?: string | null
          error_message?: string | null
          from_email?: string | null
          id?: string
          is_ai_generated?: boolean | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string | null
          to_email?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      marketing_engagement_history: {
        Row: {
          action_type: string
          created_at: string | null
          executed_at: string | null
          id: string
          metadata: Json | null
          result: Json | null
          status: string | null
          target_url: string | null
          target_user: string | null
        }
        Insert: {
          action_type: string
          created_at?: string | null
          executed_at?: string | null
          id?: string
          metadata?: Json | null
          result?: Json | null
          status?: string | null
          target_url?: string | null
          target_user?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string | null
          executed_at?: string | null
          id?: string
          metadata?: Json | null
          result?: Json | null
          status?: string | null
          target_url?: string | null
          target_user?: string | null
        }
        Relationships: []
      }
      marketing_engagement_queue: {
        Row: {
          action_type: string
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          priority: number | null
          scheduled_for: string | null
          status: string | null
          target_url: string | null
          target_user: string | null
          updated_at: string | null
        }
        Insert: {
          action_type: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          priority?: number | null
          scheduled_for?: string | null
          status?: string | null
          target_url?: string | null
          target_user?: string | null
          updated_at?: string | null
        }
        Update: {
          action_type?: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          priority?: number | null
          scheduled_for?: string | null
          status?: string | null
          target_url?: string | null
          target_user?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      marketing_leads: {
        Row: {
          company: string | null
          converted_at: string | null
          created_at: string | null
          email: string | null
          id: string
          last_contacted_at: string | null
          lead_type: string | null
          linkedin_url: string | null
          name: string | null
          notes: Json | null
          phone: string | null
          score: number | null
          source: string | null
          status: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          company?: string | null
          converted_at?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          lead_type?: string | null
          linkedin_url?: string | null
          name?: string | null
          notes?: Json | null
          phone?: string | null
          score?: number | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          company?: string | null
          converted_at?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          lead_type?: string | null
          linkedin_url?: string | null
          name?: string | null
          notes?: Json | null
          phone?: string | null
          score?: number | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      marketing_leads_v2: {
        Row: {
          company: string | null
          company_name: string | null
          contact_name: string | null
          converted_at: string | null
          created_at: string | null
          email: string | null
          id: string
          last_contacted_at: string | null
          name: string | null
          notes: string | null
          phone: string | null
          score: number | null
          source: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          company?: string | null
          company_name?: string | null
          contact_name?: string | null
          converted_at?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          score?: number | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          company?: string | null
          company_name?: string | null
          contact_name?: string | null
          converted_at?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          last_contacted_at?: string | null
          name?: string | null
          notes?: string | null
          phone?: string | null
          score?: number | null
          source?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      marketing_meeting_notes: {
        Row: {
          action_items: Json | null
          ai_summary: string | null
          attendees: string[] | null
          created_at: string | null
          follow_ups: Json | null
          id: string
          key_decisions: Json | null
          meeting_date: string | null
          meeting_title: string
          status: string | null
          transcript: string | null
          updated_at: string | null
        }
        Insert: {
          action_items?: Json | null
          ai_summary?: string | null
          attendees?: string[] | null
          created_at?: string | null
          follow_ups?: Json | null
          id?: string
          key_decisions?: Json | null
          meeting_date?: string | null
          meeting_title: string
          status?: string | null
          transcript?: string | null
          updated_at?: string | null
        }
        Update: {
          action_items?: Json | null
          ai_summary?: string | null
          attendees?: string[] | null
          created_at?: string | null
          follow_ups?: Json | null
          id?: string
          key_decisions?: Json | null
          meeting_date?: string | null
          meeting_title?: string
          status?: string | null
          transcript?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      marketing_reports: {
        Row: {
          category: string | null
          created_at: string | null
          data: Json
          generated_at: string | null
          id: string
          insights: Json | null
          period_end: string | null
          period_start: string | null
          report_type: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          data: Json
          generated_at?: string | null
          id?: string
          insights?: Json | null
          period_end?: string | null
          period_start?: string | null
          report_type: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          data?: Json
          generated_at?: string | null
          id?: string
          insights?: Json | null
          period_end?: string | null
          period_start?: string | null
          report_type?: string
        }
        Relationships: []
      }
      marketing_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: string | null
          session_token: string
          user_agent: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          session_token: string
          user_agent?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          session_token?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      marketing_social_posts: {
        Row: {
          comments: number | null
          content: string | null
          created_at: string | null
          engagement: Json | null
          id: string
          likes: number | null
          media_urls: string[] | null
          platform: string
          platforms: string[] | null
          posted_at: string | null
          published_at: string | null
          scheduled_at: string | null
          shares: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          comments?: number | null
          content?: string | null
          created_at?: string | null
          engagement?: Json | null
          id?: string
          likes?: number | null
          media_urls?: string[] | null
          platform: string
          platforms?: string[] | null
          posted_at?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          shares?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          comments?: number | null
          content?: string | null
          created_at?: string | null
          engagement?: Json | null
          id?: string
          likes?: number | null
          media_urls?: string[] | null
          platform?: string
          platforms?: string[] | null
          posted_at?: string | null
          published_at?: string | null
          scheduled_at?: string | null
          shares?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      marketing_support_tickets: {
        Row: {
          ai_confidence: number | null
          assigned_to: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string | null
          description: string | null
          id: string
          messages: Json | null
          priority: string | null
          resolved_at: string | null
          status: string | null
          subject: string
          ticket_number: string | null
          updated_at: string | null
        }
        Insert: {
          ai_confidence?: number | null
          assigned_to?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          description?: string | null
          id?: string
          messages?: Json | null
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject: string
          ticket_number?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_confidence?: number | null
          assigned_to?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string | null
          description?: string | null
          id?: string
          messages?: Json | null
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject?: string
          ticket_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      marketing_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          source: string | null
          source_reference: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          source?: string | null
          source_reference?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          source?: string | null
          source_reference?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      marketing_tasks_v2: {
        Row: {
          assigned_to: string | null
          category: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          priority: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          priority?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      memberships: {
        Row: {
          billing_period: string | null
          created_at: string
          expires_at: string | null
          first_login_at: string | null
          id: string
          is_trial: boolean | null
          last_activity_at: string | null
          plan_name: string
          plan_price: number
          signals_received_count: number | null
          starts_at: string | null
          status: Database["public"]["Enums"]["membership_status"] | null
          trial_coupon_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_period?: string | null
          created_at?: string
          expires_at?: string | null
          first_login_at?: string | null
          id?: string
          is_trial?: boolean | null
          last_activity_at?: string | null
          plan_name: string
          plan_price: number
          signals_received_count?: number | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["membership_status"] | null
          trial_coupon_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_period?: string | null
          created_at?: string
          expires_at?: string | null
          first_login_at?: string | null
          id?: string
          is_trial?: boolean | null
          last_activity_at?: string | null
          plan_name?: string
          plan_price?: number
          signals_received_count?: number | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["membership_status"] | null
          trial_coupon_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mt5_notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          order_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          order_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          order_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt5_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "mt5_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      mt5_orders: {
        Row: {
          additional_requirements: Json | null
          admin_status: string | null
          amount: number
          assigned_to: string | null
          backtest_report_url: string | null
          bot_name: string
          claude_prompt: string | null
          compiled_bot_url: string | null
          created_at: string
          id: string
          order_number: string
          performance_targets: Json | null
          plan_type: string
          priority: string | null
          progress: number | null
          revision_requests: Json | null
          revisions: number | null
          risk_management: Json | null
          source_code_url: string | null
          status: string
          technical_specs: Json | null
          trading_strategy: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_requirements?: Json | null
          admin_status?: string | null
          amount: number
          assigned_to?: string | null
          backtest_report_url?: string | null
          bot_name: string
          claude_prompt?: string | null
          compiled_bot_url?: string | null
          created_at?: string
          id?: string
          order_number: string
          performance_targets?: Json | null
          plan_type: string
          priority?: string | null
          progress?: number | null
          revision_requests?: Json | null
          revisions?: number | null
          risk_management?: Json | null
          source_code_url?: string | null
          status?: string
          technical_specs?: Json | null
          trading_strategy?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_requirements?: Json | null
          admin_status?: string | null
          amount?: number
          assigned_to?: string | null
          backtest_report_url?: string | null
          bot_name?: string
          claude_prompt?: string | null
          compiled_bot_url?: string | null
          created_at?: string
          id?: string
          order_number?: string
          performance_targets?: Json | null
          plan_type?: string
          priority?: string | null
          progress?: number | null
          revision_requests?: Json | null
          revisions?: number | null
          risk_management?: Json | null
          source_code_url?: string | null
          status?: string
          technical_specs?: Json | null
          trading_strategy?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mt5_payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          order_id: string | null
          payment_method: string
          plan_type: string
          status: string
          transaction_id: string | null
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          order_id?: string | null
          payment_method: string
          plan_type: string
          status?: string
          transaction_id?: string | null
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          order_id?: string | null
          payment_method?: string
          plan_type?: string
          status?: string
          transaction_id?: string | null
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mt5_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "mt5_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      mt5_support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          priority: string | null
          resolved_at: string | null
          status: string
          subject: string
          ticket_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string
          subject: string
          ticket_number: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          priority?: string | null
          resolved_at?: string | null
          status?: string
          subject?: string
          ticket_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      mt5_ticket_messages: {
        Row: {
          attachments: string[] | null
          content: string
          created_at: string
          id: string
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Insert: {
          attachments?: string[] | null
          content: string
          created_at?: string
          id?: string
          sender_id: string
          sender_type: string
          ticket_id: string
        }
        Update: {
          attachments?: string[] | null
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
          sender_type?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mt5_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "mt5_support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      mt5_users: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          is_trial: boolean | null
          license_key: string | null
          payment_verified: boolean | null
          plan_type: string
          trial_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_trial?: boolean | null
          license_key?: string | null
          payment_verified?: boolean | null
          plan_type?: string
          trial_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_trial?: boolean | null
          license_key?: string | null
          payment_verified?: boolean | null
          plan_type?: string
          trial_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          badges: boolean | null
          created_at: string | null
          email_notifications: boolean | null
          id: string
          milestones: boolean | null
          sessions: boolean | null
          updated_at: string | null
          user_id: string
          vip_signals: boolean | null
        }
        Insert: {
          badges?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          milestones?: boolean | null
          sessions?: boolean | null
          updated_at?: string | null
          user_id: string
          vip_signals?: boolean | null
        }
        Update: {
          badges?: boolean | null
          created_at?: string | null
          email_notifications?: boolean | null
          id?: string
          milestones?: boolean | null
          sessions?: boolean | null
          updated_at?: string | null
          user_id?: string
          vip_signals?: boolean | null
        }
        Relationships: []
      }
      otp_verifications: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          otp_code: string
          verified: boolean | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          otp_code: string
          verified?: boolean | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          otp_code?: string
          verified?: boolean | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          affiliate_code: string | null
          affiliate_commission: number | null
          completed_at: string | null
          coupon_code: string | null
          created_at: string
          discount_amount: number | null
          final_price: number
          id: string
          membership_id: string | null
          original_price: number
          payment_method: string
          payment_provider: string | null
          paypal_order_id: string | null
          plan_name: string
          status: Database["public"]["Enums"]["payment_status"] | null
          stripe_payment_intent_id: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          affiliate_code?: string | null
          affiliate_commission?: number | null
          completed_at?: string | null
          coupon_code?: string | null
          created_at?: string
          discount_amount?: number | null
          final_price: number
          id?: string
          membership_id?: string | null
          original_price: number
          payment_method: string
          payment_provider?: string | null
          paypal_order_id?: string | null
          plan_name: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          stripe_payment_intent_id?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          affiliate_code?: string | null
          affiliate_commission?: number | null
          completed_at?: string | null
          coupon_code?: string | null
          created_at?: string
          discount_amount?: number | null
          final_price?: number
          id?: string
          membership_id?: string | null
          original_price?: number
          payment_method?: string
          payment_provider?: string | null
          paypal_order_id?: string | null
          plan_name?: string
          status?: Database["public"]["Enums"]["payment_status"] | null
          stripe_payment_intent_id?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_membership_id_fkey"
            columns: ["membership_id"]
            isOneToOne: false
            referencedRelation: "memberships"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          agree_to_marketing: boolean | null
          agree_to_terms: boolean | null
          avatar_url: string | null
          company: string | null
          country: string | null
          created_at: string
          email_preferences: Json | null
          first_login_at: string | null
          first_name: string | null
          id: string
          last_activity_at: string | null
          last_name: string | null
          phone: string | null
          portal_type: string | null
          preferred_dashboard_mode: string | null
          referral_code: string | null
          referred_by: string | null
          signals_received_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agree_to_marketing?: boolean | null
          agree_to_terms?: boolean | null
          avatar_url?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          email_preferences?: Json | null
          first_login_at?: string | null
          first_name?: string | null
          id?: string
          last_activity_at?: string | null
          last_name?: string | null
          phone?: string | null
          portal_type?: string | null
          preferred_dashboard_mode?: string | null
          referral_code?: string | null
          referred_by?: string | null
          signals_received_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agree_to_marketing?: boolean | null
          agree_to_terms?: boolean | null
          avatar_url?: string | null
          company?: string | null
          country?: string | null
          created_at?: string
          email_preferences?: Json | null
          first_login_at?: string | null
          first_name?: string | null
          id?: string
          last_activity_at?: string | null
          last_name?: string | null
          phone?: string | null
          portal_type?: string | null
          preferred_dashboard_mode?: string | null
          referral_code?: string | null
          referred_by?: string | null
          signals_received_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      prop_firm_requests: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          id: string
          prop_firm_name: string
          responded_at: string | null
          status: string | null
          updated_at: string | null
          user_email: string
          user_id: string | null
          user_name: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          prop_firm_name: string
          responded_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_email: string
          user_id?: string | null
          user_name: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          id?: string
          prop_firm_name?: string
          responded_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_email?: string
          user_id?: string | null
          user_name?: string
        }
        Relationships: []
      }
      prop_firm_rule_acknowledgments: {
        Row: {
          account_id: string | null
          acknowledged_at: string | null
          created_at: string | null
          id: string
          prop_firm: string | null
          rule_version: string | null
          rule_version_acknowledged: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          acknowledged_at?: string | null
          created_at?: string | null
          id?: string
          prop_firm?: string | null
          rule_version?: string | null
          rule_version_acknowledged?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          acknowledged_at?: string | null
          created_at?: string | null
          id?: string
          prop_firm?: string | null
          rule_version?: string | null
          rule_version_acknowledged?: string | null
          user_id?: string
        }
        Relationships: []
      }
      prop_firm_rule_changes: {
        Row: {
          account_type: string
          created_at: string | null
          detected_at: string | null
          field_name: string
          id: string
          new_value: string | null
          notified: boolean | null
          old_value: string | null
          prop_firm_id: string | null
        }
        Insert: {
          account_type: string
          created_at?: string | null
          detected_at?: string | null
          field_name: string
          id?: string
          new_value?: string | null
          notified?: boolean | null
          old_value?: string | null
          prop_firm_id?: string | null
        }
        Update: {
          account_type?: string
          created_at?: string | null
          detected_at?: string | null
          field_name?: string
          id?: string
          new_value?: string | null
          notified?: boolean | null
          old_value?: string | null
          prop_firm_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prop_firm_rule_changes_prop_firm_id_fkey"
            columns: ["prop_firm_id"]
            isOneToOne: false
            referencedRelation: "prop_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      prop_firm_rules: {
        Row: {
          account_inactivity_days: number | null
          account_sizes: Json | null
          account_type: string
          additional_rules: Json | null
          challenge_duration_days: number | null
          consistency_rule_percent: number | null
          consistency_rule_type: string | null
          copy_trading_allowed: boolean | null
          created_at: string | null
          ea_allowed: boolean | null
          extracted_at: string | null
          first_payout_delay: number | null
          grid_trading_allowed: boolean | null
          hedging_allowed: boolean | null
          id: string
          inactivity_rule_days: number | null
          is_current: boolean | null
          martingale_allowed: boolean | null
          max_daily_loss_percent: number | null
          max_open_lots: number | null
          max_open_trades: number | null
          max_position_size: number | null
          max_total_drawdown_percent: number | null
          max_trading_days: number | null
          min_stop_loss_pips: number | null
          min_trading_days: number | null
          news_trading_allowed: boolean | null
          overnight_fee_percent: number | null
          payout_frequency: string | null
          payout_split: number | null
          profit_split_after_scaling: number | null
          profit_target_percent: number | null
          prohibited_instruments: string[] | null
          prohibited_pairs: string[] | null
          prohibited_strategies: string[] | null
          prop_firm_id: string | null
          raw_content: string | null
          reset_fee: number | null
          scaling_plan: Json | null
          source_url: string | null
          stop_loss_required: boolean | null
          trading_hours_end: string | null
          trading_hours_start: string | null
          updated_at: string | null
          version: number | null
          weekend_fee_percent: number | null
          weekend_holding_allowed: boolean | null
        }
        Insert: {
          account_inactivity_days?: number | null
          account_sizes?: Json | null
          account_type: string
          additional_rules?: Json | null
          challenge_duration_days?: number | null
          consistency_rule_percent?: number | null
          consistency_rule_type?: string | null
          copy_trading_allowed?: boolean | null
          created_at?: string | null
          ea_allowed?: boolean | null
          extracted_at?: string | null
          first_payout_delay?: number | null
          grid_trading_allowed?: boolean | null
          hedging_allowed?: boolean | null
          id?: string
          inactivity_rule_days?: number | null
          is_current?: boolean | null
          martingale_allowed?: boolean | null
          max_daily_loss_percent?: number | null
          max_open_lots?: number | null
          max_open_trades?: number | null
          max_position_size?: number | null
          max_total_drawdown_percent?: number | null
          max_trading_days?: number | null
          min_stop_loss_pips?: number | null
          min_trading_days?: number | null
          news_trading_allowed?: boolean | null
          overnight_fee_percent?: number | null
          payout_frequency?: string | null
          payout_split?: number | null
          profit_split_after_scaling?: number | null
          profit_target_percent?: number | null
          prohibited_instruments?: string[] | null
          prohibited_pairs?: string[] | null
          prohibited_strategies?: string[] | null
          prop_firm_id?: string | null
          raw_content?: string | null
          reset_fee?: number | null
          scaling_plan?: Json | null
          source_url?: string | null
          stop_loss_required?: boolean | null
          trading_hours_end?: string | null
          trading_hours_start?: string | null
          updated_at?: string | null
          version?: number | null
          weekend_fee_percent?: number | null
          weekend_holding_allowed?: boolean | null
        }
        Update: {
          account_inactivity_days?: number | null
          account_sizes?: Json | null
          account_type?: string
          additional_rules?: Json | null
          challenge_duration_days?: number | null
          consistency_rule_percent?: number | null
          consistency_rule_type?: string | null
          copy_trading_allowed?: boolean | null
          created_at?: string | null
          ea_allowed?: boolean | null
          extracted_at?: string | null
          first_payout_delay?: number | null
          grid_trading_allowed?: boolean | null
          hedging_allowed?: boolean | null
          id?: string
          inactivity_rule_days?: number | null
          is_current?: boolean | null
          martingale_allowed?: boolean | null
          max_daily_loss_percent?: number | null
          max_open_lots?: number | null
          max_open_trades?: number | null
          max_position_size?: number | null
          max_total_drawdown_percent?: number | null
          max_trading_days?: number | null
          min_stop_loss_pips?: number | null
          min_trading_days?: number | null
          news_trading_allowed?: boolean | null
          overnight_fee_percent?: number | null
          payout_frequency?: string | null
          payout_split?: number | null
          profit_split_after_scaling?: number | null
          profit_target_percent?: number | null
          prohibited_instruments?: string[] | null
          prohibited_pairs?: string[] | null
          prohibited_strategies?: string[] | null
          prop_firm_id?: string | null
          raw_content?: string | null
          reset_fee?: number | null
          scaling_plan?: Json | null
          source_url?: string | null
          stop_loss_required?: boolean | null
          trading_hours_end?: string | null
          trading_hours_start?: string | null
          updated_at?: string | null
          version?: number | null
          weekend_fee_percent?: number | null
          weekend_holding_allowed?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "prop_firm_rules_prop_firm_id_fkey"
            columns: ["prop_firm_id"]
            isOneToOne: false
            referencedRelation: "prop_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      prop_firms: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_scraped_at: string | null
          logo_url: string | null
          name: string
          scrape_status: string | null
          slug: string
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_scraped_at?: string | null
          logo_url?: string | null
          name: string
          scrape_status?: string | null
          slug: string
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_scraped_at?: string | null
          logo_url?: string | null
          name?: string
          scrape_status?: string | null
          slug?: string
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      push_notification_logs: {
        Row: {
          body: string | null
          clicked_at: string | null
          created_at: string | null
          delivered_at: string | null
          endpoint: string | null
          error_message: string | null
          id: string
          notification_type: string | null
          sent_at: string | null
          status: string | null
          title: string | null
          user_id: string | null
        }
        Insert: {
          body?: string | null
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          endpoint?: string | null
          error_message?: string | null
          id?: string
          notification_type?: string | null
          sent_at?: string | null
          status?: string | null
          title?: string | null
          user_id?: string | null
        }
        Update: {
          body?: string | null
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          endpoint?: string | null
          error_message?: string | null
          id?: string
          notification_type?: string | null
          sent_at?: string | null
          status?: string | null
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      questionnaires: {
        Row: {
          account_number: string | null
          account_size: number
          account_type: string
          challenge_step: string | null
          completed: boolean | null
          created_at: string
          crypto_assets: string[] | null
          custom_forex_pairs: string[] | null
          forex_assets: string[] | null
          id: string
          prop_firm: string
          risk_percentage: number | null
          risk_reward_ratio: string | null
          trades_per_day: string | null
          trading_experience: string | null
          trading_session: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number?: string | null
          account_size: number
          account_type: string
          challenge_step?: string | null
          completed?: boolean | null
          created_at?: string
          crypto_assets?: string[] | null
          custom_forex_pairs?: string[] | null
          forex_assets?: string[] | null
          id?: string
          prop_firm: string
          risk_percentage?: number | null
          risk_reward_ratio?: string | null
          trades_per_day?: string | null
          trading_experience?: string | null
          trading_session?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string | null
          account_size?: number
          account_type?: string
          challenge_step?: string | null
          completed?: boolean | null
          created_at?: string
          crypto_assets?: string[] | null
          custom_forex_pairs?: string[] | null
          forex_assets?: string[] | null
          id?: string
          prop_firm?: string
          risk_percentage?: number | null
          risk_reward_ratio?: string | null
          trades_per_day?: string | null
          trading_experience?: string | null
          trading_session?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_clicks: {
        Row: {
          converted: boolean | null
          converted_at: string | null
          converted_user_id: string | null
          created_at: string
          id: string
          referral_code: string
          referrer_url: string | null
          referrer_user_id: string | null
          user_agent: string | null
          visitor_fingerprint: string | null
          visitor_ip: string | null
        }
        Insert: {
          converted?: boolean | null
          converted_at?: string | null
          converted_user_id?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referrer_url?: string | null
          referrer_user_id?: string | null
          user_agent?: string | null
          visitor_fingerprint?: string | null
          visitor_ip?: string | null
        }
        Update: {
          converted?: boolean | null
          converted_at?: string | null
          converted_user_id?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referrer_url?: string | null
          referrer_user_id?: string | null
          user_agent?: string | null
          visitor_fingerprint?: string | null
          visitor_ip?: string | null
        }
        Relationships: []
      }
      referral_credits: {
        Row: {
          created_at: string
          credit_amount: number
          expires_at: string | null
          id: string
          referred_user_id: string
          status: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          credit_amount?: number
          expires_at?: string | null
          id?: string
          referred_user_id: string
          status?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          credit_amount?: number
          expires_at?: string | null
          id?: string
          referred_user_id?: string
          status?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      signal_messages: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          message: string
          message_type: string | null
          metadata: Json | null
          sender_id: string | null
          sender_type: string | null
          signal_id: string | null
          title: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          message: string
          message_type?: string | null
          metadata?: Json | null
          sender_id?: string | null
          sender_type?: string | null
          signal_id?: string | null
          title?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          message?: string
          message_type?: string | null
          metadata?: Json | null
          sender_id?: string | null
          sender_type?: string | null
          signal_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signal_messages_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      signals: {
        Row: {
          agent_id: string | null
          agent_notes: string | null
          ai_reasoning: string | null
          approved_by: string | null
          auto_vip_reason: string | null
          confidence_score: number | null
          created_at: string
          dashboard_data_id: string | null
          entry_price: number
          experts_count: number | null
          id: string
          image_url: string | null
          is_public: boolean | null
          is_vip: boolean | null
          lot_size: number | null
          milestone: string | null
          outcome: Database["public"]["Enums"]["signal_outcome"] | null
          pnl: number | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          risk_amount: number | null
          signal_type: Database["public"]["Enums"]["signal_type"]
          stop_loss: number | null
          symbol: string
          take_profit: number | null
          taken_at: string | null
          taken_by_user: boolean | null
          trade_type: string | null
          user_id: string | null
          vip_notes: string | null
        }
        Insert: {
          agent_id?: string | null
          agent_notes?: string | null
          ai_reasoning?: string | null
          approved_by?: string | null
          auto_vip_reason?: string | null
          confidence_score?: number | null
          created_at?: string
          dashboard_data_id?: string | null
          entry_price: number
          experts_count?: number | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          is_vip?: boolean | null
          lot_size?: number | null
          milestone?: string | null
          outcome?: Database["public"]["Enums"]["signal_outcome"] | null
          pnl?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_amount?: number | null
          signal_type: Database["public"]["Enums"]["signal_type"]
          stop_loss?: number | null
          symbol: string
          take_profit?: number | null
          taken_at?: string | null
          taken_by_user?: boolean | null
          trade_type?: string | null
          user_id?: string | null
          vip_notes?: string | null
        }
        Update: {
          agent_id?: string | null
          agent_notes?: string | null
          ai_reasoning?: string | null
          approved_by?: string | null
          auto_vip_reason?: string | null
          confidence_score?: number | null
          created_at?: string
          dashboard_data_id?: string | null
          entry_price?: number
          experts_count?: number | null
          id?: string
          image_url?: string | null
          is_public?: boolean | null
          is_vip?: boolean | null
          lot_size?: number | null
          milestone?: string | null
          outcome?: Database["public"]["Enums"]["signal_outcome"] | null
          pnl?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_amount?: number | null
          signal_type?: Database["public"]["Enums"]["signal_type"]
          stop_loss?: number | null
          symbol?: string
          take_profit?: number | null
          taken_at?: string | null
          taken_by_user?: boolean | null
          trade_type?: string | null
          user_id?: string | null
          vip_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signals_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "admin_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signals_dashboard_data_id_fkey"
            columns: ["dashboard_data_id"]
            isOneToOne: false
            referencedRelation: "dashboard_data"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          created_at: string | null
          id: string
          maintenance_message: string | null
          maintenance_mode: boolean | null
          maintenance_started_at: string | null
          maintenance_started_by: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          maintenance_message?: string | null
          maintenance_mode?: boolean | null
          maintenance_started_at?: string | null
          maintenance_started_by?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          maintenance_message?: string | null
          maintenance_mode?: boolean | null
          maintenance_started_at?: string | null
          maintenance_started_by?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      strategy_customizations: {
        Row: {
          created_at: string | null
          id: string
          max_daily_drawdown: number | null
          max_daily_trades: number | null
          min_rr_ratio: number | null
          notes: string | null
          preferred_pairs: string[] | null
          preferred_sessions: string[] | null
          risk_per_trade: number | null
          signal_filters: Json | null
          strategy_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          max_daily_drawdown?: number | null
          max_daily_trades?: number | null
          min_rr_ratio?: number | null
          notes?: string | null
          preferred_pairs?: string[] | null
          preferred_sessions?: string[] | null
          risk_per_trade?: number | null
          signal_filters?: Json | null
          strategy_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          max_daily_drawdown?: number | null
          max_daily_trades?: number | null
          min_rr_ratio?: number | null
          notes?: string | null
          preferred_pairs?: string[] | null
          preferred_sessions?: string[] | null
          risk_per_trade?: number | null
          signal_filters?: Json | null
          strategy_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string | null
          description: string
          id: string
          priority: string | null
          resolution: string | null
          resolved_at: string | null
          status: string | null
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category: string
          created_at?: string | null
          description: string
          id?: string
          priority?: string | null
          resolution?: string | null
          resolved_at?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          priority?: string | null
          resolution?: string | null
          resolved_at?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      system_notifications: {
        Row: {
          content: string | null
          created_at: string | null
          id: string
          message: string
          message_type: string | null
          metadata: Json | null
          sender_id: string | null
          sender_type: string | null
          signal_id: string | null
          title: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string
          message: string
          message_type?: string | null
          metadata?: Json | null
          sender_id?: string | null
          sender_type?: string | null
          signal_id?: string | null
          title?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string
          message?: string
          message_type?: string | null
          metadata?: Json | null
          sender_id?: string | null
          sender_type?: string | null
          signal_id?: string | null
          title?: string | null
        }
        Relationships: []
      }
      trade_consistency_alerts: {
        Row: {
          account_id: string | null
          alert_type: string
          created_at: string | null
          current_value: number | null
          dismissed: boolean | null
          expected_value: number | null
          id: string
          message: string | null
          severity: string | null
          threshold_pct: number | null
          user_id: string
          was_blocked: boolean | null
        }
        Insert: {
          account_id?: string | null
          alert_type: string
          created_at?: string | null
          current_value?: number | null
          dismissed?: boolean | null
          expected_value?: number | null
          id?: string
          message?: string | null
          severity?: string | null
          threshold_pct?: number | null
          user_id: string
          was_blocked?: boolean | null
        }
        Update: {
          account_id?: string | null
          alert_type?: string
          created_at?: string | null
          current_value?: number | null
          dismissed?: boolean | null
          expected_value?: number | null
          id?: string
          message?: string | null
          severity?: string | null
          threshold_pct?: number | null
          user_id?: string
          was_blocked?: boolean | null
        }
        Relationships: []
      }
      trade_daily_stats: {
        Row: {
          account_id: string
          consecutive_losses: number | null
          consecutive_wins: number | null
          created_at: string | null
          date: string
          id: string
          losing_trades: number | null
          total_pnl: number | null
          total_trades: number | null
          user_id: string
          winning_trades: number | null
        }
        Insert: {
          account_id: string
          consecutive_losses?: number | null
          consecutive_wins?: number | null
          created_at?: string | null
          date: string
          id?: string
          losing_trades?: number | null
          total_pnl?: number | null
          total_trades?: number | null
          user_id: string
          winning_trades?: number | null
        }
        Update: {
          account_id?: string
          consecutive_losses?: number | null
          consecutive_wins?: number | null
          created_at?: string | null
          date?: string
          id?: string
          losing_trades?: number | null
          total_pnl?: number | null
          total_trades?: number | null
          user_id?: string
          winning_trades?: number | null
        }
        Relationships: []
      }
      trade_journal: {
        Row: {
          created_at: string
          emotions: string | null
          entry_date: string
          entry_price: number
          exit_date: string | null
          exit_price: number | null
          id: string
          lot_size: number | null
          notes: string | null
          pnl: number | null
          pnl_percentage: number | null
          screenshot_url: string | null
          setup_type: string | null
          status: string | null
          stop_loss: number | null
          symbol: string
          tags: string[] | null
          take_profit: number | null
          trade_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emotions?: string | null
          entry_date?: string
          entry_price: number
          exit_date?: string | null
          exit_price?: number | null
          id?: string
          lot_size?: number | null
          notes?: string | null
          pnl?: number | null
          pnl_percentage?: number | null
          screenshot_url?: string | null
          setup_type?: string | null
          status?: string | null
          stop_loss?: number | null
          symbol: string
          tags?: string[] | null
          take_profit?: number | null
          trade_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          emotions?: string | null
          entry_date?: string
          entry_price?: number
          exit_date?: string | null
          exit_price?: number | null
          id?: string
          lot_size?: number | null
          notes?: string | null
          pnl?: number | null
          pnl_percentage?: number | null
          screenshot_url?: string | null
          setup_type?: string | null
          status?: string | null
          stop_loss?: number | null
          symbol?: string
          tags?: string[] | null
          take_profit?: number | null
          trade_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trade_management_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          signal_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          signal_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          signal_id?: string | null
        }
        Relationships: []
      }
      trade_post_mortems: {
        Row: {
          created_at: string | null
          emotion_after: string | null
          emotion_before: string | null
          id: string
          lessons_learned: string | null
          reflection: string | null
          trade_id: string | null
          user_id: string
          would_take_again: boolean | null
        }
        Insert: {
          created_at?: string | null
          emotion_after?: string | null
          emotion_before?: string | null
          id?: string
          lessons_learned?: string | null
          reflection?: string | null
          trade_id?: string | null
          user_id: string
          would_take_again?: boolean | null
        }
        Update: {
          created_at?: string | null
          emotion_after?: string | null
          emotion_before?: string | null
          id?: string
          lessons_learned?: string | null
          reflection?: string | null
          trade_id?: string | null
          user_id?: string
          would_take_again?: boolean | null
        }
        Relationships: []
      }
      trading_mistake_patterns: {
        Row: {
          account_id: string | null
          avg_pnl_when_mistake: number | null
          count: number | null
          created_at: string | null
          id: string
          mistake_type: string
          period_end: string | null
          period_start: string | null
          total_pnl_impact: number | null
          user_id: string
          win_rate_with_mistake: number | null
        }
        Insert: {
          account_id?: string | null
          avg_pnl_when_mistake?: number | null
          count?: number | null
          created_at?: string | null
          id?: string
          mistake_type: string
          period_end?: string | null
          period_start?: string | null
          total_pnl_impact?: number | null
          user_id: string
          win_rate_with_mistake?: number | null
        }
        Update: {
          account_id?: string | null
          avg_pnl_when_mistake?: number | null
          count?: number | null
          created_at?: string | null
          id?: string
          mistake_type?: string
          period_end?: string | null
          period_start?: string | null
          total_pnl_impact?: number | null
          user_id?: string
          win_rate_with_mistake?: number | null
        }
        Relationships: []
      }
      treasure_hunt_config: {
        Row: {
          clue_data: Json | null
          created_at: string | null
          end_date: string | null
          id: string
          is_active: boolean | null
          prize_amount: number | null
          reveal_date: string | null
          spins_remaining: number | null
          start_date: string | null
          updated_at: string | null
          winners_announced: boolean | null
        }
        Insert: {
          clue_data?: Json | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          prize_amount?: number | null
          reveal_date?: string | null
          spins_remaining?: number | null
          start_date?: string | null
          updated_at?: string | null
          winners_announced?: boolean | null
        }
        Update: {
          clue_data?: Json | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          is_active?: boolean | null
          prize_amount?: number | null
          reveal_date?: string | null
          spins_remaining?: number | null
          start_date?: string | null
          updated_at?: string | null
          winners_announced?: boolean | null
        }
        Relationships: []
      }
      treasure_hunt_entries: {
        Row: {
          announcement_status: string | null
          answer: string | null
          clue_number: number | null
          completed_at: string | null
          created_at: string | null
          current_stage: number | null
          email: string | null
          hints_used: number | null
          id: string
          is_correct: boolean | null
          is_winner: boolean | null
          started_at: string | null
          twitter_handle: string | null
          user_id: string | null
          winner_position: number | null
        }
        Insert: {
          announcement_status?: string | null
          answer?: string | null
          clue_number?: number | null
          completed_at?: string | null
          created_at?: string | null
          current_stage?: number | null
          email?: string | null
          hints_used?: number | null
          id?: string
          is_correct?: boolean | null
          is_winner?: boolean | null
          started_at?: string | null
          twitter_handle?: string | null
          user_id?: string | null
          winner_position?: number | null
        }
        Update: {
          announcement_status?: string | null
          answer?: string | null
          clue_number?: number | null
          completed_at?: string | null
          created_at?: string | null
          current_stage?: number | null
          email?: string | null
          hints_used?: number | null
          id?: string
          is_correct?: boolean | null
          is_winner?: boolean | null
          started_at?: string | null
          twitter_handle?: string | null
          user_id?: string | null
          winner_position?: number | null
        }
        Relationships: []
      }
      user_account_manager_assignments: {
        Row: {
          account_manager_id: string | null
          assigned_at: string | null
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          account_manager_id?: string | null
          assigned_at?: string | null
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          account_manager_id?: string | null
          assigned_at?: string | null
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_account_manager_assignments_account_manager_id_fkey"
            columns: ["account_manager_id"]
            isOneToOne: false
            referencedRelation: "account_managers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_key: string
          category: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
          points: number | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_key: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          points?: number | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_key?: string
          category?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          points?: number | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          activity_details: Json | null
          activity_type: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          page: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activity_details?: Json | null
          activity_type: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          page?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activity_details?: Json | null
          activity_type?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          page?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_activity_log: {
        Row: {
          activity_details: Json | null
          activity_type: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          page: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          activity_details?: Json | null
          activity_type?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          page?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          activity_details?: Json | null
          activity_type?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          page?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_ai_settings: {
        Row: {
          api_key_encrypted: string
          created_at: string
          id: string
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key_encrypted: string
          created_at?: string
          id?: string
          provider?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key_encrypted?: string
          created_at?: string
          id?: string
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_key: string
          created_at: string | null
          description: string | null
          earned_at: string | null
          icon: string | null
          id: string
          name: string
          tier: string | null
          user_id: string
        }
        Insert: {
          badge_key: string
          created_at?: string | null
          description?: string | null
          earned_at?: string | null
          icon?: string | null
          id?: string
          name: string
          tier?: string | null
          user_id: string
        }
        Update: {
          badge_key?: string
          created_at?: string | null
          description?: string | null
          earned_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          tier?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          created_at: string
          electronic_signature_accepted: boolean
          id: string
          ip_address: string | null
          privacy_accepted: boolean
          risk_disclosure_accepted: boolean
          signed_at: string
          terms_accepted: boolean
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          electronic_signature_accepted?: boolean
          id?: string
          ip_address?: string | null
          privacy_accepted?: boolean
          risk_disclosure_accepted?: boolean
          signed_at?: string
          terms_accepted?: boolean
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          electronic_signature_accepted?: boolean
          id?: string
          ip_address?: string | null
          privacy_accepted?: boolean
          risk_disclosure_accepted?: boolean
          signed_at?: string
          terms_accepted?: boolean
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_daily_stats: {
        Row: {
          account_id: string
          contributed_pct_of_total: number | null
          created_at: string | null
          daily_pnl: number | null
          date: string
          id: string
          trades_count: number | null
          user_id: string
          win_rate: number | null
        }
        Insert: {
          account_id: string
          contributed_pct_of_total?: number | null
          created_at?: string | null
          daily_pnl?: number | null
          date: string
          id?: string
          trades_count?: number | null
          user_id: string
          win_rate?: number | null
        }
        Update: {
          account_id?: string
          contributed_pct_of_total?: number | null
          created_at?: string | null
          daily_pnl?: number | null
          date?: string
          id?: string
          trades_count?: number | null
          user_id?: string
          win_rate?: number | null
        }
        Relationships: []
      }
      user_deposits: {
        Row: {
          account_id: string | null
          amount: number
          confirmed_at: string | null
          created_at: string | null
          currency: string | null
          deposit_date: string | null
          deposited_at: string | null
          id: string
          notes: string | null
          payment_method: string | null
          status: string | null
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          confirmed_at?: string | null
          created_at?: string | null
          currency?: string | null
          deposit_date?: string | null
          deposited_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          confirmed_at?: string | null
          created_at?: string | null
          currency?: string | null
          deposit_date?: string | null
          deposited_at?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_personal_accounts: {
        Row: {
          account_label: string | null
          account_name: string | null
          account_number: string | null
          account_type: string | null
          broker: string | null
          broker_name: string | null
          capital_floor: number | null
          created_at: string | null
          currency: string | null
          current_balance: number | null
          daily_loss_limit_pct: number | null
          daily_pnl: number | null
          highest_balance: number | null
          id: string
          initial_balance: number | null
          is_active: boolean | null
          is_primary: boolean | null
          leverage: number | null
          lock_reason: string | null
          max_drawdown: number | null
          monthly_income_goal: number | null
          preferred_pairs: string[] | null
          profit_factor: number | null
          risk_per_trade_pct: number | null
          starting_balance: number | null
          status: string | null
          total_pnl: number | null
          total_trades: number | null
          trading_locked_until: string | null
          trading_session: string | null
          updated_at: string | null
          user_id: string
          win_rate: number | null
        }
        Insert: {
          account_label?: string | null
          account_name?: string | null
          account_number?: string | null
          account_type?: string | null
          broker?: string | null
          broker_name?: string | null
          capital_floor?: number | null
          created_at?: string | null
          currency?: string | null
          current_balance?: number | null
          daily_loss_limit_pct?: number | null
          daily_pnl?: number | null
          highest_balance?: number | null
          id?: string
          initial_balance?: number | null
          is_active?: boolean | null
          is_primary?: boolean | null
          leverage?: number | null
          lock_reason?: string | null
          max_drawdown?: number | null
          monthly_income_goal?: number | null
          preferred_pairs?: string[] | null
          profit_factor?: number | null
          risk_per_trade_pct?: number | null
          starting_balance?: number | null
          status?: string | null
          total_pnl?: number | null
          total_trades?: number | null
          trading_locked_until?: string | null
          trading_session?: string | null
          updated_at?: string | null
          user_id: string
          win_rate?: number | null
        }
        Update: {
          account_label?: string | null
          account_name?: string | null
          account_number?: string | null
          account_type?: string | null
          broker?: string | null
          broker_name?: string | null
          capital_floor?: number | null
          created_at?: string | null
          currency?: string | null
          current_balance?: number | null
          daily_loss_limit_pct?: number | null
          daily_pnl?: number | null
          highest_balance?: number | null
          id?: string
          initial_balance?: number | null
          is_active?: boolean | null
          is_primary?: boolean | null
          leverage?: number | null
          lock_reason?: string | null
          max_drawdown?: number | null
          monthly_income_goal?: number | null
          preferred_pairs?: string[] | null
          profit_factor?: number | null
          risk_per_trade_pct?: number | null
          starting_balance?: number | null
          status?: string | null
          total_pnl?: number | null
          total_trades?: number | null
          trading_locked_until?: string | null
          trading_session?: string | null
          updated_at?: string | null
          user_id?: string
          win_rate?: number | null
        }
        Relationships: []
      }
      user_prop_accounts: {
        Row: {
          account_label: string | null
          account_number: string | null
          account_size: number | null
          account_type: string | null
          allowed_trading_hours: Json | null
          avg_lot_size: number | null
          challenge_deadline: string | null
          challenge_start_date: string | null
          consistency_rule_pct: number | null
          created_at: string | null
          current_equity: number | null
          current_profit: number | null
          current_risk_multiplier: number | null
          daily_dd_limit_pct: number | null
          daily_drawdown_used_pct: number | null
          daily_profit_target: number | null
          days_traded: number | null
          failure_reason: string | null
          highest_equity: number | null
          id: string
          is_trailing_dd: boolean | null
          last_equity_update_at: string | null
          last_sync_at: string | null
          lock_after_target: boolean | null
          max_dd_limit_pct: number | null
          max_drawdown_used_pct: number | null
          max_trading_days: number | null
          min_trading_days: number | null
          news_buffer_minutes: number | null
          payout_amount: number | null
          payout_split: number | null
          personal_daily_loss_limit_pct: number | null
          phase: string | null
          profit_target: number | null
          profit_target_pct: number | null
          prop_firm_name: string | null
          reported_equity: number | null
          require_checklist_before_trading: boolean | null
          rule_version_acknowledged: string | null
          scaling_week: number | null
          starting_balance: number
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_label?: string | null
          account_number?: string | null
          account_size?: number | null
          account_type?: string | null
          allowed_trading_hours?: Json | null
          avg_lot_size?: number | null
          challenge_deadline?: string | null
          challenge_start_date?: string | null
          consistency_rule_pct?: number | null
          created_at?: string | null
          current_equity?: number | null
          current_profit?: number | null
          current_risk_multiplier?: number | null
          daily_dd_limit_pct?: number | null
          daily_drawdown_used_pct?: number | null
          daily_profit_target?: number | null
          days_traded?: number | null
          failure_reason?: string | null
          highest_equity?: number | null
          id?: string
          is_trailing_dd?: boolean | null
          last_equity_update_at?: string | null
          last_sync_at?: string | null
          lock_after_target?: boolean | null
          max_dd_limit_pct?: number | null
          max_drawdown_used_pct?: number | null
          max_trading_days?: number | null
          min_trading_days?: number | null
          news_buffer_minutes?: number | null
          payout_amount?: number | null
          payout_split?: number | null
          personal_daily_loss_limit_pct?: number | null
          phase?: string | null
          profit_target?: number | null
          profit_target_pct?: number | null
          prop_firm_name?: string | null
          reported_equity?: number | null
          require_checklist_before_trading?: boolean | null
          rule_version_acknowledged?: string | null
          scaling_week?: number | null
          starting_balance?: number
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_label?: string | null
          account_number?: string | null
          account_size?: number | null
          account_type?: string | null
          allowed_trading_hours?: Json | null
          avg_lot_size?: number | null
          challenge_deadline?: string | null
          challenge_start_date?: string | null
          consistency_rule_pct?: number | null
          created_at?: string | null
          current_equity?: number | null
          current_profit?: number | null
          current_risk_multiplier?: number | null
          daily_dd_limit_pct?: number | null
          daily_drawdown_used_pct?: number | null
          daily_profit_target?: number | null
          days_traded?: number | null
          failure_reason?: string | null
          highest_equity?: number | null
          id?: string
          is_trailing_dd?: boolean | null
          last_equity_update_at?: string | null
          last_sync_at?: string | null
          lock_after_target?: boolean | null
          max_dd_limit_pct?: number | null
          max_drawdown_used_pct?: number | null
          max_trading_days?: number | null
          min_trading_days?: number | null
          news_buffer_minutes?: number | null
          payout_amount?: number | null
          payout_split?: number | null
          personal_daily_loss_limit_pct?: number | null
          phase?: string | null
          profit_target?: number | null
          profit_target_pct?: number | null
          prop_firm_name?: string | null
          reported_equity?: number | null
          require_checklist_before_trading?: boolean | null
          rule_version_acknowledged?: string | null
          scaling_week?: number | null
          starting_balance?: number
          status?: string | null
          updated_at?: string | null
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_signal_actions: {
        Row: {
          action: string
          action_type: string | null
          created_at: string | null
          id: string
          outcome: string | null
          pnl: number | null
          signal_id: string | null
          taken_at: string | null
          user_id: string
        }
        Insert: {
          action: string
          action_type?: string | null
          created_at?: string | null
          id?: string
          outcome?: string | null
          pnl?: number | null
          signal_id?: string | null
          taken_at?: string | null
          user_id: string
        }
        Update: {
          action?: string
          action_type?: string | null
          created_at?: string | null
          id?: string
          outcome?: string | null
          pnl?: number | null
          signal_id?: string | null
          taken_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_signal_actions_signal_id_fkey"
            columns: ["signal_id"]
            isOneToOne: false
            referencedRelation: "signals"
            referencedColumns: ["id"]
          },
        ]
      }
      user_trade_allocations: {
        Row: {
          account_id: string | null
          closed_at: string | null
          created_at: string | null
          entry_price: number | null
          id: string
          lot_size: number | null
          pnl: number | null
          r_multiple: number | null
          realized_pnl: number | null
          risk_amount: number | null
          signal_id: string | null
          status: string | null
          stop_loss: number | null
          take_profit: number | null
          take_profit_1: number | null
          take_profit_2: number | null
          take_profit_3: number | null
          unrealized_pnl: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id?: string | null
          closed_at?: string | null
          created_at?: string | null
          entry_price?: number | null
          id?: string
          lot_size?: number | null
          pnl?: number | null
          r_multiple?: number | null
          realized_pnl?: number | null
          risk_amount?: number | null
          signal_id?: string | null
          status?: string | null
          stop_loss?: number | null
          take_profit?: number | null
          take_profit_1?: number | null
          take_profit_2?: number | null
          take_profit_3?: number | null
          unrealized_pnl?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string | null
          closed_at?: string | null
          created_at?: string | null
          entry_price?: number | null
          id?: string
          lot_size?: number | null
          pnl?: number | null
          r_multiple?: number | null
          realized_pnl?: number | null
          risk_amount?: number | null
          signal_id?: string | null
          status?: string | null
          stop_loss?: number | null
          take_profit?: number | null
          take_profit_1?: number | null
          take_profit_2?: number | null
          take_profit_3?: number | null
          unrealized_pnl?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_withdrawals: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          notes: string | null
          payment_method: string | null
          processed_at: string | null
          requested_at: string | null
          status: string | null
          transaction_id: string | null
          user_id: string
          wallet_address: string | null
          withdrawal_date: string | null
          withdrawal_type: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          processed_at?: string | null
          requested_at?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id: string
          wallet_address?: string | null
          withdrawal_date?: string | null
          withdrawal_type?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          processed_at?: string | null
          requested_at?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string
          wallet_address?: string | null
          withdrawal_date?: string | null
          withdrawal_type?: string | null
        }
        Relationships: []
      }
      white_glove_support_tickets: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string | null
          description: string | null
          first_response_at: string | null
          id: string
          priority: string | null
          resolved_at: string | null
          response_sla_hours: number | null
          status: string | null
          subject: string
          ticket_number: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          first_response_at?: string | null
          id?: string
          priority?: string | null
          resolved_at?: string | null
          response_sla_hours?: number | null
          status?: string | null
          subject: string
          ticket_number?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          first_response_at?: string | null
          id?: string
          priority?: string | null
          resolved_at?: string | null
          response_sla_hours?: number | null
          status?: string | null
          subject?: string
          ticket_number?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      white_glove_ticket_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          sender_id: string | null
          sender_type: string
          ticket_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          sender_id?: string | null
          sender_type: string
          ticket_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          sender_id?: string | null
          sender_type?: string
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "white_glove_ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "white_glove_support_tickets"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      membership_status:
        | "active"
        | "inactive"
        | "pending"
        | "cancelled"
        | "expired"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      signal_outcome:
        | "pending"
        | "target_hit"
        | "stop_loss_hit"
        | "cancelled"
        | "breakeven"
      signal_type: "BUY" | "SELL"
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
      membership_status: [
        "active",
        "inactive",
        "pending",
        "cancelled",
        "expired",
      ],
      payment_status: ["pending", "completed", "failed", "refunded"],
      signal_outcome: [
        "pending",
        "target_hit",
        "stop_loss_hit",
        "cancelled",
        "breakeven",
      ],
      signal_type: ["BUY", "SELL"],
    },
  },
} as const
