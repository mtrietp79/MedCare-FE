import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, ChevronLeft, ChevronRight, Eye, EyeOff, MessageSquare, RefreshCw, Search, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { websiteFeedbackService, type WebsiteFeedback } from '@/services/websiteFeedbackService'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
import { AdminEmptyState, AdminErrorState, AdminTableSkeleton } from '@/components/admin/AdminPageStates'
import { formatDateDisplay } from '@/lib/date-display'

interface HttpError extends Error {
  status?: number
  data?: unknown
}

const ITEMS_PER_PAGE = 15
type FeedbackActionType = 'approve' | 'hide' | 'unhide'

function getErrorStatus(error: unknown): number | undefined {
  const status = (error as HttpError)?.status
  return typeof status === 'number' ? status : undefined
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return 'Không thể tải danh sách feedback website.'
}


function normalizeVietnameseText(value?: string | null): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function getFeedbackStatusLabel(item: WebsiteFeedback): string {
  const normalizedDisplay = normalizeVietnameseText(item.statusDisplay)

  if (normalizedDisplay === 'cho duyet' || normalizedDisplay === 'chua duyet') {
    return 'Chờ duyệt'
  }

  if (normalizedDisplay === 'da duyet') {
    return 'Đã duyệt'
  }

  if (normalizedDisplay === 'da an' || normalizedDisplay === 'an') {
    return 'Đã ẩn'
  }

  if (item.status === 'APPROVED') return 'Đã duyệt'
  if (item.status === 'HIDDEN') return 'Đã ẩn'
  return 'Chờ duyệt'
}

function getStatusBadge(item: WebsiteFeedback) {
  const statusLabel = getFeedbackStatusLabel(item)

  if (item.status === 'APPROVED') {
    return <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">{statusLabel}</Badge>
  }

  if (item.status === 'HIDDEN') {
    return <Badge className="border border-slate-300 bg-slate-100 text-slate-700">{statusLabel}</Badge>
  }

  return <Badge className="border border-amber-200 bg-amber-50 text-amber-700">{statusLabel}</Badge>
}

function getHomepageBadge(item: WebsiteFeedback) {
  if (item.visibleOnHomepage) {
    return <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700">Hiển thị</Badge>
  }

  return <Badge className="border border-slate-300 bg-slate-100 text-slate-700">Đang ẩn</Badge>
}

export function AdminWebsiteFeedbacksPage() {
  const { toast } = useToast()

  const [feedbacks, setFeedbacks] = useState<WebsiteFeedback[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [keyword, setKeyword] = useState('')
  const [actionLoadingKey, setActionLoadingKey] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const loadFeedbacks = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await websiteFeedbackService.getAdminFeedbacks()
      setFeedbacks(Array.isArray(data) ? data : [])
    } catch (fetchError: unknown) {
      const status = getErrorStatus(fetchError)
      const message = getErrorMessage(fetchError)

      if (status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
      } else if (status === 403) {
        setError('Không có quyền truy cập dữ liệu feedback website.')
      } else if (status === 500) {
        setError('Hệ thống tạm thời bị lỗi. Vui lòng thử lại sau.')
      } else {
        setError(message)
      }

      toast({
        title: 'Lỗi',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadFeedbacks()
  }, [])

  const filteredFeedbacks = useMemo(() => {
    const text = keyword.trim().toLowerCase()
    if (!text) return feedbacks
    return feedbacks.filter((item) =>
      [item.fullName, item.email, item.comment].some((field) =>
        String(field || '').toLowerCase().includes(text)
      )
    )
  }, [feedbacks, keyword])

  const totalPages = Math.max(1, Math.ceil(filteredFeedbacks.length / ITEMS_PER_PAGE))

  useEffect(() => {
    setCurrentPage(1)
  }, [keyword])

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages))
  }, [totalPages])

  const paginatedFeedbacks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredFeedbacks.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredFeedbacks, currentPage])

  const isLoadingAction = (action: 'approve' | 'hide' | 'unhide' | 'delete', id: string) =>
    actionLoadingKey === `${action}-${id}`

  const updateFeedbackItem = (
    feedbackId: string,
    updater: (item: WebsiteFeedback) => WebsiteFeedback
  ) => {
    setFeedbacks((prev) =>
      prev.map((item) => (item.id === feedbackId ? updater(item) : item))
    )
  }

  const buildNextFeedbackState = (
    currentItem: WebsiteFeedback,
    action: FeedbackActionType,
    nextFeedback?: WebsiteFeedback | null
  ): WebsiteFeedback => {
    if (nextFeedback?.id) {
      return {
        ...currentItem,
        ...nextFeedback,
      }
    }

    if (action === 'approve') {
      return {
        ...currentItem,
        approved: true,
        hidden: false,
        status: 'APPROVED',
        statusDisplay: 'Đã duyệt',
        visibleOnHomepage: true,
        canApprove: false,
        canHide: true,
        canUnhide: false,
      }
    }

    if (action === 'hide') {
      return {
        ...currentItem,
        hidden: true,
        status: 'HIDDEN',
        statusDisplay: 'Đã ẩn',
        visibleOnHomepage: false,
        canApprove: false,
        canHide: false,
        canUnhide: true,
      }
    }

    return {
      ...currentItem,
      approved: true,
      hidden: false,
      status: 'APPROVED',
      statusDisplay: 'Đã duyệt',
      visibleOnHomepage: true,
      canApprove: false,
      canHide: true,
      canUnhide: false,
    }
  }

  const handleApprove = async (item: WebsiteFeedback) => {
    try {
      setActionLoadingKey(`approve-${item.id}`)
      const response = await websiteFeedbackService.approve(item.id)
      toast({ title: 'Thành công', description: response.message })
      updateFeedbackItem(item.id, (currentItem) =>
        buildNextFeedbackState(currentItem, 'approve', response.feedback)
      )
    } catch (actionError: unknown) {
      const status = getErrorStatus(actionError)
      const message = getErrorMessage(actionError)

      toast({
        title: status === 403 ? 'Không có quyền' : 'Lỗi',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setActionLoadingKey('')
    }
  }

  const handleHide = async (item: WebsiteFeedback) => {
    try {
      setActionLoadingKey(`hide-${item.id}`)
      const response = await websiteFeedbackService.hide(item.id)
      toast({ title: 'Thành công', description: response.message })
      updateFeedbackItem(item.id, (currentItem) =>
        buildNextFeedbackState(currentItem, 'hide', response.feedback)
      )
    } catch (actionError: unknown) {
      const status = getErrorStatus(actionError)
      const message = getErrorMessage(actionError)

      toast({
        title: status === 403 ? 'Không có quyền' : 'Lỗi',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setActionLoadingKey('')
    }
  }

  const handleUnhide = async (item: WebsiteFeedback) => {
    try {
      setActionLoadingKey(`unhide-${item.id}`)
      const response = await websiteFeedbackService.unhide(item.id)
      toast({ title: 'Thành công', description: response.message })
      updateFeedbackItem(item.id, (currentItem) =>
        buildNextFeedbackState(currentItem, 'unhide', response.feedback)
      )
    } catch (actionError: unknown) {
      const status = getErrorStatus(actionError)
      const message = getErrorMessage(actionError)

      toast({
        title: status === 403 ? 'Không có quyền' : 'Lỗi',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setActionLoadingKey('')
    }
  }

  const handleDelete = async (feedback: WebsiteFeedback) => {
    try {
      setActionLoadingKey(`delete-${feedback.id}`)
      const response = await websiteFeedbackService.remove(feedback.id)
      setFeedbacks((prev) => prev.filter((item) => item.id !== feedback.id))
      toast({ title: 'Thành công', description: response.message })
    } catch (actionError: unknown) {
      const status = getErrorStatus(actionError)
      const message = getErrorMessage(actionError)

      toast({
        title: status === 403 ? 'Không có quyền' : 'Lỗi',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setActionLoadingKey('')
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Feedback website</h1>
        <p className="text-muted-foreground">Quản lý phản hồi đánh giá MedCare</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách feedback</CardTitle>
          <CardDescription></CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="Tìm theo tên, email hoặc nội dung..."
                className="pl-9"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => void loadFeedbacks()}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </Button>
          </div>

          {loading && <AdminTableSkeleton rows={8} />}
          {!loading && error && <AdminErrorState message={error} onRetry={() => void loadFeedbacks()} />}
          {!loading && !error && filteredFeedbacks.length === 0 && (
            <AdminEmptyState title="Chưa có feedback phù hợp." />
          )}

          {!loading && !error && filteredFeedbacks.length > 0 && (
            <>
              <div className="text-sm text-slate-500">Hiển thị {filteredFeedbacks.length} feedback</div>
              <Table className="min-w-[1380px] table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[170px]">Người gửi</TableHead>
                    <TableHead className="w-[220px]">Email</TableHead>
                    <TableHead className="w-[100px]">Rating</TableHead>
                    <TableHead className="w-[430px]">Nội dung</TableHead>
                    <TableHead className="w-[130px]">Ngày gửi</TableHead>
                    <TableHead className="w-[130px]">Trạng thái</TableHead>
                    <TableHead className="w-[120px]">Trang chủ</TableHead>
                    <TableHead className="w-[280px] text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedFeedbacks.map((feedback) => {
                    const canApprove = feedback.canApprove ?? feedback.status === 'PENDING'
                    const canHide = feedback.canHide ?? (feedback.status === 'PENDING' || feedback.status === 'APPROVED')
                    const canUnhide = feedback.canUnhide ?? feedback.status === 'HIDDEN'
                    const canDelete = feedback.canDelete ?? true
                    const approveDisabled = isLoadingAction('approve', feedback.id)
                    const hideDisabled = isLoadingAction('hide', feedback.id)
                    const unhideDisabled = isLoadingAction('unhide', feedback.id)
                    const deleteDisabled = isLoadingAction('delete', feedback.id)

                    return (
                      <TableRow key={feedback.id}>
                        <TableCell className="align-top whitespace-normal break-words font-medium">
                          {feedback.fullName || '-'}
                        </TableCell>
                        <TableCell className="align-top whitespace-normal break-all text-slate-600">
                          {feedback.email || '-'}
                        </TableCell>
                        <TableCell className="align-top whitespace-nowrap">
                          <Badge variant="outline" className="gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {feedback.rating || 0}/5
                          </Badge>
                        </TableCell>
                        <TableCell className="align-top whitespace-normal break-words leading-6 text-slate-700">
                          {feedback.comment || '-'}
                        </TableCell>
                        <TableCell className="align-top whitespace-nowrap">
                          {formatDateDisplay(feedback.createdAt)}
                        </TableCell>
                        <TableCell className="align-top whitespace-nowrap">{getStatusBadge(feedback)}</TableCell>
                        <TableCell className="align-top whitespace-nowrap">{getHomepageBadge(feedback)}</TableCell>
                        <TableCell className="align-top text-right">
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {canApprove && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void handleApprove(feedback)}
                                disabled={approveDisabled}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Duyệt
                              </Button>
                            )}

                            {canHide && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void handleHide(feedback)}
                                disabled={hideDisabled}
                              >
                                <EyeOff className="h-4 w-4" />
                                Ẩn
                              </Button>
                            )}

                            {canUnhide && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void handleUnhide(feedback)}
                                disabled={unhideDisabled}
                              >
                                <Eye className="h-4 w-4" />
                                Bỏ ẩn
                              </Button>
                            )}

                            {canDelete && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-200 text-red-600 hover:bg-red-50"
                                    disabled={deleteDisabled}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    Xóa
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Bạn có chắc muốn xóa feedback từ {feedback.fullName || feedback.email || feedback.id}?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Hủy</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => void handleDelete(feedback)}>
                                      Xóa
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              <div className="flex justify-end border-t border-slate-200 px-1 pt-4">
                <div className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-100"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <span className="min-w-[92px] text-center text-sm font-semibold text-slate-700">
                    Trang {currentPage}/{totalPages}
                  </span>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-100"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
