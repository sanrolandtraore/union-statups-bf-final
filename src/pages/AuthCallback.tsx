import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, MailCheck, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const finish = async () => {
      const url = new URL(window.location.href);
      const params = url.searchParams;
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));

      const authError = params.get("error_description") || hash.get("error_description");
      if (authError) {
        if (mounted) setError(decodeURIComponent(authError.replace(/\+/g, " ")));
        return;
      }

      // Supabase can return a PKCE authorization code after email verification
      // or an OAuth callback. Exchange it before trying to restore the session.
      const code = params.get("code");
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          if (mounted) setError(exchangeError.message);
          return;
        }
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!mounted) return;

      if (sessionError) {
        setError(sessionError.message);
        return;
      }

      if (data.session) {
        navigate("/dashboard", { replace: true });
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (!mounted) return;

      if (userError || !userData.user) {
        setError(userError?.message || "La vérification n'a pas pu établir une session.");
        return;
      }

      // A verified user without an active browser session should authenticate
      // normally rather than being sent through a callback loop.
      navigate("/auth", { replace: true });
    };

    void finish();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
          <XCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <h1 className="text-xl font-semibold">Vérification impossible</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Button className="mt-6" onClick={() => navigate("/auth", { replace: true })}>
            Retour à la connexion
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 text-center">
        <MailCheck className="mx-auto mb-4 h-12 w-12 text-primary" />
        <h1 className="text-xl font-semibold">Vérification de votre compte</h1>
        <p className="mt-2 text-sm text-muted-foreground">Validation de votre adresse e-mail en cours…</p>
        <Loader2 className="mx-auto mt-6 h-6 w-6 animate-spin text-primary" />
      </div>
    </main>
  );
};

export default AuthCallback;
