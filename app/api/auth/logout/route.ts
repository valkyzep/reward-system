import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { csrfProtection } from '@/lib/csrf'

export async function POST(request: NextRequest) {
  // CSRF protection
  const csrfResponse = csrfProtection(request)
  if (csrfResponse) return csrfResponse
  try {
    const sessionToken = request.cookies.get('session_token')?.value

    if (sessionToken) {
      // Delete session from database
      await supabaseAdmin
        .from('user_sessions')
        .delete()
        .eq('session_token', sessionToken)
    }

    // Clear cookies
    const response = NextResponse.json({ message: 'Logged out successfully' })
    response.cookies.delete('session_token')
    response.cookies.delete('csrf_token')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
