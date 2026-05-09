import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DollarSign, CreditCard, TrendingUp, Calendar, Eye } from 'lucide-react'
import { adminApi } from '@/services/adminService'
import { useToast } from '@/hooks/use-toast'

interface Invoice {
  id: string
  patientName: string
  medicalRecordId: string
  totalAmount: number
  status: 'pending' | 'paid' | 'cancelled'
  createdAt: string
  paidAt?: string
}

interface FinanceSummary {
  totalRevenue: number
  monthlyRevenue: number
  pendingAmount: number
  paidInvoices: number
  pendingInvoices: number
}

export function AdminFinancePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [summary, setSummary] = useState<FinanceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchFinanceData()
  }, [])

  const fetchFinanceData = async () => {
    try {
      setLoading(true)
      const [invoicesData] = await Promise.all([
        adminApi.getInvoices()
      ])

      setInvoices(invoicesData)

      // Calculate summary from invoices
      const totalRevenue = invoicesData
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.totalAmount, 0)

      const monthlyRevenue = invoicesData
        .filter(inv => {
          const invoiceDate = new Date(inv.createdAt)
          const now = new Date()
          return inv.status === 'paid' &&
                 invoiceDate.getMonth() === now.getMonth() &&
                 invoiceDate.getFullYear() === now.getFullYear()
        })
        .reduce((sum, inv) => sum + inv.totalAmount, 0)

      const pendingAmount = invoicesData
        .filter(inv => inv.status === 'pending')
        .reduce((sum, inv) => sum + inv.totalAmount, 0)

      const paidInvoices = invoicesData.filter(inv => inv.status === 'paid').length
      const pendingInvoices = invoicesData.filter(inv => inv.status === 'pending').length

      setSummary({
        totalRevenue,
        monthlyRevenue,
        pendingAmount,
        paidInvoices,
        pendingInvoices
      })
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể tải dữ liệu tài chính',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePayInvoice = async (invoiceId: string) => {
    try {
      await adminApi.payInvoice(invoiceId)
      toast({
        title: 'Thành công',
        description: 'Đã thanh toán hóa đơn'
      })
      fetchFinanceData()
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: 'Không thể thanh toán hóa đơn',
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge variant="default">Đã thanh toán</Badge>
      case 'pending':
        return <Badge variant="secondary">Chờ thanh toán</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Đã hủy</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('vi-VN') + ' VND'
  }

  const openInvoiceDetail = (invoice: Invoice) => {
    setSelectedInvoice(invoice)
    setIsDetailDialogOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Quản lý tài chính</h1>
        <p className="text-muted-foreground">Theo dõi doanh thu và quản lý hóa đơn</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              Từ tất cả hóa đơn đã thanh toán
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu tháng này</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.monthlyRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Hóa đơn đã thanh toán trong tháng
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chờ thanh toán</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary?.pendingAmount || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {summary?.pendingInvoices || 0} hóa đơn chưa thanh toán
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hóa đơn đã thanh toán</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.paidInvoices || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tổng số hóa đơn đã hoàn tất
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách hóa đơn</CardTitle>
          <CardDescription>
            Quản lý tất cả hóa đơn trong hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Đang tải...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã hóa đơn</TableHead>
                  <TableHead>Bệnh nhân</TableHead>
                  <TableHead>Hồ sơ bệnh án</TableHead>
                  <TableHead>Tổng tiền</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">#{invoice.id.slice(-8)}</TableCell>
                    <TableCell>{invoice.patientName}</TableCell>
                    <TableCell>#{invoice.medicalRecordId.slice(-8)}</TableCell>
                    <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell>{new Date(invoice.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openInvoiceDetail(invoice)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {invoice.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePayInvoice(invoice.id)}
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Invoice Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chi tiết hóa đơn #{selectedInvoice?.id.slice(-8)}</DialogTitle>
            <DialogDescription>
              Thông tin chi tiết về hóa đơn
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Bệnh nhân</Label>
                  <p className="text-sm">{selectedInvoice.patientName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Hồ sơ bệnh án</Label>
                  <p className="text-sm">#{selectedInvoice.medicalRecordId.slice(-8)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Tổng tiền</Label>
                  <p className="text-sm font-semibold">{formatCurrency(selectedInvoice.totalAmount)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Trạng thái</Label>
                  <div className="mt-1">{getStatusBadge(selectedInvoice.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Ngày tạo</Label>
                  <p className="text-sm">{new Date(selectedInvoice.createdAt).toLocaleString('vi-VN')}</p>
                </div>
                {selectedInvoice.paidAt && (
                  <div>
                    <Label className="text-sm font-medium">Ngày thanh toán</Label>
                    <p className="text-sm">{new Date(selectedInvoice.paidAt).toLocaleString('vi-VN')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
