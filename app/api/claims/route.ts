import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// POST - Submit a claim
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      rewardId,
      variantOption,
      username,
      fullName,
      phoneNumber,
      deliveryAddress,
      ewalletName,
      ewalletAccount
    } = body

    // Generate claim ID
    const claimId = 'CLM-' + Math.random().toString(36).substr(2, 9).toUpperCase()

    // Check if database is ready
    const { data: testQuery, error: testError } = await supabase
      .from('claims')
      .select('id')
      .limit(1)
    
    // If tables don't exist yet, return mock success
    if (testError && testError.message.includes('relation')) {
      console.log('Database not ready, returning mock claim ID')
      return NextResponse.json({ 
        success: true, 
        claimId,
        message: 'Database not configured. This is a demo claim ID.' 
      })
    }

    // Get variant_id if variant is selected
    let variantId = null
    if (variantOption) {
      const { data: variant, error: variantError } = await supabase
        .from('reward_variants')
        .select('id')
        .eq('reward_id', rewardId)
        .eq('option_name', variantOption)
        .single()

      if (variantError) throw variantError
      variantId = variant.id
    }

    // Insert claim
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .insert({
        claim_id: claimId,
        reward_id: rewardId,
        variant_id: variantId,
        username,
        full_name: fullName,
        phone_number: phoneNumber,
        delivery_address: deliveryAddress,
        ewallet_name: ewalletName,
        ewallet_account: ewalletAccount,
        status: 'pending'
      })
      .select()
      .single()

    if (claimError) throw claimError

    return NextResponse.json({ success: true, claimId, claim })
  } catch (error: any) {
    console.error('Error submitting claim:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - Check claim status by claim_id
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const claimId = searchParams.get('claimId')

    if (!claimId) {
      return NextResponse.json({ error: 'Claim ID required' }, { status: 400 })
    }

    // Check if database is ready
    const { data: testQuery, error: testError } = await supabase
      .from('claims')
      .select('id')
      .limit(1)
    
    // If tables don't exist yet, return mock status
    if (testError && testError.message.includes('relation')) {
      console.log('Database not ready, returning mock status')
      const statuses = ['Pending', 'Processing', 'Approved', 'Completed', 'Rejected']
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
      return NextResponse.json({
        claimId,
        status: randomStatus,
        rewardName: 'Demo Reward',
        message: 'Database not configured. This is demo data.'
      })
    }

    const { data: claim, error } = await supabase
      .from('claims')
      .select(`
        *,
        reward:rewards (name, points),
        variant:reward_variants (option_name)
      `)
      .eq('claim_id', claimId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Claim not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json({
      claimId: claim.claim_id,
      rewardName: claim.reward?.name || 'Unknown Reward',
      points: claim.reward?.points || 0,
      variant: claim.variant?.option_name || 'N/A',
      status: claim.status,
      username: claim.username,
      fullName: claim.full_name,
      phoneNumber: claim.phone_number,
      deliveryAddress: claim.delivery_address,
      createdAt: claim.created_at,
      updatedAt: claim.updated_at
    })
  } catch (error: any) {
    console.error('Error checking claim:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
