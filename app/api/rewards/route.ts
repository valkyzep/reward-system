import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET all rewards with their images
export async function GET() {
  try {
    // Fetch all rewards
    const { data: rewards, error: rewardsError } = await supabase
      .from('rewards')
      .select('*')
      .order('points', { ascending: false })

    if (rewardsError) throw rewardsError

    // Fetch all approved claims counts in one query
    const { data: allClaims, error: claimsError } = await supabase
      .from('claims')
      .select('reward_id')
      .eq('status', 'Approved')

    if (claimsError) throw claimsError

    // Create lookup maps for faster access
    const claimsCounts = (allClaims || []).reduce((acc: Record<number, number>, claim: any) => {
      acc[claim.reward_id] = (acc[claim.reward_id] || 0) + 1
      return acc
    }, {})

    // Build rewards with details
    const rewardsWithDetails = rewards.map((reward) => {
      const approvedCount = claimsCounts[reward.id] || 0
      const availableQuantity = Math.max(0, reward.quantity - approvedCount)

      // Parse images from reward.images field (assuming it's JSON array)
      const images = reward.images ? (Array.isArray(reward.images) ? reward.images : JSON.parse(reward.images)) : []

      return {
        id: reward.id,
        name: reward.name,
        model: reward.model,
        description: reward.description || '',
        points: reward.points,
        category: reward.category,
        quantity: availableQuantity,
        tier: reward.tier || 'bronze',
        image: images[0] || '',
        images: images,
        discounted_price: reward.discounted_price || null,
        discount_end_date: reward.discount_end_date || null
      }
    })

    return NextResponse.json(rewardsWithDetails)
  } catch (error: any) {
    console.error('Error fetching rewards:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create a new reward with images
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, model, points, category, quantity, tier, images } = body

    // Insert reward
    const { data: reward, error: rewardError } = await supabase
      .from('rewards')
      .insert({
        name,
        model,
        points,
        category,
        quantity,
        tier,
        images: JSON.stringify(images || [])
      })
      .select()
      .single()

    if (rewardError) throw rewardError

    return NextResponse.json({ success: true, reward })
  } catch (error: any) {
    console.error('Error creating reward:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
