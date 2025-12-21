import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

// GET - Fetch current stats with calculated count based on time
export async function GET() {
  try {
    const supabase = await getSupabaseAdmin()
    
    // Get or create stats record
    let { data: stats, error } = await supabase
      .from('stats')
      .select('*')
      .single()

    if (error || !stats) {
      // Create initial stats record if doesn't exist
      const { data: newStats, error: insertError } = await supabase
        .from('stats')
        .insert({
          rewards_claimed_base: 0,
          last_updated: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) throw insertError
      stats = newStats
    }

    // Calculate current count based on time elapsed
    const lastUpdated = new Date(stats.last_updated).getTime()
    const now = Date.now()
    const secondsElapsed = Math.floor((now - lastUpdated) / 1000)
    const intervalsElapsed = Math.floor(secondsElapsed / 2) // Every 2 seconds
    const incrementsToAdd = intervalsElapsed * 3 // Average 3 per interval (1-5 random)
    
    const currentCount = stats.rewards_claimed_base + incrementsToAdd

    return NextResponse.json({
      rewardsClaimed: currentCount,
      activePlayers: stats.active_players || 500,
      baseCount: stats.rewards_claimed_base,
      lastUpdated: stats.last_updated
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}

// POST - Update the base count (called periodically from client)
export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseAdmin()
    const { rewardsClaimed, activePlayers } = await request.json()

    const { error } = await supabase
      .from('stats')
      .update({
        rewards_claimed_base: rewardsClaimed,
        active_players: activePlayers,
        last_updated: new Date().toISOString()
      })
      .eq('id', 1) // Assuming single stats row with id 1

    if (error) {
      // If no row exists, insert it
      await supabase
        .from('stats')
        .insert({
          id: 1,
          rewards_claimed_base: rewardsClaimed,
          active_players: activePlayers,
          last_updated: new Date().toISOString()
        })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating stats:', error)
    return NextResponse.json({ error: 'Failed to update stats' }, { status: 500 })
  }
}
