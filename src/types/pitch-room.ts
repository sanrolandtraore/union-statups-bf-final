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
  is_locked: boolean;
  recording_url: string | null;
  cover_image_url: string | null;
  tags: string[];
  livekit_room_name: string | null;
  settings: {
    chat_enabled: boolean;
    qa_enabled: boolean;
    hand_raise_enabled: boolean;
    waiting_room: boolean;
    egress_id?: string | null;
    recording_filepath?: string | null;
  };
  created_at: string;
  updated_at: string;
}

// Rôles internes host/moderator/speaker/viewer ≈ Host/Co-host/Speaker/Participant
export const ROLE_LABELS: Record<string, string> = {
  host: "Host",
  moderator: "Co-host",
  speaker: "Speaker",
  viewer: "Participant",
};

export interface RoomRecording {
  id: string;
  room_id: string;
  organizer_id: string;
  egress_id: string | null;
  storage_path: string | null;
  status: "recording" | "completed" | "failed";
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  created_at: string;
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
  is_anonymous: boolean;
  upvotes: number;
  parent_id: string | null;
  created_at: string;
}
