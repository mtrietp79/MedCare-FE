import { Link } from 'react-router-dom'
import { Heart, Phone, Mail, MapPin, Facebook, Youtube } from 'lucide-react'
import { CONTACT_INFO, getContactEmailHref, getContactPhoneHref } from '@/lib/contact-info'

const footerLinks = {
  services: [
    { name: 'Đặt lịch khám', href: '/booking' },
    { name: 'Tìm bác sĩ', href: '/doctors' },
    { name: 'Chuyên khoa', href: '/specialty' },
    { name: 'Tư vấn trực tuyến', href: '#' },
  ],
  company: [
    { name: 'Giới thiệu', href: '/about' },
    { name: 'Liên hệ', href: '/contact' },
    { name: 'Tuyển dụng', href: '#' },
    { name: 'Tin tức', href: '#' },
  ],
  support: [
    { name: 'Hướng dẫn đặt lịch', href: '#' },
    { name: 'Câu hỏi thường gặp', href: '#' },
    { name: 'Chính sách bảo mật', href: '#' },
    { name: 'Điều khoản sử dụng', href: '#' },
  ],
}

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Heart className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold">MedCare</span>
            </Link>
            <p className="text-background/70 mb-6 max-w-sm leading-relaxed">
              Nền tảng đặt lịch khám bệnh trực tuyến hàng đầu Việt Nam. 
              Kết nối bạn với các bác sĩ chuyên khoa uy tín.
            </p>
            
            {/* Contact info */}
            <div className="space-y-3">
              <a href={getContactPhoneHref()} className="flex items-center gap-3 text-background/70 hover:text-background transition-colors">
                <Phone className="w-4 h-4" />
                <span>{CONTACT_INFO.phone}</span>
              </a>
              <a href={getContactEmailHref()} className="flex items-center gap-3 text-background/70 hover:text-background transition-colors">
                <Mail className="w-4 h-4" />
                <span>{CONTACT_INFO.email}</span>
              </a>
              <div className="flex items-start gap-3 text-background/70">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{CONTACT_INFO.address}</span>
              </div>
            </div>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold mb-4">Dịch vụ</h3>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-background/70 hover:text-background transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Về chúng tôi</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-background/70 hover:text-background transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Hỗ trợ</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-background/70 hover:text-background transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-background/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-background/60 text-sm">
            &copy; 2026 MedCare. Tất cả quyền được bảo lưu.
          </p>
          
          {/* Social links */}
          <div className="flex items-center gap-4">
            <a
              href="#"
              className="w-10 h-10 bg-background/10 rounded-full flex items-center justify-center hover:bg-background/20 transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="w-10 h-10 bg-background/10 rounded-full flex items-center justify-center hover:bg-background/20 transition-colors"
              aria-label="YouTube"
            >
              <Youtube className="w-5 h-5" />
            </a>
            <a
              href="#"
              className="w-10 h-10 bg-background/10 rounded-full flex items-center justify-center hover:bg-background/20 transition-colors"
              aria-label="Zalo"
            >
              <span className="text-sm font-bold">Z</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
