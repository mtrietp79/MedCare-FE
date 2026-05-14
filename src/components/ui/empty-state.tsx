import { motion } from 'framer-motion'
import { AlertCircle, Calendar, Search, Heart, FileText, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon = <Search className="w-16 h-16" />,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        'flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/20 bg-gradient-to-b from-secondary/20 to-accent/10 p-8 text-center',
        className,
      )}
    >
      {/* Icon */}
      <motion.div
        variants={itemVariants}
        className="flex justify-center text-muted-foreground"
      >
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {icon}
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h3
        variants={itemVariants}
        className="text-lg font-semibold text-foreground"
      >
        {title}
      </motion.h3>

      {/* Description */}
      {description && (
        <motion.p
          variants={itemVariants}
          className="text-sm text-muted-foreground max-w-sm"
        >
          {description}
        </motion.p>
      )}

      {/* Action Button */}
      {action && (
        <motion.button
          variants={itemVariants}
          onClick={action.onClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  )
}

export function EmptyAppointments() {
  return (
    <EmptyState
      icon={
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Calendar className="w-16 h-16 text-primary/40" />
        </motion.div>
      }
      title="Không có lịch hẹn nào"
      description="Bạn chưa đặt lịch hẹn nào. Hãy bắt đầu tìm kiếm bác sĩ ngay hôm nay."
      action={{
        label: 'Đặt lịch khám',
        onClick: () => window.location.href = '/booking',
      }}
    />
  )
}

export function EmptySearch() {
  return (
    <EmptyState
      icon={
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          <Search className="w-16 h-16 text-accent/40" />
        </motion.div>
      }
      title="Không tìm thấy kết quả"
      description="Hãy thử thay đổi từ khóa tìm kiếm hoặc bộ lọc của bạn."
    />
  )
}

export function EmptyFavorites() {
  return (
    <EmptyState
      icon={
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <Heart className="w-16 h-16 text-destructive/40" />
        </motion.div>
      }
      title="Không có bác sĩ yêu thích"
      description="Thêm các bác sĩ vào danh sách yêu thích để xem lại sau."
      action={{
        label: 'Khám phá bác sĩ',
        onClick: () => window.location.href = '/doctors',
      }}
    />
  )
}

export function EmptyMedicalRecords() {
  return (
    <EmptyState
      icon={
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <FileText className="w-16 h-16 text-primary/40" />
        </motion.div>
      }
      title="Chưa có hồ sơ y tế"
      description="Hồ sơ y tế của bạn sẽ xuất hiện ở đây sau khi bạn khám bệnh."
    />
  )
}

export function ErrorState({
  title = 'Đã xảy ra lỗi',
  description,
  action,
  className,
}: Omit<EmptyStateProps, 'icon'>) {
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut',
      },
    },
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={cn(
        'flex items-center gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-6',
        className,
      )}
    >
      <motion.div
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <AlertCircle className="w-8 h-8 text-destructive flex-shrink-0" />
      </motion.div>

      <div className="flex-1">
        <h3 className="font-semibold text-destructive mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-destructive/80">{description}</p>
        )}
      </div>

      {action && (
        <motion.button
          onClick={action.onClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 bg-destructive/10 text-destructive rounded font-medium hover:bg-destructive/20 transition-colors whitespace-nowrap"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  )
}

export function LoadingSpinner() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex items-center justify-center py-12"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full"
      />
    </motion.div>
  )
}

export function ProgressBar({ progress = 0 }: { progress?: number }) {
  return (
    <motion.div className="w-full h-1 bg-secondary rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-primary to-accent"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      />
    </motion.div>
  )
}
