'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AuthTestPage() {
  const [email, setEmail] = useState('test@test.com')
  const [password, setPassword] = useState('testpass123')
  const [fullName, setFullName] = useState('Test User')
  const [phone, setPhone] = useState('07123456789')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function testConnection() {
    setLoading(true)
    setResult(null)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from('users').select('count').limit(1)

      if (error) {
        setResult({
          status: 'error',
          message: 'Database connection failed',
          error: error.message,
          details: error
        })
      } else {
        setResult({
          status: 'success',
          message: 'Database connection successful',
          data
        })
      }
    } catch (err: any) {
      setResult({
        status: 'error',
        message: 'Connection test failed',
        error: err.message
      })
    } finally {
      setLoading(false)
    }
  }

  async function testSignup() {
    setLoading(true)
    setResult(null)
    try {
      // Step 1: Call server-side signup API
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          full_name: fullName,
          phone: phone,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setResult({
          status: 'error',
          step: 'API signup',
          message: data.error || 'Signup failed',
          error: data
        })
        setLoading(false)
        return
      }

      // Step 2: Login to get session
      const supabase = createClient()
      const { data: authData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (loginError) {
        setResult({
          status: 'error',
          step: 'auto-login after signup',
          message: loginError.message,
          error: loginError
        })
        setLoading(false)
        return
      }

      // Step 3: Fetch profile to verify
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileError) {
        setResult({
          status: 'error',
          step: 'profile verification',
          message: 'User created but profile not found',
          error: profileError,
          authUser: authData.user
        })
        setLoading(false)
        return
      }

      setResult({
        status: 'success',
        message: 'Signup successful! Account and profile created via server API.',
        authUser: authData.user,
        profile: profileData
      })
    } catch (err: any) {
      setResult({
        status: 'error',
        message: err.message,
        error: err
      })
    } finally {
      setLoading(false)
    }
  }

  async function testLogin() {
    setLoading(true)
    setResult(null)
    try {
      const supabase = createClient()

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setResult({
          status: 'error',
          message: error.message,
          error
        })
      } else {
        // Try to fetch profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user?.id)
          .single()

        setResult({
          status: 'success',
          message: 'Login successful!',
          user: data.user,
          session: data.session,
          profile,
          profileError
        })
      }
    } catch (err: any) {
      setResult({
        status: 'error',
        message: err.message,
        error: err
      })
    } finally {
      setLoading(false)
    }
  }

  async function testGetSession() {
    setLoading(true)
    setResult(null)
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.getSession()

      setResult({
        status: error ? 'error' : 'success',
        message: error ? error.message : 'Session retrieved',
        session: data.session,
        error
      })
    } catch (err: any) {
      setResult({
        status: 'error',
        message: err.message,
        error: err
      })
    } finally {
      setLoading(false)
    }
  }

  async function testLogout() {
    setLoading(true)
    setResult(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signOut()

      setResult({
        status: error ? 'error' : 'success',
        message: error ? error.message : 'Logged out successfully',
        error
      })
    } catch (err: any) {
      setResult({
        status: 'error',
        message: err.message,
        error: err
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen p-8 bg-muted/30">
      <div className="container max-w-4xl">
        <h1 className="text-3xl mb-8">Authentication Diagnostic Tool</h1>

        <div className="grid gap-6">
          {/* Connection Test */}
          <Card>
            <CardHeader>
              <CardTitle>1. Test Database Connection</CardTitle>
              <CardDescription>
                Verify Supabase connection and RLS policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={testConnection} disabled={loading}>
                Test Connection
              </Button>
            </CardContent>
          </Card>

          {/* Signup Form */}
          <Card>
            <CardHeader>
              <CardTitle>2. Test Signup</CardTitle>
              <CardDescription>
                Create a new test account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              <Button onClick={testSignup} disabled={loading}>
                Test Signup
              </Button>
            </CardContent>
          </Card>

          {/* Login Test */}
          <Card>
            <CardHeader>
              <CardTitle>3. Test Login</CardTitle>
              <CardDescription>
                Login with existing credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>
              <Button onClick={testLogin} disabled={loading}>
                Test Login
              </Button>
            </CardContent>
          </Card>

          {/* Session Test */}
          <Card>
            <CardHeader>
              <CardTitle>4. Test Session</CardTitle>
              <CardDescription>
                Check current session status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={testGetSession} disabled={loading}>
                Get Session
              </Button>
            </CardContent>
          </Card>

          {/* Logout Test */}
          <Card>
            <CardHeader>
              <CardTitle>5. Test Logout</CardTitle>
              <CardDescription>
                Sign out and clear session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={testLogout} disabled={loading} variant="destructive">
                Test Logout
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <Card className={result.status === 'success' ? 'border-green-500' : 'border-red-500'}>
              <CardHeader>
                <CardTitle className={result.status === 'success' ? 'text-green-600' : 'text-red-600'}>
                  {result.status === 'success' ? '✓ Success' : '✗ Error'}
                </CardTitle>
                <CardDescription>{result.message}</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96 text-sm">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Environment Check</h3>
          <p className="text-sm text-muted-foreground">
            Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ Not set'}
          </p>
          <p className="text-sm text-muted-foreground">
            Supabase Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '❌ Not set'}
          </p>
        </div>
      </div>
    </div>
  )
}
