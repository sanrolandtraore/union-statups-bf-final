-- ============================================================
-- Appels vidéo privés 1:1 + Espace Vidéo Prototype (asynchrone)
-- Inspiré de l'analyse concurrentielle DamascusProjects
-- ============================================================

-- 1) APPELS PRIVÉS 1:1 ------------------------------------------------

CREATE TABLE IF NOT EXISTS public.private_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  initiator_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, live, ended, declined, missed
  livekit_room_name text,
  requested_at timestamp with time zone NOT NULL DEFAULT now(),
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  duration_seconds integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CHECK (initiator_id <> recipient_id)
);
ALTER TABLE public.private_calls ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE public.private_calls;

CREATE POLICY "Participants can view their own calls" ON public.private_calls
  FOR SELECT TO authenticated
  USING (auth.uid() = initiator_id OR auth.uid() = recipient_id);

-- Écriture réservée au service role (edge function private-call) pour
-- garantir l'intégrité des statuts et empêcher un utilisateur de
-- démarrer un appel au nom d'un autre.

-- 2) ESPACE VIDÉO PROTOTYPE (asynchrone) -------------------------------

CREATE TABLE IF NOT EXISTS public.pitch_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  storage_path text NOT NULL,
  thumbnail_path text,
  duration_seconds integer,
  file_size_bytes bigint,
  views_count integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.pitch_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view published videos" ON public.pitch_videos
  FOR SELECT TO authenticated
  USING (is_published = true OR owner_id = auth.uid());

CREATE POLICY "Startups and talents can upload their own video" ON public.pitch_videos
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = owner_id
    AND (has_role(auth.uid(), 'startup'::app_role) OR has_role(auth.uid(), 'talent'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  );

CREATE POLICY "Owner can update own video" ON public.pitch_videos
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner can delete own video" ON public.pitch_videos
  FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

-- Compteur de vues : une fonction dédiée (pas d'UPDATE direct autorisé
-- aux autres utilisateurs) pour éviter la manipulation du compteur.
CREATE OR REPLACE FUNCTION public.increment_video_views(video_id uuid)
RETURNS void AS $$
  UPDATE public.pitch_videos SET views_count = views_count + 1 WHERE id = video_id;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.increment_video_views(uuid) TO authenticated;

-- Bucket public en lecture (contenu de "vitrine" destiné à être vu
-- largement par les investisseurs) mais écriture strictement contrôlée.
INSERT INTO storage.buckets (id, name, public)
VALUES ('pitch-videos', 'pitch-videos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view pitch video files" ON storage.objects
  FOR SELECT USING (bucket_id = 'pitch-videos');

CREATE POLICY "Owner can upload own pitch video files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'pitch-videos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Owner can delete own pitch video files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'pitch-videos' AND (storage.foldername(name))[1] = auth.uid()::text);
