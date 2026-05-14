import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, Calendar, Shield, Clock } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('')

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  }

  const floatingVariants = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/30">
      {/* Animated decorative elements */}
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.6, 0.8, 0.6],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"
      />
      <motion.div
        animate={{ 
          scale: [1, 1.15, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"
      />
      
      <div className="container mx-auto px-4 py-16 md:py-24 relative">
        <motion.div
          className="grid lg:grid-cols-2 gap-12 items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Content */}
          <motion.div className="space-y-8">
            <motion.div className="space-y-4" variants={itemVariants}>
              <motion.div
                className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium"
                whileHover={{ scale: 1.05, backgroundColor: 'var(--primary-light)' }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                <Shield className="w-4 h-4" />
                Đặt lịch an toàn & tiện lợi
              </motion.div>
              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight text-balance"
                variants={itemVariants}
              >
                Chăm sóc sức khỏe{' '}
                <motion.span
                  className="text-primary inline-block"
                  animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  thông minh
                </motion.span>
              </motion.h1>
              <motion.p
                className="text-lg text-muted-foreground max-w-lg leading-relaxed"
                variants={itemVariants}
              >
                Đặt lịch khám bệnh trực tuyến với các bác sĩ hàng đầu Việt Nam. 
                Tiết kiệm thời gian, không cần chờ đợi.
              </motion.p>
            </motion.div>

            {/* Search bar */}
            <motion.div
              variants={itemVariants}
              whileHover={{ boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)' }}
              className="bg-card rounded-2xl p-2 shadow-lg border max-w-xl transition-all"
            >
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Tìm bác sĩ, chuyên khoa..."
                    className="pl-12 h-12 border-0 bg-transparent text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button size="lg" className="h-12 px-6" asChild>
                    <Link to={`/doctors${searchQuery ? `?q=${searchQuery}` : ''}`}>
                      Tìm kiếm
                    </Link>
                  </Button>
                </motion.div>
              </div>
            </motion.div>

            {/* Quick stats */}
            <motion.div className="flex flex-wrap gap-8" variants={itemVariants}>
              {[
                { icon: Calendar, label: '50K+', desc: 'Lịch hẹn đã đặt', color: 'primary' },
                { icon: Clock, label: '24/7', desc: 'Hỗ trợ khách hàng', color: 'accent' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-3"
                  whileHover={{ x: 8 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  <div className={`w-12 h-12 bg-${stat.color}/10 rounded-xl flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 text-${stat.color}`} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-foreground">{stat.label}</div>
                    <div className="text-sm text-muted-foreground">{stat.desc}</div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Image/Illustration placeholder */}
          <motion.div
            className="relative hidden lg:block"
            initial={{ opacity: 0, scale: 0.9, x: 50 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
          >
            <div className="relative w-full aspect-square max-w-lg mx-auto">
              {/* Main card */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80 rounded-3xl shadow-2xl"
                animate={{ rotate: [2, -2, 2] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ transform: 'rotate(3deg)' }}
              />
              <motion.div
                className="absolute inset-0 bg-card rounded-3xl shadow-xl flex items-center justify-center"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="text-center p-8">
                  <motion.div
                    className="w-32 h-32 bg-primary/10 rounded-full mx-auto mb-6 flex items-center justify-center"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <svg className="w-16 h-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </motion.div>
                  <h3 className="text-xl font-bold text-foreground mb-2">Bác sĩ chuyên khoa</h3>
                  <p className="text-muted-foreground">85+ bác sĩ hàng đầu</p>
                </div>
              </motion.div>
              
              {/* Floating cards */}
              <motion.div
                className="absolute -top-4 -right-4 bg-card rounded-2xl p-4 shadow-lg border"
                variants={floatingVariants}
                animate="animate"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">98%</div>
                    <div className="text-xs text-muted-foreground">Hài lòng</div>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                className="absolute -bottom-4 -left-4 bg-card rounded-2xl p-4 shadow-lg border"
                variants={floatingVariants}
                animate="animate"
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground">15K+</div>
                    <div className="text-xs text-muted-foreground">Bệnh nhân</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
