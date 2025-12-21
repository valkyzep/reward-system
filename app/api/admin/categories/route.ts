import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabaseAdmin'
import { csrfProtection } from '@/lib/csrf'

// GET - Fetch all categories
export async function GET() {
  try {
    const supabase = await getSupabaseAdmin()
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error

    return NextResponse.json(data || [])
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// POST - Add new category
export async function POST(request: NextRequest) {
  // CSRF protection
  const csrfResponse = csrfProtection(request)
  if (csrfResponse) return csrfResponse

  try {
    const supabase = await getSupabaseAdmin()
    const { name } = await request.json()

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({ name: name.trim() })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return NextResponse.json({ error: 'Category already exists' }, { status: 400 })
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

// DELETE - Remove category
export async function DELETE(request: NextRequest) {
  // CSRF protection
  const csrfResponse = csrfProtection(request)
  if (csrfResponse) return csrfResponse

  try {
    const supabase = await getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    // Check if category is in use
    const { count } = await supabase
      .from('rewards')
      .select('id', { count: 'exact', head: true })
      .eq('category', id)

    if (count && count > 0) {
      return NextResponse.json({ 
        error: `Cannot delete category. ${count} reward(s) are using this category.` 
      }, { status: 400 })
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
