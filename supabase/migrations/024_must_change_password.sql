-- Migration: Add must_change_password flag to users
-- Set TRUE when an admin issues a temporary password; cleared after the user changes it on first login.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_users_must_change_password
  ON public.users(must_change_password)
  WHERE must_change_password = TRUE;
