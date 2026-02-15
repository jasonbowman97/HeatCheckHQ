-- Affiliate system: tracks partner Discord servers, influencers, etc.
-- Affiliates get a unique code. Users who sign up via /join/[code] are tracked.
-- When a referred user pays, the affiliate earns a commission.

-- Affiliates table (the partner / Discord server owner)
CREATE TABLE IF NOT EXISTS public.affiliates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,                          -- e.g. "BetSquad Discord"
  code text NOT NULL UNIQUE,                   -- e.g. "betsquad" -> heatcheckhq.io/join/betsquad
  contact_email text,                          -- how to pay them
  discord_server text,                         -- Discord server name / invite link
  commission_cents integer NOT NULL DEFAULT 500, -- $5.00 per conversion
  trial_days integer NOT NULL DEFAULT 14,      -- how many days of free Pro referred users get
  is_active boolean NOT NULL DEFAULT true,
  notes text,                                  -- internal notes
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast code lookups
CREATE UNIQUE INDEX IF NOT EXISTS affiliates_code_idx ON public.affiliates (code);

-- RLS: only service role can read/write affiliates (admin-only)
ALTER TABLE public.affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_affiliates" ON public.affiliates
  FOR ALL USING (true) WITH CHECK (true);

-- Track which users came from which affiliate
-- Also stores the trial expiration so we know when Pro access ends
CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id uuid NOT NULL REFERENCES public.affiliates(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trial_expires_at timestamptz,                -- when the free Pro trial ends
  converted_at timestamptz,                    -- when user paid for Pro (null = not yet)
  commission_paid boolean NOT NULL DEFAULT false, -- have we paid the affiliate yet?
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)                              -- a user can only be referred once
);

CREATE INDEX IF NOT EXISTS affiliate_referrals_affiliate_idx ON public.affiliate_referrals (affiliate_id);
CREATE INDEX IF NOT EXISTS affiliate_referrals_user_idx ON public.affiliate_referrals (user_id);

-- RLS: service role only
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_referrals" ON public.affiliate_referrals
  FOR ALL USING (true) WITH CHECK (true);

-- Add referral tracking columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS referred_by_affiliate uuid REFERENCES public.affiliates(id),
ADD COLUMN IF NOT EXISTS trial_expires_at timestamptz;
