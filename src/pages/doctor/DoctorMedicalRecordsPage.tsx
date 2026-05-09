import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Eye, Edit, FileText, Calendar, User, Stethoscope } from 'lucide-react'
import { doctorApi } from '@/services/doctorService'
import { useToast } from '@/hooks/use-toast'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const medicalRecordSchema = z.object({
  patientId: z.string().min(1, 'Vui lòng chọn bệnh nhân'),
  diagnosis: z.string().min(1, 'Vui lòng nhập chẩn đoán'),
  symptoms: z.string().min(1, 'Vui lòng nhập triệu chứng'),
  treatment: z.string().min(1, 'Vui lòng nhập phương pháp điều trị'),
  notes: z.string().optional(),
  prescription: z.string().optional()
})

type MedicalRecordFormData = z.infer<typeof medicalRecordSchema>

interface MedicalRecord {
  id: string
  patientId: string
  patientName: string
  diagnosis: string
  symptoms: string
  treatment: string
  notes: string
  prescription: string
  createdAt: string
  updatedAt: string
}

interface Patient {
  id: string
  fullName: string
  phone: string
  dateOfBirth: string
}

export function DoctorMedicalRecordsPage() {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
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
  } = useForm<MedicalRecordFormData>({
    resolver: zodResolver(medicalRecordSchema)
  })

  useEffect(() => {
    fetchMedicalRecords()
    fetchPatients()
  }, [currentPage])

  const fetchMedicalRecords = async () => {
    try {
      setLoading(true)
      const params: any = {
        page: currentPage - 1,
        size: 10
      }

      const data = await doctorApi.getMedicalRecords(params)
      setRecords(data.content || data)
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách bệnh án',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPatients = async () => {
    try {
      const data = await doctorApi.getPatients({ size: 100 })
      setPatients(data.content || data)
    } catch (error) {
      console.error('Failed to fetch patients:', error)
    }
  }

  const onSubmit = async (data: MedicalRecordFormData) => {
    try {
      if (selectedRecord) {
        await doctorApi.updateMedicalRecord(selectedRecord.id, data)
        toast({
          title: 'Thành công',
          description: 'Đã cập nhật bệnh án'
        })
      } else {
        await doctorApi.createMedicalRecord(data)
        toast({
          title: 'Thành công',
          description: 'Đã tạo bệnh án mới'
        })
      }
      setIsCreateDialogOpen(false)
      setIsEditDialogOpen(false)
      resetForm()
      fetchMedicalRecords()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: selectedRecord ? 'Không thể cập nhật bệnh án' : 'Không thể tạo bệnh án',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    reset({
      patientId: '',
      diagnosis: '',
      symptoms: '',
      treatment: '',
      notes: '',
      prescription: ''
    })
    setSelectedRecord(null)
  }

  const openEditDialog = (record: MedicalRecord) => {
    setSelectedRecord(record)
    setValue('patientId', record.patientId)
    setValue('diagnosis', record.diagnosis)
    setValue('symptoms', record.symptoms)
    setValue('treatment', record.treatment)
    setValue('notes', record.notes)
    setValue('prescription', record.prescription)
    setIsEditDialogOpen(true)
  }

  const openDetailDialog = (record: MedicalRecord) => {
    setSelectedRecord(record)
    setIsDetailDialogOpen(true)
  }

  const handleDeleteRecord = async (recordId: string) => {
    try {
      await doctorApi.deleteMedicalRecord(recordId)
      toast({
        title: 'Thành công',
        description: 'Đã xóa bệnh án'
      })
      fetchMedicalRecords()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa bệnh án',
        variant: 'destructive'
      })
    }
  }

  const filteredRecords = records.filter(record =>
    record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý bệnh án</h1>
          <p className="text-muted-foreground">Xem và quản lý bệnh án của bệnh nhân</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Tạo bệnh án mới
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Tạo bệnh án mới</DialogTitle>
              <DialogDescription>
                Nhập thông tin bệnh án cho bệnh nhân
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="patientId">Bệnh nhân</Label>
                  <Select onValueChange={(value) => setValue('patientId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn bệnh nhân" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients.map(patient => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.fullName} - {patient.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.patientId && (
                    <p className="text-sm text-red-500">{errors.patientId.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="diagnosis">Chẩn đoán</Label>
                <Input
                  id="diagnosis"
                  {...register('diagnosis')}
                  placeholder="Nhập chẩn đoán bệnh"
                />
                {errors.diagnosis && (
                  <p className="text-sm text-red-500">{errors.diagnosis.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="symptoms">Triệu chứng</Label>
                <Textarea
                  id="symptoms"
                  {...register('symptoms')}
                  placeholder="Mô tả triệu chứng của bệnh nhân"
                  rows={3}
                />
                {errors.symptoms && (
                  <p className="text-sm text-red-500">{errors.symptoms.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="treatment">Phương pháp điều trị</Label>
                <Textarea
                  id="treatment"
                  {...register('treatment')}
                  placeholder="Mô tả phương pháp điều trị"
                  rows={3}
                />
                {errors.treatment && (
                  <p className="text-sm text-red-500">{errors.treatment.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="prescription">Đơn thuốc</Label>
                <Textarea
                  id="prescription"
                  {...register('prescription')}
                  placeholder="Chi tiết đơn thuốc (tùy chọn)"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Ghi chú</Label>
                <Textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Ghi chú bổ sung (tùy chọn)"
                  rows={2}
                />
              </div>

              <DialogFooter>
                <Button type="submit">Tạo bệnh án</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách bệnh án</CardTitle>
          <CardDescription>
            Tổng cộng {records.length} bệnh án
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center space-x-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên bệnh nhân hoặc chẩn đoán..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-4">Đang tải...</div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Không có bệnh án nào</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bệnh nhân</TableHead>
                    <TableHead>Chẩn đoán</TableHead>
                    <TableHead>Ngày tạo</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{record.patientName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Stethoscope className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-xs">{record.diagnosis}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{new Date(record.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetailDialog(record)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(record)}
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chi tiết bệnh án</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về bệnh án
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Bệnh nhân</Label>
                  <p className="text-sm">{selectedRecord.patientName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Ngày tạo</Label>
                  <p className="text-sm">{new Date(selectedRecord.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Chẩn đoán</Label>
                <p className="text-sm mt-1">{selectedRecord.diagnosis}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Triệu chứng</Label>
                <p className="text-sm mt-1">{selectedRecord.symptoms}</p>
              </div>

              <div>
                <Label className="text-sm font-medium">Phương pháp điều trị</Label>
                <p className="text-sm mt-1">{selectedRecord.treatment}</p>
              </div>

              {selectedRecord.prescription && (
                <div>
                  <Label className="text-sm font-medium">Đơn thuốc</Label>
                  <p className="text-sm mt-1">{selectedRecord.prescription}</p>
                </div>
              )}

              {selectedRecord.notes && (
                <div>
                  <Label className="text-sm font-medium">Ghi chú</Label>
                  <p className="text-sm mt-1">{selectedRecord.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa bệnh án</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin bệnh án
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editPatientId">Bệnh nhân</Label>
                <Select
                  value={selectedRecord?.patientId}
                  onValueChange={(value) => setValue('patientId', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(patient => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.fullName} - {patient.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.patientId && (
                  <p className="text-sm text-red-500">{errors.patientId.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editDiagnosis">Chẩn đoán</Label>
              <Input
                id="editDiagnosis"
                {...register('diagnosis')}
              />
              {errors.diagnosis && (
                <p className="text-sm text-red-500">{errors.diagnosis.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="editSymptoms">Triệu chứng</Label>
              <Textarea
                id="editSymptoms"
                {...register('symptoms')}
                rows={3}
              />
              {errors.symptoms && (
                <p className="text-sm text-red-500">{errors.symptoms.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="editTreatment">Phương pháp điều trị</Label>
              <Textarea
                id="editTreatment"
                {...register('treatment')}
                rows={3}
              />
              {errors.treatment && (
                <p className="text-sm text-red-500">{errors.treatment.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="editPrescription">Đơn thuốc</Label>
              <Textarea
                id="editPrescription"
                {...register('prescription')}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editNotes">Ghi chú</Label>
              <Textarea
                id="editNotes"
                {...register('notes')}
                rows={2}
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