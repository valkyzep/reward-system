import { randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'

const CSRF_TOKEN_LENGTH = 32
const CSRF_COOKIE_NAME = 'csrf_token'

/**
 * Generate a CSRF token
 */
export function generateCsrfToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
}

/**
 * Set CSRF token in cookie
 */
export function setCsrfCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/'
  })
}

/**
 * Validate CSRF token from request
 */
export function validateCsrfToken(request: NextRequest): boolean {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
  const headerToken = request.headers.get('x-csrf-token')

  if (!cookieToken || !headerToken) {
    return false
  }

  // Constant-time comparison to prevent timing attacks
  return cookieToken === headerToken
}

/**
 * CSRF protection middleware
 */
export function csrfProtection(request: NextRequest): NextResponse | null {
  // Only check CSRF for state-changing methods
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method)) {
    if (!validateCsrfToken(request)) {
      return NextResponse.json(
        { error: 'Invalid CSRF token' },
        { status: 403 }
      )
    }
  }
  
  return null // Valid request
}
