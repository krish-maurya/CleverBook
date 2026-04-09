import { cn } from '@/lib/utils'

type StatusType =
  | 'MATCHED'
  | 'DISCREPANCY'
  | 'PENDING_REVIEW'
  | 'PENDING'
  | 'SENT'
  | 'FAILED'
  | 'RETRIED'
  | 'DEAD_LETTER'
  | 'COMPLETED'
  | 'RUNNING'

interface StatusBadgeProps {
  status: StatusType
  className?: string
}

const statusStyles: Record<StatusType, string> = {
  MATCHED: 'bg-lime-glow/10 text-lime-glow border-lime-glow/20',
  DISCREPANCY: 'bg-destructive/10 text-destructive border-destructive/20',
  PENDING_REVIEW: 'bg-warning/10 text-warning-foreground border-warning/20',
  PENDING: 'bg-warning/10 text-warning-foreground border-warning/20',
  SENT: 'bg-lime-glow/10 text-lime-glow border-lime-glow/20',
  FAILED: 'bg-destructive/10 text-destructive border-destructive/20',
  RETRIED: 'bg-warning/10 text-warning-foreground border-warning/20',
  DEAD_LETTER: 'bg-destructive/10 text-destructive border-destructive/20',
  COMPLETED: 'bg-lime-glow/10 text-lime-glow border-lime-glow/20',
  RUNNING: 'bg-emerald-pine/30 text-green-tea border-emerald-pine/30',
}

const statusLabels: Record<StatusType, string> = {
  MATCHED: 'Matched',
  DISCREPANCY: 'Discrepancy',
  PENDING_REVIEW: 'Pending Review',
  PENDING: 'Pending',
  SENT: 'Sent',
  FAILED: 'Failed',
  RETRIED: 'Retried',
  DEAD_LETTER: 'Dead Letter',
  COMPLETED: 'Completed',
  RUNNING: 'Running',
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        statusStyles[status],
        className
      )}
    >
      {statusLabels[status]}
    </span>
  )
}
