'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Bike, Scissors, Check, X, Eye } from 'lucide-react'

interface Application {
  id: string
  email: string
  full_name: string
  phone: string
  application_type: 'runner' | 'tailor'
  status: 'pending' | 'approved' | 'rejected'
  bio: string
  experience_years: number
  availability: string
  postcode_coverage?: string[]
  has_vehicle?: boolean
  license_number?: string
  specializations?: string[]
  portfolio_urls?: string[]
  certifications?: string[]
  created_at: string
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadApplications()
  }, [])

  async function loadApplications() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast.error('Failed to load applications')
      console.error(error)
    } else {
      setApplications(data || [])
    }
    setLoading(false)
  }

  async function handleApprove(application: Application) {
    setProcessing(true)

    try {
      const response = await fetch('/api/admin/applications/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: application.id,
          action: 'approve',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve application')
      }

      toast.success('Application approved successfully!')
      loadApplications()
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve application')
    } finally {
      setProcessing(false)
    }
  }

  async function handleReject() {
    if (!selectedApp || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection')
      return
    }

    setProcessing(true)

    try {
      const response = await fetch('/api/admin/applications/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: selectedApp.id,
          action: 'reject',
          rejection_reason: rejectionReason,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject application')
      }

      toast.success('Application rejected')
      setShowRejectDialog(false)
      setRejectionReason('')
      setSelectedApp(null)
      loadApplications()
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject application')
    } finally {
      setProcessing(false)
    }
  }

  function ApplicationCard({ app }: { app: Application }) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                app.application_type === 'runner' ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-purple-100 dark:bg-purple-900/20'
              }`}>
                {app.application_type === 'runner' ?
                  <Bike className={`h-5 w-5 ${app.application_type === 'runner' ? 'text-blue-600 dark:text-blue-400' : ''}`} /> :
                  <Scissors className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                }
              </div>
              <div>
                <CardTitle className="text-lg">{app.full_name}</CardTitle>
                <CardDescription>{app.email}</CardDescription>
              </div>
            </div>
            <Badge
              variant={
                app.status === 'pending' ? 'outline' :
                app.status === 'approved' ? 'default' : 'destructive'
              }
            >
              {app.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Phone:</span>
              <p className="font-medium">{app.phone}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Experience:</span>
              <p className="font-medium">{app.experience_years} years</p>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground">Availability:</span>
              <p className="font-medium capitalize">{app.availability.replace('-', ' ')}</p>
            </div>
          </div>

          <div>
            <span className="text-muted-foreground text-sm">Bio:</span>
            <p className="text-sm mt-1">{app.bio}</p>
          </div>

          {app.application_type === 'runner' && app.postcode_coverage && (
            <div>
              <span className="text-muted-foreground text-sm">Coverage Areas:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {app.postcode_coverage.map(code => (
                  <Badge key={code} variant="secondary" className="text-xs">{code}</Badge>
                ))}
              </div>
            </div>
          )}

          {app.application_type === 'tailor' && app.specializations && (
            <div>
              <span className="text-muted-foreground text-sm">Specializations:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {app.specializations.map(spec => (
                  <Badge key={spec} variant="secondary" className="text-xs">{spec}</Badge>
                ))}
              </div>
            </div>
          )}

          {app.status === 'pending' && (
            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => handleApprove(app)}
                disabled={processing}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={() => {
                  setSelectedApp(app)
                  setShowRejectDialog(true)
                }}
                disabled={processing}
                variant="destructive"
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const pendingApps = applications.filter(app => app.status === 'pending')
  const approvedApps = applications.filter(app => app.status === 'approved')
  const rejectedApps = applications.filter(app => app.status === 'rejected')

  return (
    <div className="max-w-7xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Applications</h1>
        <p className="text-muted-foreground">Review and manage runner and tailor applications</p>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingApps.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedApps.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedApps.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {loading ? (
            <p>Loading...</p>
          ) : pendingApps.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No pending applications
              </CardContent>
            </Card>
          ) : (
            pendingApps.map(app => <ApplicationCard key={app.id} app={app} />)
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedApps.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No approved applications
              </CardContent>
            </Card>
          ) : (
            approvedApps.map(app => <ApplicationCard key={app.id} app={app} />)
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedApps.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No rejected applications
              </CardContent>
            </Card>
          ) : (
            rejectedApps.map(app => <ApplicationCard key={app.id} app={app} />)
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this application. The applicant will receive this in an email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejection_reason">Reason for Rejection</Label>
            <Textarea
              id="rejection_reason"
              placeholder="e.g., Insufficient experience, location not covered, etc."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing || !rejectionReason.trim()}
            >
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
