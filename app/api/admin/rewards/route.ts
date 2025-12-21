import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { csrfProtection } from '@/lib/csrf'

// GET - Fetch all rewards
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseAdmin()
    const { data: rewards, error } = await supabase
      .from('rewards')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Transform data to match frontend format
    const transformedRewards = rewards.map((reward: any) => ({
      id: reward.id,
      name: reward.name,
      model: reward.model,
      description: reward.description || '',
      points: reward.points,
      category: reward.category,
      quantity: reward.quantity,
      tier: reward.tier || 'bronze',
      images: reward.images ? JSON.parse(reward.images) : []
    }))

    return NextResponse.json(transformedRewards)
  } catch (error: any) {
    console.error('Error fetching rewards:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Update a reward
export async function PATCH(request: NextRequest) {
  // CSRF protection
  const csrfResponse = csrfProtection(request)
  if (csrfResponse) return csrfResponse

  try {
    const supabase = await getSupabaseAdmin()
    const body = await request.json()
    const { id, name, model, description, points, category, quantity, tier, images } = body

    // Update reward
    const { error: updateError } = await supabase
      .from('rewards')
      .update({
        name,
        model,
        description: description || '',
        points: parseInt(points),
        category,
        quantity: parseInt(quantity),
        tier: tier || 'bronze',
        images: JSON.stringify(images || []),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) throw updateError

    return NextResponse.json({ success: true, message: 'Reward updated successfully' })
  } catch (error: any) {
    console.error('Error updating reward:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete a reward
export async function DELETE(request: NextRequest) {
  // CSRF protection
  const csrfResponse = csrfProtection(request)
  if (csrfResponse) return csrfResponse

  try {
    const supabase = await getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Reward ID is required' }, { status: 400 })
    }

    // Check if there are any claims for this reward
    const { data: claims, error: claimsError } = await supabase
      .from('claims')
      .select('id')
      .eq('reward_id', id)

    if (claimsError) throw claimsError

    // Check if force delete is requested
    const force = searchParams.get('force')
    
    if (claims && claims.length > 0 && !force) {
      return NextResponse.json({ 
        claimCount: claims.length
      }, { status: 400 })
    }

    // If force delete, delete all associated claims first
    if (force && claims && claims.length > 0) {
      const { error: deleteClaimsError } = await supabase
        .from('claims')
        .delete()
        .eq('reward_id', id)
      
      if (deleteClaimsError) throw deleteClaimsError
    }

    const { error } = await supabase
      .from('rewards')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Reward deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting reward:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create a new reward
export async function POST(request: NextRequest) {
  // CSRF protection
  const csrfResponse = csrfProtection(request)
  if (csrfResponse) return csrfResponse

  try {
    const supabase = await getSupabaseAdmin()
    const body = await request.json()
    const { name, model, description, points, category, quantity, tier, images } = body

    // Insert reward
    const { data: reward, error: rewardError } = await supabase
      .from('rewards')
      .insert({
        name,
        model,
        description: description || '',
        points: parseInt(points),
        category,
        quantity: parseInt(quantity),
        tier: tier || 'bronze',
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