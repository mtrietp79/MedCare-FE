import { useEffect, useState } from 'react'
import { Plus, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScheduleDialog } from '@/components/schedule/schedule-dialog'
import { ScheduleList } from '@/components/schedule/schedule-list'
import { scheduleApi, doctorApi } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import type { DoctorSchedule, Doctor } from '@/types'
import { AdminErrorState } from '@/components/admin/AdminPageStates'

export function AdminSchedulePage() {
  const { toast } = useToast()

  const [schedules, setSchedules] = useState<DoctorSchedule[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<DoctorSchedule | undefined>()
  const [filter, setFilter] = useState({ date: '', doctorId: '' })

  useEffect(() => {
    void loadDoctors()
  }, [])

  useEffect(() => {
    void loadSchedules()
  }, [filter])

  const loadDoctors = async () => {
    try {
      const data = await doctorApi.getAll()
      setDoctors(data)
      setError('')
    } catch (loadError) {
      console.error('loadDoctors error', loadError)
      setError('Không thể tải danh sách bác sĩ.')
    }
  }

  const loadSchedules = async () => {
    try {
      setIsLoading(true)
      setError('')
      const data = await scheduleApi.getAll({
        doctorId: filter.doctorId || undefined,
        date: filter.date || undefined,
      })

      const sorted = [...data].sort((a, b) => {
        const dateComp = a.date.localeCompare(b.date)
        if (dateComp !== 0) return dateComp
        return a.startTime.localeCompare(b.startTime)
      })

      setSchedules(sorted)
    } catch (loadError) {
      console.error('loadSchedules error', loadError)
      const message = loadError instanceof Error ? loadError.message : 'Không thể tải danh sách lịch khám.'
      setError(message)
      toast({
        title: 'Lỗi',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAdd = () => {
    setSelectedSchedule(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (schedule: DoctorSchedule) => {
    setSelectedSchedule(schedule)
    setDialogOpen(true)
  }

  const handleSubmit = async (data: Omit<DoctorSchedule, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (selectedSchedule) {
        await scheduleApi.update(selectedSchedule.id, data)
        toast({ title: 'Thành công', description: 'Lịch khám đã được cập nhật.' })
      } else {
        await scheduleApi.create(data)
        toast({ title: 'Thành công', description: 'Lịch khám đã được thêm.' })
      }

      setDialogOpen(false)
      await loadSchedules()
    } catch (submitError) {
      console.error('handleSubmit error', submitError)
      toast({
        title: 'Lỗi',
        description: submitError instanceof Error ? submitError.message : 'Không thể lưu lịch khám.',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await scheduleApi.delete(id)
      toast({ title: 'Thành công', description: 'Lịch khám đã được xóa.' })
      await loadSchedules()
    } catch (deleteError) {
      console.error('handleDelete error', deleteError)
      toast({
        title: 'Lỗi',
        description: deleteError instanceof Error ? deleteError.message : 'Không thể xóa lịch khám.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý lịch khám</h1>
          <p className="mt-1 text-muted-foreground">Thêm, sửa và xóa lịch khám của bác sĩ</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Thêm lịch khám
        </Button>
      </div>

      <div className="rounded-lg border bg-white p-4 flex flex-wrap gap-4">
        <div className="min-w-[220px] flex-1">
          <label className="mb-1 block text-sm font-medium">Bác sĩ</label>
          <select
            value={filter.doctorId}
            onChange={(e) => setFilter((prev) => ({ ...prev, doctorId: e.target.value }))}
            className="w-full rounded-md border px-3 py-2 text-sm"
          >
            <option value="">Tất cả bác sĩ</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.fullName || doctor.name || doctor.id}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[220px] flex-1">
          <label className="mb-1 block text-sm font-medium">Ngày</label>
          <input
            type="date"
            value={filter.date}
            onChange={(e) => setFilter((prev) => ({ ...prev, date: e.target.value }))}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
        </div>

        <div className="flex items-end">
          <Button variant="outline" size="sm" onClick={() => void loadSchedules()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Làm mới
          </Button>
        </div>
      </div>

      {error && <AdminErrorState message={error} onRetry={() => void loadSchedules()} />}

      <ScheduleList schedules={schedules} isLoading={isLoading} onEdit={handleEdit} onDelete={handleDelete} />

      <ScheduleDialog
        open={dialogOpen}
        schedule={selectedSchedule}
        doctors={doctors}
        isLoading={isLoading}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
