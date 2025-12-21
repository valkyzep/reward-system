import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { csrfProtection } from '@/lib/csrf'

// GET - Fetch all claims for admin dashboard
export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('claims')
      .select(`
        *,
        reward:rewards(name, points)
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
      adminUser: claim.admin_user || 'N/A',
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
export async function PATCH(request: NextRequest) {
  // CSRF protection
  const csrfResponse = csrfProtection(request)
  if (csrfResponse) return csrfResponse
  try {
    const supabase = await getSupabaseAdmin()
    const body = await request.json()
    const { claimId, status, rejectionReason } = body

    if (!claimId || !status) {
      return NextResponse.json({ error: 'Claim ID and status required' }, { status: 400 })
    }

    // Get admin username from session cookie
    const cookies = request.headers.get('cookie')
    let adminUsername = 'Admin'
    
    if (cookies) {
      const sessionToken = cookies.split('; ').find(c => c.startsWith('session_token='))?.split('=')[1]
      if (sessionToken) {
        const { data: session, error: sessionError } = await supabase
          .from('user_sessions')
          .select('user:users(email, full_name, role)')
          .eq('session_token', sessionToken)
          .single()
        
        console.log('Session lookup:', { sessionToken, session, sessionError })
        
        if (session?.user) {
          const user = session.user as any
          // Use role to determine display name
          if (user.role === 'super_admin') {
            adminUsername = 'Super Admin'
          } else {
            // For regular admins, extract a simple name from email or use full_name
            const email = user.email || ''
            if (email.includes('admin1')) {
              adminUsername = 'Admin1'
            } else if (email.includes('admin2')) {
              adminUsername = 'Admin2'
            } else if (email.includes('admin3')) {
              adminUsername = 'Admin3'
            } else {
              // Default to Admin for other cases
              adminUsername = 'Admin'
            }
          }
        }
      }
    }
    
    console.log('Admin username:', adminUsername)

    const updateData: any = {
      status,
      admin_user: adminUsername,
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
