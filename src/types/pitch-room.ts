export interface PitchRoom {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  format: "webinar" | "panel";
  status: "scheduled" | "live" | "ended" | "cancelled";
  scheduled_at: string | null;
  started_at: string | null;
  ended_at: string | null;
  max_participants: number;
  is_recording: boolean;
  recording_url: string | null;
  cover_image_url: string | null;
  tags: string[];
  livekit_room_name: string | null;
  settings: {
    chat_enabled: boolean;
    qa_enabled: boolean;
    hand_raise_enabled: boolean;
    waiting_room: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface PitchRoomParticipant {
  id: string;
  room_id: string;
  user_id: string;
  role: "host" | "speaker" | "moderator" | "viewer";
  status: "joined" | "left" | "kicked" | "banned" | "waiting";
  can_publish_audio: boolean;
  can_publish_video: boolean;
  hand_raised: boolean;
  joined_at: string | null;
  left_at: string | null;
  created_at: string;
}

export interface PitchRoomMessage {
  id: string;
  room_id: string;
  user_id: string;
  message: string;
  message_type: "chat" | "question" | "announcement";
  is_pinned: boolean;
  is_answered: boolean;
  parent_id: string | null;
  created_at: string;
}
