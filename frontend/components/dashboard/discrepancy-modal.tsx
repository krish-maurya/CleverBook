'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from './status-badge'
import { formatCurrency, formatDate } from '@/lib/format'
import { Settlement } from '@/lib/api'
import { Package, CreditCard } from 'lucide-react'

interface DiscrepancyModalProps {
  settlement: Settlement | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DiscrepancyModal({ settlement, open, onOpenChange }: DiscrepancyModalProps) {
  if (!settlement) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <DialogTitle className="text-xl">Settlement Details</DialogTitle>
            <StatusBadge status={settlement.status} />
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* AWB Info */}
          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
            <div>
              <p className="text-sm text-muted-foreground">AWB Number</p>
              <p className="text-lg font-bold text-lime-glow">{settlement.awb}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Courier</p>
              <p className="text-lg font-semibold">{settlement.courier}</p>
            </div>
          </div>

          {/* Order vs Settlement Comparison */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Package className="h-5 w-5 text-lime-glow" />
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DetailRow label="Merchant ID" value={settlement.merchantId} />
                <DetailRow
                  label="COD Amount"
                  value={formatCurrency(settlement.codAmount)}
                  highlight
                />
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="h-5 w-5 text-green-tea" />
                  Settlement Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <DetailRow label="Batch ID" value={settlement.batchId} />
                <DetailRow
                  label="Settled COD Amount"
                  value={formatCurrency(settlement.settledCodAmount)}
                  highlight
                />
                <DetailRow label="Charged Weight" value={`${settlement.chargedWeight} kg`} />
                <DetailRow
                  label="Forward Charge"
                  value={formatCurrency(settlement.forwardCharge)}
                />
                <DetailRow
                  label="RTO Charge"
                  value={formatCurrency(settlement.rtoCharge)}
                />
                <DetailRow
                  label="COD Handling Fee"
                  value={formatCurrency(settlement.codHandlingFee)}
                />
                <DetailRow
                  label="Settlement Date"
                  value={formatDate(settlement.settlementDate)}
                />
                {settlement.discrepancyType && (
                  <DetailRow label="Discrepancy Type" value={settlement.discrepancyType} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function DetailRow({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={highlight ? 'font-semibold text-foreground' : 'text-sm text-foreground'}>
        {value}
      </span>
    </div>
  )
}
