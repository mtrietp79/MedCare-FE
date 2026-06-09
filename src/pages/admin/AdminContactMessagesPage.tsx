import { useCallback, useEffect, useState } from 'react'
import {
  Eye,
  Mail,
  MessageSquareReply,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import {
  contactMessageService,
  type ContactMessage,
  type ContactMessageSort,
  type ContactMessageStats,
  type ContactMessageStatusFilter,
} from '@/services/contactMessageService'
import {
  CONTACT_MESSAGE_STATUS_LABEL,
  getContactMessageStatusClass,
  getContactMessageStatusLabel,
  type ContactMessageStatus,
} from '@/lib/contact-message-status'
import { formatDateTimeDisplay } from '@/lib/date-display'
import { AdminEmptyState, AdminErrorState, AdminTableSkeleton } from '@/components/admin/AdminPageStates'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

const ITEMS_PER_PAGE = 10

function truncateText(value: string, maxLength = 80) {
  const text = String(value || '').trim()
  if (text.length <= maxLength) return text || '-'
  return `${text.slice(0, maxLength)}...`
}

function StatusBadge({ message }: { message: ContactMessage }) {
  return (
    <Badge
      variant="outline"
      className={getContactMessageStatusClass(message.status)}
    >
      {getContactMessageStatusLabel(message.status, message.statusDisplay)}
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

export function AdminContactMessagesPage() {
  const { toast } = useToast()

  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [stats, setStats] = useState<ContactMessageStats>({
    total: 0,
    new: 0,
    inProgress: 0,
    replied: 0,
    closed: 0,
  })
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebouncedValue(keyword, 300)
  const [statusFilter, setStatusFilter] = useState<ContactMessageStatusFilter>('all')
  const [sortOrder, setSortOrder] = useState<ContactMessageSort>('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [actionLoadingKey, setActionLoadingKey] = useState('')

  const [detailOpen, setDetailOpen] = useState(false)
  const [replyOpen, setReplyOpen] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null)
  const [adminReply, setAdminReply] = useState('')
  const [adminNote, setAdminNote] = useState('')

  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true)
      const data = await contactMessageService.getAdminStats()
      setStats(data)
    } catch (fetchError: unknown) {
      toast({
        title: 'Lỗi',
        description: contactMessageService.getErrorMessage(fetchError, 'Không thể tải thống kê tin nhắn.'),
        variant: 'destructive',
      })
    } finally {
      setStatsLoading(false)
    }
  }, [toast])

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const { items, total } = await contactMessageService.getAdminMessages({
        keyword: debouncedKeyword,
        status: statusFilter,
        sort: sortOrder,
        page: currentPage - 1,
        size: ITEMS_PER_PAGE,
      })
      setMessages(items)
      setTotalItems(total)
    } catch (fetchError: unknown) {
      contactMessageService.logLoadError(fetchError)
      const message = contactMessageService.getErrorMessage(
        fetchError,
        'Không thể tải danh sách tin nhắn liên hệ.',
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
  }, [currentPage, debouncedKeyword, sortOrder, statusFilter, toast])

  const reloadAll = useCallback(async () => {
    await Promise.all([loadStats(), loadMessages()])
  }, [loadMessages, loadStats])

  useEffect(() => {
    void loadStats()
  }, [loadStats])

  useEffect(() => {
    void loadMessages()
  }, [loadMessages])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedKeyword, statusFilter, sortOrder])

  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE))

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages))
  }, [totalPages])

  const openDetail = (message: ContactMessage) => {
    setSelectedMessage(message)
    setDetailOpen(true)
  }

  const openReply = (message: ContactMessage) => {
    setSelectedMessage(message)
    setAdminReply(message.adminReply || '')
    setAdminNote(message.adminNote || '')
    setReplyOpen(true)
  }

  const handleStatusChange = async (message: ContactMessage, status: ContactMessageStatus) => {
    if (message.status === status) return

    try {
      setActionLoadingKey(`status-${message.id}`)
      const updated = await contactMessageService.updateStatus(message.id, { status })
      setMessages((prev) => prev.map((item) => (item.id === message.id ? updated : item)))
      if (selectedMessage?.id === message.id) setSelectedMessage(updated)
      await loadStats()
      toast({
        title: 'Thành công',
        description: 'Cập nhật trạng thái tin nhắn thành công.',
      })
    } catch (actionError: unknown) {
      toast({
        title: 'Lỗi',
        description: contactMessageService.getErrorMessage(actionError, 'Không thể cập nhật trạng thái.'),
        variant: 'destructive',
      })
    } finally {
      setActionLoadingKey('')
    }
  }

  const handleReply = async () => {
    if (!selectedMessage) return
    if (!adminReply.trim()) {
      toast({
        title: 'Thiếu thông tin',
        description: 'Vui lòng nhập nội dung phản hồi.',
        variant: 'destructive',
      })
      return
    }

    try {
      setActionLoadingKey(`reply-${selectedMessage.id}`)
      const updated = await contactMessageService.replyToMessage(selectedMessage.id, {
        adminReply,
        adminNote,
      })
      setMessages((prev) => prev.map((item) => (item.id === selectedMessage.id ? updated : item)))
      setSelectedMessage(updated)
      setReplyOpen(false)
      await Promise.all([loadStats(), loadMessages()])
      toast({
        title: 'Thành công',
        description: 'Phản hồi tin nhắn thành công',
      })
    } catch (actionError: unknown) {
      toast({
        title: 'Lỗi',
        description: contactMessageService.getErrorMessage(actionError, 'Không thể gửi phản hồi.'),
        variant: 'destructive',
      })
    } finally {
      setActionLoadingKey('')
    }
  }

  const handleDelete = async (message: ContactMessage) => {
    try {
      setActionLoadingKey(`delete-${message.id}`)
      await contactMessageService.remove(message.id)
      setMessages((prev) => prev.filter((item) => item.id !== message.id))
      if (selectedMessage?.id === message.id) {
        setSelectedMessage(null)
        setDetailOpen(false)
        setReplyOpen(false)
      }
      await loadStats()
      toast({
        title: 'Thành công',
        description: 'Xóa tin nhắn thành công',
      })
    } catch (actionError: unknown) {
      toast({
        title: 'Lỗi',
        description: contactMessageService.getErrorMessage(actionError, 'Không thể xóa tin nhắn.'),
        variant: 'destructive',
      })
    } finally {
      setActionLoadingKey('')
    }
  }

  const statCards = [
    { label: 'Tổng tin nhắn', value: stats.total, className: 'border-primary/20 bg-primary/5' },
    { label: 'Mới', value: stats.new, className: 'border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/20' },
    { label: 'Đang xử lý', value: stats.inProgress, className: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20' },
    { label: 'Đã phản hồi', value: stats.replied, className: 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20' },
    { label: 'Đã đóng', value: stats.closed, className: 'border-slate-300 bg-slate-100 dark:border-slate-600 dark:bg-slate-900/30' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Tin nhắn liên hệ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quản lý và phản hồi tin nhắn từ người dùng gửi qua trang liên hệ
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {statCards.map((card) => (
          <Card key={card.label} className={card.className}>
            <CardHeader className="pb-2">
              <CardDescription>{card.label}</CardDescription>
              <CardTitle className="text-3xl">
                {statsLoading ? '...' : card.value}
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách tin nhắn</CardTitle>
          <CardDescription>Tìm kiếm, lọc và xử lý tin nhắn liên hệ từ trang public</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Tìm theo tên, email, SĐT, tiêu đề, nội dung..."
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value: ContactMessageStatusFilter) => setStatusFilter(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="NEW">Mới</SelectItem>
                <SelectItem value="IN_PROGRESS">Đang xử lý</SelectItem>
                <SelectItem value="REPLIED">Đã phản hồi</SelectItem>
                <SelectItem value="CLOSED">Đã đóng</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortOrder} onValueChange={(value: ContactMessageSort) => setSortOrder(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sắp xếp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Mới nhất</SelectItem>
                <SelectItem value="oldest">Cũ nhất</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => void reloadAll()} disabled={loading || statsLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Tải lại
            </Button>
          </div>

          {loading ? (
            <AdminTableSkeleton rows={6} />
          ) : error ? (
            <AdminErrorState message={error} onRetry={() => void reloadAll()} />
          ) : messages.length === 0 ? (
            <AdminEmptyState title="Chưa có tin nhắn liên hệ nào" />
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Người gửi</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Số điện thoại</TableHead>
                      <TableHead>Tiêu đề</TableHead>
                      <TableHead>Nội dung rút gọn</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày gửi</TableHead>
                      <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {messages.map((message) => (
                      <TableRow key={message.id}>
                        <TableCell className="font-medium">{message.fullName || '-'}</TableCell>
                        <TableCell>{message.email || '-'}</TableCell>
                        <TableCell>{message.phone || '-'}</TableCell>
                        <TableCell>{message.subject || '-'}</TableCell>
                        <TableCell className="max-w-[220px]">{truncateText(message.message)}</TableCell>
                        <TableCell>
                          <StatusBadge message={message} />
                        </TableCell>
                        <TableCell>{formatDateTimeDisplay(message.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => openDetail(message)}>
                              <Eye className="mr-1 h-4 w-4" />
                              Chi tiết
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => openReply(message)}>
                              <MessageSquareReply className="mr-1 h-4 w-4" />
                              Phản hồi
                            </Button>
                            <Select
                              value={message.status}
                              onValueChange={(value: ContactMessageStatus) =>
                                void handleStatusChange(message, value)
                              }
                              disabled={actionLoadingKey === `status-${message.id}`}
                            >
                              <SelectTrigger className="h-8 w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {(['NEW', 'IN_PROGRESS', 'REPLIED', 'CLOSED'] as ContactMessageStatus[]).map(
                                  (status) => (
                                    <SelectItem key={status} value={status}>
                                      {CONTACT_MESSAGE_STATUS_LABEL[status]}
                                    </SelectItem>
                                  ),
                                )}
                              </SelectContent>
                            </Select>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  disabled={actionLoadingKey === `delete-${message.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Xóa tin nhắn</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Bạn có chắc muốn xóa tin nhắn này không?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Hủy</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => void handleDelete(message)}>
                                    Xóa
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <p>
                  Hiển thị {messages.length} / {totalItems} tin nhắn
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết tin nhắn liên hệ</DialogTitle>
            <DialogDescription>Thông tin người gửi và nội dung tin nhắn</DialogDescription>
          </DialogHeader>
          {selectedMessage ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <DetailField label="Họ tên" value={selectedMessage.fullName} />
              <DetailField label="Email" value={selectedMessage.email} />
              <DetailField label="Số điện thoại" value={selectedMessage.phone} />
              <DetailField label="Tiêu đề" value={selectedMessage.subject} />
              <DetailField
                label="Trạng thái"
                value={<StatusBadge message={selectedMessage} />}
              />
              <DetailField label="Ngày gửi" value={formatDateTimeDisplay(selectedMessage.createdAt)} />
              <div className="sm:col-span-2">
                <DetailField label="Nội dung" value={<p className="whitespace-pre-wrap">{selectedMessage.message}</p>} />
              </div>
              {selectedMessage.adminReply ? (
                <div className="sm:col-span-2">
                  <DetailField
                    label="Phản hồi của admin"
                    value={<p className="whitespace-pre-wrap">{selectedMessage.adminReply}</p>}
                  />
                </div>
              ) : null}
              {selectedMessage.adminNote ? (
                <div className="sm:col-span-2">
                  <DetailField
                    label="Ghi chú nội bộ"
                    value={<p className="whitespace-pre-wrap">{selectedMessage.adminNote}</p>}
                  />
                </div>
              ) : null}
              {selectedMessage.repliedBy ? (
                <DetailField label="Admin phản hồi" value={selectedMessage.repliedBy} />
              ) : null}
              {selectedMessage.repliedAt ? (
                <DetailField label="Thời gian phản hồi" value={formatDateTimeDisplay(selectedMessage.repliedAt)} />
              ) : null}
            </div>
          ) : null}
          <DialogFooter>
            {selectedMessage ? (
              <Button variant="outline" onClick={() => openReply(selectedMessage)}>
                <Mail className="mr-2 h-4 w-4" />
                Phản hồi
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={replyOpen} onOpenChange={setReplyOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Phản hồi tin nhắn</DialogTitle>
            <DialogDescription>Gửi phản hồi và lưu ghi chú nội bộ cho admin</DialogDescription>
          </DialogHeader>
          {selectedMessage ? (
            <div className="space-y-4">
              <div className="rounded-xl border bg-muted/30 p-4 text-sm">
                <p><span className="font-medium">Người gửi:</span> {selectedMessage.fullName}</p>
                <p><span className="font-medium">Email:</span> {selectedMessage.email}</p>
                <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{selectedMessage.message}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminReply">Nội dung phản hồi</Label>
                <Textarea
                  id="adminReply"
                  rows={5}
                  value={adminReply}
                  onChange={(event) => setAdminReply(event.target.value)}
                  placeholder="Nhập nội dung phản hồi gửi cho người dùng..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="adminNote">Ghi chú nội bộ</Label>
                <Textarea
                  id="adminNote"
                  rows={3}
                  value={adminNote}
                  onChange={(event) => setAdminNote(event.target.value)}
                  placeholder="Ghi chú chỉ admin xem..."
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyOpen(false)}>
              Hủy
            </Button>
            <Button
              onClick={() => void handleReply()}
              disabled={!selectedMessage || actionLoadingKey === `reply-${selectedMessage?.id}`}
            >
              {actionLoadingKey === `reply-${selectedMessage?.id}` ? 'Đang gửi...' : 'Gửi phản hồi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
