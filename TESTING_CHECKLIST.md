# HeatCheck.io - Testing Checklist

## Deployment Success ✅
- Site is live and accessible
- Build completed without errors

## Core Functionality to Test

### 1. Homepage & Navigation
- [ ] Homepage loads correctly
- [ ] All navigation links work
- [ ] Mobile menu works
- [ ] Dark/light theme toggle works

### 2. MLB Dashboards
- [ ] **Hitting Stats** (`/mlb/hitting-stats`)
  - API: `/api/mlb/batting`
  - Should show player batting statistics
  - Filters should work (hand, time range)

- [ ] **NRFI** (`/mlb/nrfi`)
  - Should show no-run first inning data
  - Table should display properly

- [ ] **Pitching Stats** (`/mlb/pitching-stats`)
  - API: `/api/mlb/pitching`
  - Should show pitcher statistics
  - Arsenal drill-down should work

- [ ] **Trends** (`/mlb/trends`)
  - API: `/api/mlb/trends`
  - Should show hot/cold streaks

- [ ] **Weather** (`/mlb/weather`)
  - API: `/api/mlb/schedule`
  - Should show game weather conditions

### 3. NBA Dashboards
- [ ] **First Basket** (`/nba/first-basket`)
  - Should show first basket probabilities
  - Filters should work

- [ ] **Head-to-Head** (`/nba/head-to-head`)
  - API: `/api/nba/h2h`
  - Should show team matchup data
  - Team selector should work

- [ ] **Trends** (`/nba/trends`)
  - API: `/api/nba/trends`
  - Should show NBA player trends

### 4. NFL Dashboards
- [ ] **Matchup** (`/nfl/matchup`)
  - API: `/api/nfl/matchup`
  - Should show team statistics
  - Positional breakdowns should display

- [ ] **Redzone** (`/nfl/redzone`)
  - Should show redzone efficiency stats

- [ ] **Trends** (`/nfl/trends`)
  - API: `/api/nfl/trends`
  - Should show NFL trends

### 5. Authentication & Paywall Features
- [ ] **Sign Up** (`/auth/sign-up`)
  - Supabase connection working
  - Can create account

- [ ] **Login** (`/auth/login`)
  - Supabase authentication working
  - Can sign in successfully

- [ ] **Account Page** (`/account`)
  - Shows subscription status
  - Stripe Customer Portal link works

- [ ] **Paywall Behavior**
  - Free users see limited rows on NRFI, First Basket, Weather
  - Pro features are locked for free users
  - Upgrade prompts appear correctly

### 6. Stripe Integration
- [ ] **Checkout** (`/checkout`)
  - Stripe Checkout loads
  - Can initiate subscription

- [ ] **Webhooks** (`/api/stripe/webhook`)
  - Verify in Stripe Dashboard that webhook is configured
  - Test subscription updates properly sync to Supabase

- [ ] **Customer Portal** (`/api/stripe/portal`)
  - Can access Stripe billing portal
  - Can manage subscription

## API Endpoints Status

### MLB APIs
- `/api/mlb/batting` - Fetches batting statistics from ESPN
- `/api/mlb/pitching` - Fetches pitching statistics from ESPN
- `/api/mlb/schedule` - Fetches schedule and weather data
- `/api/mlb/trends` - Fetches leaders/trends data

### NBA APIs
- `/api/nba/schedule` - Fetches NBA schedule
- `/api/nba/h2h` - Fetches head-to-head matchup data
- `/api/nba/trends` - Fetches NBA trends data
- `/api/nba/defense-vs-position` - Fetches defensive matchup data

### NFL APIs
- `/api/nfl/schedule` - Fetches NFL schedule
- `/api/nfl/matchup` - Fetches team matchup statistics
- `/api/nfl/trends` - Fetches NFL trends data

### Stripe APIs
- `/api/stripe/create-checkout` - Creates Stripe checkout session
- `/api/stripe/portal` - Creates Stripe customer portal session
- `/api/stripe/webhook` - Handles Stripe webhook events

## Environment Variables to Verify in Vercel

### Supabase (Required for Auth)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Stripe (Required for Payments)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID`
- `NEXT_PUBLIC_STRIPE_ANNUAL_PRICE_ID`

### Optional
- `NEXT_PUBLIC_BASE_URL` - Should be your Vercel domain or left unset

## Known Issues to Watch For

1. **ESPN API Rate Limits**
   - If you see empty data, check if ESPN API is rate limiting
   - Data is cached, so should be fine after first load

2. **Supabase Connection**
   - Make sure all environment variables are set in Vercel
   - Check Supabase dashboard for connection errors

3. **Stripe Webhooks**
   - Webhook must be configured in Stripe Dashboard
   - Point to: `https://your-domain.vercel.app/api/stripe/webhook`
   - Events to listen for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

4. **Middleware Warning**
   - You may see a warning about middleware being deprecated
   - This is just a Next.js notice, it won't affect functionality

## Quick Test Commands

If you want to test APIs directly:

```bash
# Test MLB batting API
curl https://your-domain.vercel.app/api/mlb/batting

# Test NBA schedule
curl https://your-domain.vercel.app/api/nba/schedule

# Test NFL matchup
curl https://your-domain.vercel.app/api/nfl/matchup
```

## Success Criteria

✅ All dashboards load without errors
✅ Data displays correctly (not empty or showing errors)
✅ Filters and interactive elements work
✅ Authentication flow works (sign up, login, logout)
✅ Paywall correctly limits access
✅ Stripe checkout can be initiated (use test mode)

## Next Steps After Testing

1. **If everything works**: You're ready to go live!
2. **If APIs fail**: Check Vercel logs for error messages
3. **If auth fails**: Verify Supabase environment variables
4. **If payments fail**: Verify Stripe environment variables and webhook

---

**Deployment**: ${new Date().toISOString()}
**Commit**: 3f792f1
**Branch**: update-homescreen
