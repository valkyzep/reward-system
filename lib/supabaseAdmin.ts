import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseServiceKey) {
  throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
}

/**
 * Server-side Supabase client with service role key
 * This bypasses RLS by default, so we need to set session context
 */
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Get Supabase admin client with session context set for RLS
 * This allows RLS policies to check the current user's session
 */
export async function getSupabaseAdmin() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('session_token')?.value

  // Create a client for this request
  const client = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Set session context if available
  if (sessionToken) {
    // Execute a query to set the session context
    // This makes the session_token available to RLS policies
    await client.rpc('set_session_context', { session_token: sessionToken })
  }

  return client
}

export { supabaseAdmin }
