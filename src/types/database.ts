// Hand-written types mirroring supabase/migrations/0001_init.sql.
// (Can be regenerated later with `supabase gen types typescript`.)

// All app tables live in a dedicated schema (isolated from the project's
// shared `public` schema). The Supabase clients and realtime subscriptions
// must be configured with this schema name.
export const DB_SCHEMA = "eleven_auction" as const;

export type RoomStatus = "lobby" | "watching" | "ended";
export type MessageType = "chat" | "system";
export type ParticipantRole = "host" | "viewer";

export type Profile = {
  id: string;
  display_name: string;
  avatar_color: string;
  created_at: string;
};

export type Room = {
  id: string;
  code: string;
  name: string;
  host_id: string;
  is_public: boolean;
  status: RoomStatus;
  current_item_id: string | null;
  is_playing: boolean;
  position_seconds: number;
  playback_updated_at: string;
  created_at: string;
}

export type QueueItem = {
  id: string;
  room_id: string;
  youtube_video_id: string;
  title: string | null;
  url: string;
  position: number;
  added_by: string | null;
  played: boolean;
  created_at: string;
};

export type Message = {
  id: string;
  room_id: string;
  user_id: string | null;
  display_name: string;
  content: string;
  type: MessageType;
  created_at: string;
};

export type RoomParticipant = {
  id: string;
  room_id: string;
  user_id: string;
  role: ParticipantRole;
  joined_at: string;
};

// Minimal Database shape for the typed Supabase client. Row/Insert/Update are
// kept simple (Insert = partial of Row) since our writes are explicit.
export interface Database {
  eleven_auction: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & Pick<Profile, "id" | "display_name">;
        Update: Partial<Profile>;
        Relationships: [];
      };
      rooms: {
        Row: Room;
        Insert: Partial<Room> & Pick<Room, "code" | "name" | "host_id">;
        Update: Partial<Room>;
        Relationships: [];
      };
      queue_items: {
        Row: QueueItem;
        Insert: Partial<QueueItem> & Pick<QueueItem, "room_id" | "youtube_video_id" | "url">;
        Update: Partial<QueueItem>;
        Relationships: [];
      };
      messages: {
        Row: Message;
        Insert: Partial<Message> & Pick<Message, "room_id" | "display_name" | "content">;
        Update: Partial<Message>;
        Relationships: [];
      };
      room_participants: {
        Row: RoomParticipant;
        Insert: Partial<RoomParticipant> & Pick<RoomParticipant, "room_id" | "user_id">;
        Update: Partial<RoomParticipant>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_room_member: { Args: { p_room_id: string }; Returns: boolean };
      is_room_host: { Args: { p_room_id: string }; Returns: boolean };
    };
    Enums: Record<string, never>;
  };
}
