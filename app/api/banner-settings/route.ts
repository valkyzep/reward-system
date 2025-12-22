import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET - Fetch banner settings
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('banner_settings')
      .select('*')
      .eq('setting_key', 'main')
      .single()

    if (error) {
      console.error('Error fetching banner settings:', error)
      return NextResponse.json(
        { error: 'Failed to fetch banner settings' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/banner-settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update banner settings
export async function PUT(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json()
    const {
      top_banner_image,
      bottom_banner_images,
      bottom_banner_links,
      carousel_interval
    } = body

    // Update the banner settings
    const { data, error } = await supabase
      .from('banner_settings')
      .update({
        top_banner_image,
        bottom_banner_images,
        bottom_banner_links,
        carousel_interval,
        updated_at: new Date().toISOString()
      })
      .eq('setting_key', 'main')
      .select()
      .single()

    if (error) {
      console.error('Error updating banner settings:', error)
      return NextResponse.json(
        { error: 'Failed to update banner settings' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PUT /api/banner-settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
