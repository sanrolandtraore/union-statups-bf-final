# Union'S — Production Audit Exit Criteria

A production workflow is complete only when frontend, Supabase, backend/Edge Functions, payment provider and Vercel configuration agree and the real workflow succeeds.

Critical workflows: authentication and email confirmation; password recovery; Storage upload/read/replace/delete; Pro payment and idempotent webhook activation; Talent, Startup, Investor, Partner, Startup School and Investment & Pitch.

Production checks: intended Supabase URL and publishable key; Storage migrations applied; production Auth callback configured; payment secrets server-side; webhook configured; Vercel redeployed; real end-to-end tests pass. Mock success is not accepted.
