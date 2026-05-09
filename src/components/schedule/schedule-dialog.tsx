import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScheduleForm } from './schedule-form'
import type { DoctorSchedule, Doctor } from '@/types'

interface ScheduleDialogProps {
  open: boolean
  schedule?: DoctorSchedule
  doctors?: Doctor[]
  isLoading?: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: Omit<DoctorSchedule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
}

export function ScheduleDialog({
  open,
  schedule,
  doctors = [],
  isLoading = false,
  onOpenChange,
  onSubmit,
}: ScheduleDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{schedule ? 'Chỉnh Sửa Lịch Khám' : 'Thêm Lịch Khám'}</DialogTitle>
        </DialogHeader>
        <ScheduleForm
          schedule={schedule}
          doctors={doctors}
          isLoading={isLoading}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
