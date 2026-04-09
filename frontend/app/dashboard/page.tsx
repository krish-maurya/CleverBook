'use client'

import useSWR from 'swr'
import { StatsCard, StatsCardSkeleton } from '@/components/dashboard/stats-card'
import { CourierChart, CourierChartSkeleton } from '@/components/dashboard/courier-chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getStats, Stats } from '@/lib/api'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { Package, AlertTriangle, IndianRupee, Clock, CheckCircle } from 'lucide-react'
const fetcher = () => getStats()

export default function DashboardPage() {
  const { data: stats, isLoading, error } = useSWR<Stats>('stats', fetcher, {
    refreshInterval: 30000,
  })

  if (isLoading) {
    return <DashboardSkeleton />
  }

  if (error || !stats) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Settlement reconciliation overview and alerts</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Unable to load dashboard data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Please check backend connectivity and try again.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Settlement reconciliation overview and alerts
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Settlements"
          value={stats.totalSettlements.toLocaleString()}
          icon={Package}
          iconClassName="bg-lime-glow"
        />
        <StatsCard
          title="Total Discrepancies"
          value={stats.totalDiscrepancies.toLocaleString()}
          icon={AlertTriangle}
          iconClassName="bg-destructive"
        />
        <StatsCard
          title="Discrepancy Value"
          value={formatCurrency(stats.totalDiscrepancyValue)}
          icon={IndianRupee}
          iconClassName="bg-warning"
        />
        <StatsCard
          title="Pending Review"
          value={stats.pendingReview.toLocaleString()}
          icon={Clock}
          iconClassName="bg-emerald-pine"
        />
      </div>

      {/* Charts and Job Status */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CourierChart data={stats.courierWiseDisputes} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Last Reconciliation Job</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.lastJobStatus ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lime-glow/10">
                    <CheckCircle className="h-6 w-6 text-lime-glow" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{stats.lastJobStatus.status}</p>
                    <p className="text-sm text-muted-foreground">Job completed successfully</p>
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-border">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Run Time</span>
                    <span className="text-sm font-medium">
                      {formatDateTime(stats.lastJobStatus.runTime)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Records Processed</span>
                    <span className="text-sm font-medium">
                      {stats.lastJobStatus.recordsProcessed.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-sm text-muted-foreground">No jobs have been run yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <div className="h-9 w-48 animate-pulse rounded bg-muted" />
        <div className="h-5 w-72 animate-pulse rounded bg-muted mt-2" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CourierChartSkeleton />
        </div>
        <Card>
          <CardHeader>
            <div className="h-6 w-48 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="h-32 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
