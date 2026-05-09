import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calendar, Clock, User, MapPin, Search, Filter, Eye, Edit, Trash2 } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { doctorApi } from '@/services/doctorService'
import { useToast } from '@/hooks/use-toast'

interface Appointment {
  id: string
  patientName: string
  patientId: string
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  type: string
  notes: string
  specialty: string
  createdAt: string
}

export function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState('')
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  // Form states
  const [formData, setFormData] = useState({
    status: 'confirmed' as 'pending' | 'confirmed' | 'completed' | 'cancelled',
    notes: ''
  })

  useEffect(() => {
    fetchAppointments()
  }, [statusFilter, dateFilter, currentPage])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage - 1,
        size: 10
      }

      if (statusFilter !== 'all') params.status = statusFilter
      if (dateFilter) params.date = dateFilter

      const data = await doctorApi.getAppointments(params)
      setAppointments(data.content || data)
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách lịch hẹn',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateAppointment = async () => {
    if (!selectedAppointment) return

    try {
      await doctorApi.updateAppointment(selectedAppointment.id, formData)
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật lịch hẹn'
      })
      setIsEditDialogOpen(false)
      resetForm()
      fetchAppointments()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật lịch hẹn',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      await doctorApi.deleteAppointment(appointmentId)
      toast({
        title: 'Thành công',
        description: 'Đã xóa lịch hẹn'
      })
      fetchAppointments()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa lịch hẹn',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      status: 'confirmed',
      notes: ''
    })
    setSelectedAppointment(null)
  }

  const openEditDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setFormData({
      status: appointment.status,
      notes: appointment.notes
    })
    setIsEditDialogOpen(true)
  }

  const openDetailDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsDetailDialogOpen(true)
  }

  const filteredAppointments = appointments.filter(appointment =>
    appointment.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    appointment.type.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="default">Đã xác nhận</Badge>
      case 'pending':
        return <Badge variant="secondary">Chờ xác nhận</Badge>
      case 'completed':
        return <Badge variant="outline">Hoàn thành</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Đã hủy</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getStatusOptions = () => [
    { value: 'all', label: 'Tất cả' },
    { value: 'pending', label: 'Chờ xác nhận' },
    { value: 'confirmed', label: 'Đã xác nhận' },
    { value: 'completed', label: 'Hoàn thành' },
    { value: 'cancelled', label: 'Đã hủy' }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quản lý lịch hẹn</h1>
        <p className="text-muted-foreground">Xem và quản lý các cuộc hẹn của bạn</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách lịch hẹn</CardTitle>
          <CardDescription>
            Tổng cộng {appointments.length} lịch hẹn
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên bệnh nhân hoặc loại khám..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                {getStatusOptions().map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full sm:w-[180px]"
            />
          </div>

          {loading ? (
            <div className="text-center py-4">Đang tải...</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Không có lịch hẹn nào</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bệnh nhân</TableHead>
                    <TableHead>Ngày giờ</TableHead>
                    <TableHead>Loại khám</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((appointment) => (
                    <TableRow key={appointment.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{appointment.patientName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{appointment.date}</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">{appointment.time}</span>
                        </div>
                      </TableCell>
                      <TableCell>{appointment.type}</TableCell>
                      <TableCell>{getStatusBadge(appointment.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetailDialog(appointment)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(appointment)}
                        >
                          <Edit className="h-4 w-4" />
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

      {/* Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chi tiết lịch hẹn</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về cuộc hẹn
            </DialogDescription>
          </DialogHeader>
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Bệnh nhân</Label>
                  <p className="text-sm">{selectedAppointment.patientName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Loại khám</Label>
                  <p className="text-sm">{selectedAppointment.type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Ngày</Label>
                  <p className="text-sm">{selectedAppointment.date}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Giờ</Label>
                  <p className="text-sm">{selectedAppointment.time}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Chuyên khoa</Label>
                  <p className="text-sm">{selectedAppointment.specialty}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Trạng thái</Label>
                  <div className="mt-1">{getStatusBadge(selectedAppointment.status)}</div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Ghi chú</Label>
                <p className="text-sm mt-1">{selectedAppointment.notes || 'Không có ghi chú'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa lịch hẹn</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin lịch hẹn
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Trạng thái</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({...formData, status: value})}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Chờ xác nhận</SelectItem>
                  <SelectItem value="confirmed">Đã xác nhận</SelectItem>
                  <SelectItem value="completed">Hoàn thành</SelectItem>
                  <SelectItem value="cancelled">Đã hủy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">Ghi chú</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleUpdateAppointment}>Cập nhật</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}