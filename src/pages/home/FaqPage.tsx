import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'

const faqs = [
  {
    question: 'Tôi có cần đăng nhập để đặt lịch không?',
    answer: 'Bạn có thể xem thông tin bác sĩ và chuyên khoa mà không cần đăng nhập. Tuy nhiên để đặt lịch, theo dõi lịch hẹn và hồ sơ bệnh án, bạn cần đăng nhập tài khoản bệnh nhân.',
  },
  {
    question: 'Tôi có thể hủy lịch khám không?',
    answer: 'Có. Bạn có thể hủy lịch khám trong phần quản lý lịch hẹn của tài khoản. Một số trường hợp có thể áp dụng chính sách hoàn tiền hoặc phí hủy theo quy định của phòng khám.',
  },
  {
    question: 'Sau khi thanh toán, tôi xem lịch hẹn ở đâu?',
    answer: 'Sau khi thanh toán thành công, lịch hẹn sẽ được hiển thị trong trang quản lý lịch của bạn. Bạn cũng sẽ nhận được thông tin xác nhận qua email hoặc tin nhắn nếu được cung cấp.',
  },
  {
    question: 'Tôi có thể đổi mật khẩu tài khoản không?',
    answer: 'Có. Bạn có thể đổi mật khẩu trong phần cài đặt tài khoản sau khi đăng nhập. Nếu quên mật khẩu, hãy sử dụng chức năng quên mật khẩu để thiết lập lại.',
  },
  {
    question: 'Hồ sơ bệnh án có được lưu lại không?',
    answer: 'Có. Hồ sơ bệnh án từ các lần khám trước sẽ được lưu lại trong tài khoản của bạn để dễ dàng xem lại và theo dõi quá trình điều trị.',
  },
  {
    question: 'Tôi có thể đặt lịch tái khám không?',
    answer: 'Bạn có thể đặt lịch tái khám sau khi đã có lịch khám trước đó. Hệ thống cho phép bạn chọn bác sĩ cũ hoặc bác sĩ khác tùy theo nhu cầu.',
  },
  {
    question: 'Nếu thanh toán thành công nhưng chưa thấy lịch thì làm sao?',
    answer: 'Nếu bạn đã thanh toán nhưng chưa nhận được lịch, hãy kiểm tra lại trang quản lý lịch hoặc liên hệ bộ phận hỗ trợ của MedCare để được xác nhận lại.',
  },
  {
    question: 'Tôi liên hệ hỗ trợ bằng cách nào?',
    answer: 'Bạn có thể liên hệ với chúng tôi qua trang Liên hệ hoặc số điện thoại và email có sẵn trong footer. Đội ngũ hỗ trợ sẽ giúp bạn giải đáp thắc mắc.',
  },
]

export function FaqPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="rounded-3xl bg-white p-10 shadow-sm mb-10">
        <p className="text-sm font-semibold text-primary">Câu hỏi thường gặp</p>
        <h1 className="mt-4 text-4xl font-bold text-foreground">Bạn cần biết gì về MedCare?</h1>
        <p className="mt-6 text-base leading-8 text-muted-foreground">
          Những câu hỏi phổ biến về đặt lịch, thanh toán, hồ sơ và hỗ trợ người dùng.
        </p>
      </div>

      <div className="space-y-4">
        <Accordion type="single" collapsible className="space-y-4">
          {faqs.map((item, index) => (
            <AccordionItem key={item.question} value={`item-${index}`}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground leading-7">{item.answer}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  )
}
