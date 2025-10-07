export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      air_entries: {
        Row: {
          created_at: string
          id: string
          identifier: string
          model_id: number
          source: string
          user_id: string | null
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          identifier?: string
          model_id: number
          source: string
          user_id?: string | null
          version: number
        }
        Update: {
          created_at?: string
          id?: string
          identifier?: string
          model_id?: number
          source?: string
          user_id?: string | null
          version?: number
        }
        Relationships: []
      }
      "avatars-prompts": {
        Row: {
          birth_city: string | null
          birth_country: string | null
          birth_gps_coordinates: string | null
          "birth-day": string | null
          created_at: string | null
          death_city: string | null
          death_country: string | null
          death_gps_coordinates: string | null
          "death-day": string | null
          description: string | null
          first_name: string | null
          gender: string | null
          id: string
          "last-name": string
          source_citation: string | null
        }
        Insert: {
          birth_city?: string | null
          birth_country?: string | null
          birth_gps_coordinates?: string | null
          "birth-day"?: string | null
          created_at?: string | null
          death_city?: string | null
          death_country?: string | null
          death_gps_coordinates?: string | null
          "death-day"?: string | null
          description?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          "last-name": string
          source_citation?: string | null
        }
        Update: {
          birth_city?: string | null
          birth_country?: string | null
          birth_gps_coordinates?: string | null
          "birth-day"?: string | null
          created_at?: string | null
          death_city?: string | null
          death_country?: string | null
          death_gps_coordinates?: string | null
          "death-day"?: string | null
          description?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          "last-name"?: string
          source_citation?: string | null
        }
        Relationships: []
      }
      friends: {
        Row: {
          created_at: string | null
          friend_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          friend_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          friend_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      game_rounds: {
        Row: {
          created_at: string | null
          game_id: string
          id: string
          image_id: string
          round_index: number
        }
        Insert: {
          created_at?: string | null
          game_id: string
          id?: string
          image_id: string
          round_index: number
        }
        Update: {
          created_at?: string | null
          game_id?: string
          id?: string
          image_id?: string
          round_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_rounds_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          completed: boolean | null
          created_at: string | null
          created_by: string | null
          current_round: number | null
          guest_id: string | null
          id: string
          mode: string
          round_count: number | null
          score: number | null
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          created_by?: string | null
          current_round?: number | null
          guest_id?: string | null
          id?: string
          mode: string
          round_count?: number | null
          score?: number | null
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          created_by?: string | null
          current_round?: number | null
          guest_id?: string | null
          id?: string
          mode?: string
          round_count?: number | null
          score?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      guesses: {
        Row: {
          accuracy: number | null
          created_at: string | null
          game_id: string
          guess_lat: number
          guess_lon: number
          guess_year: number
          id: string
          image_id: string
          is_fallback_location: boolean | null
          round_index: number
          user_id: string | null
        }
        Insert: {
          accuracy?: number | null
          created_at?: string | null
          game_id: string
          guess_lat: number
          guess_lon: number
          guess_year: number
          id?: string
          image_id: string
          is_fallback_location?: boolean | null
          round_index: number
          user_id?: string | null
        }
        Update: {
          accuracy?: number | null
          created_at?: string | null
          game_id?: string
          guess_lat?: number
          guess_lon?: number
          guess_year?: number
          id?: string
          image_id?: string
          is_fallback_location?: boolean | null
          round_index?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guesses_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      hints: {
        Row: {
          accuracy_penalty: number
          created_at: string
          distance_km: number | null
          id: string
          image_id: string
          level: number
          text: string
          time_diff_years: number | null
          type: string
          xp_cost: number
        }
        Insert: {
          accuracy_penalty: number
          created_at?: string
          distance_km?: number | null
          id?: string
          image_id: string
          level: number
          text: string
          time_diff_years?: number | null
          type: string
          xp_cost: number
        }
        Update: {
          accuracy_penalty?: number
          created_at?: string
          distance_km?: number | null
          id?: string
          image_id?: string
          level?: number
          text?: string
          time_diff_years?: number | null
          type?: string
          xp_cost?: number
        }
        Relationships: []
      }
      images: {
        Row: {
          "1_when_century": string | null
          "1_where_continent": string | null
          "2_when_event": string | null
          "2_when_event_years": string | null
          "2_where_landmark": string | null
          "2_where_landmark_km": number | null
          "3_when_decade": string | null
          "3_where_region": string | null
          "4_when_event": string | null
          "4_when_event_years": number | null
          "4_where_landmark": string | null
          "4_where_landmark_km": number | null
          "5_when_clues": string | null
          "5_where_clues": string | null
          accuracy_score: Json | null
          ai_generated: boolean | null
          approx_people_count: number | null
          aspect_ratio: string | null
          celebrity: boolean | null
          cfg_scale: number | null
          confidence: number | null
          content_hash: string | null
          cost: number | null
          country: string | null
          created_at: string
          date: string | null
          description: string | null
          desktop_image_url: string | null
          binary: string | null
          desktop_size_kb: number | null
          exact_date: string | null
          gps_coordinates: string | null
          has_full_hints: boolean | null
          height: number | null
          id: string
          image_url: string | null
          key_elements: string | null
          last_verified: string | null
          latitude: number | null
          location: string | null
          location_name: string | null
          longitude: number | null
          mature_content: boolean | null
          mobile_image_url: string | null
          mobile_size_kb: number | null
          model: string | null
          negative_prompt: string | null
          optimized_image_url: string | null
          original_size_kb: number | null
          output_format: string | null
          positive_prompt: string | null
          prompt: string
          prompt_id: string | null
          ready: boolean | null
          real_event: boolean | null
          scheduler: string | null
          seed: number | null
          source_citation: string | null
          steps: number | null
          theme: string | null
          thumbnail_image_url: string | null
          title: string | null
          user_id: string
          width: number | null
          year: number | null
        }
        Insert: {
          "1_when_century"?: string | null
          "1_where_continent"?: string | null
          "2_when_event"?: string | null
          "2_when_event_years"?: string | null
          "2_where_landmark"?: string | null
          "2_where_landmark_km"?: number | null
          "3_when_decade"?: string | null
          "3_where_region"?: string | null
          "4_when_event"?: string | null
          "4_when_event_years"?: number | null
          "4_where_landmark"?: string | null
          "4_where_landmark_km"?: number | null
          "5_when_clues"?: string | null
          "5_where_clues"?: string | null
          accuracy_score?: Json | null
          ai_generated?: boolean | null
          approx_people_count?: number | null
          aspect_ratio?: string | null
          celebrity?: boolean | null
          cfg_scale?: number | null
          confidence?: number | null
          content_hash?: string | null
          cost?: number | null
          country?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          desktop_image_url?: string | null
          binary?: string | null
          desktop_size_kb?: number | null
          exact_date?: string | null
          gps_coordinates?: string | null
          has_full_hints?: boolean | null
          height?: number | null
          id?: string
          image_url?: string | null
          key_elements?: string | null
          last_verified?: string | null
          latitude?: number | null
          location?: string | null
          location_name?: string | null
          longitude?: number | null
          mature_content?: boolean | null
          mobile_image_url?: string | null
          mobile_size_kb?: number | null
          model?: string | null
          negative_prompt?: string | null
          optimized_image_url?: string | null
          original_size_kb?: number | null
          output_format?: string | null
          positive_prompt?: string | null
          prompt: string
          prompt_id?: string | null
          ready?: boolean | null
          real_event?: boolean | null
          scheduler?: string | null
          seed?: number | null
          source_citation?: string | null
          steps?: number | null
          theme?: string | null
          thumbnail_image_url?: string | null
          title?: string | null
          user_id: string
          width?: number | null
          year?: number | null
        }
        Update: {
          "1_when_century"?: string | null
          "1_where_continent"?: string | null
          "2_when_event"?: string | null
          "2_when_event_years"?: string | null
          "2_where_landmark"?: string | null
          "2_where_landmark_km"?: number | null
          "3_when_decade"?: string | null
          "3_where_region"?: string | null
          "4_when_event"?: string | null
          "4_when_event_years"?: number | null
          "4_where_landmark"?: string | null
          "4_where_landmark_km"?: number | null
          "5_when_clues"?: string | null
          "5_where_clues"?: string | null
          accuracy_score?: Json | null
          ai_generated?: boolean | null
          approx_people_count?: number | null
          aspect_ratio?: string | null
          celebrity?: boolean | null
          cfg_scale?: number | null
          confidence?: number | null
          content_hash?: string | null
          cost?: number | null
          country?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          desktop_image_url?: string | null
          binary?: string | null
          desktop_size_kb?: number | null
          exact_date?: string | null
          gps_coordinates?: string | null
          has_full_hints?: boolean | null
          height?: number | null
          id?: string
          image_url?: string | null
          key_elements?: string | null
          last_verified?: string | null
          latitude?: number | null
          location?: string | null
          location_name?: string | null
          longitude?: number | null
          mature_content?: boolean | null
          mobile_image_url?: string | null
          mobile_size_kb?: number | null
          model?: string | null
          negative_prompt?: string | null
          optimized_image_url?: string | null
          original_size_kb?: number | null
          output_format?: string | null
          positive_prompt?: string | null
          prompt?: string
          prompt_id?: string | null
          ready?: boolean | null
          real_event?: boolean | null
          scheduler?: string | null
          seed?: number | null
          source_citation?: string | null
          steps?: number | null
          theme?: string | null
          thumbnail_image_url?: string | null
          title?: string | null
          user_id?: string
          width?: number | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "images_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_image_url: string | null
          avatar_name: string | null
          avatar_url: string | null
          created_at: string | null
          display_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_image_url?: string | null
          avatar_name?: string | null
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_image_url?: string | null
          avatar_name?: string | null
          avatar_url?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      prompts: {
        Row: {
          "1_when_century": string | null
          "1_where_continent": string | null
          "2_when_event": string | null
          "2_when_event_years": string | null
          "2_where_landmark": string | null
          "2_where_landmark_km": number | null
          "3_when_decade": string | null
          "3_where_region": string | null
          "4_when_event": string | null
          "4_when_event_years": number | null
          "4_where_landmark": string | null
          "4_where_landmark_km": number | null
          "5_when_clues": string | null
          "5_where_clues": string | null
          ai_generated: boolean | null
          approx_people_count: number | null
          celebrity: boolean | null
          confidence: number | null
          country: string | null
          created_at: string
          date: string | null
          description: string | null
          gps_coordinates: string | null
          has_full_hints: boolean | null
          id: string
          key_elements: string | null
          last_verified: string | null
          latitude: number | null
          location: string | null
          longitude: number | null
          negative_prompt: string | null
          prompt: string
          real_event: boolean | null
          source_citation: string | null
          theme: string | null
          title: string | null
          user_id: string
          year: number | null
        }
        Insert: {
          "1_when_century"?: string | null
          "1_where_continent"?: string | null
          "2_when_event"?: string | null
          "2_when_event_years"?: string | null
          "2_where_landmark"?: string | null
          "2_where_landmark_km"?: number | null
          "3_when_decade"?: string | null
          "3_where_region"?: string | null
          "4_when_event"?: string | null
          "4_when_event_years"?: number | null
          "4_where_landmark"?: string | null
          "4_where_landmark_km"?: number | null
          "5_when_clues"?: string | null
          "5_where_clues"?: string | null
          ai_generated?: boolean | null
          approx_people_count?: number | null
          celebrity?: boolean | null
          confidence?: number | null
          country?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          gps_coordinates?: string | null
          has_full_hints?: boolean | null
          id?: string
          key_elements?: string | null
          last_verified?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          negative_prompt?: string | null
          prompt: string
          real_event?: boolean | null
          source_citation?: string | null
          theme?: string | null
          title?: string | null
          user_id: string
          year?: number | null
        }
        Update: {
          "1_when_century"?: string | null
          "1_where_continent"?: string | null
          "2_when_event"?: string | null
          "2_when_event_years"?: string | null
          "2_where_landmark"?: string | null
          "2_where_landmark_km"?: number | null
          "3_when_decade"?: string | null
          "3_where_region"?: string | null
          "4_when_event"?: string | null
          "4_when_event_years"?: number | null
          "4_where_landmark"?: string | null
          "4_where_landmark_km"?: number | null
          "5_when_clues"?: string | null
          "5_where_clues"?: string | null
          ai_generated?: boolean | null
          approx_people_count?: number | null
          celebrity?: boolean | null
          confidence?: number | null
          country?: string | null
          created_at?: string
          date?: string | null
          description?: string | null
          gps_coordinates?: string | null
          has_full_hints?: boolean | null
          id?: string
          key_elements?: string | null
          last_verified?: string | null
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          negative_prompt?: string | null
          prompt?: string
          real_event?: boolean | null
          source_citation?: string | null
          theme?: string | null
          title?: string | null
          user_id?: string
          year?: number | null
        }
        Relationships: []
      }
      "prompts-ref": {
        Row: {
          "1_when_century": string | null
          "1_where_continent": string | null
          "2_when_event": string | null
          "2_when_event_years": string | null
          "2_where_landmark": string | null
          "2_where_landmark_km": number | null
          "3_when_decade": string | null
          "3_where_region": string | null
          "4_when_event": string | null
          "4_when_event_years": number | null
          "4_where_landmark": string | null
          "4_where_landmark_km": number | null
          "5_when_clues": string | null
          "5_where_clues": string | null
          ai_generated: boolean | null
          approx_people_count: number | null
          celebrity: boolean | null
          confidence: number | null
          country: string | null
          created_at: string | null
          date: string | null
          description: string | null
          gps_coordinates: string | null
          has_full_hints: boolean | null
          id: string
          key_elements: string | null
          last_verified: string | null
          latitude: number
          location: string | null
          longitude: number
          negative_prompt: string | null
          prompt: string
          real_event: boolean | null
          source_citation: string | null
          theme: string | null
          title: string | null
          updated_at: string | null
          user_id: string
          year: number | null
        }
        Insert: {
          "1_when_century"?: string | null
          "1_where_continent"?: string | null
          "2_when_event"?: string | null
          "2_when_event_years"?: string | null
          "2_where_landmark"?: string | null
          "2_where_landmark_km"?: number | null
          "3_when_decade"?: string | null
          "3_where_region"?: string | null
          "4_when_event"?: string | null
          "4_when_event_years"?: number | null
          "4_where_landmark"?: string | null
          "4_where_landmark_km"?: number | null
          "5_when_clues"?: string | null
          "5_where_clues"?: string | null
          ai_generated?: boolean | null
          approx_people_count?: number | null
          celebrity?: boolean | null
          confidence?: number | null
          country?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          gps_coordinates?: string | null
          has_full_hints?: boolean | null
          id?: string
          key_elements?: string | null
          last_verified?: string | null
          latitude: number
          location?: string | null
          longitude: number
          negative_prompt?: string | null
          prompt: string
          real_event?: boolean | null
          source_citation?: string | null
          theme?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          year?: number | null
        }
        Update: {
          "1_when_century"?: string | null
          "1_where_continent"?: string | null
          "2_when_event"?: string | null
          "2_when_event_years"?: string | null
          "2_where_landmark"?: string | null
          "2_where_landmark_km"?: number | null
          "3_when_decade"?: string | null
          "3_where_region"?: string | null
          "4_when_event"?: string | null
          "4_when_event_years"?: number | null
          "4_where_landmark"?: string | null
          "4_where_landmark_km"?: number | null
          "5_when_clues"?: string | null
          "5_where_clues"?: string | null
          ai_generated?: boolean | null
          approx_people_count?: number | null
          celebrity?: boolean | null
          confidence?: number | null
          country?: string | null
          created_at?: string | null
          date?: string | null
          description?: string | null
          gps_coordinates?: string | null
          has_full_hints?: boolean | null
          id?: string
          key_elements?: string | null
          last_verified?: string | null
          latitude?: number
          location?: string | null
          longitude?: number
          negative_prompt?: string | null
          prompt?: string
          real_event?: boolean | null
          source_citation?: string | null
          theme?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          year?: number | null
        }
        Relationships: []
      }
      round_hints: {
        Row: {
          hint_id: string
          id: string
          purchased_at: string
          round_id: string
          user_id: string
        }
        Insert: {
          hint_id: string
          id?: string
          purchased_at?: string
          round_id: string
          user_id: string
        }
        Update: {
          hint_id?: string
          id?: string
          purchased_at?: string
          round_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "round_hints_hint_id_fkey"
            columns: ["hint_id"]
            isOneToOne: false
            referencedRelation: "hints"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          id: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          id: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          id?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      trash: {
        Row: {
          "1_when_century": string | null
          "1_where_continent": string | null
          "2_when_event": string | null
          "2_when_event_years": string | null
          "2_where_landmark": string | null
          "2_where_landmark_km": number | null
          "3_when_decade": string | null
          "3_where_region": string | null
          ai_generated: boolean | null
          celebrity: boolean | null
          country: string | null
          created_at: string | null
          date: string | null
          deleted_at: string | null
          description: string | null
          gps_coordinates: string | null
          hint_what: string | null
          hint_when: string | null
          hint_where: string | null
          id: string
          key_elements: string | null
          location: string | null
          original_prompt_id: string
          prompt: string
          real_event: boolean | null
          theme: string | null
          title: string | null
          updated_at: string | null
          user_id: string
          year: number | null
        }
        Insert: {
          "1_when_century"?: string | null
          "1_where_continent"?: string | null
          "2_when_event"?: string | null
          "2_when_event_years"?: string | null
          "2_where_landmark"?: string | null
          "2_where_landmark_km"?: number | null
          "3_when_decade"?: string | null
          "3_where_region"?: string | null
          ai_generated?: boolean | null
          celebrity?: boolean | null
          country?: string | null
          created_at?: string | null
          date?: string | null
          deleted_at?: string | null
          description?: string | null
          gps_coordinates?: string | null
          hint_what?: string | null
          hint_when?: string | null
          hint_where?: string | null
          id?: string
          key_elements?: string | null
          location?: string | null
          original_prompt_id: string
          prompt: string
          real_event?: boolean | null
          theme?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
          year?: number | null
        }
        Update: {
          "1_when_century"?: string | null
          "1_where_continent"?: string | null
          "2_when_event"?: string | null
          "2_when_event_years"?: string | null
          "2_where_landmark"?: string | null
          "2_where_landmark_km"?: number | null
          "3_when_decade"?: string | null
          "3_where_region"?: string | null
          ai_generated?: boolean | null
          celebrity?: boolean | null
          country?: string | null
          created_at?: string | null
          date?: string | null
          deleted_at?: string | null
          description?: string | null
          gps_coordinates?: string | null
          hint_what?: string | null
          hint_when?: string | null
          hint_where?: string | null
          id?: string
          key_elements?: string | null
          location?: string | null
          original_prompt_id?: string
          prompt?: string
          real_event?: boolean | null
          theme?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
          year?: number | null
        }
        Relationships: []
      }
      user_metrics: {
        Row: {
          best_accuracy: number | null
          challenge_accuracy: number | null
          created_at: string | null
          games_played: number
          global_rank: number | null
          id: string
          location_accuracy: number | null
          location_bullseye: number
          overall_accuracy: number | null
          perfect_games: number
          time_accuracy: number | null
          updated_at: string | null
          user_id: string | null
          xp_total: number | null
          year_bullseye: number
        }
        Insert: {
          best_accuracy?: number | null
          challenge_accuracy?: number | null
          created_at?: string | null
          games_played?: number
          global_rank?: number | null
          id?: string
          location_accuracy?: number | null
          location_bullseye?: number
          overall_accuracy?: number | null
          perfect_games?: number
          time_accuracy?: number | null
          updated_at?: string | null
          user_id?: string | null
          xp_total?: number | null
          year_bullseye?: number
        }
        Update: {
          best_accuracy?: number | null
          challenge_accuracy?: number | null
          created_at?: string | null
          games_played?: number
          global_rank?: number | null
          id?: string
          location_accuracy?: number | null
          location_bullseye?: number
          overall_accuracy?: number | null
          perfect_games?: number
          time_accuracy?: number | null
          updated_at?: string | null
          user_id?: string | null
          xp_total?: number | null
          year_bullseye?: number
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          id: string
          settings_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          settings_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          settings_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_prompts: {
        Args: { prompt_ids: string[] }
        Returns: Json
      }
      delete_unlinked_prompts: {
        Args: { prompt_ids: string[] }
        Returns: Json
      }
      get_random_game_images: {
        Args: { limit_count: number }
        Returns: {
          id: string
          title: string
          description: string
          latitude: number
          longitude: number
          year: number
          image_url: string
          location_name: string
          country: string
          continent: string
        }[]
      }
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      parse_gps_coordinates: {
        Args: { gps_text: string }
        Returns: {
          lat: number
          lng: number
        }[]
      }
      purchase_hint: {
        Args: {
          p_round_id: string
          p_hint_id: string
          p_user_id: string
          p_xp_cost: number
          p_accuracy_penalty: number
        }
        Returns: undefined
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
      upsert_user_settings: {
        Args: { p_user_id: string; p_settings: Json }
        Returns: undefined
      }
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
