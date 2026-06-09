import { useEffect, useState } from 'react'
import { Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { websiteFeedbackService, type WebsiteFeedback } from '@/services/websiteFeedbackService'
import { formatDateDisplay } from '@/lib/date-display'

export function Testimonials() {
  const { toast } = useToast()
  const MAX_VISIBLE_FEEDBACKS = 6

  const [feedbacks, setFeedbacks] = useState<WebsiteFeedback[]>([])
  const [showAllFeedbacks, setShowAllFeedbacks] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')
  const visibleFeedbacks = showAllFeedbacks ? feedbacks : feedbacks.slice(0, MAX_VISIBLE_FEEDBACKS)

  const loadFeedbacks = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await websiteFeedbackService.getPublicFeedbacks()
      setFeedbacks(Array.isArray(data) ? data : [])
    } catch {
      setError('Không thể tải danh sách đánh giá. Vui lòng thử lại sau.')
      setFeedbacks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadFeedbacks()
  }, [])

  const submitFeedback = async () => {
    if (!fullName.trim() || !email.trim() || !comment.trim()) {
      toast({ title: 'Lỗi', description: 'Vui lòng nhập đầy đủ họ tên, email và nội dung góp ý.', variant: 'destructive' })
      return
    }

    try {
      setSubmitting(true)
      setSubmitMessage('')
      await websiteFeedbackService.createPublicFeedback({
        fullName: fullName.trim(),
        email: email.trim(),
        rating,
        comment: comment.trim(),
      })

      setFullName('')
      setEmail('')
      setRating(5)
      setComment('')
      setSubmitMessage('Cảm ơn bạn đã gửi đánh giá. Đánh giá sẽ được hiển thị sau khi được duyệt.')
    } catch (submitError: any) {
      toast({
        title: 'Lỗi',
        description: submitError?.message || 'Không thể gửi đánh giá. Vui lòng thử lại sau.',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="bg-secondary/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">
            Khách hàng nói gì về MedCare
          </h2>
          <p className="mx-auto max-w-2xl leading-relaxed text-muted-foreground">
            Phản hồi thực tế từ khách hàng về chất lượng dịch vụ và trải nghiệm tại MedCare.
          </p>
        </div>

        {loading ? (
          <div className="mb-8 text-center text-muted-foreground">Đang tải...</div>
        ) : error ? (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center text-amber-800">
            <p>{error}</p>
            <Button variant="outline" className="mt-3" onClick={() => void loadFeedbacks()}>
              Thử lại
            </Button>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="mb-8 text-center text-muted-foreground">Chưa có đánh giá nào.</div>
        ) : (
          <div className="mb-10">
            <div className="grid gap-6 md:grid-cols-3">
              {visibleFeedbacks.map((feedback) => (
                <Card key={feedback.id} className="border border-border/70 shadow-sm">
                  <CardContent className="p-6">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="font-semibold text-foreground">{feedback.fullName || 'Ẩn danh'}</p>
                      <div className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        {feedback.rating || 0}
                      </div>
                    </div>
                    <p className="mb-3 text-sm leading-6 text-slate-700">{feedback.comment || 'Không có nội dung.'}</p>
                    <p className="text-xs text-muted-foreground">{formatDateDisplay(feedback.createdAt)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {feedbacks.length > MAX_VISIBLE_FEEDBACKS ? (
              <div className="mt-8 text-center">
                <Button variant="outline" onClick={() => setShowAllFeedbacks((prev) => !prev)}>
                  {showAllFeedbacks ? 'Thu gọn đánh giá' : 'Xem tất cả đánh giá'}
                </Button>
              </div>
            ) : null}
          </div>
        )}

        <Card className="mx-auto max-w-3xl border border-border/70 shadow-sm">
          <CardContent className="space-y-4 p-6 md:p-8">
            <h3 className="text-xl font-semibold text-foreground">Gửi đánh giá về MedCare</h3>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-sm font-medium">Họ tên</p>
                <Input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Nguyễn Văn A"
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium">Email</p>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Đánh giá</p>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, index) => {
                  const value = index + 1
                  const active = value <= rating
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className="rounded-md p-1 transition hover:scale-105"
                      aria-label={`Chọn ${value} sao`}
                    >
                      <Star className={`h-6 w-6 ${active ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-medium">Nội dung góp ý</p>
              <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={4}
                placeholder="Chia sẻ trải nghiệm của bạn tại MedCare..."
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {submitMessage ? <p className="text-sm text-emerald-700">{submitMessage}</p> : <span />}
              <Button onClick={() => void submitFeedback()} disabled={submitting}>
                {submitting ? 'Đang gửi...' : 'Gửi đánh giá'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
