# Supabase Database Setup

## Current Issue
The checkout page is showing a Server Components error because the `profiles` table doesn't exist in your Supabase database yet.

## Steps to Fix

### 1. Go to your Supabase Dashboard
Navigate to: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/editor

### 2. Open the SQL Editor
- Click on "SQL Editor" in the left sidebar
- Click "New query"

### 3. Execute the First SQL Script (Create Profiles Table)
Copy and paste this entire script:

```sql
-- Enable RLS
alter table if exists public.profiles enable row level security;

-- Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  subscription_tier text not null default 'free' check (subscription_tier in ('free', 'pro')),
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  subscription_status text check (subscription_status in ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Create index on email
create index if not exists profiles_email_idx on public.profiles (email);

-- Create index on stripe_customer_id
create index if not exists profiles_stripe_customer_id_idx on public.profiles (stripe_customer_id);

-- RLS policies
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.handle_updated_at();
```

Click "Run" to execute it.

### 4. Execute the Second SQL Script (Create Auto-Profile Trigger)
In a new query, copy and paste this:

```sql
-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, subscription_tier)
  values (
    new.id,
    new.email,
    'free'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
```

Click "Run" to execute it.

### 5. Verify the Setup
After running both scripts, verify:
1. The `profiles` table appears in your Tables list
2. Try signing up a new test user - a profile should be auto-created
3. Try accessing the checkout page - it should now load properly

### 6. Create Profile for Existing Users (If Any)
If you already have users in your auth.users table, you'll need to create profiles for them manually:

```sql
-- Create profiles for existing users
insert into public.profiles (id, email, subscription_tier)
select id, email, 'free'
from auth.users
on conflict (id) do nothing;
```

## What These Scripts Do

### Script 1: Creates the Profiles Table
- Stores user subscription information (tier, Stripe IDs, status)
- Sets up Row Level Security (RLS) so users can only see their own profile
- Creates indexes for faster queries
- Adds an auto-update trigger for the `updated_at` field

### Script 2: Creates Auto-Profile Trigger
- Automatically creates a profile whenever a new user signs up
- Sets the default subscription_tier to 'free'
- Ensures every user always has a corresponding profile

## After Setup
Once both scripts are executed:
1. Redeploy or wait for your Vercel deployment to update
2. Test the checkout page - it should now work
3. Test creating a new account - profile should be auto-created
4. Test upgrading to Pro - subscription data should be saved

## Troubleshooting
If you still see errors after running these scripts:
1. Check the Supabase logs in Dashboard > Logs
2. Verify the table was created in Dashboard > Table Editor
3. Check that RLS policies are enabled
4. Ensure your Supabase environment variables are correct in Vercel
