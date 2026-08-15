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
      const params = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const authErrorRaw = params.get("error_description") || hash.get("error_description");
      const code = params.get("code");
      const callbackType = params.get("type") || hash.get("type");

      if (authErrorRaw) {
        let message = authErrorRaw.replace(/\+/g, " ");
        try {
          message = decodeURIComponent(message);
        } catch {
          // Keep the original provider message when it is not valid URI encoding.
        }
        if (mounted) setError(message);
        return;
      }

      // Password-recovery links should establish the session and then enter
      // the dedicated reset screen, not the application dashboard.
      const isPasswordRecovery = callbackType === "recovery";

      // Supabase PKCE callbacks return a one-time `code`. Exchange it before
      // checking the session so confirmation links reliably establish a session.
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (!mounted) return;
        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }
        navigate(isPasswordRecovery ? "/reset-password" : "/dashboard", { replace: true });
        return;
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!mounted) return;

      if (sessionError) {
        setError(sessionError.message);
        return;
      }

      if (data.session) {
        navigate(isPasswordRecovery ? "/reset-password" : "/dashboard", { replace: true });
        return;
      }

      // Hash-based implicit-flow callbacks may be processed by the Supabase
      // client automatically. Confirm that a user exists before continuing.
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (!mounted) return;

      if (userError || !userData.user) {
        setError(userError?.message || "La vérification n'a pas pu établir une session.");
        return;
      }

      navigate(isPasswordRecovery ? "/reset-password" : "/dashboard", { replace: true });
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
          <Button className="mt-6" onClick={() => navigate("/auth", { replace: true })}>Retour à la connexion</Button>
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
