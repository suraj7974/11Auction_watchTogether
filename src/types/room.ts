import type { Message, ParticipantRole, QueueItem, Room } from "@/types/database";

/** A participant joined with their profile, ready for display. */
export type ParticipantView = {
  userId: string;
  displayName: string;
  avatarColor: string;
  role: ParticipantRole;
};

/** Everything needed to render a room on first load. */
export type RoomBundle = {
  room: Room;
  queue: QueueItem[];
  messages: Message[];
  participants: ParticipantView[];
};

/** The minimal identity the room UI needs about the current user. */
export type CurrentUser = {
  id: string;
  displayName: string;
  avatarColor: string;
};
