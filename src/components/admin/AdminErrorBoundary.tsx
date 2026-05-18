import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AdminErrorBoundaryState {
  hasError: boolean
  errorMessage: string
}

export class AdminErrorBoundary extends React.Component<React.PropsWithChildren, AdminErrorBoundaryState> {
  constructor(props: React.PropsWithChildren) {
    super(props)
    this.state = {
      hasError: false,
      errorMessage: '',
    }
  }

  static getDerivedStateFromError(error: Error): AdminErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Đã xảy ra lỗi không xác định.',
    }
  }

  componentDidCatch(error: Error) {
    if (import.meta.env.DEV) {
      console.error('[admin/error-boundary]', error)
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' })
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-red-600" />
          <p className="font-semibold text-red-700">Trang quản trị gặp lỗi</p>
          <p className="mt-1 text-sm text-red-600">{this.state.errorMessage}</p>
          <Button className="mt-4" onClick={this.handleRetry}>Thử lại</Button>
        </div>
      </div>
    )
  }
}
