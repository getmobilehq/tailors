import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      email,
      full_name,
      phone,
      application_type,
      bio,
      experience_years,
      availability,
      // Runner-specific
      postcode_coverage,
      has_vehicle,
      license_number,
      // Tailor-specific
      specializations,
      portfolio_urls,
      certifications,
    } = body

    // Validate required fields
    if (!email || !full_name || !phone || !application_type || !bio) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (application_type !== 'runner' && application_type !== 'tailor') {
      return NextResponse.json(
        { error: 'Invalid application type' },
        { status: 400 }
      )
    }

    // Type-specific validation
    if (application_type === 'runner' && (!postcode_coverage || postcode_coverage.length === 0)) {
      return NextResponse.json(
        { error: 'Please select at least one postcode area' },
        { status: 400 }
      )
    }

    if (application_type === 'tailor' && (!specializations || specializations.length === 0)) {
      return NextResponse.json(
        { error: 'Please select at least one specialization' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check if email already has a pending or approved application
    const { data: existingApp } = await supabase
      .from('applications')
      .select('id, status')
      .eq('email', email)
      .eq('application_type', application_type)
      .in('status', ['pending', 'approved'])
      .single()

    if (existingApp) {
      if (existingApp.status === 'pending') {
        return NextResponse.json(
          { error: 'You already have a pending application. Please wait for review.' },
          { status: 400 }
        )
      }
      if (existingApp.status === 'approved') {
        return NextResponse.json(
          { error: 'You already have an approved application.' },
          { status: 400 }
        )
      }
    }

    // Create application
    const { data, error } = await supabase
      .from('applications')
      .insert({
        email,
        full_name,
        phone,
        application_type,
        bio,
        experience_years,
        availability,
        postcode_coverage: postcode_coverage || null,
        has_vehicle: has_vehicle || null,
        license_number: license_number || null,
        specializations: specializations || null,
        portfolio_urls: portfolio_urls || null,
        certifications: certifications || null,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating application:', error)
      return NextResponse.json(
        { error: 'Failed to submit application' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      application: data,
      message: 'Application submitted successfully'
    })

  } catch (error: any) {
    console.error('Application submission error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
