import type { MapCell } from "@/components/map/WorldMap";

export interface ScoreRowUI {
  playerId: string;
  username: string;
  isMe: boolean;
  gii: number;
  regions: number;
  minds: number;
  continents: number;
  continentIds: string[];
}

export interface OrderUI {
  id: string;
  source_country_id: string;
  target_country_id: string;
  minds: number;
  order_type: "transfer" | "explore" | "attack";
}

export interface LogUI {
  id: string;
  day_number: number;
  message: string;
  type: "info" | "combat" | "conquest" | "economy";
  actor_id: string | null;
  created_at: string;
}

export type { MapCell };
