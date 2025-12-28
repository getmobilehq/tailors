'use client'

import dynamic from 'next/dynamic'

const ItemsContent = dynamic(() => import('./items-content'), {
  ssr: false,
  loading: () => (
    <div className="max-w-7xl mx-auto">
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    </div>
  ),
})

export default function ItemsPage() {
  return <ItemsContent />
}
