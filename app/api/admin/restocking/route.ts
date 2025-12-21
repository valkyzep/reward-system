import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { csrfProtection } from '@/lib/csrf'

// GET - Fetch restocking history
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseAdmin()
    const { data: history, error } = await supabase
      .from('restocking_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json(history)
  } catch (error: any) {
    console.error('Error fetching restocking history:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Add restocking history entry
export async function POST(request: NextRequest) {
  // CSRF protection
  const csrfResponse = csrfProtection(request)
  if (csrfResponse) return csrfResponse

  try {
    const supabase = await getSupabaseAdmin()
    const body = await request.json()
    const { reward_id, reward_name, reward_category, quantity_added, admin_user } = body

    const { data, error } = await supabase
      .from('restocking_history')
      .insert({
        reward_id,
        reward_name,
        reward_category,
        quantity_added,
        admin_user
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error adding restocking history:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
