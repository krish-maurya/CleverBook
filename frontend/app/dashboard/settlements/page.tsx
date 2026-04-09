'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { UploadForm } from '@/components/dashboard/upload-form'
import { SettlementsTable } from '@/components/dashboard/settlements-table'
import { DiscrepancyModal } from '@/components/dashboard/discrepancy-modal'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getSettlements, Settlement } from '@/lib/api'
import { exportToCSV, formatCurrency, formatDate } from '@/lib/format'
import { Download } from 'lucide-react'

const filterTabs = [
  { value: '', label: 'ALL' },
  { value: 'MATCHED', label: 'MATCHED' },
  { value: 'DISCREPANCY', label: 'DISCREPANCY' },
  { value: 'PENDING_REVIEW', label: 'PENDING REVIEW' },
] as const

const fetcher = (status: string) => getSettlements(status)

export default function SettlementsPage() {
  const [activeFilter, setActiveFilter] = useState('')
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const { data: settlements, isLoading, mutate } = useSWR<Settlement[]>(
    ['settlements', activeFilter],
    () => fetcher(activeFilter)
  )

  const handleViewDetails = (settlement: Settlement) => {
    setSelectedSettlement(settlement)
    setModalOpen(true)
  }

  const handleExport = () => {
    if (!settlements || settlements.length === 0) return

    const exportData = settlements.map((s) => ({
      'AWB Number': s.awb,
      'Merchant ID': s.merchantId,
      Courier: s.courier,
      Status: s.status,
      'COD Amount': formatCurrency(s.codAmount),
      'Discrepancy Type': s.discrepancyType || '-',
      'Settlement Date': formatDate(s.settlementDate),
    }))

    exportToCSV(exportData, `settlements-${activeFilter || 'all'}-${Date.now()}`)
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settlements</h1>
          <p className="text-muted-foreground mt-1">
            Upload, view, and manage settlement reconciliations
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" disabled={!settlements?.length}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <UploadForm onUploadSuccess={() => mutate()} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {filterTabs.map((tab) => (
              <Button
                key={tab.value}
                variant="ghost"
                size="sm"
                onClick={() => setActiveFilter(tab.value)}
                className={cn(
                  'rounded-full px-4',
                  activeFilter === tab.value
                    ? 'bg-lime-glow text-background hover:bg-lime-glow/90'
                    : 'hover:bg-muted'
                )}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          {/* Settlements Table */}
          <SettlementsTable
            settlements={settlements || []}
            onViewDetails={handleViewDetails}
            isLoading={isLoading}
          />
        </div>
      </div>

      <DiscrepancyModal
        settlement={selectedSettlement}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  )
}
