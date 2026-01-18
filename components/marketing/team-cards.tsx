'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function TeamCards() {
  const [runnerHovered, setRunnerHovered] = useState(false)
  const [tailorHovered, setTailorHovered] = useState(false)

  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
      {/* Concierge/Runner Card */}
      <Card
        className="relative overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl group"
        style={{ borderColor: runnerHovered ? 'var(--actor-runner)' : 'transparent' }}
        onMouseEnter={() => setRunnerHovered(true)}
        onMouseLeave={() => setRunnerHovered(false)}
      >
        <div
          className="absolute top-0 right-0 w-32 h-32 rounded-bl-full"
          style={{ background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--actor-runner) 20%, transparent), transparent)' }}
        />
        <CardContent className="pt-10 pb-8 px-8 relative">
          <div className="flex justify-center mb-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-lg group-hover:scale-110 transition-transform duration-300"
              style={{ background: 'linear-gradient(135deg, var(--actor-runner), var(--actor-runner-dark))' }}
            >
              🚴
            </div>
          </div>

          <div className="text-center mb-6">
            <h3
              className="font-bold text-2xl mb-2"
              style={{
                fontFamily: 'var(--font-dm-sans)',
                background: 'linear-gradient(135deg, var(--actor-runner), var(--actor-runner-dark))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Join as Concierge
            </h3>
            <p className="text-sm text-muted-foreground">
              Be the face of TailorSpace. Collect garments, take measurements, and deliver smiles.
            </p>
          </div>

          <div className="space-y-3 mb-8">
            <InteractiveFeature
              color="var(--actor-runner)"
              colorLight="var(--actor-runner-light)"
              title="Flexible schedule"
              description="Work when you want, where you want"
            />
            <InteractiveFeature
              color="var(--actor-runner)"
              colorLight="var(--actor-runner-light)"
              title="Competitive earnings"
              description="Great pay per pickup & delivery"
            />
            <InteractiveFeature
              color="var(--actor-runner)"
              colorLight="var(--actor-runner-light)"
              title="Full training provided"
              description="No experience needed to start"
            />
          </div>

          <Button
            asChild
            className="w-full text-white shadow-lg hover:shadow-xl transition-all duration-300"
            size="lg"
            style={{ background: 'linear-gradient(135deg, var(--actor-runner), var(--actor-runner-dark))' }}
          >
            <Link href="/apply/runner">Apply as Concierge →</Link>
          </Button>
        </CardContent>
      </Card>

      {/* Tailor Card */}
      <Card
        className="relative overflow-hidden border-2 transition-all duration-300 hover:shadow-2xl group"
        style={{ borderColor: tailorHovered ? 'var(--actor-tailor)' : 'transparent' }}
        onMouseEnter={() => setTailorHovered(true)}
        onMouseLeave={() => setTailorHovered(false)}
      >
        <div
          className="absolute top-0 right-0 w-32 h-32 rounded-bl-full"
          style={{ background: 'linear-gradient(to bottom right, color-mix(in srgb, var(--actor-tailor) 20%, transparent), transparent)' }}
        />
        <CardContent className="pt-10 pb-8 px-8 relative">
          <div className="flex justify-center mb-6">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-lg group-hover:scale-110 transition-transform duration-300"
              style={{ background: 'linear-gradient(135deg, var(--actor-tailor), var(--actor-tailor-dark))' }}
            >
              ✂️
            </div>
          </div>

          <div className="text-center mb-6">
            <h3
              className="font-bold text-2xl mb-2"
              style={{
                fontFamily: 'var(--font-dm-sans)',
                background: 'linear-gradient(135deg, var(--actor-tailor), var(--actor-tailor-dark))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Sew For TailorSpace
            </h3>
            <p className="text-sm text-muted-foreground">
              Join our network of expert tailors. Showcase your craft and build your reputation.
            </p>
          </div>

          <div className="space-y-3 mb-8">
            <InteractiveFeature
              color="var(--actor-tailor)"
              colorLight="var(--actor-tailor-light)"
              title="Steady workflow"
              description="Consistent quality work delivered to you"
            />
            <InteractiveFeature
              color="var(--actor-tailor)"
              colorLight="var(--actor-tailor-light)"
              title="Fair compensation"
              description="Competitive rates for your expertise"
            />
            <InteractiveFeature
              color="var(--actor-tailor)"
              colorLight="var(--actor-tailor-light)"
              title="Work from anywhere"
              description="Use your own workshop or studio"
            />
          </div>

          <Button
            asChild
            className="w-full text-white shadow-lg hover:shadow-xl transition-all duration-300"
            size="lg"
            style={{ background: 'linear-gradient(135deg, var(--actor-tailor), var(--actor-tailor-dark))' }}
          >
            <Link href="/apply/tailor">Start Sewing With Us →</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function InteractiveFeature({
  color,
  colorLight,
  title,
  description
}: {
  color: string
  colorLight: string
  title: string
  description: string
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg transition-colors"
      style={{
        backgroundColor: hovered
          ? colorLight
          : `color-mix(in srgb, ${colorLight} 50%, transparent)`
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color }} />
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
