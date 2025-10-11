-- Add invite codes table for private beta access control
CREATE TABLE IF NOT EXISTS public.invite_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  max_uses integer NULL DEFAULT 1,
  current_uses integer NOT NULL DEFAULT 0,
  created_by uuid NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NULL,
  notes text NULL,
  CONSTRAINT invite_codes_pkey PRIMARY KEY (id),
  CONSTRAINT invite_codes_uses_check CHECK (current_uses <= max_uses)
);

-- Add index for fast code lookup
CREATE INDEX IF NOT EXISTS idx_invite_codes_code ON public.invite_codes (code);
CREATE INDEX IF NOT EXISTS idx_invite_codes_created_at ON public.invite_codes (created_at);

-- Add invite_code column to profiles to track which code was used
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invite_code_used text NULL;

-- Enable RLS on invite_codes table
ALTER TABLE public.invite_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read active invite codes (needed for validation during signup)
CREATE POLICY "Anyone can validate invite codes"
  ON public.invite_codes
  FOR SELECT
  USING (
    (expires_at IS NULL OR expires_at > now())
    AND current_uses < max_uses
  );

-- Policy: Only authenticated users can see all invite codes (for admin purposes later)
CREATE POLICY "Authenticated users can view all invite codes"
  ON public.invite_codes
  FOR SELECT
  TO authenticated
  USING (true);

-- Insert some initial invite codes for beta testing
INSERT INTO public.invite_codes (code, max_uses, notes) VALUES
  ('BETA2025', 20, 'Initial private beta access - 20 users'),
  ('MEEPLEGO-PREVIEW', 10, 'Preview access for early testers')
ON CONFLICT (code) DO NOTHING;
