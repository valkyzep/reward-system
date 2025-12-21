import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

// GET - Fetch all tiers
export async function GET() {
  try {
    const supabase = await getSupabaseAdmin()
    
    const { data, error } = await supabase
      .from('tiers')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching tiers:', error)
    return NextResponse.json({ error: 'Failed to fetch tiers' }, { status: 500 })
  }
}
