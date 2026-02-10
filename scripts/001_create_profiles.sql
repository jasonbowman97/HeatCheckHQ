-- Profiles table: stores subscription tier for each user
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'pro')),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- Users can update their own profile
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- Allow insert during signup trigger (security definer)
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- Service role can do anything (for Stripe webhook)
create policy "service_role_all" on public.profiles
  for all using (true) with check (true);
