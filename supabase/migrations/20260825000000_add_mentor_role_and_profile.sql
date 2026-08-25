-- Ajoute 'mentor' à la liste des rôles auto-assignables au signup,
-- maintenant que la valeur d'enum existe (migration précédente).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  requested_role TEXT;
BEGIN
  INSERT INTO public.profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );

  requested_role := NEW.raw_user_meta_data->>'role';

  IF requested_role IN ('talent', 'startup', 'investor', 'partner', 'mentor') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, requested_role::public.app_role);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Table de profil mentor, alignée sur le pattern {role}_profiles utilisé
-- par talent/startup/investor/partner. La table `mentors` existante est
-- conservée telle quelle (données riches déjà en place) ; cette nouvelle
-- table couvre les champs communs utilisés par le matching et l'IA de
-- co-fondateur, avec synchronisation automatique depuis `mentors`.
CREATE TABLE IF NOT EXISTS public.mentor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  specialty text[],
  bio text,
  company_name text,
  experience_years integer,
  availability text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.mentor_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view mentor profiles" ON public.mentor_profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Mentor can manage own profile" ON public.mentor_profiles
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
