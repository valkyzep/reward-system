import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET all rewards with their variants and galleries
export async function GET() {
  try {
    // Fetch all rewards
    const { data: rewards, error: rewardsError } = await supabase
      .from('rewards')
      .select('*')
      .order('points', { ascending: false })

    if (rewardsError) throw rewardsError

    // Fetch all variants in one query
    const { data: allVariants, error: variantsError } = await supabase
      .from('reward_variants')
      .select('*')

    if (variantsError) throw variantsError

    // Fetch all galleries in one query
    const { data: allGalleries, error: galleriesError } = await supabase
      .from('reward_galleries')
      .select('*')
      .order('image_order', { ascending: true })

    if (galleriesError) throw galleriesError

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
      // Get variants for this reward
      const variants = (allVariants || []).filter((v: any) => v.reward_id === reward.id)

      const variantOptions: string[] = []
      const galleries: Record<string, string[]> = {}

      for (const variant of variants) {
        variantOptions.push(variant.option_name)

        const galleryImages = (allGalleries || [])
          .filter((g: any) => g.variant_id === variant.id)
          .map((img: any) => img.image_url)

        galleries[variant.option_name] = galleryImages
      }

      const approvedCount = claimsCounts[reward.id] || 0
      const availableQuantity = Math.max(0, reward.quantity - approvedCount)

      return {
        id: reward.id,
        name: reward.name,
        points: reward.points,
        category: reward.category,
        quantity: availableQuantity,
        tier: reward.tier || 'bronze',
        variants: variantOptions.length > 0 ? {
          type: reward.variant_type,
          options: variantOptions
        } : undefined,
        image: galleries[variantOptions[0]]?.[0] || '',
        galleries: Object.keys(galleries).length > 0 ? galleries : undefined
      }
    })

    return NextResponse.json(rewardsWithDetails)
  } catch (error: any) {
    console.error('Error fetching rewards:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create a new reward with variants and galleries
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, points, category, quantity, variants, galleries } = body

    // Insert reward
    const { data: reward, error: rewardError } = await supabase
      .from('rewards')
      .insert({
        name,
        points,
        category,
        quantity,
        variant_type: variants?.type
      })
      .select()
      .single()

    if (rewardError) throw rewardError

    // Insert variants and galleries
    if (variants && galleries) {
      for (const option of variants.options) {
        // Insert variant
        const { data: variant, error: variantError } = await supabase
          .from('reward_variants')
          .insert({
            reward_id: reward.id,
            option_name: option
          })
          .select()
          .single()

        if (variantError) throw variantError

        // Insert galleries for this variant
        const galleryImages = galleries[option] || []
        for (let i = 0; i < galleryImages.length; i++) {
          const { error: galleryError } = await supabase
            .from('reward_galleries')
            .insert({
              variant_id: variant.id,
              image_url: galleryImages[i],
              image_order: i
            })

          if (galleryError) throw galleryError
        }
      }
    }

    return NextResponse.json({ success: true, reward })
  } catch (error: any) {
    console.error('Error creating reward:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
