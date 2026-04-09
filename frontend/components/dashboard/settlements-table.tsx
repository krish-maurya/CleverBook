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
import { Button } from '@/components/ui/button'
import { StatusBadge } from './status-badge'
import { formatCurrency, formatDate } from '@/lib/format'
import { Settlement } from '@/lib/api'
import { Eye, FileSearch } from 'lucide-react'

interface SettlementsTableProps {
  settlements: Settlement[]
  onViewDetails: (settlement: Settlement) => void
  isLoading?: boolean
}

export function SettlementsTable({ settlements, onViewDetails, isLoading }: SettlementsTableProps) {
  if (isLoading) {
    return <SettlementsTableSkeleton />
  }

  if (settlements.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FileSearch className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold text-foreground">No settlements found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Upload a file or change filters to see settlements
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
                <TableHead className="font-semibold">AWB Number</TableHead>
                <TableHead className="font-semibold">Merchant ID</TableHead>
                <TableHead className="font-semibold">Courier</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">COD Amount</TableHead>
                <TableHead className="font-semibold">Discrepancy Type</TableHead>
                <TableHead className="font-semibold">Settlement Date</TableHead>
                <TableHead className="font-semibold text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {settlements.map((settlement) => (
                <TableRow
                  key={`${settlement.batchId}-${settlement.awb}`}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => onViewDetails(settlement)}
                >
                  <TableCell className="font-medium text-primary">{settlement.awb}</TableCell>
                  <TableCell className="text-muted-foreground">{settlement.merchantId}</TableCell>
                  <TableCell>{settlement.courier}</TableCell>
                  <TableCell>
                    <StatusBadge status={settlement.status} />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(settlement.codAmount)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {settlement.discrepancyType || '-'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(settlement.settlementDate)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        onViewDetails(settlement)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
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

function SettlementsTableSkeleton() {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">AWB Number</TableHead>
                <TableHead className="font-semibold">Merchant ID</TableHead>
                <TableHead className="font-semibold">Courier</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-right">COD Amount</TableHead>
                <TableHead className="font-semibold">Discrepancy Type</TableHead>
                <TableHead className="font-semibold">Settlement Date</TableHead>
                <TableHead className="font-semibold text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><div className="h-4 w-24 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell><div className="h-4 w-20 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell><div className="h-4 w-16 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell><div className="h-5 w-20 animate-pulse rounded-full bg-muted" /></TableCell>
                  <TableCell><div className="h-4 w-16 animate-pulse rounded bg-muted ml-auto" /></TableCell>
                  <TableCell><div className="h-4 w-24 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell><div className="h-4 w-24 animate-pulse rounded bg-muted" /></TableCell>
                  <TableCell><div className="h-8 w-8 animate-pulse rounded bg-muted mx-auto" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
