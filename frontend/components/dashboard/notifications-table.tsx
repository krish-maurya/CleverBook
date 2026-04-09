'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from './status-badge'
import { formatDateTime } from '@/lib/format'
import { Notification } from '@/lib/api'
import { Bell } from 'lucide-react'

interface NotificationsTableProps {
  notifications: Notification[]
  isLoading?: boolean
}

export function NotificationsTable({ notifications, isLoading }: NotificationsTableProps) {
  if (isLoading) {
    return <NotificationsTableSkeleton />
  }

  if (notifications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Bell className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No notifications</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Notifications will appear here when discrepancies are detected
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">AWB</TableHead>
                <TableHead className="font-semibold">Merchant ID</TableHead>
                <TableHead className="font-semibold">Discrepancy Type</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-center">Attempts</TableHead>
                <TableHead className="font-semibold">Last Attempt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {notifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell className="font-medium text-primary">{notification.awb}</TableCell>
                  <TableCell className="text-muted-foreground">{notification.merchantId}</TableCell>
                  <TableCell>{notification.discrepancyType}</TableCell>
                  <TableCell>
                    <StatusBadge status={notification.status} />
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-medium">
                      {notification.attempts}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(notification.lastAttemptTime)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function NotificationsTableSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">AWB</TableHead>
                <TableHead className="font-semibold">Merchant ID</TableHead>
                <TableHead className="font-semibold">Discrepancy Type</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-center">Attempts</TableHead>
                <TableHead className="font-semibold">Last Attempt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 w-24 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell><div className="h-4 w-20 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell><div className="h-4 w-28 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell><div className="h-5 w-16 animate-pulse rounded-full bg-muted" /></TableCell>
                  <TableCell><div className="h-6 w-6 animate-pulse rounded-full bg-muted mx-auto" /></TableCell>
                  <TableCell><div className="h-4 w-28 animate-pulse rounded bg-muted" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
