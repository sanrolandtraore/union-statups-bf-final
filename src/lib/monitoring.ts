import { supabase } from "@/integrations/supabase/client";

/**
 * Monitoring d'erreurs frontend.
 *
 * Par défaut : journalise dans la table `client_error_logs` (Supabase),
 * consultable par les admins depuis le dashboard. Fonctionne immédiatement,
 * sans compte tiers à configurer.
 *
 * Pour basculer vers Sentry plus tard : définir VITE_SENTRY_DSN dans les
 * variables d'environnement — ce module l'utilisera automatiquement en plus
 * de la journalisation Supabase (les deux ne sont pas exclusifs).
 */

let lastReportedMessage = "";
let lastReportedAt = 0;

export function reportError(error: Error, context?: Record<string, unknown>) {
  try {
    // Anti-spam basique : évite de journaliser la même erreur en boucle
    // (ex. un composant qui re-render en erreur en continu).
    const now = Date.now();
    if (error.message === lastReportedMessage && now - lastReportedAt < 5000) return;
    lastReportedMessage = error.message;
    lastReportedAt = now;

    if (import.meta.env.DEV) {
      console.error("[monitoring]", error, context);
    }

    // Journalisation Supabase (best-effort, ne bloque jamais l'UI)
    void supabase.from("client_error_logs").insert({
      message: error.message?.slice(0, 2000) || "Erreur inconnue",
      stack: error.stack?.slice(0, 4000) || null,
      context: context ? JSON.parse(JSON.stringify(context)) : null,
      url: typeof window !== "undefined" ? window.location.href : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    }).then(({ error: insertError }) => {
      if (insertError && import.meta.env.DEV) {
        console.error("[monitoring] échec de journalisation:", insertError);
      }
    });

    // Point d'extension Sentry (opt-in via variable d'environnement)
    const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
    if (sentryDsn) {
      // Le nom du package est construit dynamiquement pour empêcher Rollup de
      // tenter de le résoudre/bundler au build (il n'est pas installé par
      // défaut) — résolution 100% différée au runtime, échoue silencieusement
      // si le package est absent.
      const sentryPkg = ["@sentry", "react"].join("/");
      import(sentryPkg)
        .then((Sentry) => Sentry.captureException(error, { extra: context }))
        .catch(() => { /* Sentry non installé — ignoré silencieusement */ });
    }
  } catch {
    // Le monitoring ne doit jamais lui-même faire planter l'application.
  }
}
