import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Plus, Search, Edit, Trash2, Pill } from 'lucide-react'
import { adminApi } from '@/services/adminService'
import { useToast } from '@/hooks/use-toast'

interface Medicine {
  id: string
  name: string
  dosage: string
  description: string
  quantity: number
  unit: string
  price: number
  status: 'available' | 'out_of_stock' | 'discontinued'
  createdAt: string
}

export function AdminMedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const { toast } = useToast()

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    description: '',
    quantity: 0,
    unit: '',
    price: 0,
    status: 'available' as 'available' | 'out_of_stock' | 'discontinued'
  })

  useEffect(() => {
    fetchMedicines()
  }, [])

  const fetchMedicines = async () => {
    try {
      setLoading(true)
      const data = await adminApi.getMedicines()
      setMedicines(data)
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải danh sách thuốc',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    try {
      await adminApi.createMedicine(formData)
      toast({
        title: 'Thành công',
        description: 'Đã thêm thuốc mới'
      })
      setIsCreateDialogOpen(false)
      resetForm()
      fetchMedicines()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể thêm thuốc',
        variant: 'destructive'
      })
    }
  }

  const handleUpdate = async () => {
    if (!selectedMedicine) return

    try {
      await adminApi.updateMedicine(selectedMedicine.id, formData)
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật thông tin thuốc'
      })
      setIsEditDialogOpen(false)
      resetForm()
      fetchMedicines()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể cập nhật thuốc',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async (medicineId: string) => {
    try {
      await adminApi.deleteMedicine(medicineId)
      toast({
        title: 'Thành công',
        description: 'Đã xóa thuốc'
      })
      fetchMedicines()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể xóa thuốc',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      dosage: '',
      description: '',
      quantity: 0,
      unit: '',
      price: 0,
      status: 'available'
    })
    setSelectedMedicine(null)
  }

  const openEditDialog = (medicine: Medicine) => {
    setSelectedMedicine(medicine)
    setFormData({
      name: medicine.name,
      dosage: medicine.dosage,
      description: medicine.description,
      quantity: medicine.quantity,
      unit: medicine.unit,
      price: medicine.price,
      status: medicine.status
    })
    setIsEditDialogOpen(true)
  }

  const filteredMedicines = medicines.filter(medicine =>
    medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medicine.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="default">Còn hàng</Badge>
      case 'out_of_stock':
        return <Badge variant="destructive">Hết hàng</Badge>
      case 'discontinued':
        return <Badge variant="secondary">Ngừng kinh doanh</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản lý thuốc</h1>
          <p className="text-muted-foreground">Quản lý danh sách thuốc trong hệ thống</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Thêm thuốc
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Thêm thuốc mới</DialogTitle>
              <DialogDescription>
                Nhập thông tin cho thuốc mới
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Tên thuốc</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="dosage" className="text-right">Liều lượng</Label>
                <Input
                  id="dosage"
                  value={formData.dosage}
                  onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                  className="col-span-3"
                  placeholder="500mg, 10ml, ..."
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity" className="text-right">Số lượng</Label>
                <Input
                  id="quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="unit" className="text-right">Đơn vị</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  className="col-span-3"
                  placeholder="viên, chai, hộp, ..."
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">Giá (VND)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Mô tả</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="col-span-3"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" onClick={handleCreate}>Thêm thuốc</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách thuốc</CardTitle>
          <CardDescription>
            Tổng cộng {medicines.length} loại thuốc
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm thuốc..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-4">Đang tải...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên thuốc</TableHead>
                  <TableHead>Liều lượng</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead>Giá</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMedicines.map((medicine) => (
                  <TableRow key={medicine.id}>
                    <TableCell className="font-medium">{medicine.name}</TableCell>
                    <TableCell>{medicine.dosage}</TableCell>
                    <TableCell>{medicine.quantity} {medicine.unit}</TableCell>
                    <TableCell>{medicine.price.toLocaleString('vi-VN')} VND</TableCell>
                    <TableCell>{getStatusBadge(medicine.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(medicine)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                            <AlertDialogDescription>
                              Bạn có chắc chắn muốn xóa thuốc {medicine.name}?
                              Hành động này không thể hoàn tác.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Hủy</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(medicine.id)}>
                              Xóa
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thuốc</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin thuốc
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">Tên thuốc</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-dosage" className="text-right">Liều lượng</Label>
              <Input
                id="edit-dosage"
                value={formData.dosage}
                onChange={(e) => setFormData({...formData, dosage: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-quantity" className="text-right">Số lượng</Label>
              <Input
                id="edit-quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-unit" className="text-right">Đơn vị</Label>
              <Input
                id="edit-unit"
                value={formData.unit}
                onChange={(e) => setFormData({...formData, unit: e.target.value})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-price" className="text-right">Giá (VND)</Label>
              <Input
                id="edit-price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: parseInt(e.target.value) || 0})}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">Mô tả</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="col-span-3"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-status" className="text-right">Trạng thái</Label>
              <select
                id="edit-status"
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="available">Còn hàng</option>
                <option value="out_of_stock">Hết hàng</option>
                <option value="discontinued">Ngừng kinh doanh</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleUpdate}>Cập nhật</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
