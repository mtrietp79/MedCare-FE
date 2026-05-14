import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Phone, MapPin, Send, Clock, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { containerVariants, itemVariants } from '@/lib/animations'

// Import images
import clinic1 from '../../public/clinic1.png'
import clinic2 from '../../public/clinic2.png'
import lab1 from '../../public/lab1.png'
import lab2 from '../../public/lab2.png'

interface FormData {
  name: string
  email: string
  phone: string
  subject: string
  message: string
}

export function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))
      setSubmitStatus('success')
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' })
      setTimeout(() => setSubmitStatus('idle'), 3000)
    } catch (error) {
      setSubmitStatus('error')
      setTimeout(() => setSubmitStatus('idle'), 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const contactMethods = [
    {
      icon: Phone,
      title: 'Gọi cho chúng tôi',
      description: 'Hỗ trợ 24/7 mọi ngày',
      value: '1900 123 456',
      color: 'bg-primary/10 text-primary',
    },
    {
      icon: Mail,
      title: 'Gửi email',
      description: 'Phản hồi trong 1 giờ',
      value: 'support@medcare.vn',
      color: 'bg-accent/10 text-accent',
    },
    {
      icon: MapPin,
      title: 'Địa chỉ',
      description: 'Ghé thăm văn phòng',
      value: 'TP. Hồ Chí Minh',
      color: 'bg-chart-1/10 text-chart-1',
    },
  ]

  const facilities = [
    {
      image: clinic1,
      title: 'Phòng khám chuyên khoa',
      description: 'Cơ sở vật chất hiện đại, trang thiết bị y tế tiên tiến',
    },
    {
      image: clinic2,
      title: 'Phòng chờ thoải mái',
      description: 'Không gian yên tĩnh, thoáng đãng cho bệnh nhân',
    },
    {
      image: lab1,
      title: 'Phòng xét nghiệm',
      description: 'Hệ thống xét nghiệm máy móc hiện đại',
    },
    {
      image: lab2,
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
                      <Label htmlFor="name" className="text-sm font-semibold">
                        Họ và tên
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="Nhập họ và tên"
                        value={formData.name}
                        onChange={handleChange}
                        required
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
                        placeholder="0912 345 678"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm font-semibold">
                      Email
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="subject" className="text-sm font-semibold">
                      Chủ đề
                    </Label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="Tiêu đề tin nhắn"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-sm font-semibold">
                      Nội dung
                    </Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Hãy viết lời nhắn của bạn tại đây..."
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      required
                      className="mt-2"
                    />
                  </div>

                  {/* Status Messages */}
                  {submitStatus === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-chart-2/10 text-chart-2 rounded-lg text-sm font-medium"
                    >
                      ✓ Cảm ơn bạn! Chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.
                    </motion.div>
                  )}

                  {submitStatus === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-destructive/10 text-destructive rounded-lg text-sm font-medium"
                    >
                      ✗ Gửi tin nhắn thất bại. Vui lòng thử lại.
                    </motion.div>
                  )}

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
                      123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh, Việt Nam
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Điện thoại</h3>
                    <a href="tel:1900123456" className="text-sm text-primary hover:underline">
                      1900 123 456
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-chart-1/10 text-chart-1 flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <a href="mailto:support@medcare.vn" className="text-sm text-primary hover:underline">
                      support@medcare.vn
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
