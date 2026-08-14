-- Step 1: Add 'admin' to app_role enum only (must commit before using)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';