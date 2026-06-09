import { useCallback, useEffect, useState } from 'react'
import {
  Copy,
  Eye,
  KeyRound,
  Lock,
  RefreshCw,
  Search,
  Unlock,
} from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import {
  adminPatientService,
  type AdminPatientDetail,
  type AdminPatientListItem,
  type AdminPatientSort,
  type AdminPatientStats,
  type AdminPatientStatusFilter,
} from '@/services/adminPatientService'
import { PatientAvatar } from '@/components/patient/patient-ui'
import { AdminEmptyState, AdminErrorState, AdminTableSkeleton } from '@/components/admin/AdminPageStates'
import { formatDateTimeDisplay } from '@/lib/date-display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

const ITEMS_PER_PAGE = 10
const DEFAULT_TEMP_PASSWORD = 'Bn@123'

function formatCurrency(value?: number | null) {
  if (value === null || value === undefined) return '-'
  return `${new Intl.NumberFormat('vi-VN').format(value)} VND`
}

function AccountStatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400">
      Hoạt động
    </Badge>
  ) : (
    <Badge className="border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-900/40 dark:text-slate-300">
      Đã khóa
    </Badge>
  )
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="text-sm text-foreground">{value || '-'}</div>
    </div>
  )
}

export function AdminPatientsPage() {
  const { toast } = useToast()

  const [patients, setPatients] = useState<AdminPatientListItem[]>([])
  const [stats, setStats] = useState<AdminPatientStats>({
    total: 0,
    active: 0,
    locked: 0,
    newThisMonth: 0,
  })
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const debouncedSearch = useDebouncedValue(searchInput, 300)
  const [statusFilter, setStatusFilter] = useState<AdminPatientStatusFilter>('all')
  const [sortOrder, setSortOrder] = useState<AdminPatientSort>('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [actionLoadingKey, setActionLoadingKey] = useState('')

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [selectedPatient, setSelectedPatient] = useState<AdminPatientDetail | null>(null)

  const [resetOpen, setResetOpen] = useState(false)
  const [resetTarget, setResetTarget] = useState<AdminPatientListItem | null>(null)
  const [temporaryPassword, setTemporaryPassword] = useState(DEFAULT_TEMP_PASSWORD)
  const [resetResultOpen, setResetResultOpen] = useState(false)
  const [resetResultPassword, setResetResultPassword] = useState('')

  const [lockTarget, setLockTarget] = useState<AdminPatientListItem | null>(null)
  const [unlockTarget, setUnlockTarget] = useState<AdminPatientListItem | null>(null)

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const data = await adminPatientService.getStats()
      setStats(data)
    } catch (fetchError: unknown) {
      toast({
        title: 'Lỗi',
        description: adminPatientService.getErrorMessage(fetchError, 'Không thể tải thống kê bệnh nhân.'),
        variant: 'destructive',
      })
    } finally {
      setStatsLoading(false)
    }
  }, [toast])

  const loadPatients = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const { items, total } = await adminPatientService.getPatients({
        keyword: debouncedSearch,
        status: statusFilter,
        sort: sortOrder,
        page: currentPage - 1,
        size: ITEMS_PER_PAGE,
      })
      setPatients(items)
      setTotalItems(total)
    } catch (fetchError: unknown) {
      adminPatientService.logLoadError(fetchError)
      const message = adminPatientService.getErrorMessage(
        fetchError,
        'Không thể tải danh sách bệnh nhân.',
      )
      setError(message)

      toast({
        title: 'Lỗi',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [currentPage, debouncedSearch, sortOrder, statusFilter, toast])

  const reloadAll = useCallback(async () => {
    await Promise.all([loadStats(), loadPatients()])
  }, [loadPatients, loadStats])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  useEffect(() => {
    void loadPatients()
  }, [loadPatients])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedSearch, statusFilter, sortOrder])

  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages))
  }, [totalPages])

  const openDetail = async (patient: AdminPatientListItem) => {
    try {
      setDetailLoading(true)
      setDetailOpen(true)
      setSelectedPatient(null)
      const detail = await adminPatientService.getPatientById(patient.id)
      setSelectedPatient(detail)
    } catch (fetchError: unknown) {
      setDetailOpen(false)
      toast({
        title: 'Lỗi',
        description: adminPatientService.getErrorMessage(fetchError, 'Không thể tải chi tiết bệnh nhân.'),
        variant: 'destructive',
      })
    } finally {
      setDetailLoading(false)
    }
  }

  const updatePatientInList = (updated: AdminPatientListItem) => {
    setPatients((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)))
    if (selectedPatient?.id === updated.id) {
      setSelectedPatient((prev) => (prev ? { ...prev, ...updated } : prev))
    }
  }

  const handleLock = async (patient: AdminPatientListItem) => {
    try {
      setActionLoadingKey(`lock-${patient.id}`)
      const updated = await adminPatientService.lockPatient(patient.id)
      console.info(`[AdminPatients] Lock patient success:`, {
        patientId: patient.id,
        patientName: patient.fullName,
        updatedIsActive: updated.isActive,
      })
      updatePatientInList(updated)
      await loadStats()
      toast({ title: 'Thành công', description: 'Khóa tài khoản bệnh nhân thành công' })
    } catch (actionError: unknown) {
      console.error('[AdminPatients] Lock patient failed:', {
        status: (actionError as { response?: { status: number } }).response?.status,
        patientId: patient.id,
        error: actionError,
      })
      toast({
        title: 'Lỗi',
        description: adminPatientService.getErrorMessage(actionError, 'Không thể khóa tài khoản bệnh nhân.'),
        variant: 'destructive',
      })
    } finally {
      setActionLoadingKey('')
      setLockTarget(null)
    }
  }

  const handleUnlock = async (patient: AdminPatientListItem) => {
    try {
      setActionLoadingKey(`unlock-${patient.id}`)
      const updated = await adminPatientService.unlockPatient(patient.id)
      console.info(`[AdminPatients] Unlock patient success:`, {
        patientId: patient.id,
        patientName: patient.fullName,
        updatedIsActive: updated.isActive,
      })
      updatePatientInList(updated)
      await loadStats()
      toast({ title: 'Thành công', description: 'Mở khóa tài khoản bệnh nhân thành công' })
    } catch (actionError: unknown) {
      console.error('[AdminPatients] Unlock patient failed:', {
        status: (actionError as { response?: { status: number } }).response?.status,
        patientId: patient.id,
        error: actionError,
      })
      toast({
        title: 'Lỗi',
        description: adminPatientService.getErrorMessage(actionError, 'Không thể mở khóa tài khoản bệnh nhân.'),
        variant: 'destructive',
      })
    } finally {
      setActionLoadingKey('')
      setUnlockTarget(null)
    }
  }

  const openResetDialog = (patient: AdminPatientListItem) => {
    setResetTarget(patient)
    setTemporaryPassword(DEFAULT_TEMP_PASSWORD)
    setResetOpen(true)
  }

  const handleResetPassword = async () => {
    if (!resetTarget) return

    try {
      setActionLoadingKey(`reset-${resetTarget.id}`)
      const response = await adminPatientService.resetPassword(resetTarget.id, {
        temporaryPassword: temporaryPassword.trim() || undefined,
      })

      setResetOpen(false)
      setResetResultPassword(response.temporaryPassword || temporaryPassword.trim() || DEFAULT_TEMP_PASSWORD)
      setResetResultOpen(true)

      toast({
        title: 'Thành công',
        description: 'Reset mật khẩu thành công',
      })
    } catch (actionError: unknown) {
      toast({
        title: 'Lỗi',
        description: adminPatientService.getErrorMessage(actionError, 'Không thể reset mật khẩu bệnh nhân.'),
        variant: 'destructive',
      })
    } finally {
      setActionLoadingKey('')
    }
  }

  const copyTemporaryPassword = async () => {
    try {
      await navigator.clipboard.writeText(resetResultPassword)
      toast({ title: 'Đã copy', description: 'Mật khẩu tạm đã được sao chép.' })
    } catch {
      toast({
        title: 'Lỗi',
        description: 'Không thể sao chép mật khẩu. Vui lòng copy thủ công.',
        variant: 'destructive',
      })
    }
  }

  const statCards = [
    { label: 'Tổng bệnh nhân', value: stats.total, className: 'border-primary/20 bg-primary/5' },
    { label: 'Đang hoạt động', value: stats.active, className: 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20' },
    { label: 'Đã khóa', value: stats.locked, className: 'border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-slate-900/30' },
    { label: 'Bệnh nhân mới tháng này', value: stats.newThisMonth, className: 'border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/20' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Quản lý bệnh nhân</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Theo dõi và quản lý tài khoản bệnh nhân trong hệ thống
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label} className={card.className}>
            <CardHeader className="pb-2">
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-3xl">{statsLoading ? '...' : card.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách bệnh nhân</CardTitle>
          <CardDescription>Tìm kiếm, lọc và quản lý tài khoản bệnh nhân</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_160px_160px_auto]">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Tìm theo tên, email, số điện thoại..."
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value: AdminPatientStatusFilter) => setStatusFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="locked">Đã khóa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(value: AdminPatientSort) => setSortOrder(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="oldest">Cũ nhất</SelectItem>
                <SelectItem value="name-asc">Tên A-Z</SelectItem>
                <SelectItem value="name-desc">Tên Z-A</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => void reloadAll()} disabled={loading || statsLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Tải lại
            </Button>
          </div>

          {loading ? (
            <AdminTableSkeleton rows={8} />
          ) : error ? (
            <AdminErrorState message={error} onRetry={() => void reloadAll()} />
          ) : patients.length === 0 ? (
            <AdminEmptyState title="Chưa có bệnh nhân nào" />
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border">
                <Table className="min-w-[1100px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[180px]">Bệnh nhân</TableHead>
                      <TableHead className="min-w-[190px]">Email</TableHead>
                      <TableHead className="min-w-[140px]">Số điện thoại</TableHead>
                      <TableHead className="min-w-[90px] text-left">Giới tính</TableHead>
                      <TableHead className="min-w-[110px] text-left">Ngày sinh</TableHead>
                      <TableHead className="min-w-[110px] text-left">Số lịch hẹn</TableHead>
                      <TableHead className="min-w-[110px] text-left">Số bệnh án</TableHead>
                      <TableHead className="min-w-[110px] text-left">Trạng thái</TableHead>
                      <TableHead className="min-w-[150px] text-left">Ngày tạo</TableHead>
                      <TableHead className="text-right sticky right-0 bg-background/90 dark:bg-slate-950/95 z-20">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="min-w-[180px]">
                          <div className="flex items-center gap-3">
                            <PatientAvatar name={patient.fullName} size="md" />
                            <span className="font-medium">{patient.fullName || '-'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[190px] truncate" title={patient.email || '-'}>{patient.email || '-'}</TableCell>
                        <TableCell className="max-w-[140px] truncate" title={patient.phone || '-'}>{patient.phone || '-'}</TableCell>
                        <TableCell className="whitespace-nowrap">{patient.genderLabel}</TableCell>
                        <TableCell className="whitespace-nowrap">{patient.dateOfBirth}</TableCell>
                        <TableCell className="whitespace-nowrap">{patient.appointmentCount}</TableCell>
                        <TableCell className="whitespace-nowrap">{patient.medicalRecordCount}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          <AccountStatusBadge isActive={patient.isActive} />
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{formatDateTimeDisplay(patient.createdAt)}</TableCell>
                        <TableCell className="sticky right-0 bg-background/90 dark:bg-slate-950/95 z-10">
                          <div className="flex items-center justify-end gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 rounded-md p-0"
                                  onClick={() => void openDetail(patient)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent sideOffset={4}>Xem chi tiết</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 rounded-md p-0"
                                  onClick={() => openResetDialog(patient)}
                                >
                                  <KeyRound className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent sideOffset={4}>Reset mật khẩu</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 rounded-md p-0"
                                  onClick={() => (patient.isActive ? setLockTarget(patient) : setUnlockTarget(patient))}
                                >
                                  {patient.isActive ? (
                                    <Lock className="h-4 w-4 text-amber-700" />
                                  ) : (
                                    <Unlock className="h-4 w-4 text-emerald-700" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent sideOffset={4}>{patient.isActive ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <p>
                  Hiển thị {patients.length} / {totalItems} bệnh nhân
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  >
                    Trước
                  </Button>
                  <span>
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Chi tiết bệnh nhân</DialogTitle>
            <DialogDescription>Thông tin tài khoản và lịch sử khám gần đây (chỉ xem)</DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <AdminTableSkeleton rows={4} />
          ) : selectedPatient ? (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 rounded-xl border bg-muted/20 p-4 sm:flex-row sm:items-center">
                <PatientAvatar name={selectedPatient.fullName} size="xl" />
                <div>
                  <h3 className="text-xl font-semibold">{selectedPatient.fullName}</h3>
                  <p className="text-sm text-muted-foreground">{selectedPatient.email}</p>
                  <div className="mt-2">
                    <AccountStatusBadge isActive={selectedPatient.isActive} />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <DetailField label="Số điện thoại" value={selectedPatient.phone} />
                <DetailField label="Giới tính" value={selectedPatient.genderLabel} />
                <DetailField label="Ngày sinh" value={selectedPatient.dateOfBirth} />
                <DetailField label="Địa chỉ" value={selectedPatient.address} />
                <DetailField label="Ngày tạo tài khoản" value={formatDateTimeDisplay(selectedPatient.createdAt)} />
              </div>

              <div>
                <h4 className="mb-3 font-semibold">Thống kê</h4>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Card className="shadow-none">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Tổng lịch hẹn</p>
                      <p className="text-2xl font-semibold">{selectedPatient.stats.totalAppointments}</p>
                    </CardContent>
                  </Card>
                  <Card className="shadow-none">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Lịch đã khám</p>
                      <p className="text-2xl font-semibold">{selectedPatient.stats.completedAppointments}</p>
                    </CardContent>
                  </Card>
                  <Card className="shadow-none">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Lịch đã hủy</p>
                      <p className="text-2xl font-semibold">{selectedPatient.stats.cancelledAppointments}</p>
                    </CardContent>
                  </Card>
                  <Card className="shadow-none">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Số bệnh án</p>
                      <p className="text-2xl font-semibold">{selectedPatient.stats.medicalRecordCount}</p>
                    </CardContent>
                  </Card>
                  <Card className="shadow-none">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground">Số hóa đơn</p>
                      <p className="text-2xl font-semibold">{selectedPatient.stats.invoiceCount}</p>
                    </CardContent>
                  </Card>
                  {selectedPatient.stats.totalPaidAmount !== null ? (
                    <Card className="shadow-none">
                      <CardContent className="p-4">
                        <p className="text-xs text-muted-foreground">Tổng tiền đã thanh toán</p>
                        <p className="text-lg font-semibold text-primary">
                          {formatCurrency(selectedPatient.stats.totalPaidAmount)}
                        </p>
                      </CardContent>
                    </Card>
                  ) : null}
                </div>
              </div>

              <div>
                <h4 className="mb-3 font-semibold">Lịch hẹn gần đây</h4>
                {selectedPatient.recentAppointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có lịch hẹn.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã lịch</TableHead>
                          <TableHead>Bác sĩ</TableHead>
                          <TableHead>Ngày giờ</TableHead>
                          <TableHead>Loại khám</TableHead>
                          <TableHead>Trạng thái</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedPatient.recentAppointments.map((item) => (
                          <TableRow key={item.id || item.appointmentCode}>
                            <TableCell>{item.appointmentCode}</TableCell>
                            <TableCell>{item.doctorName || '-'}</TableCell>
                            <TableCell>{item.appointmentDateTime}</TableCell>
                            <TableCell>{item.appointmentTypeLabel}</TableCell>
                            <TableCell>{item.statusLabel}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <div>
                <h4 className="mb-3 font-semibold">Bệnh án gần đây</h4>
                {selectedPatient.recentMedicalRecords.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Chưa có bệnh án.</p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mã bệnh án</TableHead>
                          <TableHead>Bác sĩ</TableHead>
                          <TableHead>Chẩn đoán</TableHead>
                          <TableHead>Ngày khám</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedPatient.recentMedicalRecords.map((item) => (
                          <TableRow key={item.id || item.recordCode}>
                            <TableCell>{item.recordCode}</TableCell>
                            <TableCell>{item.doctorName || '-'}</TableCell>
                            <TableCell>{item.diagnosis}</TableCell>
                            <TableCell>{item.appointmentDate}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset mật khẩu bệnh nhân</DialogTitle>
            <DialogDescription>
              {resetTarget ? `Reset mật khẩu cho ${resetTarget.fullName}` : 'Nhập mật khẩu tạm cho bệnh nhân'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="temporaryPassword">Mật khẩu tạm</Label>
              <Input
                id="temporaryPassword"
                value={temporaryPassword}
                onChange={(event) => setTemporaryPassword(event.target.value)}
                placeholder={DEFAULT_TEMP_PASSWORD}
              />
              <p className="text-xs text-muted-foreground">
                Để trống để Backend tự tạo mật khẩu. Gợi ý: {DEFAULT_TEMP_PASSWORD}
              </p>
            </div>
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
              Bệnh nhân sẽ phải đổi mật khẩu sau khi đăng nhập.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={() => void handleResetPassword()}
              disabled={!resetTarget || actionLoadingKey === `reset-${resetTarget.id}`}
            >
              {resetTarget && actionLoadingKey === `reset-${resetTarget.id}` ? 'Đang reset...' : 'Xác nhận reset'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={resetResultOpen} onOpenChange={setResetResultOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset mật khẩu thành công</DialogTitle>
            <DialogDescription>
              Mật khẩu tạm chỉ hiển thị một lần. Hãy sao chép và gửi cho bệnh nhân.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">Mật khẩu tạm</p>
            <p className="mt-1 font-mono text-lg font-semibold">{resetResultPassword}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => void copyTemporaryPassword()} className="gap-2">
              <Copy className="h-4 w-4" />
              Copy mật khẩu
            </Button>
            <Button onClick={() => setResetResultOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(lockTarget)} onOpenChange={(open) => !open && setLockTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Khóa tài khoản bệnh nhân</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Bạn có chắc muốn khóa tài khoản bệnh nhân <strong>{lockTarget?.fullName}</strong> không?</p>
              <p>Tài khoản này sẽ không thể đăng nhập cho đến khi được mở khóa.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={lockTarget ? actionLoadingKey === `lock-${lockTarget.id}` : false}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => lockTarget && void handleLock(lockTarget)}
              disabled={lockTarget ? actionLoadingKey === `lock-${lockTarget.id}` : false}
            >
              {lockTarget && actionLoadingKey === `lock-${lockTarget.id}` ? 'Đang khóa...' : 'Khóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={Boolean(unlockTarget)} onOpenChange={(open) => !open && setUnlockTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mở khóa tài khoản bệnh nhân</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Bạn có chắc muốn mở khóa tài khoản bệnh nhân <strong>{unlockTarget?.fullName}</strong> không?</p>
              <p>Bệnh nhân sẽ có thể đăng nhập lại sau khi mở khóa.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unlockTarget ? actionLoadingKey === `unlock-${unlockTarget.id}` : false}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => unlockTarget && void handleUnlock(unlockTarget)}
              disabled={unlockTarget ? actionLoadingKey === `unlock-${unlockTarget.id}` : false}
            >
              {unlockTarget && actionLoadingKey === `unlock-${unlockTarget.id}` ? 'Đang mở khóa...' : 'Mở khóa'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
