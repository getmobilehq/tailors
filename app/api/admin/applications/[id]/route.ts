import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) }
  }

  return { user }
}

// PATCH - Update application details
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAdmin()
    if (auth.error) return auth.error

    const body = await request.json()
    const {
      full_name,
      email,
      phone,
      bio,
      experience_years,
      availability,
      specializations,
      postcode_coverage,
      has_vehicle,
      certifications,
      portfolio_urls,
    } = body

    const adminClient = createAdminClient()

    const updateData: Record<string, any> = {}
    if (full_name !== undefined) updateData.full_name = full_name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (bio !== undefined) updateData.bio = bio
    if (experience_years !== undefined) updateData.experience_years = experience_years
    if (availability !== undefined) updateData.availability = availability
    if (specializations !== undefined) updateData.specializations = specializations
    if (postcode_coverage !== undefined) updateData.postcode_coverage = postcode_coverage
    if (has_vehicle !== undefined) updateData.has_vehicle = has_vehicle
    if (certifications !== undefined) updateData.certifications = certifications
    if (portfolio_urls !== undefined) updateData.portfolio_urls = portfolio_urls

    const { data, error } = await adminClient
      .from('applications')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete application
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await verifyAdmin()
    if (auth.error) return auth.error

    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('applications')
      .delete()
      .eq('id', params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
