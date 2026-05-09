import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ScheduleDialog } from '@/components/schedule/schedule-dialog'
import { ScheduleList } from '@/components/schedule/schedule-list'
import { scheduleApi, doctorApi } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { Plus, RefreshCw } from 'lucide-react'
import type { DoctorSchedule, Doctor } from '@/types'

export function AdminSchedulePage() {
  const { toast } = useToast()

  const [schedules, setSchedules] = useState<DoctorSchedule[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<DoctorSchedule | undefined>()
  const [filter, setFilter] = useState({ date: '', doctorId: '' })

  // Load doctors for form
  useEffect(() => {
    loadDoctors()
  }, [])

  // Load schedules
  useEffect(() => {
    loadSchedules()
  }, [filter])

  const loadDoctors = async () => {
    try {
      const data = await doctorApi.getAll()
      setDoctors(data)
    } catch (error) {
      console.error('Lỗi tải danh sách bác sĩ:', error)
    }
  }

  const loadSchedules = async () => {
    try {
      setIsLoading(true)
      const data = await scheduleApi.getAll({
        doctorId: filter.doctorId || undefined,
        date: filter.date || undefined,
      })

      // Sort by date and start time
      const sorted = data.sort((a, b) => {
        const dateComp = a.date.localeCompare(b.date)
        if (dateComp !== 0) return dateComp
        return a.startTime.localeCompare(b.startTime)
      })

      setSchedules(sorted)
    } catch (error) {
      console.error('Lỗi tải lịch khám:', error)
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách lịch khám',
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
        // Update
        await scheduleApi.update(selectedSchedule.id, data)
        toast({
          title: 'Thành công',
          description: 'Lịch khám đã được cập nhật',
        })
      } else {
        // Create
        await scheduleApi.create(data)
        toast({
          title: 'Thành công',
          description: 'Lịch khám đã được thêm',
        })
      }
      setDialogOpen(false)
      loadSchedules()
    } catch (error) {
      console.error('Lỗi lưu lịch khám:', error)
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể lưu lịch khám',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await scheduleApi.delete(id)
      toast({
        title: 'Thành công',
        description: 'Lịch khám đã được xóa',
      })
      loadSchedules()
    } catch (error) {
      console.error('Lỗi xóa lịch khám:', error)
      toast({
        title: 'Lỗi',
        description: error instanceof Error ? error.message : 'Không thể xóa lịch khám',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản Lý Lịch Khám</h1>
          <p className="text-gray-600 mt-1">Thêm, chỉnh sửa và xóa lịch khám của bác sĩ</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Thêm Lịch Khám
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Bác Sĩ</label>
          <select
            value={filter.doctorId}
            onChange={(e) => setFilter({ ...filter, doctorId: e.target.value })}
            className="w-full px-3 py-2 border rounded-md text-sm"
          >
            <option value="">Tất cả bác sĩ</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Ngày</label>
          <input
            type="date"
            value={filter.date}
            onChange={(e) => setFilter({ ...filter, date: e.target.value })}
            className="w-full px-3 py-2 border rounded-md text-sm"
          />
        </div>

        <div className="flex items-end">
          <Button variant="outline" size="sm" onClick={loadSchedules} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Làm Mới
          </Button>
        </div>
      </div>

      {/* Schedule List */}
      <ScheduleList schedules={schedules} isLoading={isLoading} onEdit={handleEdit} onDelete={handleDelete} />

      {/* Dialog */}
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
