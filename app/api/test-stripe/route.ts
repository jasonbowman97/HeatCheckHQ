import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const hasStripeKey = !!process.env.STRIPE_SECRET_KEY
    const keyLength = process.env.STRIPE_SECRET_KEY?.length || 0
    const keyPrefix = process.env.STRIPE_SECRET_KEY?.substring(0, 7) || 'missing'

    return NextResponse.json({
      hasStripeKey,
      keyLength,
      keyPrefix,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}
