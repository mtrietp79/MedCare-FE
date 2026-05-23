import { useEffect, useMemo, useState } from 'react'
import { Calendar, CreditCard, DollarSign, Eye, TrendingUp } from 'lucide-react'
import { adminApi } from '@/services/adminService'
import { useToast } from '@/hooks/use-toast'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { normalizeInvoice, safeLower, safeNumber, safeString, type NormalizedInvoice } from '@/lib/admin-normalizers'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AdminEmptyState, AdminErrorState, AdminTableSkeleton } from '@/components/admin/AdminPageStates'

interface FinanceSummary {
  totalRevenue: number
  monthlyRevenue: number
  pendingAmount: number
  paidInvoices: number
  pendingInvoices: number
}

interface HttpError extends Error {
  status?: number
  data?: unknown
}

function getErrorStatus(error: unknown): number | undefined {
  const status = (error as HttpError)?.status
  return typeof status === 'number' ? status : undefined
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return 'Khong the tai du lieu tai chinh.'
}

function normalizeSummary(raw: any): FinanceSummary {
  const source = raw && typeof raw === 'object' && raw.data && typeof raw.data === 'object' ? raw.data : raw
  return {
    totalRevenue: safeNumber(source?.totalRevenue ?? source?.revenueTotal, 0),
    monthlyRevenue: safeNumber(source?.monthlyRevenue ?? source?.currentMonthRevenue, 0),
    pendingAmount: safeNumber(source?.pendingAmount ?? source?.pendingTotal, 0),
    paidInvoices: safeNumber(source?.paidInvoices ?? source?.paidCount, 0),
    pendingInvoices: safeNumber(source?.pendingInvoices ?? source?.pendingCount, 0),
  }
}

function shortId(value: string): string {
  const normalized = safeString(value)
  if (!normalized) return '-'
  return `#${normalized.slice(-8)}`
}

export function AdminFinancePage() {
  const { toast } = useToast()

  const [invoices, setInvoices] = useState<NormalizedInvoice[]>([])
  const [summary, setSummary] = useState<FinanceSummary>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingAmount: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<NormalizedInvoice | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 300)
  const [statusFilter, setStatusFilter] = useState<'all' | NormalizedInvoice['status']>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'amount_desc'>('newest')

  const fetchFinanceData = async () => {
    setLoading(true)
    setError('')

    try {
      const [invoiceRaw, summaryRaw] = await Promise.all([
        adminApi.getInvoices(),
        adminApi.getInvoicesSummary(),
      ])

      const normalizedInvoices = (Array.isArray(invoiceRaw) ? invoiceRaw : []).map(normalizeInvoice)
      setInvoices(normalizedInvoices)
      setSummary(normalizeSummary(summaryRaw))
    } catch (fetchError: unknown) {
      const status = getErrorStatus(fetchError)
      const message = getErrorMessage(fetchError)

      if (status === 401) {
        setError('Phien dang nhap da het han. Vui long dang nhap lai.')
      } else if (status === 403) {
        setError('Khong co quyen truy cap du lieu tai chinh.')
      } else if (status === 500) {
        setError('He thong tam thoi bi loi. Vui long thu lai sau.')
      } else {
        setError(message)
      }

      toast({
        title: 'Loi',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchFinanceData()
  }, [])

  const filteredInvoices = useMemo(() => {
    const keyword = safeLower(debouncedSearch)

    const list = invoices.filter((invoice) => {
      const hitSearch = !keyword
        || safeLower(invoice.patientName).includes(keyword)
        || safeLower(invoice.id).includes(keyword)
        || safeLower(invoice.medicalRecordId).includes(keyword)

      const hitStatus = statusFilter === 'all' || invoice.status === statusFilter
      return hitSearch && hitStatus
    })

    list.sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }

      if (sortBy === 'amount_desc') {
        return b.totalAmount - a.totalAmount
      }

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    return list
  }, [invoices, debouncedSearch, statusFilter, sortBy])

  const handlePayInvoice = async (invoiceId: string) => {
    try {
      await adminApi.payInvoice(invoiceId)
      toast({ title: 'Thanh cong', description: 'Da thanh toan hoa don.' })
      await fetchFinanceData()
    } catch (payError: unknown) {
      const status = getErrorStatus(payError)
      const message = getErrorMessage(payError)

      if (status === 403) {
        toast({
          title: 'Khong co quyen',
          description: message,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: 'Loi',
        description: message,
        variant: 'destructive',
      })
    }
  }

  const statusBadge = (status: NormalizedInvoice['status']) => {
    if (status === 'paid') return <Badge variant="default">Da thanh toan</Badge>
    if (status === 'pending') return <Badge variant="secondary">Cho thanh toan</Badge>
    return <Badge variant="destructive">Da huy</Badge>
  }

  const formatCurrency = (amount: number) => `${amount.toLocaleString('vi-VN')} VND`

  const openInvoiceDetail = (invoice: NormalizedInvoice) => {
    setSelectedInvoice(invoice)
    setIsDetailDialogOpen(true)
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Quan ly tai chinh</h1>
        <p className="text-muted-foreground">Theo doi doanh thu va xu ly hoa don</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tong doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="mr-1 inline h-3 w-3" />
              Tu tat ca hoa don da thanh toan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doanh thu thang nay</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.monthlyRevenue)}</div>
            <p className="text-xs text-muted-foreground">Doanh thu tu hoa don da tra trong thang hien tai</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cho thanh toan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.pendingAmount)}</div>
            <p className="text-xs text-muted-foreground">{summary.pendingInvoices} hoa don dang cho</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Da thanh toan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.paidInvoices}</div>
            <p className="text-xs text-muted-foreground">Tong hoa don da thanh toan</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sach hoa don</CardTitle>
          <CardDescription>Thanh toan, theo doi va tra cuu hoa don</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[260px] flex-1">
              <Input placeholder="Tim theo ma hoa don, ho so, ten benh nhan" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={(value: 'all' | NormalizedInvoice['status']) => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tat ca trang thai</SelectItem>
                <SelectItem value="pending">Cho thanh toan</SelectItem>
                <SelectItem value="paid">Da thanh toan</SelectItem>
                <SelectItem value="cancelled">Da huy</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(value: 'newest' | 'oldest' | 'amount_desc') => setSortBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Moi nhat</SelectItem>
                <SelectItem value="oldest">Cu nhat</SelectItem>
                <SelectItem value="amount_desc">So tien giam dan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading && <AdminTableSkeleton rows={8} />}
          {!loading && error && <AdminErrorState message={error} onRetry={() => void fetchFinanceData()} />}
          {!loading && !error && filteredInvoices.length === 0 && <AdminEmptyState title="Khong co hoa don phu hop." />}

          {!loading && !error && filteredInvoices.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ma hoa don</TableHead>
                  <TableHead>Benh nhan</TableHead>
                  <TableHead>Bac si</TableHead>
                  <TableHead>Ho so benh an</TableHead>
                  <TableHead>Tong tien</TableHead>
                  <TableHead>Trang thai</TableHead>
                  <TableHead>Ngay tao</TableHead>
                  <TableHead className="text-right">Hanh dong</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{shortId(invoice.id)}</TableCell>
                    <TableCell>{invoice.patientName || '-'}</TableCell>
                    <TableCell>{invoice.doctorName || '-'}</TableCell>
                    <TableCell>{shortId(invoice.medicalRecordId)}</TableCell>
                    <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                    <TableCell>{statusBadge(invoice.status)}</TableCell>
                    <TableCell>{invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString('vi-VN') : '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openInvoiceDetail(invoice)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {invoice.status === 'pending' && (
                        <Button variant="ghost" size="sm" onClick={() => void handlePayInvoice(invoice.id)}>
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

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Chi tiet hoa don {shortId(selectedInvoice?.id || '')}</DialogTitle>
            <DialogDescription>Thong tin chi tiet hoa don</DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label>Benh nhan</Label>
                <p>{selectedInvoice.patientName || '-'}</p>
              </div>
              <div>
                <Label>Bac si</Label>
                <p>{selectedInvoice.doctorName || '-'}</p>
              </div>
              <div>
                <Label>Ho so benh an</Label>
                <p>{shortId(selectedInvoice.medicalRecordId)}</p>
              </div>
              <div>
                <Label>Tong tien</Label>
                <p className="font-semibold">{formatCurrency(selectedInvoice.totalAmount)}</p>
              </div>
              <div>
                <Label>Trang thai</Label>
                <div className="mt-1">{statusBadge(selectedInvoice.status)}</div>
              </div>
              <div>
                <Label>Ngay tao</Label>
                <p>{selectedInvoice.createdAt ? new Date(selectedInvoice.createdAt).toLocaleString('vi-VN') : '-'}</p>
              </div>
              <div>
                <Label>Ngay thanh toan</Label>
                <p>{selectedInvoice.paidAt ? new Date(selectedInvoice.paidAt).toLocaleString('vi-VN') : '-'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
