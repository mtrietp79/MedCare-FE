import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Clock, Users, Trash2, Edit2, AlertCircle } from 'lucide-react'
import type { DoctorSchedule } from '@/types'
import { formatDateDisplay, normalizeTimeLabel } from '@/lib/date-display'

interface ScheduleListProps {
  schedules: DoctorSchedule[]
  isLoading?: boolean
  onEdit?: (schedule: DoctorSchedule) => void
  onDelete?: (id: string) => Promise<void>
}

export function ScheduleList({ schedules, isLoading = false, onEdit, onDelete }: ScheduleListProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteId || !onDelete) return

    try {
      setIsDeleting(true)
      await onDelete(deleteId)
      setDeleteId(null)
    } finally {
      setIsDeleting(false)
    }
  }

  const formatTime = (time: string) => normalizeTimeLabel(time) || time.slice(0, 5)

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </Card>
        ))}
      </div>
    )
  }

  if (schedules.length === 0) {
    return (
      <Card className="p-12 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-500 text-lg">Không có lịch khám nào</p>
        <p className="text-gray-400 text-sm mt-1">Hãy thêm lịch khám để bắt đầu</p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {schedules.map((schedule) => (
        <Card key={schedule.id} className="p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-lg">
                  {schedule.doctor?.name || 'Chưa xác định'}
                </h3>
                <Badge variant={schedule.isAvailable ? 'default' : 'secondary'}>
                  {schedule.isAvailable ? 'Có Sẵn' : 'Không Có Sẵn'}
                </Badge>
              </div>

              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    {formatDateDisplay(schedule.date)} ({formatTime(schedule.startTime)} - {formatTime(schedule.endTime)})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>
                    {schedule.currentPatients || 0}/{schedule.maxPatients} bệnh nhân
                  </span>
                </div>
                {schedule.notes && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                    <span className="font-medium">Ghi chú:</span> {schedule.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 ml-4">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(schedule)}
                  disabled={isDeleting}
                  title="Chỉnh sửa"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteId(schedule.id)}
                  disabled={isDeleting}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  title="Xóa"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa Lịch Khám</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa lịch khám này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? 'Đang Xóa...' : 'Xóa'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
