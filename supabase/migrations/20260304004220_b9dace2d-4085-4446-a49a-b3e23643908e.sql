
-- Pitch Rooms table
CREATE TABLE public.pitch_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  format text NOT NULL DEFAULT 'webinar', -- 'webinar' or 'panel'
  status text NOT NULL DEFAULT 'scheduled', -- scheduled, live, ended, cancelled
  scheduled_at timestamp with time zone,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  max_participants integer NOT NULL DEFAULT 5000,
  is_recording boolean NOT NULL DEFAULT false,
  recording_url text,
  cover_image_url text,
  tags text[] DEFAULT '{}'::text[],
  livekit_room_name text UNIQUE,
  settings jsonb NOT NULL DEFAULT '{"chat_enabled": true, "qa_enabled": true, "hand_raise_enabled": true, "waiting_room": false}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pitch_rooms ENABLE ROW LEVEL SECURITY;

-- Participants table
CREATE TABLE public.pitch_room_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.pitch_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'viewer', -- 'host', 'speaker', 'moderator', 'viewer'
  status text NOT NULL DEFAULT 'joined', -- 'joined', 'left', 'kicked', 'banned', 'waiting'
  can_publish_audio boolean NOT NULL DEFAULT false,
  can_publish_video boolean NOT NULL DEFAULT false,
  joined_at timestamp with time zone DEFAULT now(),
  left_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);

ALTER TABLE public.pitch_room_participants ENABLE ROW LEVEL SECURITY;

-- Chat messages for pitch rooms
CREATE TABLE public.pitch_room_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.pitch_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  message text NOT NULL,
  message_type text NOT NULL DEFAULT 'chat', -- 'chat', 'question', 'announcement'
  is_pinned boolean NOT NULL DEFAULT false,
  is_answered boolean NOT NULL DEFAULT false,
  parent_id uuid REFERENCES public.pitch_room_messages(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pitch_room_messages ENABLE ROW LEVEL SECURITY;

-- Enable realtime for chat and participants
ALTER PUBLICATION supabase_realtime ADD TABLE public.pitch_room_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.pitch_room_participants;

-- RLS Policies for pitch_rooms
CREATE POLICY "Anyone can view live/scheduled rooms" ON public.pitch_rooms
  FOR SELECT TO authenticated
  USING (status IN ('scheduled', 'live') OR creator_id = auth.uid());

CREATE POLICY "Authenticated can create rooms" ON public.pitch_rooms
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creator can update own rooms" ON public.pitch_rooms
  FOR UPDATE TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY "Creator can delete own rooms" ON public.pitch_rooms
  FOR DELETE TO authenticated
  USING (auth.uid() = creator_id);

CREATE POLICY "Admin can manage all rooms" ON public.pitch_rooms
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for participants
CREATE POLICY "Room members can view participants" ON public.pitch_room_participants
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.pitch_rooms r WHERE r.id = room_id AND (r.creator_id = auth.uid() OR r.status = 'live'))
    OR user_id = auth.uid()
  );

CREATE POLICY "Authenticated can join rooms" ON public.pitch_room_participants
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Host or self can update participant" ON public.pitch_room_participants
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.pitch_rooms r WHERE r.id = room_id AND r.creator_id = auth.uid())
  );

CREATE POLICY "Host can delete participants" ON public.pitch_room_participants
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.pitch_rooms r WHERE r.id = room_id AND r.creator_id = auth.uid())
  );

-- RLS Policies for messages
CREATE POLICY "Room participants can view messages" ON public.pitch_room_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.pitch_room_participants p WHERE p.room_id = pitch_room_messages.room_id AND p.user_id = auth.uid() AND p.status = 'joined')
    OR EXISTS (SELECT 1 FROM public.pitch_rooms r WHERE r.id = pitch_room_messages.room_id AND r.creator_id = auth.uid())
  );

CREATE POLICY "Participants can send messages" ON public.pitch_room_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM public.pitch_room_participants p WHERE p.room_id = pitch_room_messages.room_id AND p.user_id = auth.uid() AND p.status = 'joined')
  );

CREATE POLICY "Host can update messages" ON public.pitch_room_messages
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.pitch_rooms r WHERE r.id = pitch_room_messages.room_id AND r.creator_id = auth.uid())
    OR user_id = auth.uid()
  );

-- Trigger for updated_at
CREATE TRIGGER update_pitch_rooms_updated_at
  BEFORE UPDATE ON public.pitch_rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
