
-- Mentors table
CREATE TABLE public.mentors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  specialty text[] DEFAULT '{}'::text[],
  experience_years integer DEFAULT 0,
  company_name text,
  bio text,
  achievements text,
  linkedin_url text,
  website_url text,
  availability text DEFAULT 'available',
  hourly_rate integer DEFAULT 0,
  is_approved boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  total_sessions integer DEFAULT 0,
  rating numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Startup School programs/courses
CREATE TABLE public.startup_school_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  cover_image_url text,
  mentor_id uuid REFERENCES public.mentors(id) ON DELETE SET NULL,
  program_type text NOT NULL DEFAULT 'course',
  difficulty_level text DEFAULT 'beginner',
  duration_hours integer DEFAULT 0,
  modules_count integer DEFAULT 0,
  is_published boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  tags text[] DEFAULT '{}'::text[],
  price integer DEFAULT 0,
  enrolled_count integer DEFAULT 0,
  rating numeric DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Modules within programs
CREATE TABLE public.startup_school_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.startup_school_programs(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  content_type text NOT NULL DEFAULT 'video',
  video_url text,
  content text,
  duration_minutes integer DEFAULT 0,
  sort_order integer DEFAULT 0,
  is_free boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Coaching sessions (booking)
CREATE TABLE public.coaching_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.mentors(id) ON DELETE CASCADE,
  mentee_id uuid NOT NULL,
  session_type text DEFAULT 'one_on_one',
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer DEFAULT 60,
  status text DEFAULT 'pending',
  topic text,
  notes text,
  meeting_url text,
  price integer DEFAULT 0,
  rating integer,
  feedback text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Startup School content/articles/testimonials
CREATE TABLE public.startup_school_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid,
  mentor_id uuid REFERENCES public.mentors(id) ON DELETE SET NULL,
  title text NOT NULL,
  excerpt text,
  content text,
  cover_image_url text,
  content_type text NOT NULL DEFAULT 'article',
  category text DEFAULT 'general',
  video_url text,
  is_published boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  views_count integer DEFAULT 0,
  tags text[] DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Program enrollments
CREATE TABLE public.program_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.startup_school_programs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  progress_percentage integer DEFAULT 0,
  completed_modules uuid[] DEFAULT '{}'::uuid[],
  status text DEFAULT 'active',
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(program_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_school_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_school_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.startup_school_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_enrollments ENABLE ROW LEVEL SECURITY;

-- Mentors policies
CREATE POLICY "Approved mentors viewable by everyone" ON public.mentors FOR SELECT USING (is_approved = true);
CREATE POLICY "Admin can manage mentors" ON public.mentors FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can apply as mentor" ON public.mentors FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Mentors can update own profile" ON public.mentors FOR UPDATE USING (auth.uid() = user_id);

-- Programs policies
CREATE POLICY "Published programs viewable by everyone" ON public.startup_school_programs FOR SELECT USING (is_published = true);
CREATE POLICY "Admin can manage programs" ON public.startup_school_programs FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Modules policies
CREATE POLICY "Modules viewable by everyone" ON public.startup_school_modules FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.startup_school_programs p WHERE p.id = program_id AND p.is_published = true)
);
CREATE POLICY "Admin can manage modules" ON public.startup_school_modules FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Coaching sessions policies
CREATE POLICY "Mentors can view own sessions" ON public.coaching_sessions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.mentors m WHERE m.id = mentor_id AND m.user_id = auth.uid())
);
CREATE POLICY "Mentees can view own sessions" ON public.coaching_sessions FOR SELECT USING (auth.uid() = mentee_id);
CREATE POLICY "Authenticated can book sessions" ON public.coaching_sessions FOR INSERT WITH CHECK (auth.uid() = mentee_id);
CREATE POLICY "Participants can update sessions" ON public.coaching_sessions FOR UPDATE USING (
  auth.uid() = mentee_id OR EXISTS (SELECT 1 FROM public.mentors m WHERE m.id = mentor_id AND m.user_id = auth.uid())
);

-- Content policies
CREATE POLICY "Published content viewable by everyone" ON public.startup_school_content FOR SELECT USING (is_published = true);
CREATE POLICY "Admin can manage content" ON public.startup_school_content FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

-- Enrollment policies
CREATE POLICY "Users can view own enrollments" ON public.program_enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can enroll" ON public.program_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own enrollment" ON public.program_enrollments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all enrollments" ON public.program_enrollments FOR SELECT USING (has_role(auth.uid(), 'admin'));
