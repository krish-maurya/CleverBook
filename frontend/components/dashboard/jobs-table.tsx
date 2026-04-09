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
import { Job } from '@/lib/api'
import { Clock } from 'lucide-react'

interface JobsTableProps {
  jobs: Job[]
  isLoading?: boolean
}

export function JobsTable({ jobs, isLoading }: JobsTableProps) {
  if (isLoading) {
    return <JobsTableSkeleton />
  }

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Clock className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No jobs found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Trigger a reconciliation job to get started
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
                <TableHead className="font-semibold">Job ID</TableHead>
                <TableHead className="font-semibold">Run Time</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Records Processed</TableHead>
                <TableHead className="font-semibold text-right">Discrepancies Found</TableHead>
                <TableHead className="font-semibold">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium text-primary font-mono text-sm">
                    {job.id}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDateTime(job.runTime)}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={job.status} />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {job.recordsProcessed.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    <span className={job.discrepanciesFound > 0 ? 'text-destructive' : 'text-success'}>
                      {job.discrepanciesFound.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{job.duration}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function JobsTableSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Job ID</TableHead>
                <TableHead className="font-semibold">Run Time</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">Records Processed</TableHead>
                <TableHead className="font-semibold text-right">Discrepancies Found</TableHead>
                <TableHead className="font-semibold">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 w-32 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell><div className="h-4 w-28 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell><div className="h-5 w-20 animate-pulse rounded-full bg-muted" /></TableCell>
                  <TableCell><div className="h-4 w-16 animate-pulse rounded bg-muted ml-auto" /></TableCell>
                  <TableCell><div className="h-4 w-12 animate-pulse rounded bg-muted ml-auto" /></TableCell>
                  <TableCell><div className="h-4 w-16 animate-pulse rounded bg-muted" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
