import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock } from 'lucide-react'
import { doctorApi } from '@/services/doctorService'
import { scheduleApi } from '@/services/api'
import type { DoctorSchedule } from '@/types'
import { useToast } from '@/hooks/use-toast'

export function DoctorSchedulePage() {
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    void fetchSchedules()
  }, [])

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      const profile = await doctorApi.getProfile()
      const data = await scheduleApi.getByDoctorId(profile.id)
      setSchedules(data)
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách lịch làm việc',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Lịch làm việc bác sĩ</h1>
        <p className="mt-1 text-muted-foreground">
          Thông tin lịch làm việc chỉ mang tính tham khảo. Bác sĩ mặc định làm việc tất cả khung giờ hệ thống mỗi ngày.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách lịch làm việc tham khảo</CardTitle>
          <CardDescription>
            Không thể thêm, sửa hoặc xóa lịch làm việc tại giao diện này.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Đang tải...</div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Không có lịch làm việc để hiển thị.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Thời gian</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Bệnh nhân</TableHead>
                  <TableHead>Ghi chú</TableHead>
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
                    <TableCell>
                      <Badge variant={schedule.isAvailable ? 'default' : 'secondary'}>
                        {schedule.isAvailable ? 'Khả dụng' : 'Đầy / Không khả dụng'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {schedule.currentPatients ?? 0}/{schedule.maxPatients}
                    </TableCell>
                    <TableCell>{schedule.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

