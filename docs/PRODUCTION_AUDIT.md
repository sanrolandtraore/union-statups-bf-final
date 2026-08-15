# Union'S — Production Audit

## Exit criteria

A production workflow is complete only when the frontend, Supabase, backend/Edge Functions, payment provider and Vercel configuration all agree and the real workflow succeeds.

### Critical workflows

- Authentication: signup → verification email → `/auth/callback` → session → dashboard.
- Password recovery: reset email → `/reset-password` → password update.
- Storage: upload → persisted object → authorized read → replace/delete.
- Pro subscription: create payment → provider confirmation → server-side webhook → idempotent activation.
- Business modules: Talent, Startup, Investor, Partner, Startup School, Investment & Pitch.

## Current code safeguards

- Supabase PKCE callback codes are exchanged with `exchangeCodeForSession` before redirecting to the dashboard.
- Auth state changes defer role queries outside the Supabase auth callback to avoid lock contention.
- Storage provisioning is handled separately by the production Storage reconciliation migration.

## Environment validation required before declaring production-ready

1. `VITE_SUPABASE_URL` and publishable key point to the intended Supabase project.
2. All required Storage migrations have been applied to that project.
3. Supabase Auth redirect URLs include the production callback URL.
4. Payment provider secrets are configured only in server/Edge Function environments.
5. Payment webhook endpoint is configured and verified.
6. Vercel has been redeployed after environment/migration changes.
7. Real end-to-end tests pass; no mock success is accepted as production validation.
