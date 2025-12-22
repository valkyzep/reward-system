import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'

// GET - Fetch current stats with auto-increment logic
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
          rewards_claimed: 0,
          active_players: 500,
          last_rewards_increment: new Date().toISOString(),
          last_players_increment: new Date().toISOString()
        })
        .select()
        .single()

      if (insertError) throw insertError
      stats = newStats
    }

    // Auto-increment logic for rewards claimed (every 2 seconds, add 1-5)
    const lastRewardsUpdate = new Date(stats.last_rewards_increment).getTime()
    const now = Date.now()
    const rewardsSecondsElapsed = Math.floor((now - lastRewardsUpdate) / 1000)
    const rewardsIntervals = Math.floor(rewardsSecondsElapsed / 2)
    
    // Auto-increment logic for active players (every 3 seconds, change -5 to +5)
    const lastPlayersUpdate = new Date(stats.last_players_increment).getTime()
    const playersSecondsElapsed = Math.floor((now - lastPlayersUpdate) / 1000)
    const playersIntervals = Math.floor(playersSecondsElapsed / 3)
    
    let newRewardsClaimed = stats.rewards_claimed
    let newActivePlayers = stats.active_players

    // Update rewards if interval passed
    if (rewardsIntervals > 0) {
      for (let i = 0; i < Math.min(rewardsIntervals, 10); i++) {
        newRewardsClaimed += Math.floor(Math.random() * 5) + 1
      }
    }

    // Update players if interval passed
    if (playersIntervals > 0) {
      for (let i = 0; i < Math.min(playersIntervals, 10); i++) {
        const change = Math.floor(Math.random() * 11) - 5
        newActivePlayers += change
        if (newActivePlayers < 100) newActivePlayers = 100
        if (newActivePlayers > 999) newActivePlayers = 999
      }
    }

    // Save updated values back to database if changed
    if (rewardsIntervals > 0 || playersIntervals > 0) {
      await supabase
        .from('stats')
        .update({
          rewards_claimed: newRewardsClaimed,
          active_players: newActivePlayers,
          last_rewards_increment: rewardsIntervals > 0 ? new Date().toISOString() : stats.last_rewards_increment,
          last_players_increment: playersIntervals > 0 ? new Date().toISOString() : stats.last_players_increment
        })
        .eq('id', stats.id)
    }

    return NextResponse.json({
      rewardsClaimed: newRewardsClaimed,
      activePlayers: newActivePlayers
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch stats',
      rewardsClaimed: 0,
      activePlayers: 500
    }, { status: 500 })
  }
}

// POST - Manual update (for admin purposes)
export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseAdmin()
    const { rewardsClaimed, activePlayers } = await request.json()

    const { error } = await supabase
      .from('stats')
      .update({
        rewards_claimed: rewardsClaimed,
        active_players: activePlayers,
        last_rewards_increment: new Date().toISOString(),
        last_players_increment: new Date().toISOString()
      })
      .eq('id', 1)

    if (error) {
      await supabase
        .from('stats')
        .insert({
          id: 1,
          rewards_claimed: rewardsClaimed,
          active_players: activePlayers,
          last_rewards_increment: new Date().toISOString(),
          last_players_increment: new Date().toISOString()
        })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating stats:', error)
    return NextResponse.json({ error: 'Failed to update stats' }, { status: 500 })
  }
}
