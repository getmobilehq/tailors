'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function NetworkTestPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function testDirectFetch() {
    setLoading(true)
    setResult(null)

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    try {
      // Test 1: Basic fetch to auth health endpoint
      const response = await fetch(`${url}/auth/v1/health`, {
        method: 'GET',
        headers: {
          'apikey': key!,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.text()

      setResult({
        status: 'success',
        message: 'Direct fetch worked!',
        response: {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          data
        },
        env: {
          url,
          hasKey: !!key
        }
      })
    } catch (error: any) {
      setResult({
        status: 'error',
        message: error.message,
        error: {
          name: error.name,
          message: error.message,
          cause: error.cause,
          stack: error.stack?.split('\n').slice(0, 5)
        },
        env: {
          url,
          hasKey: !!key
        }
      })
    } finally {
      setLoading(false)
    }
  }

  async function testCORS() {
    setLoading(true)
    setResult(null)

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    try {
      // Test CORS with a simple request
      const response = await fetch(`${url}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': key!,
        },
      })

      setResult({
        status: 'success',
        message: 'CORS test passed!',
        response: {
          ok: response.ok,
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
        }
      })
    } catch (error: any) {
      setResult({
        status: 'error',
        message: 'CORS test failed',
        error: {
          name: error.name,
          message: error.message,
          type: error.constructor.name
        }
      })
    } finally {
      setLoading(false)
    }
  }

  async function testBrowserInfo() {
    setLoading(true)
    setResult(null)

    try {
      setResult({
        status: 'info',
        browser: {
          userAgent: navigator.userAgent,
          onLine: navigator.onLine,
          cookieEnabled: navigator.cookieEnabled,
          language: navigator.language,
        },
        connection: (navigator as any).connection ? {
          effectiveType: (navigator as any).connection.effectiveType,
          downlink: (navigator as any).connection.downlink,
          rtt: (navigator as any).connection.rtt,
        } : 'Not available',
        env: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          keyPreview: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) + '...'
        }
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-muted/30">
      <div className="container max-w-4xl">
        <h1 className="text-3xl mb-8">Network Diagnostic Tool</h1>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Test Direct HTTP Fetch</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Tests if browser can reach Supabase server directly
              </p>
              <Button onClick={testDirectFetch} disabled={loading}>
                Test Direct Fetch
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Test CORS</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Tests if CORS headers are configured correctly
              </p>
              <Button onClick={testCORS} disabled={loading}>
                Test CORS
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Browser Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Shows browser capabilities and network status
              </p>
              <Button onClick={testBrowserInfo} disabled={loading}>
                Get Browser Info
              </Button>
            </CardContent>
          </Card>

          {result && (
            <Card className={result.status === 'success' ? 'border-green-500' : result.status === 'error' ? 'border-red-500' : 'border-blue-500'}>
              <CardHeader>
                <CardTitle className={result.status === 'success' ? 'text-green-600' : result.status === 'error' ? 'text-red-600' : 'text-blue-600'}>
                  {result.status === 'success' ? '✓ Success' : result.status === 'error' ? '✗ Error' : 'ℹ Info'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96 text-sm">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-8 p-4 bg-amber-50 rounded-lg">
          <h3 className="font-semibold mb-2">Common "Failed to Fetch" Causes:</h3>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>Browser extension blocking request (Privacy Badger, uBlock, etc.)</li>
            <li>Firewall blocking Supabase domain</li>
            <li>VPN interfering with connection</li>
            <li>Corporate proxy blocking requests</li>
            <li>Antivirus software with web protection</li>
            <li>Network connectivity issues</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Quick Fixes:</h3>
          <ol className="text-sm space-y-1 list-decimal list-inside">
            <li>Try in Incognito/Private mode (bypasses extensions)</li>
            <li>Disable browser extensions temporarily</li>
            <li>Check browser DevTools → Network tab for blocked requests</li>
            <li>Restart browser</li>
            <li>Check if you can access https://qpnpzctawztmvgfaprpi.supabase.co in browser</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
