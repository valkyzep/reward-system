import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET - Fetch all claims for admin dashboard
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('claims')
      .select(`
        *,
        reward:rewards(name, points),
        variant:reward_variants(option_name)
      `)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: claims, error } = await query

    if (error) throw error

    // Transform data to match admin panel structure
    const transformedClaims = claims.map((claim: any) => ({
      id: claim.claim_id,
      rewardName: claim.reward?.name || 'Unknown',
      points: claim.reward?.points || 0,
      username: claim.username,
      name: claim.full_name,
      phone: claim.phone_number,
      address: claim.delivery_address || 'N/A',
      walletName: claim.ewallet_name || 'N/A',
      walletNumber: claim.ewallet_account || 'N/A',
      status: claim.status,
      reason: claim.rejection_reason || '',
      variant: claim.variant?.option_name || 'N/A',
      timestamp: new Date(claim.created_at).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    }))

    return NextResponse.json(transformedClaims)
  } catch (error: any) {
    console.error('Error fetching claims:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Update claim status
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { claimId, status, rejectionReason } = body

    if (!claimId || !status) {
      return NextResponse.json({ error: 'Claim ID and status required' }, { status: 400 })
    }

    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (rejectionReason) {
      updateData.rejection_reason = rejectionReason
    }

    // If approving, decrease the reward quantity
    if (status === 'approved') {
      // First, get the claim to find the reward_id
      const { data: claim, error: claimError } = await supabase
        .from('claims')
        .select('reward_id')
        .eq('claim_id', claimId)
        .single()

      if (claimError) throw claimError

      // Get the current reward quantity
      const { data: reward, error: rewardError } = await supabase
        .from('rewards')
        .select('quantity, name')
        .eq('id', claim.reward_id)
        .single()

      if (rewardError) throw rewardError

      // Check if item is out of stock
      if (reward.quantity <= 0) {
        return NextResponse.json({ 
          error: `This item is already out of stock. Cannot approve claim for "${reward.name}".` 
        }, { status: 400 })
      }

      // Decrease quantity by 1
      const newQuantity = reward.quantity - 1

      // Update the reward quantity
      const { error: updateRewardError } = await supabase
        .from('rewards')
        .update({ quantity: newQuantity })
        .eq('id', claim.reward_id)

      if (updateRewardError) throw updateRewardError
    }

    const { data, error } = await supabase
      .from('claims')
      .update(updateData)
      .eq('claim_id', claimId)
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error('Error updating claim:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
