import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { ScheduleDialog } from '@/components/schedule/schedule-dialog'
import { ScheduleList } from '@/components/schedule/schedule-list'
import { scheduleApi, doctorApi } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import { Plus, RefreshCw } from 'lucide-react'
import type { DoctorSchedule, Doctor } from '@/types'

export function DoctorSchedulePage() {
  const { toast } = useToast()
  const { user } = useAuth()

  const [schedules, setSchedules] = useState<DoctorSchedule[]>([])
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedSchedule, setSelectedSchedule] = useState<DoctorSchedule | undefined>()
  const [filter, setFilter] = useState({ date: '' })

  // Load doctor info and schedules
  useEffect(() => {
    if (user?.username) {
      loadDoctor()
    }
  }, [user?.username])

  // Load schedules when doctor is loaded
  useEffect(() => {
    if (doctor) {
      loadSchedules()
    }
  }, [doctor, filter])

  const loadDoctor = async () => {
    try {
      // Get current doctor from context or API
      // For now, we'll assume the doctor info is available in the auth context or we fetch it
      const doctors = await doctorApi.getAll()
      // In real scenario, match doctor with authenticated user
      // For now, just set the first doctor as example
      if (doctors.length > 0) {
        setDoctor(doctors[0])
      }
    } catch (error) {
      console.error('Lỗi tải thông tin bác sĩ:', error)
    }
  }

  const loadSchedules = async () => {
    if (!doctor) return

    try {
      setIsLoading(true)
      const data = await scheduleApi.getByDoctorId(doctor.id, {
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

  if (!doctor) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Đang tải thông tin...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Lịch Khám Của Tôi</h1>
          <p className="text-gray-600 mt-1">Quản lý lịch làm việc của bạn</p>
        </div>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="w-4 h-4" />
          Thêm Lịch Khám
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex gap-4">
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
        doctors={doctor ? [doctor] : []}
        isLoading={isLoading}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
