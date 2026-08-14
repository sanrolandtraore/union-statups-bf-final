ALTER TABLE public.pitch_room_participants ADD COLUMN IF NOT EXISTS hand_raised boolean NOT NULL DEFAULT false;

-- Add unique constraint for room_id + user_id if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pitch_room_participants_room_id_user_id_key'
  ) THEN
    ALTER TABLE public.pitch_room_participants ADD CONSTRAINT pitch_room_participants_room_id_user_id_key UNIQUE (room_id, user_id);
  END IF;
END $$;