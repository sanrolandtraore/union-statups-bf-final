-- ============================================================
-- Pitch Room V2 — annotations persistées, enregistrements,
-- verrouillage de salle, Q&A avancé (vote + anonymat)
-- ============================================================

-- 1) Verrouillage de salle
ALTER TABLE public.pitch_rooms ADD COLUMN IF NOT EXISTS is_locked boolean NOT NULL DEFAULT false;

-- 2) Q&A avancé : anonymat + compteur de votes sur pitch_room_messages
ALTER TABLE public.pitch_room_messages ADD COLUMN IF NOT EXISTS is_anonymous boolean NOT NULL DEFAULT false;
ALTER TABLE public.pitch_room_messages ADD COLUMN IF NOT EXISTS upvotes integer NOT NULL DEFAULT 0;

-- Table de votes (empêche un utilisateur de voter deux fois pour la même question)
CREATE TABLE IF NOT EXISTS public.pitch_room_message_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.pitch_room_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);
ALTER TABLE public.pitch_room_message_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room participants can view votes" ON public.pitch_room_message_votes
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.pitch_room_messages m
      JOIN public.pitch_room_participants p ON p.room_id = m.room_id
      WHERE m.id = message_id AND p.user_id = auth.uid() AND p.status = 'joined'
    )
  );

CREATE POLICY "Joined participants can vote once" ON public.pitch_room_message_votes
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.pitch_room_messages m
      JOIN public.pitch_room_participants p ON p.room_id = m.room_id
      WHERE m.id = message_id AND p.user_id = auth.uid() AND p.status = 'joined'
    )
  );

CREATE POLICY "User can remove own vote" ON public.pitch_room_message_votes
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Triggers pour maintenir upvotes en phase avec la table de votes
CREATE OR REPLACE FUNCTION public.increment_message_upvotes()
RETURNS trigger AS $$
BEGIN
  UPDATE public.pitch_room_messages SET upvotes = upvotes + 1 WHERE id = NEW.message_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.decrement_message_upvotes()
RETURNS trigger AS $$
BEGIN
  UPDATE public.pitch_room_messages SET upvotes = GREATEST(upvotes - 1, 0) WHERE id = OLD.message_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_increment_upvotes ON public.pitch_room_message_votes;
CREATE TRIGGER trg_increment_upvotes AFTER INSERT ON public.pitch_room_message_votes
  FOR EACH ROW EXECUTE FUNCTION public.increment_message_upvotes();

DROP TRIGGER IF EXISTS trg_decrement_upvotes ON public.pitch_room_message_votes;
CREATE TRIGGER trg_decrement_upvotes AFTER DELETE ON public.pitch_room_message_votes
  FOR EACH ROW EXECUTE FUNCTION public.decrement_message_upvotes();

-- 3) Annotations persistées (pour que les participants qui rejoignent en retard
--    voient le tableau, et pour permettre un futur replay)
CREATE TABLE IF NOT EXISTS public.room_annotations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.pitch_rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  action jsonb NOT NULL, -- { id, tool, color, width, points: [{x,y}] }
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.room_annotations ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_annotations;

CREATE POLICY "Room participants can view annotations" ON public.room_annotations
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.pitch_room_participants p WHERE p.room_id = room_annotations.room_id AND p.user_id = auth.uid() AND p.status = 'joined')
    OR EXISTS (SELECT 1 FROM public.pitch_rooms r WHERE r.id = room_annotations.room_id AND r.creator_id = auth.uid())
  );

CREATE POLICY "Host, co-host and speakers can draw" ON public.room_annotations
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (
      EXISTS (SELECT 1 FROM public.pitch_rooms r WHERE r.id = room_annotations.room_id AND r.creator_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.pitch_room_participants p
        WHERE p.room_id = room_annotations.room_id AND p.user_id = auth.uid()
          AND p.status = 'joined' AND p.role IN ('moderator', 'speaker')
      )
    )
  );

CREATE POLICY "Host or co-host can clear annotations" ON public.room_annotations
  FOR DELETE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.pitch_rooms r WHERE r.id = room_annotations.room_id AND r.creator_id = auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.pitch_room_participants p
      WHERE p.room_id = room_annotations.room_id AND p.user_id = auth.uid()
        AND p.status = 'joined' AND p.role = 'moderator'
    )
  );

-- 4) Enregistrements — historique complet (Room ID, organisateur, date, durée)
CREATE TABLE IF NOT EXISTS public.room_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.pitch_rooms(id) ON DELETE CASCADE,
  organizer_id uuid NOT NULL,
  egress_id text,
  storage_path text,
  status text NOT NULL DEFAULT 'recording', -- recording, completed, failed
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  duration_seconds integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.room_recordings ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_recordings;

CREATE POLICY "Organizer can view own recordings" ON public.room_recordings
  FOR SELECT TO authenticated
  USING (organizer_id = auth.uid());

CREATE POLICY "Room participants can view recording status" ON public.room_recordings
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.pitch_room_participants p WHERE p.room_id = room_recordings.room_id AND p.user_id = auth.uid())
  );

CREATE POLICY "Admin can manage recordings" ON public.room_recordings
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Écriture réservée au service role (edge function) — pas de policy INSERT/UPDATE
-- pour les utilisateurs authentifiés : toute écriture passe par livekit-token
-- avec la clé service_role, ce qui garantit l'intégrité des métadonnées.

-- 5) Storage bucket dédié aux enregistrements (privé, accès via URL signée)
INSERT INTO storage.buckets (id, name, public)
VALUES ('pitch-recordings', 'pitch-recordings', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Organizer can read own recording files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'pitch-recordings'
    AND EXISTS (
      SELECT 1 FROM public.room_recordings rr
      WHERE rr.storage_path = storage.objects.name AND rr.organizer_id = auth.uid()
    )
  );

CREATE POLICY "Service role manages recording files" ON storage.objects
  FOR ALL TO service_role
  USING (bucket_id = 'pitch-recordings')
  WITH CHECK (bucket_id = 'pitch-recordings');
