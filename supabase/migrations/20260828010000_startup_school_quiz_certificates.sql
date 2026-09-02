-- ============================================================
-- Startup School IA — quiz générés par IA, certificats, mentorat
-- ============================================================

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.startup_school_modules(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL, -- ["choix A", "choix B", "choix C", "choix D"]
  correct_answer_index integer NOT NULL,
  explanation text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CHECK (correct_answer_index >= 0)
);
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
-- Aucune policy SELECT pour les utilisateurs : la réponse correcte ne
-- doit jamais être lisible directement. Accès exclusif via
-- get_quiz_questions() (sans la réponse) et submit_quiz_attempt()
-- (qui vérifie côté serveur).

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_id uuid NOT NULL REFERENCES public.startup_school_modules(id) ON DELETE CASCADE,
  score integer NOT NULL,
  total_questions integer NOT NULL,
  passed boolean NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own quiz attempts" ON public.quiz_attempts
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  program_id uuid NOT NULL REFERENCES public.startup_school_programs(id) ON DELETE CASCADE,
  certificate_number text NOT NULL UNIQUE,
  issued_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, program_id)
);
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own certificates" ON public.certificates
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Anyone can verify a certificate by number" ON public.certificates
  FOR SELECT TO authenticated USING (true);

-- Retourne les questions SANS la réponse correcte.
CREATE OR REPLACE FUNCTION public.get_quiz_questions(p_module_id uuid)
RETURNS TABLE(id uuid, question text, options jsonb, sort_order integer) AS $$
  SELECT id, question, options, sort_order FROM public.quiz_questions
  WHERE module_id = p_module_id ORDER BY sort_order;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Corrige le quiz côté serveur, enregistre la tentative, retourne le
-- détail (score + quelles réponses étaient correctes + explications).
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(p_module_id uuid, p_answers jsonb)
RETURNS jsonb AS $$
DECLARE
  v_question RECORD;
  v_score integer := 0;
  v_total integer := 0;
  v_results jsonb := '[]'::jsonb;
  v_given integer;
  v_correct boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  FOR v_question IN SELECT * FROM public.quiz_questions WHERE module_id = p_module_id ORDER BY sort_order LOOP
    v_total := v_total + 1;
    v_given := (p_answers->>(v_question.sort_order)::text)::integer;
    v_correct := (v_given = v_question.correct_answer_index);
    IF v_correct THEN v_score := v_score + 1; END IF;
    v_results := v_results || jsonb_build_object(
      'question_id', v_question.id, 'correct', v_correct,
      'correct_answer_index', v_question.correct_answer_index, 'explanation', v_question.explanation
    );
  END LOOP;

  IF v_total = 0 THEN
    RAISE EXCEPTION 'Aucune question pour ce module';
  END IF;

  INSERT INTO public.quiz_attempts (user_id, module_id, score, total_questions, passed)
  VALUES (auth.uid(), p_module_id, v_score, v_total, (v_score::float / v_total) >= 0.7);

  RETURN jsonb_build_object('score', v_score, 'total', v_total, 'passed', (v_score::float / v_total) >= 0.7, 'results', v_results);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Émet un certificat si le programme est à 100% et pas déjà émis.
CREATE OR REPLACE FUNCTION public.issue_certificate(p_program_id uuid)
RETURNS jsonb AS $$
DECLARE
  v_enrollment RECORD;
  v_existing uuid;
  v_cert_number text;
  v_cert_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non authentifié';
  END IF;

  SELECT * INTO v_enrollment FROM public.program_enrollments
    WHERE user_id = auth.uid() AND program_id = p_program_id;
  IF v_enrollment IS NULL OR COALESCE(v_enrollment.progress_percentage, 0) < 100 THEN
    RAISE EXCEPTION 'Programme non terminé';
  END IF;

  SELECT id INTO v_existing FROM public.certificates WHERE user_id = auth.uid() AND program_id = p_program_id;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('certificate_id', v_existing, 'already_issued', true);
  END IF;

  v_cert_number := 'UNIONS-' || to_char(now(), 'YYYY') || '-' || upper(substr(md5(random()::text), 1, 8));

  INSERT INTO public.certificates (user_id, program_id, certificate_number)
  VALUES (auth.uid(), p_program_id, v_cert_number)
  RETURNING id INTO v_cert_id;

  RETURN jsonb_build_object('certificate_id', v_cert_id, 'certificate_number', v_cert_number, 'already_issued', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_quiz_questions(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_quiz_attempt(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.issue_certificate(uuid) TO authenticated;
