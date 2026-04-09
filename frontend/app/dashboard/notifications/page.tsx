'use client'

import useSWR from 'swr'
import { NotificationsTable } from '@/components/dashboard/notifications-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getNotifications, Notification } from '@/lib/api'
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'

const fetcher = () => getNotifications()

export default function NotificationsPage() {
  const { data: notifications, isLoading } = useSWR<Notification[]>(
    'notifications',
    fetcher,
    {
      refreshInterval: 30000, // Auto-refresh every 30 seconds
    }
  )

  // Calculate stats
  const sentCount = notifications?.filter((n) => n.status === 'SENT').length || 0
  const failedCount = notifications?.filter((n) => n.status === 'FAILED').length || 0
  const retriedCount = notifications?.filter((n) => n.status === 'RETRIED').length || 0

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Track discrepancy alerts sent to merchants
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Auto-refreshing every 30s
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <CheckCircle className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{sentCount}</p>
              <p className="text-sm text-muted-foreground">Sent Successfully</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
              <RefreshCw className="h-6 w-6 text-warning-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{retriedCount}</p>
              <p className="text-sm text-muted-foreground">Retried</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{failedCount}</p>
              <p className="text-sm text-muted-foreground">Failed</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications Table */}
      <div>
        <h2 className="text-lg font-semibold mb-4">All Notifications</h2>
        <NotificationsTable notifications={notifications || []} isLoading={isLoading} />
      </div>
    </div>
  )
}
