import 'server-only'

import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables')
}

console.log('[Stripe Init] Stripe secret key found, length:', stripeSecretKey.length)
console.log('[Stripe Init] Key starts with:', stripeSecretKey.substring(0, 7))

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2024-11-20.acacia',
  typescript: true,
})
