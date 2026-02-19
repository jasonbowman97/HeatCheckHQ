// ============================================================
// lib/email.ts — Resend email utility
// ============================================================
// Server-only. Sends transactional emails via Resend.
// Env var: RESEND_API_KEY (set in Vercel dashboard)

import "server-only"
import { Resend } from "resend"

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_EMAIL = "HeatCheck HQ <hello@heatcheckhq.io>"

// ── Welcome email ──────────────────────────────────────────
export async function sendWelcomeEmail(to: string, name?: string) {
  const firstName = name || "there"

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Welcome to HeatCheck HQ — your 7-day Pro trial is live",
      html: welcomeEmailHtml(firstName),
    })

    if (error) {
      console.error("[Email] Failed to send welcome email:", error)
      return { success: false, error }
    }

    console.log(`[Email] Welcome email sent to ${to}, id: ${data?.id}`)
    return { success: true, id: data?.id }
  } catch (err) {
    console.error("[Email] Welcome email error:", err)
    return { success: false, error: err }
  }
}

// ── Pro upgrade confirmation ──────────────────────────────
export async function sendProUpgradeEmail(to: string, plan: string) {
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: "You're now a HeatCheck Pro member",
      html: proUpgradeEmailHtml(plan),
    })

    if (error) {
      console.error("[Email] Failed to send upgrade email:", error)
      return { success: false, error }
    }

    console.log(`[Email] Pro upgrade email sent to ${to}, id: ${data?.id}`)
    return { success: true, id: data?.id }
  } catch (err) {
    console.error("[Email] Pro upgrade email error:", err)
    return { success: false, error: err }
  }
}

// ── HTML Templates ─────────────────────────────────────────

function welcomeEmailHtml(firstName: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:28px;font-weight:700;color:#f0f6fc;letter-spacing:-0.5px;">HeatCheck HQ</span>
    </div>

    <div style="background:#161b22;border:1px solid #30363d;border-radius:12px;padding:32px 24px;">
      <h1 style="color:#f0f6fc;font-size:22px;margin:0 0 16px;">Hey ${firstName}, welcome aboard!</h1>

      <p style="color:#8b949e;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Your free account is set up and your <strong style="color:#f0f6fc;">7-day Pro trial</strong> is already active.
        That means every dashboard, every filter, and every data point is unlocked right now.
      </p>

      <p style="color:#8b949e;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Here's what to try first:
      </p>

      <div style="margin:0 0 24px;">
        <div style="padding:8px 0;border-bottom:1px solid #21262d;">
          <span style="color:#58a6ff;font-weight:600;">Check My Prop</span>
          <span style="color:#8b949e;"> — run any player prop through our convergence engine</span>
        </div>
        <div style="padding:8px 0;border-bottom:1px solid #21262d;">
          <span style="color:#58a6ff;font-weight:600;">Matchup X-Ray</span>
          <span style="color:#8b949e;"> — deep-dive any game with defense-adjusted projections</span>
        </div>
        <div style="padding:8px 0;">
          <span style="color:#58a6ff;font-weight:600;">Streaks</span>
          <span style="color:#8b949e;"> — catch hot and cold trends before the market moves</span>
        </div>
      </div>

      <a href="https://heatcheckhq.io/check" style="display:inline-block;background:#2f81f7;color:#fff;font-weight:600;font-size:15px;padding:12px 28px;border-radius:8px;text-decoration:none;">
        Run your first prop check
      </a>

      <p style="color:#484f58;font-size:13px;margin:24px 0 0;">
        Your trial ends in 7 days. No credit card was charged. Upgrade anytime at
        <a href="https://heatcheckhq.io/checkout" style="color:#58a6ff;text-decoration:none;">heatcheckhq.io/checkout</a>.
      </p>
    </div>

    <p style="text-align:center;color:#484f58;font-size:12px;margin-top:24px;">
      HeatCheck HQ &mdash; Sports analytics for smarter bets<br>
      <a href="https://heatcheckhq.io" style="color:#484f58;text-decoration:none;">heatcheckhq.io</a>
    </p>
  </div>
</body>
</html>`
}

function proUpgradeEmailHtml(plan: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#0d1117;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:28px;font-weight:700;color:#f0f6fc;letter-spacing:-0.5px;">HeatCheck HQ</span>
    </div>

    <div style="background:#161b22;border:1px solid #30363d;border-radius:12px;padding:32px 24px;">
      <h1 style="color:#f0f6fc;font-size:22px;margin:0 0 16px;">You're Pro now. Let's go.</h1>

      <p style="color:#8b949e;font-size:15px;line-height:1.6;margin:0 0 16px;">
        Your <strong style="color:#f0f6fc;">${plan}</strong> subscription is active.
        Every dashboard, filter, and data point is permanently unlocked.
      </p>

      <p style="color:#8b949e;font-size:15px;line-height:1.6;margin:0 0 24px;">
        Manage your subscription anytime from your
        <a href="https://heatcheckhq.io/account" style="color:#58a6ff;text-decoration:none;">account page</a>.
      </p>

      <a href="https://heatcheckhq.io/check" style="display:inline-block;background:#2f81f7;color:#fff;font-weight:600;font-size:15px;padding:12px 28px;border-radius:8px;text-decoration:none;">
        Go to dashboards
      </a>
    </div>

    <p style="text-align:center;color:#484f58;font-size:12px;margin-top:24px;">
      HeatCheck HQ &mdash; Sports analytics for smarter bets<br>
      <a href="https://heatcheckhq.io" style="color:#484f58;text-decoration:none;">heatcheckhq.io</a>
    </p>
  </div>
</body>
</html>`
}
