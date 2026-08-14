import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  // Erreur volontairement explicite et bloquante : mieux vaut un échec de démarrage
  // clair qu'une application qui tourne silencieusement contre le mauvais projet
  // (ou pas de projet du tout) faute de configuration.
  throw new Error(
    "[Union'S] Configuration Supabase manquante : VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY " +
    "doivent être définies dans les variables d'environnement (fichier .env en local, " +
    "ou Environment Variables du projet Vercel en production). Aucune valeur de repli n'est utilisée."
  );
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
