import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, User, MapPin } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const appointments = [
  {
    id: 1,
    patientName: 'Nguyễn Văn A',
    time: '09:00',
    date: '2024-01-15',
    status: 'confirmed',
    type: 'Khám tổng quát',
    notes: 'Đau đầu, chóng mặt'
  },
  {
    id: 2,
    patientName: 'Trần Thị B',
    time: '10:30',
    date: '2024-01-15',
    status: 'pending',
    type: 'Tái khám',
    notes: 'Theo dõi huyết áp'
  },
  {
    id: 3,
    patientName: 'Lê Văn C',
    time: '14:00',
    date: '2024-01-15',
    status: 'completed',
    type: 'Khám chuyên khoa',
    notes: 'Viêm họng'
  }
]

export function DoctorAppointmentsPage() {
  const [selectedTab, setSelectedTab] = useState('today')

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default">Đã xác nhận</Badge>
      case 'pending':
        return <Badge variant="secondary">Chờ xác nhận</Badge>
      case 'completed':
        return <Badge variant="outline">Hoàn thành</Badge>
      default:
        return <Badge variant="destructive">Hủy</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quản lý lịch hẹn</h1>
        <p className="text-muted-foreground">Xem và quản lý các cuộc hẹn của bạn</p>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="today">Hôm nay</TabsTrigger>
          <TabsTrigger value="week">Tuần này</TabsTrigger>
          <TabsTrigger value="month">Tháng này</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          {appointments.map((appointment) => (
            <Card key={appointment.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">{appointment.patientName}</CardTitle>
                      <CardDescription>{appointment.type}</CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(appointment.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{appointment.date}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{appointment.time}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Phòng khám A</span>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-muted-foreground">Ghi chú: {appointment.notes}</p>
                </div>
                <div className="mt-4 flex space-x-2">
                  <Button size="sm" variant="outline">Xem chi tiết</Button>
                  <Button size="sm" variant="outline">Cập nhật trạng thái</Button>
                  <Button size="sm" variant="outline">Gọi điện</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}