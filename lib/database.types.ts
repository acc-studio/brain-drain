/**
 * Database types. Hand-written to match supabase/migrations.
 * Regenerate from the live local DB with:  npm run db:types
 */
export type Json = string | number | boolean | null | { [k: string]: Json } | Json[];

export type OrderType = "transfer" | "explore" | "attack";
export type LogType = "info" | "combat" | "conquest" | "economy";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; username: string; color_hue: number; created_at: string };
        Insert: { id: string; username: string; color_hue?: number; created_at?: string };
        Update: Partial<{ username: string; color_hue: number }>;
        Relationships: [];
      };
      countries: {
        Row: { id: string; name: string; continent: string; connections: string[] };
        Insert: { id: string; name: string; continent: string; connections?: string[] };
        Update: Partial<{ name: string; continent: string; connections: string[] }>;
        Relationships: [];
      };
      map_state: {
        Row: {
          country_id: string;
          owner_id: string | null;
          minds: number;
          updated_at: string;
        };
        Insert: {
          country_id: string;
          owner_id?: string | null;
          minds?: number;
          updated_at?: string;
        };
        Update: Partial<{ owner_id: string | null; minds: number; updated_at: string }>;
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          day_number: number;
          source_country_id: string;
          target_country_id: string;
          minds: number;
          order_type: OrderType;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          day_number: number;
          source_country_id: string;
          target_country_id: string;
          minds: number;
          order_type: OrderType;
          created_at?: string;
        };
        Update: Partial<{
          source_country_id: string;
          target_country_id: string;
          minds: number;
          order_type: OrderType;
        }>;
        Relationships: [];
      };
      game_logs: {
        Row: {
          id: string;
          day_number: number;
          message: string;
          type: LogType;
          actor_id: string | null;
          region_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          day_number: number;
          message: string;
          type?: LogType;
          actor_id?: string | null;
          region_id?: string | null;
          created_at?: string;
        };
        Update: Partial<{ message: string; type: LogType }>;
        Relationships: [];
      };
      daily_puzzles: {
        Row: {
          day_number: number;
          word_solution: string;
          word_length: number;
          numbers_target: number;
          numbers_pool: number[];
          code_solution: string[];
          code_length: number;
          symbol_palette: string[];
          created_at: string;
        };
        Insert: {
          day_number: number;
          word_solution: string;
          word_length: number;
          numbers_target: number;
          numbers_pool: number[];
          code_solution: string[];
          code_length: number;
          symbol_palette: string[];
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["daily_puzzles"]["Insert"]>;
        Relationships: [];
      };
      daily_performance: {
        Row: {
          id: string;
          user_id: string;
          day_number: number;
          word_tier: number;
          word_attempts: number;
          word_guesses: string[];
          word_completed_at: string | null;
          numbers_tier: number;
          numbers_result: number | null;
          numbers_expression: string[] | null;
          numbers_completed_at: string | null;
          code_tier: number;
          code_attempts: number;
          code_guesses: string[][];
          code_completed_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          day_number: number;
          word_tier?: number;
          word_attempts?: number;
          word_guesses?: string[];
          word_completed_at?: string | null;
          numbers_tier?: number;
          numbers_result?: number | null;
          numbers_expression?: string[] | null;
          numbers_completed_at?: string | null;
          code_tier?: number;
          code_attempts?: number;
          code_guesses?: string[][];
          code_completed_at?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["daily_performance"]["Insert"]>;
        Relationships: [];
      };
      global_settings: {
        Row: { key: string; value: Json; updated_at: string };
        Insert: { key: string; value: Json; updated_at?: string };
        Update: Partial<{ value: Json; updated_at: string }>;
        Relationships: [];
      };
    };
    Views: {
      public_daily_puzzles: {
        Row: {
          day_number: number;
          word_length: number;
          numbers_target: number;
          numbers_pool: number[];
          code_length: number;
          symbol_palette: string[];
        };
        Relationships: [];
      };
    };
    Functions: {
      current_day: { Args: Record<string, never>; Returns: number };
      enlist: { Args: Record<string, never>; Returns: string };
    };
    Enums: {
      order_type: OrderType;
      log_type: LogType;
    };
    CompositeTypes: Record<string, never>;
  };
}
