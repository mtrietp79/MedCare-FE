import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Calendar, Shield, Clock, Heart, Zap, CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/services/api'
import { useToast } from '@/hooks/use-toast'
import type { SearchResponse } from '@/types'

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { toast } = useToast()

  const onSearch = async (triggerFromButton = false) => {
    const keyword = searchQuery.trim()

    try {
      setLoadingSearch(true)
      setSearchError(null)
      const response = await api.search.query(keyword)
      setSearchResults(response)
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Có lỗi xảy ra, vui lòng thử lại.'
      toast({ title: 'Lỗi', description: message, variant: 'destructive' })
      setSearchResults(null)
    } finally {
      setLoadingSearch(false)
    }
  }

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300)
    return () => window.clearTimeout(handle)
  }, [searchQuery])

  useEffect(() => {
    const fetchSearch = async () => {
      if (!debouncedQuery) {
        setSearchResults(null)
        setSearchError(null)
        setLoadingSearch(false)
        return
      }

      try {
        setLoadingSearch(true)
        setSearchError(null)
        const response = await api.search.query(debouncedQuery)
        setSearchResults(response)
      } catch (err: any) {
        setSearchError(err?.response?.data?.message || err?.message || 'Không thể tải kết quả tìm kiếm')
        setSearchResults(null)
      } finally {
        setLoadingSearch(false)
      }
    }

    fetchSearch()
  }, [debouncedQuery])

  const doctorResults = searchResults?.doctors ?? []
  const specialtyResults = searchResults?.specialties ?? []
  const hasResults = doctorResults.length > 0 || specialtyResults.length > 0
  const isDropdownOpen = debouncedQuery.length > 0

  const handleResultClick = (path: string) => {
    navigate(path)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  }

  const floatingVariants = {
    animate: {
      y: [0, -12, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  }

  return (
    <section className="relative overflow-hidden bg-primary/10 -mt-2">
      {/* Animated decorative elements */}
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-10 right-10 w-96 h-96 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
      />
      <motion.div
        animate={{ 
          scale: [1, 1.15, 1],
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute -bottom-10 -left-10 w-80 h-80 bg-accent/15 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"
      />
      
      <div className="container mx-auto px-4 relative z-10 py-16 md:py-24 lg:py-28">
        <motion.div
          className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Content Left */}
          <motion.div className="space-y-8 lg:col-span-3">
            <motion.div className="space-y-6" variants={itemVariants}>
              <motion.div
                className="inline-flex items-center gap-2 bg-white text-primary px-4 py-2.5 rounded-full text-sm font-semibold shadow-sm border border-primary/20"
                whileHover={{ scale: 1.05, boxShadow: '0 8px 16px rgba(0, 132, 255, 0.2)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                <Zap className="w-4 h-4" />
                Được tin tưởng bởi 50K+ bệnh nhân
              </motion.div>

              <motion.h1
                className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight text-balance"
                variants={itemVariants}
              >
                Chăm sóc sức khỏe{' '}
                <motion.span
                  className="text-primary"
                  animate={{ opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  thông minh
                </motion.span>
              </motion.h1>

              <motion.p
                className="text-xl text-muted-foreground max-w-lg leading-relaxed font-medium"
                variants={itemVariants}
              >
                Đặt lịch khám bệnh trực tuyến với các bác sĩ hàng đầu Việt Nam trong vài phút. 
                Tiết kiệm thời gian, không cần chờ đợi.
              </motion.p>
            </motion.div>

            {/* Search bar - LARGER */}
            <motion.div
              variants={itemVariants}
              whileHover={{ boxShadow: '0 25px 50px rgba(0, 0, 0, 0.12)' }}
              className="relative z-30 bg-white rounded-2xl p-2.5 shadow-lg border border-border/50 max-w-2xl transition-all"
            >
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-muted-foreground" />
                  <Input
                    id="hero-search-input"
                    type="text"
                    placeholder="Tìm bác sĩ, chuyên khoa, bệnh viện..."
                    className="pl-16 h-14 border-0 bg-transparent text-lg font-medium placeholder:text-muted-foreground"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        onSearch(true)
                      }
                    }}
                  />
                </div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className="h-14 px-8 text-base font-semibold" onClick={() => onSearch(true)}>
                    Tìm kiếm
                  </Button>
                </motion.div>
              </div>

              {isDropdownOpen && (
                <div className="mt-3 rounded-3xl border border-border/70 bg-white shadow-xl z-50">
                  {loadingSearch ? (
                    <div className="p-4 text-sm text-muted-foreground">Đang tìm kiếm...</div>
                  ) : searchError ? (
                    <div className="p-4 text-sm text-destructive">Lỗi: {searchError}</div>
                  ) : hasResults ? (
                    <div className="divide-y divide-border/60">
                      <div className="p-4">
                        <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground mb-3">Bác sĩ</div>
                        {doctorResults.map((doctor) => (
                          <button
                            key={doctor.id}
                            type="button"
                            onClick={() => handleResultClick(`/doctors/${doctor.id}`)}
                            className="w-full text-left rounded-2xl px-3 py-2 hover:bg-slate-100 transition-colors"
                          >
                            <div className="text-sm font-medium text-foreground">{doctor.fullName}</div>
                            <div className="text-xs text-muted-foreground">{doctor.specialtyName || 'Chưa cập nhật'}</div>
                          </button>
                        ))}
                      </div>
                      <div className="p-4">
                        <div className="text-xs uppercase tracking-[0.24em] text-muted-foreground mb-3">Chuyên khoa</div>
                        {specialtyResults.map((specialty) => (
                          <button
                            key={specialty.id}
                            type="button"
                            onClick={() => handleResultClick(`/specialty/${specialty.id}`)}
                            className="w-full text-left rounded-2xl px-3 py-2 hover:bg-slate-100 transition-colors"
                          >
                            <div className="text-sm font-medium text-foreground">{specialty.name}</div>
                            <div className="text-xs text-muted-foreground">{specialty.description || 'Chuyên khoa'}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 text-sm text-muted-foreground">Không tìm thấy kết quả phù hợp.</div>
                  )}
                </div>
              )}
            </motion.div>

            {/* Quick stats - LARGER */}
            <motion.div className="grid grid-cols-2 gap-6 pt-4" variants={itemVariants}>
              {[
                { icon: Calendar, label: '50K+', desc: 'Lịch hẹn', color: 'bg-primary/20 text-primary' },
                { icon: Clock, label: '24/7', desc: 'Hỗ trợ khách hàng', color: 'bg-accent/20 text-accent' },
                { icon: Heart, label: '98%', desc: 'Hài lòng', color: 'bg-chart-2/20 text-chart-2' },
                { icon: CheckCircle2, label: '85+', desc: 'Bác sĩ chuyên khoa', color: 'bg-chart-1/20 text-chart-1' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-border/40 hover:bg-white/80 transition-colors"
                  whileHover={{ y: -4 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  <div className={`w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 ${stat.color}`}>
                    <stat.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{stat.label}</div>
                    <div className="text-sm text-muted-foreground font-medium">{stat.desc}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Image Section Right - RICHER CONTENT */}
          <motion.div
            className="relative hidden lg:flex flex-col items-center lg:col-span-2"
            initial={{ opacity: 0, scale: 0.85, x: 60 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          >
            <div className="relative w-full max-w-md">
              {/* Main Doctor Card */}
              <motion.div
                className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-muted"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <img
                  src="/images/hero/doctor.png"
                  alt="Healthcare Professional"
                  className="w-full h-full object-cover aspect-[3/4]"
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                
                {/* Badge */}
                <motion.div
                  className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg"
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                >
                  <p className="text-sm text-muted-foreground font-medium">Bác sĩ chuyên khoa</p>
                  <p className="text-lg font-bold text-primary">85+ chuyên gia hàng đầu</p>
                </motion.div>
              </motion.div>

              {/* Top Right - Satisfaction Card */}
              <motion.div
                className="absolute -top-6 -right-6 bg-white rounded-2xl p-5 shadow-lg border-2 border-primary/20"
                variants={floatingVariants}
                animate="animate"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-chart-2/20 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6 text-chart-2" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">98%</p>
                    <p className="text-xs text-muted-foreground font-medium">Hài lòng</p>
                  </div>
                </div>
              </motion.div>

              {/* Bottom Left - Patients Card */}
              <motion.div
                className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-5 shadow-lg border-2 border-accent/20"
                variants={floatingVariants}
                animate="animate"
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">50K+</p>
                    <p className="text-xs text-muted-foreground font-medium">Lịch khám</p>
                  </div>
                </div>
              </motion.div>

              {/* Top Left - Fast Booking Badge */}
              <motion.div
                className="absolute -top-12 -left-12 bg-primary text-white rounded-2xl p-4 shadow-lg"
                animate={{ rotate: [0, 5, 0], y: [0, -6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  <span className="text-sm font-bold">Đặt lịch nhanh</span>
                </div>
              </motion.div>

              {/* Bottom Right - Fast Service */}
              <motion.div
                className="absolute -bottom-4 right-0 translate-x-1/4 bg-white rounded-xl p-4 shadow-md border border-accent/30"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
              >
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-accent" />
                  <div>
                    <p className="text-sm font-bold text-foreground">Nhanh chóng</p>
                    <p className="text-xs text-muted-foreground">&lt; 5 phút</p>
                  </div>
                </div>
              </motion.div>

              {/* Right Middle - Expert Rating */}
              <motion.div
                className="absolute top-1/2 -right-8 -translate-y-1/2 bg-white rounded-xl p-4 shadow-md border border-chart-1/30"
                animate={{ x: [0, 8, 0], y: [0, -4, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-chart-1" />
                  <div>
                    <p className="text-sm font-bold text-foreground">Đánh giá cao</p>
                    <p className="text-xs text-muted-foreground">5★ từ bệnh nhân</p>
                  </div>
                </div>
              </motion.div>

              {/* Left Middle - Quick Consultation */}
              <motion.div
                className="absolute top-1/3 -left-8 bg-white rounded-xl p-4 shadow-md border border-chart-2/30"
                animate={{ x: [0, -6, 0], y: [0, 4, 0] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-chart-2" />
                  <div>
                    <p className="text-sm font-bold text-foreground">Tư vấn nhanh</p>
                    <p className="text-xs text-muted-foreground">Online 24/7</p>
                  </div>
                </div>
              </motion.div>

              {/* Top Center-Right - Expert Doctors */}
              <motion.div
                className="absolute top-0 right-1/3 translate-x-1/2 -translate-y-2/3 bg-white rounded-xl p-3 shadow-md border border-primary/20 text-center"
                animate={{ rotate: [0, -3, 0], y: [0, -4, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
              >
                <p className="text-lg font-bold text-primary">85+</p>
                <p className="text-xs text-muted-foreground font-medium">Chuyên gia</p>
              </motion.div>
            </div>

            {/* Additional Info Box Below */}
            <motion.div
              className="mt-12 w-full bg-white rounded-2xl p-6 shadow-lg border border-border/50"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <Shield className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-xs font-semibold text-foreground">An toàn</p>
                  <p className="text-xs text-muted-foreground">Bảo mật dữ liệu</p>
                </div>
                <div>
                  <Clock className="w-6 h-6 text-accent mx-auto mb-2" />
                  <p className="text-xs font-semibold text-foreground">Nhanh chóng</p>
                  <p className="text-xs text-muted-foreground">&lt; 5 phút</p>
                </div>
                <div>
                  <Heart className="w-6 h-6 text-chart-2 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-foreground">Chuyên nghiệp</p>
                  <p className="text-xs text-muted-foreground">Bác sĩ hàng đầu</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
