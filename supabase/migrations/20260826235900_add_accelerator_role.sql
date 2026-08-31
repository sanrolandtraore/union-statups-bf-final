-- Ajout du rôle 'accelerator' (Accélérateur) demandé dans le cahier
-- des charges Freemium + Credit Wallet. Séparée de la migration
-- principale car ALTER TYPE ... ADD VALUE ne peut pas être exécutée
-- dans la même transaction qu'une utilisation de la nouvelle valeur.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'accelerator';
