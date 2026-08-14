# Union'S — Plateforme des startups du Burkina Faso

Union'S connecte startups, investisseurs, talents et partenaires : levée de fonds en syndicate, offres d'emploi, pitch rooms en direct, incubation, Startup School et bien plus.

## Stack technique

- **Frontend** : React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend** : Supabase (base de données Postgres, authentification, edge functions, stockage)
- **Visioconférence** : LiveKit
- **Paiement** : CinetPay (mobile money)

## Développement local

Prérequis : Node.js et npm ([installation via nvm](https://github.com/nvm-sh/nvm#installing-and-updating)).

```sh
git clone <url-du-depot>
cd union-statups-bf
npm i
npm run dev
```

## Scripts disponibles

```sh
npm run dev       # serveur de développement
npm run build     # build de production
npm run lint      # vérification du code
npm run test      # tests unitaires
```

## Structure du projet

```
src/
  components/   # composants React réutilisables, organisés par module
  pages/        # pages/routes de l'application
  hooks/        # hooks React personnalisés
  integrations/ # clients externes (Supabase)
  types/        # types TypeScript partagés
supabase/
  functions/    # edge functions (paiement, IA, visioconférence)
  migrations/   # migrations SQL de la base de données
```
