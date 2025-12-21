import { NextRequest, NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 10 * 60 * 1000)

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

const defaultConfig: RateLimitConfig = {
  maxRequests: 5, // 5 requests
  windowMs: 15 * 60 * 1000 // per 15 minutes
}

/**
 * Get client identifier (IP address)
 */
function getClientId(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  return ip
}

/**
 * Rate limiting middleware
 */
export function rateLimit(
  request: NextRequest,
  config: RateLimitConfig = defaultConfig
): NextResponse | null {
  const clientId = getClientId(request)
  const key = `${clientId}:${request.nextUrl.pathname}`
  const now = Date.now()

  let entry = rateLimitStore.get(key)

  // Create new entry if doesn't exist or is expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs
    }
    rateLimitStore.set(key, entry)
    return null // Allow request
  }

  // Increment counter
  entry.count++

  // Check if limit exceeded
  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    
    return NextResponse.json(
      { 
        error: 'Too many requests. Please try again later.',
        retryAfter 
      },
      { 
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': entry.resetTime.toString()
        }
      }
    )
  }

  // Update entry
  rateLimitStore.set(key, entry)
  return null // Allow request
}

/**
 * Strict rate limiting for authentication endpoints
 */
export function authRateLimit(request: NextRequest): NextResponse | null {
  return rateLimit(request, {
    maxRequests: 5, // 5 login attempts
    windowMs: 15 * 60 * 1000 // per 15 minutes
  })
}

/**
 * Moderate rate limiting for general API endpoints
 */
export function apiRateLimit(request: NextRequest): NextResponse | null {
  return rateLimit(request, {
    maxRequests: 100, // 100 requests
    windowMs: 60 * 1000 // per minute
  })
}
