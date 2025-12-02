// This is a Next.js 14 App Router application
// The actual pages are in the /app directory
// Visit the following routes:
// - / (homepage)
// - /book (booking flow)
// - /login (authentication)
// - /signup (registration)

export default function App() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-5xl font-bold tracking-tight">
          TailorSpace
        </h1>
        <p className="text-xl text-muted-foreground">
          Expert alterations delivered to your door in Nottingham
        </p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-8">
          <h2 className="text-lg font-semibold mb-3">🚀 Next.js App Router Application</h2>
          <p className="text-sm text-muted-foreground mb-4">
            This is a Next.js 14 application. To run it properly, you need to:
          </p>
          <ol className="text-left text-sm space-y-2 max-w-md mx-auto">
            <li className="flex gap-2">
              <span className="font-semibold">1.</span>
              <span>Install dependencies: <code className="bg-gray-100 px-2 py-1 rounded">npm install</code></span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">2.</span>
              <span>Set up environment variables in <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code></span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">3.</span>
              <span>Run the database schema in Supabase SQL Editor</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">4.</span>
              <span>Start dev server: <code className="bg-gray-100 px-2 py-1 rounded">npm run dev</code></span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold">5.</span>
              <span>Visit <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:3000</code></span>
            </li>
          </ol>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-8 text-sm">
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-2">📚 Documentation</h3>
            <ul className="text-left space-y-1 text-muted-foreground">
              <li>• QUICK_START.md</li>
              <li>• SETUP_GUIDE.md</li>
              <li>• DATABASE_SETUP_COMPLETE.md</li>
              <li>• DEPLOYMENT_CHECKLIST.md</li>
            </ul>
          </div>
          
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-2">🎯 Key Features</h3>
            <ul className="text-left space-y-1 text-muted-foreground">
              <li>• Complete booking flow</li>
              <li>• Stripe payments</li>
              <li>• Runner dashboard</li>
              <li>• Admin panel</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm">
            <strong>Note:</strong> This preview shows a placeholder. The full application 
            requires a proper Next.js environment to run correctly.
          </p>
        </div>
      </div>
    </div>
  )
}
