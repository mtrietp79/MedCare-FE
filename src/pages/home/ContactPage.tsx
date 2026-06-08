import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Send, Clock, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { containerVariants, itemVariants } from '@/lib/animations'
import { CONTACT_INFO, getContactEmailHref, getContactPhoneHref } from '@/lib/contact-info'
import { contactMessageService } from '@/services/contactMessageService'

interface FormData {
  fullName: string
  email: string
  phone: string
  subject: string
  message: string
}

function validateContactForm(formData: FormData): string | null {
  if (!formData.fullName.trim()) {
    return 'Vui lòng nhập họ và tên.'
  }

  if (!formData.email.trim()) {
    return 'Vui lòng nhập email.'
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailPattern.test(formData.email.trim())) {
    return 'Email không đúng định dạng.'
  }

  if (!formData.message.trim()) {
    return 'Vui lòng nhập nội dung tin nhắn.'
  }

  return null
}

export function ContactPage() {
  const { toast } = useToast()
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateContactForm(formData)
    if (validationError) {
      toast({
        title: 'Thiếu thông tin',
        description: validationError,
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    try {
      await contactMessageService.createPublicMessage({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
      })

      setFormData({
        fullName: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      })

      toast({
        title: 'Thành công',
        description: 'Gửi tin nhắn thành công. Chúng tôi sẽ phản hồi trong thời gian sớm nhất.',
      })
    } catch (error) {
      toast({
        title: 'Lỗi',
        description: contactMessageService.getErrorMessage(
          error,
          'Gửi tin nhắn thất bại. Vui lòng thử lại.',
        ),
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const contactMethods = [
    {
      icon: Phone,
      title: 'Gọi cho chúng tôi',
      description: 'Hỗ trợ 24/7 mọi ngày',
      value: CONTACT_INFO.phone,
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: Mail,
      title: 'Gửi email',
      description: 'Phản hồi trong 1 giờ',
      value: CONTACT_INFO.email,
      color: 'bg-accent/10 text-accent',
    },
    {
      icon: MapPin,
      title: 'Địa chỉ',
      description: 'Ghé thăm văn phòng',
      value: CONTACT_INFO.address,
      color: 'bg-chart-1/10 text-chart-1',
    },
  ]

  const facilities = [
    {
      image: '/images/facilities/clinic1.png',
      title: 'Phòng khám chuyên khoa',
      description: 'Cơ sở vật chất hiện đại, trang thiết bị y tế tiên tiến',
    },
    {
      image: '/images/facilities/clinic2.png',
      title: 'Phòng chờ thoải mái',
      description: 'Không gian yên tĩnh, thoáng đãng cho bệnh nhân',
    },
    {
      image: '/images/facilities/lab1.png',
      title: 'Phòng xét nghiệm',
      description: 'Hệ thống xét nghiệm máy móc hiện đại',
    },
    {
      image: '/images/facilities/lab2.png',
      title: 'Phòng chẩn đoán',
      description: 'Máy chẩn đoán hình ảnh công nghệ cao',
    },
  ]

  return (
    <div className="min-h-screen bg-primary/10">
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 bg-primary/10 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            className="max-w-3xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              variants={itemVariants} 
              className="rounded-2xl bg-white border border-border p-8 md:p-12 shadow-sm text-center"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
                Liên hệ với chúng tôi
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Chúng tôi luôn sẵn sàng giúp đỡ bạn. Hãy liên hệ ngay để được tư vấn miễn phí.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {contactMethods.map((method, i) => {
              const Icon = method.icon
              return (
                <motion.div key={i} variants={itemVariants} className="group">
                  <div className="rounded-2xl border border-border bg-card p-8 shadow-sm hover:shadow-md transition-all duration-300 h-full">
                    <div className={`w-12 h-12 rounded-xl ${method.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{method.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{method.description}</p>
                    <p className="font-medium text-primary">{method.value}</p>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      </section>

      {/* Facilities Showcase */}
      <section className="py-12 md:py-16 bg-card/50">
        <div className="container mx-auto px-4">
          <motion.div
            className="mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Cơ sở vật chất của chúng tôi</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Thiết bị y tế hiện đại, không gian thoáng đãng và chuyên nghiệp
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {facilities.map((facility, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="group rounded-xl overflow-hidden border border-border bg-white shadow-sm hover:shadow-lg transition-all duration-300 h-64"
              >
                <div className="relative h-full overflow-hidden">
                  <img
                    src={facility.image}
                    alt={facility.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-4">
                    <h3 className="font-semibold text-white mb-1">{facility.title}</h3>
                    <p className="text-sm text-white/80">{facility.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {/* Form */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
                <h2 className="text-2xl font-bold mb-6">Gửi tin nhắn cho chúng tôi</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="fullName" className="text-sm font-semibold">
                        Họ và tên *
                      </Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        placeholder="Nhập họ và tên"
                        value={formData.fullName}
                        onChange={handleChange}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-sm font-semibold">
                        Số điện thoại
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="0868663667"
                        value={formData.phone}
                        onChange={handleChange}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-semibold">
                      Email *
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="subject" className="text-sm font-semibold">
                      Tiêu đề
                    </Label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="Tiêu đề tin nhắn"
                      value={formData.subject}
                      onChange={handleChange}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-sm font-semibold">
                      Nội dung *
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Hãy viết lời nhắn của bạn tại đây..."
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      className="mt-2"
                    />
                  </div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      size="lg"
                      disabled={isLoading}
                      className="w-full"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {isLoading ? 'Đang gửi...' : 'Gửi tin nhắn'}
                    </Button>
                  </motion.div>
                </form>
              </div>
            </motion.div>

            {/* Info */}
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Địa chỉ</h3>
                    <p className="text-sm text-muted-foreground">
                      {CONTACT_INFO.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Điện thoại</h3>
                    <a href={getContactPhoneHref()} className="text-sm text-primary hover:underline">
                      {CONTACT_INFO.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-chart-1/10 text-chart-1 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <a href={getContactEmailHref()} className="text-sm text-primary hover:underline">
                      {CONTACT_INFO.email}
                    </a>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-accent/5 p-6">
                <div className="flex gap-3 mb-4">
                  <Clock className="w-5 h-5 text-primary flex-shrink-0" />
                  <h3 className="font-semibold">Giờ làm việc</h3>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>Thứ 2 - Thứ 6: 8:00 - 18:00</p>
                  <p>Thứ 7: 8:00 - 17:00</p>
                  <p>Chủ nhật: 9:00 - 17:00</p>
                  <p className="text-primary font-medium pt-2">24/7 hỗ trợ trực tuyến</p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-gradient-to-br from-chart-2/5 to-chart-3/5 p-6">
                <div className="flex gap-3 mb-4">
                  <Users className="w-5 h-5 text-chart-2 flex-shrink-0" />
                  <h3 className="font-semibold">Hỗ trợ khách hàng</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Đội ngũ chuyên nghiệp của chúng tôi sẵn sàng giải đáp mọi thắc mắc của bạn.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-12 md:py-16 bg-card/50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl overflow-hidden border border-border shadow-sm h-80 md:h-96"
          >
            <iframe
              title="MedCare Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.3712099889263!2d106.6733282!3d10.776889!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f374e4d8e3d%3A0x2c9e8c8e8e8e8e8e!2s123%20Nguyen%20Hue%20Boulevard!5e0!3m2!1sen!2s!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </motion.div>
        </div>
      </section>
    </div>
  )
}
