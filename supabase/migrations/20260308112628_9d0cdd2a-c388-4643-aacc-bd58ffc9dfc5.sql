
-- Gallery media table
CREATE TABLE public.gallery_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  media_type text NOT NULL DEFAULT 'image' CHECK (media_type IN ('image', 'video')),
  file_url text,
  video_url text,
  thumbnail_url text,
  uploaded_by uuid,
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.gallery_media ENABLE ROW LEVEL SECURITY;

-- Everyone can view published gallery items
CREATE POLICY "Published gallery viewable by everyone"
  ON public.gallery_media FOR SELECT
  USING (is_published = true);

-- Admin can manage gallery
CREATE POLICY "Admin can manage gallery"
  ON public.gallery_media FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for gallery
INSERT INTO storage.buckets (id, name, public) VALUES ('gallery', 'gallery', true);

-- Storage policies for gallery bucket
CREATE POLICY "Anyone can view gallery files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery');

CREATE POLICY "Admin can upload gallery files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gallery' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin can delete gallery files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'gallery' AND has_role(auth.uid(), 'admin'::app_role));
