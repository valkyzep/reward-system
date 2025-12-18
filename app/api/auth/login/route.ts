import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { authRateLimit } from '@/lib/rateLimit'
import { csrfProtection, generateCsrfToken, setCsrfCookie } from '@/lib/csrf'

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = authRateLimit(request)
  if (rateLimitResponse) return rateLimitResponse

  // CSRF protection
  const csrfResponse = csrfProtection(request)
  if (csrfResponse) return csrfResponse
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Fetch user from database
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', email)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Create session token
    const sessionToken = uuidv4()
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // 24 hour session

    // Save session to database
    const { error: sessionError } = await supabaseAdmin
      .from('user_sessions')
      .insert({
        user_id: user.id,
        session_token: sessionToken,
        expires_at: expiresAt.toISOString()
      })

    if (sessionError) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    // Update last login
    await supabaseAdmin
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)

    // Return user data and session token (without password hash)
    const { password_hash, ...userWithoutPassword } = user

    // Generate CSRF token
    const csrfToken = generateCsrfToken()

    const response = NextResponse.json({
      user: userWithoutPassword,
      sessionToken,
      csrfToken
    })

    // Set session cookie
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    })

    // Set CSRF cookie
    setCsrfCookie(response, csrfToken)

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
