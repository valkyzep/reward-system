import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// GET - Fetch all rewards with variants and galleries
export async function GET(request: NextRequest) {
  try {
    const { data: rewards, error } = await supabase
      .from('rewards')
      .select(`
        *,
        variants:reward_variants(
          id,
          option_name,
          galleries:reward_galleries(
            id,
            image_url,
            image_order
          )
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Transform data to match frontend format
    const transformedRewards = rewards.map((reward: any) => ({
      id: reward.id,
      name: reward.name,
      points: reward.points,
      category: reward.category,
      quantity: reward.quantity,
      tier: reward.tier || 'bronze',
      variants: {
        type: reward.variant_type || 'color',
        options: reward.variants?.map((v: any) => v.option_name) || []
      },
      galleries: reward.variants?.reduce((acc: any, variant: any) => {
        acc[variant.option_name] = variant.galleries
          ?.sort((a: any, b: any) => a.image_order - b.image_order)
          ?.map((g: any) => g.image_url) || []
        return acc
      }, {})
    }))

    return NextResponse.json(transformedRewards)
  } catch (error: any) {
    console.error('Error fetching rewards:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Update a reward
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, points, category, quantity, variantType, variantOptions, tier, galleries } = body

    // Update reward basic info
    const { error: updateError } = await supabase
      .from('rewards')
      .update({
        name,
        points: parseInt(points),
        category,
        quantity: parseInt(quantity),
        variant_type: variantType,
        tier: tier || 'bronze',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) throw updateError

    // Get current variants
    const { data: currentVariants } = await supabase
      .from('reward_variants')
      .select('id, option_name')
      .eq('reward_id', id)

    const currentOptions = currentVariants?.map(v => v.option_name) || []
    const newOptions = variantOptions.split(',').map((s: string) => s.trim()).filter((s: string) => s)

    // Delete removed variants
    const toDelete = currentVariants?.filter(v => !newOptions.includes(v.option_name)) || []
    if (toDelete.length > 0) {
      await supabase
        .from('reward_variants')
        .delete()
        .in('id', toDelete.map(v => v.id))
    }

    // Add new variants
    const toAdd = newOptions.filter((opt: string) => !currentOptions.includes(opt))
    if (toAdd.length > 0) {
      await supabase
        .from('reward_variants')
        .insert(
          toAdd.map((option: string) => ({
            reward_id: id,
            option_name: option
          }))
        )
    }

    // Update galleries if provided
    if (galleries) {
      // Get updated variant list
      const { data: updatedVariants } = await supabase
        .from('reward_variants')
        .select('id, option_name')
        .eq('reward_id', id)

      if (updatedVariants && updatedVariants.length > 0) {
        // Delete all existing galleries for all variants in one operation
        const variantIds = updatedVariants.map(v => v.id)
        await supabase
          .from('reward_galleries')
          .delete()
          .in('variant_id', variantIds)

        // Prepare all galleries to insert in one batch
        const galleriesToInsert: any[] = []
        for (const variant of updatedVariants) {
          const variantGalleries = galleries[variant.option_name] || []
          if (variantGalleries.length > 0) {
            variantGalleries.forEach((url: string, index: number) => {
              if (url && url.trim()) {
                galleriesToInsert.push({
                  variant_id: variant.id,
                  image_url: url,
                  image_order: index
                })
              }
            })
          }
        }

        // Insert all galleries in one operation
        if (galleriesToInsert.length > 0) {
          await supabase
            .from('reward_galleries')
            .insert(galleriesToInsert)
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Reward updated successfully' })
  } catch (error: any) {
    console.error('Error updating reward:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete a reward
export async function DELETE(request: NextRequest) {
  try {
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

    if (claims && claims.length > 0) {
      return NextResponse.json({ 
        error: `Cannot delete reward. There are ${claims.length} claim(s) associated with this reward. Please delete or reassign the claims first.` 
      }, { status: 400 })
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
  try {
    const body = await request.json()
    const { name, points, category, quantity, variantType, variantOptions, tier, galleries } = body

    // Insert reward
    const { data: reward, error: rewardError } = await supabase
      .from('rewards')
      .insert({
        name,
        points: parseInt(points),
        category,
        quantity: parseInt(quantity),
        variant_type: variantType,
        tier: tier || 'bronze'
      })
      .select()
      .single()

    if (rewardError) throw rewardError

    // Insert variants
    const options = variantOptions.split(',').map((s: string) => s.trim()).filter((s: string) => s)
    if (options.length > 0) {
      const { data: variants, error: variantsError } = await supabase
        .from('reward_variants')
        .insert(
          options.map((option: string) => ({
            reward_id: reward.id,
            option_name: option
          }))
        )
        .select()

      if (variantsError) throw variantsError

      // Insert galleries if provided - batch all inserts
      if (galleries && variants) {
        const galleriesToInsert: any[] = []
        for (const variant of variants) {
          const variantGalleries = galleries[variant.option_name] || []
          if (variantGalleries.length > 0) {
            variantGalleries.forEach((url: string, index: number) => {
              if (url && url.trim()) {
                galleriesToInsert.push({
                  variant_id: variant.id,
                  image_url: url,
                  image_order: index
                })
              }
            })
          }
        }
        
        // Insert all galleries in one batch operation
        if (galleriesToInsert.length > 0) {
          await supabase
            .from('reward_galleries')
            .insert(galleriesToInsert)
        }
      }
    }

    return NextResponse.json({ success: true, reward })
  } catch (error: any) {
    console.error('Error creating reward:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
