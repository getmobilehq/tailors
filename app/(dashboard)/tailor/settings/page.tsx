export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { TailorSettings } from '@/components/tailor/tailor-settings'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function TailorSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'tailor') {
    redirect('/orders')
  }

  const { data: tailorProfile } = await supabase
    .from('tailor_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/tailor">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'var(--font-dm-sans)' }}>
            Settings
          </h1>
        </div>
        <p className="text-muted-foreground ml-12">
          Manage your profile and tailor settings
        </p>
      </div>

      <TailorSettings
        user={profile}
        tailorProfile={tailorProfile}
      />
    </div>
  )
}
