'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { JobsTable } from '@/components/dashboard/jobs-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getJobs, triggerJob, Job } from '@/lib/api'
import { AlertTriangle, Play, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const fetcher = () => getJobs()

export default function JobsPage() {
  const { data: jobs, isLoading, mutate } = useSWR<Job[]>('jobs', fetcher)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [isTriggering, setIsTriggering] = useState(false)

  // Calculate pending discrepancies for notification preview
  const pendingDiscrepancies = 23 // This would come from stats in a real implementation

  const handleTriggerJob = async () => {
    setIsTriggering(true)
    try {
      await triggerJob()
      toast.success('Reconciliation job triggered successfully!')
      setShowConfirmDialog(false)
      // Refresh job list
      mutate()
    } catch (error) {
      toast.error('Failed to trigger job. Please try again.')
      console.error('Trigger job error:', error)
    } finally {
      setIsTriggering(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Jobs</h1>
          <p className="text-muted-foreground mt-1">
            View reconciliation job history and trigger new runs
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => mutate()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setShowConfirmDialog(true)}>
            <Play className="mr-2 h-4 w-4" />
            Trigger Reconciliation
          </Button>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Job Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="text-center">
              <p className="text-3xl font-bold text-lime-glow">{jobs?.length || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Total Jobs</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-tea">
                {jobs?.filter((j) => j.status === 'COMPLETED').length || 0}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-destructive">
                {jobs?.filter((j) => j.status === 'FAILED').length || 0}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Failed</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs Table */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Reconciliation Runs</h2>
        <JobsTable jobs={jobs?.slice(0, 10) || []} isLoading={isLoading} />
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Trigger Reconciliation Job
            </DialogTitle>
            <div className="pt-4 space-y-4 text-sm text-muted-foreground">
              <p>Are you sure you want to trigger a new reconciliation job?</p>

              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm font-medium text-foreground">Notification Preview</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  <span className="font-semibold text-lime-glow">{pendingDiscrepancies}</span> pending
                  discrepancies will be processed and notifications will be sent to affected
                  merchants.
                </p>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleTriggerJob} disabled={isTriggering}>
              {isTriggering ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Trigger Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
