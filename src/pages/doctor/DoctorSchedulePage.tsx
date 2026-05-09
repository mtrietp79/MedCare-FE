import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, Plus, Edit, Trash2, MapPin } from 'lucide-react'
import { doctorApi } from '@/services/doctorService'
import { useToast } from '@/hooks/use-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const scheduleSchema = z.object({
  date: z.string().min(1, 'Vui lòng chọn ngày'),
  startTime: z.string().min(1, 'Vui lòng chọn giờ bắt đầu'),
  endTime: z.string().min(1, 'Vui lòng chọn giờ kết thúc'),
  type: z.enum(['regular', 'emergency', 'consultation'], {
    required_error: 'Vui lòng chọn loại lịch'
  }),
  location: z.string().min(1, 'Vui lòng nhập địa điểm'),
  notes: z.string().optional()
})

type ScheduleFormData = z.infer<typeof scheduleSchema>

interface Schedule {
  id: string
  date: string
  startTime: string
  endTime: string
  type: 'regular' | 'emergency' | 'consultation'
  location: string
  notes: string
  status: 'active' | 'cancelled'
  createdAt: string
}

export function DoctorSchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema)
  })

  useEffect(() => {
    fetchSchedules()
  }, [currentPage])

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage - 1,
        size: 10
      }

      const data = await doctorApi.getSchedules(params)
      setSchedules((data as any).content || data)
      setTotalPages((data as any).totalPages || 1)
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách lịch làm việc',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: ScheduleFormData) => {
    try {
      if (selectedSchedule) {
        await (doctorApi as any).updateSchedule(selectedSchedule.id, data)
        toast({
          title: 'Thành công',
          description: 'Đã cập nhật lịch làm việc'
        })
      } else {
        await doctorApi.createSchedule(data)
        toast({
          title: 'Thành công',
          description: 'Đã tạo lịch làm việc mới'
        })
      }
      setIsCreateDialogOpen(false)
      setIsEditDialogOpen(false)
      resetForm()
      fetchSchedules()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: selectedSchedule ? 'Không thể cập nhật lịch làm việc' : 'Không thể tạo lịch làm việc',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    reset({
      date: '',
      startTime: '',
      endTime: '',
      type: 'regular',
      location: '',
      notes: ''
    })
    setSelectedSchedule(null)
  }

  const openEditDialog = (schedule: Schedule) => {
    setSelectedSchedule(schedule)
    setValue('date', schedule.date)
    setValue('startTime', schedule.startTime)
    setValue('endTime', schedule.endTime)
    setValue('type', schedule.type)
    setValue('location', schedule.location)
    setValue('notes', schedule.notes)
    setIsEditDialogOpen(true)
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await doctorApi.deleteSchedule(scheduleId)
      toast({
        title: 'Thành công',
        description: 'Đã xóa lịch làm việc'
      })
      fetchSchedules()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa lịch làm việc',
        variant: 'destructive'
      })
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'regular':
        return <Badge variant="default">Lịch thường</Badge>
      case 'emergency':
        return <Badge variant="destructive">Cấp cứu</Badge>
      case 'consultation':
        return <Badge variant="secondary">Tư vấn</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default">Hoạt động</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Đã hủy</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeOptions = () => [
    { value: 'regular', label: 'Lịch thường' },
    { value: 'emergency', label: 'Cấp cứu' },
    { value: 'consultation', label: 'Tư vấn' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý lịch làm việc</h1>
          <p className="text-muted-foreground">Xem và quản lý lịch làm việc của bạn</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo lịch mới
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Tạo lịch làm việc mới</DialogTitle>
              <DialogDescription>
                Thêm lịch làm việc mới vào hệ thống
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Ngày</Label>
                  <Input
                    id="date"
                    type="date"
                    {...register('date')}
                  />
                  {errors.date && (
                    <p className="text-sm text-red-500">{errors.date.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Giờ bắt đầu</Label>
                  <Input
                    id="startTime"
                    type="time"
                    {...register('startTime')}
                  />
                  {errors.startTime && (
                    <p className="text-sm text-red-500">{errors.startTime.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">Giờ kết thúc</Label>
                  <Input
                    id="endTime"
                    type="time"
                    {...register('endTime')}
                  />
                  {errors.endTime && (
                    <p className="text-sm text-red-500">{errors.endTime.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Loại lịch</Label>
                <Select onValueChange={(value: any) => setValue('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn loại lịch" />
                  </SelectTrigger>
                  <SelectContent>
                    {getTypeOptions().map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-red-500">{errors.type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Địa điểm</Label>
                <Input
                  id="location"
                  {...register('location')}
                  placeholder="Ví dụ: Phòng khám A, Tầng 2"
                />
                {errors.location && (
                  <p className="text-sm text-red-500">{errors.location.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Ghi chú</Label>
                <Input
                  id="notes"
                  {...register('notes')}
                  placeholder="Ghi chú bổ sung (tùy chọn)"
                />
              </div>

              <DialogFooter>
                <Button type="submit">Tạo lịch</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách lịch làm việc</CardTitle>
          <CardDescription>
            Tổng cộng {schedules.length} lịch làm việc
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Đang tải...</div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Không có lịch làm việc nào</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ngày</TableHead>
                    <TableHead>Thời gian</TableHead>
                    <TableHead>Loại lịch</TableHead>
                    <TableHead>Địa điểm</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(schedule.date).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>{schedule.startTime} - {schedule.endTime}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(schedule.type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-xs">{schedule.location}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(schedule)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteSchedule(schedule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Trang {currentPage} của {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa lịch làm việc</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin lịch làm việc
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editDate">Ngày</Label>
                <Input
                  id="editDate"
                  type="date"
                  {...register('date')}
                />
                {errors.date && (
                  <p className="text-sm text-red-500">{errors.date.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editStartTime">Giờ bắt đầu</Label>
                <Input
                  id="editStartTime"
                  type="time"
                  {...register('startTime')}
                />
                {errors.startTime && (
                  <p className="text-sm text-red-500">{errors.startTime.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEndTime">Giờ kết thúc</Label>
                <Input
                  id="editEndTime"
                  type="time"
                  {...register('endTime')}
                />
                {errors.endTime && (
                  <p className="text-sm text-red-500">{errors.endTime.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editType">Loại lịch</Label>
              <Select
                value={selectedSchedule?.type}
                onValueChange={(value: any) => setValue('type', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getTypeOptions().map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && (
                <p className="text-sm text-red-500">{errors.type.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="editLocation">Địa điểm</Label>
              <Input
                id="editLocation"
                {...register('location')}
              />
              {errors.location && (
                <p className="text-sm text-red-500">{errors.location.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="editNotes">Ghi chú</Label>
              <Input
                id="editNotes"
                {...register('notes')}
              />
            </div>

            <DialogFooter>
              <Button type="submit">Cập nhật</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
