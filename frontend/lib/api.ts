import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5252/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

type ApiResponse<T> = {
  success: boolean
  data: T
  message: string
}

type SettlementStatus = 'MATCHED' | 'DISCREPANCY' | 'PENDING_REVIEW'
type JobStatus = 'COMPLETED' | 'RUNNING' | 'FAILED'
type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED' | 'RETRIED' | 'DEAD_LETTER'

export interface Settlement {
  awb: string
  merchantId: string
  courier: string
  status: SettlementStatus
  codAmount: number
  settledCodAmount: number
  chargedWeight: number
  forwardCharge: number
  rtoCharge: number
  codHandlingFee: number
  batchId: string
  discrepancyType: string | null
  settlementDate: string
}

export interface Job {
  id: string
  runTime: string
  status: JobStatus
  recordsProcessed: number
  discrepanciesFound: number
  duration: string
}

export interface Notification {
  id: string
  awb: string
  merchantId: string
  discrepancyType: string
  status: NotificationStatus
  attempts: number
  lastAttemptTime: string
}

export interface Stats {
  totalSettlements: number
  totalDiscrepancies: number
  totalDiscrepancyValue: number
  pendingReview: number
  courierWiseDisputes: {
    courier: string
    disputes: number
  }[]
  lastJobStatus?: {
    status: string
    runTime: string
    recordsProcessed: number
  }
}

interface BackendSettlement {
  awbNumber: string
  settledCodAmount: number
  chargedWeight: number
  forwardCharge: number
  rtoCharge: number
  codHandlingFee: number
  settlementDate: string | null
  batchId: string
  status: SettlementStatus
  discrepancyType?: string[]
  order?: BackendOrder | null
}

interface BackendOrder {
  awbNumber: string
  merchantId: string
  courierPartner: string
  codAmount: number
}

interface BackendJob {
  _id: string
  runAt: string
  status: JobStatus
  totalProcessed: number
  discrepanciesFound: number
  duration: number | null
}

interface BackendNotification {
  _id: string
  awbNumber: string
  merchantId: string
  discrepancyType: string
  status: NotificationStatus
  attempts: number
  lastAttemptAt: string | null
  createdAt: string
}

function titleCase(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ')
}

function formatDurationMs(durationMs: number | null): string {
  if (!durationMs || durationMs <= 0) return '-'
  const totalSeconds = Math.floor(durationMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds}s`
}

function mapCourierName(courier: string | undefined): string {
  if (!courier) return '-'
  return courier
    .split(/[_\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function mapSettlement(settlement: BackendSettlement, order?: BackendOrder): Settlement {
  return {
    awb: settlement.awbNumber,
    merchantId: order?.merchantId || '-',
    courier: mapCourierName(order?.courierPartner),
    status: settlement.status,
    codAmount: order?.codAmount ?? settlement.settledCodAmount,
    settledCodAmount: settlement.settledCodAmount,
    chargedWeight: settlement.chargedWeight,
    forwardCharge: settlement.forwardCharge,
    rtoCharge: settlement.rtoCharge,
    codHandlingFee: settlement.codHandlingFee,
    batchId: settlement.batchId,
    discrepancyType: settlement.discrepancyType?.[0] ? titleCase(settlement.discrepancyType[0]) : null,
    settlementDate: settlement.settlementDate || new Date().toISOString(),
  }
}

export const uploadSettlements = async (formData: FormData) => {
  try {
    const response = await api.post<
      ApiResponse<{ batchId: string; processed: number; skipped: number; errors: string[]; total: number }>
    >('/settlements/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })

    return response.data.data
  } catch (error: any) {
    const message = error?.response?.data?.message || 'Failed to upload settlements'
    const details = error?.response?.data?.data
    const enrichedError = new Error(message) as Error & {
      details?: { batchId?: string; processed?: number; skipped?: number; errors?: string[]; total?: number }
    }
    enrichedError.details = details
    throw enrichedError
  }
}

export const getSettlements = async (status?: string) => {
  const response = await api.get<ApiResponse<{ settlements: BackendSettlement[] }>>('/settlements', {
    params: status ? { status } : {},
  })

  return response.data.data.settlements.map((settlement) => mapSettlement(settlement, settlement.order ?? undefined))
}

export const getSettlementDetail = async (awb: string) => {
  const response = await api.get<ApiResponse<{ settlement: BackendSettlement; order: BackendOrder | null }>>(
    `/settlements/${awb}`
  )

  return mapSettlement(response.data.data.settlement, response.data.data.order ?? undefined)
}

export const getJobs = async () => {
  const response = await api.get<ApiResponse<{ jobs: BackendJob[] }>>('/jobs')
  return response.data.data.jobs.map((job) => ({
    id: job._id,
    runTime: job.runAt,
    status: job.status,
    recordsProcessed: job.totalProcessed,
    discrepanciesFound: job.discrepanciesFound,
    duration: formatDurationMs(job.duration),
  }))
}

export const triggerJob = async () => {
  const response = await api.post<ApiResponse<{ message: string; startedAt: string }>>('/jobs/trigger')
  return response.data.data
}

export const getNotifications = async (status?: NotificationStatus) => {
  const response = await api.get<ApiResponse<{ notifications: BackendNotification[] }>>('/notifications', {
    params: status ? { status } : {},
  })

  return response.data.data.notifications.map((notification) => ({
    id: notification._id,
    awb: notification.awbNumber,
    merchantId: notification.merchantId,
    discrepancyType: titleCase(notification.discrepancyType),
    status: notification.status,
    attempts: notification.attempts,
    lastAttemptTime: notification.lastAttemptAt || notification.createdAt,
  }))
}

export const getStats = async () => {
  const response = await api.get<
    ApiResponse<{
      summary: {
        totalSettlements: number
        discrepancies: number
        totalDiscrepancyValueINR: number
        pendingReview: number
      }
      courierBreakdown: Record<string, { discrepancyCount: number }>
      recentJobs: { status: string; runAt: string; totalProcessed: number }[]
    }>
  >('/stats')

  const data = response.data.data

  return {
    totalSettlements: data.summary.totalSettlements,
    totalDiscrepancies: data.summary.discrepancies,
    totalDiscrepancyValue: data.summary.totalDiscrepancyValueINR,
    pendingReview: data.summary.pendingReview,
    courierWiseDisputes: Object.entries(data.courierBreakdown).map(([courier, stats]) => ({
      courier: mapCourierName(courier),
      disputes: stats.discrepancyCount,
    })),
    lastJobStatus: data.recentJobs[0]
      ? {
        status: data.recentJobs[0].status,
        runTime: data.recentJobs[0].runAt,
        recordsProcessed: data.recentJobs[0].totalProcessed,
      }
      : undefined,
  } satisfies Stats
}

export default api
