import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Confirmation token is required' },
        { status: 400 }
      )
    }

    // Find the email record with this token
    const { data: emailRecord, error: fetchError } = await supabase
      .from('early_access')
      .select('*')
      .eq('confirmation_token', token)
      .single()

    if (fetchError || !emailRecord) {
      console.error('Token lookup error:', fetchError)
      return NextResponse.json(
        { error: 'Invalid or expired confirmation token' },
        { status: 404 }
      )
    }

    // Check if already confirmed
    if (emailRecord.confirmed) {
      return NextResponse.json({
        message: 'Email already confirmed! You\'re all set for early access.',
        success: true
      })
    }

    // Confirm the email
    const { error: updateError } = await supabase
      .from('early_access')
      .update({
        confirmed: true,
        confirmed_at: new Date().toISOString()
      })
      .eq('confirmation_token', token)

    if (updateError) {
      console.error('Confirmation update error:', updateError)
      return NextResponse.json(
        { error: 'Failed to confirm email. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Email confirmed successfully! You\'re now on the early access list.',
      success: true
    })

  } catch (error) {
    console.error('Confirmation error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 