interface BillingSummaryPanelProps {
  isFollowUpAppointment: boolean
  consultationFee: number
  consultationFeeApplied: number
  medicineTotal: number
  serviceTotal: number
  total: number
}

function formatCurrencyVnd(value?: number): string {
  return `${new Intl.NumberFormat('vi-VN').format(Number(value || 0))} VND`
}

export function BillingSummaryPanel({
  isFollowUpAppointment,
  consultationFee,
  consultationFeeApplied,
  medicineTotal,
  serviceTotal,
  total,
}: BillingSummaryPanelProps) {
  return (
    <section className="space-y-3 rounded-lg border border-slate-200 p-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Tổng chi phí sau khám</h3>
        <p className="text-xs text-slate-500">Phần này chỉ đọc, hệ thống sẽ đối soát lại theo hóa đơn backend.</p>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Tiền thuốc</span>
          <span className="font-medium text-slate-900">{formatCurrencyVnd(medicineTotal)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-600">Tiền dịch vụ</span>
          <span className="font-medium text-slate-900">{formatCurrencyVnd(serviceTotal)}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-slate-600">Phí khám</span>
          {isFollowUpAppointment ? (
            <span className="font-medium text-slate-900">{formatCurrencyVnd(consultationFeeApplied)}</span>
          ) : (
            <span className="font-medium text-emerald-700">Đã thanh toán trước (0 VND)</span>
          )}
        </div>

        {isFollowUpAppointment ? (
          <p className="text-xs text-slate-500">Phí tái khám áp dụng: {formatCurrencyVnd(consultationFee || consultationFeeApplied)}</p>
        ) : null}
      </div>

      <div className="border-t border-slate-200 pt-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-900">Tổng thanh toán</span>
          <span className="text-lg font-bold text-slate-900">{formatCurrencyVnd(total)}</span>
        </div>
      </div>
    </section>
  )
}
