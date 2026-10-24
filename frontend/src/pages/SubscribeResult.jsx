import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, XCircle, ArrowRight, Loader2 } from 'lucide-react'
import { paymentApi } from '../services/api'

export default function SubscribeResult({ type = 'success' }) {
  const [params] = useSearchParams()
  const orderId = params.get('orderId')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(!!orderId)

  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      return
    }
    paymentApi.orderStatus(orderId)
      .then((res) => {
        setOrder(res)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [orderId])

  const isSuccess = type === 'success'

  return (
    <div className="subscribe-page" style={{ maxWidth: 640, margin: '60px auto', textAlign: 'center' }}>
      <section className="subscribe-success" style={{ padding: '40px 24px', background: 'var(--surface, #1e2024)', borderRadius: 16 }}>
        <div className="success-mark" style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 72,
          height: 72,
          borderRadius: '50%',
          marginBottom: 20,
          background: isSuccess ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: isSuccess ? '#22c55e' : '#ef4444'
        }}>
          {loading ? (
            <Loader2 size={36} className="animate-spin" />
          ) : isSuccess ? (
            <CheckCircle2 size={40} />
          ) : (
            <XCircle size={40} />
          )}
        </div>

        <h2>{isSuccess ? 'Thanh toán thành công!' : 'Thanh toán đã bị hủy'}</h2>
        <p style={{ color: 'var(--text-muted, #94a3b8)', margin: '12px 0 24px' }}>
          {isSuccess
            ? (order ? `Gói ${order.planCode} của bạn đã được kích hoạt thành công.` : 'Đơn hàng của bạn đã hoàn tất và gói thành viên đã được cập nhật.')
            : 'Bạn đã hủy quá trình thanh toán qua PayOS. Bạn có thể quay lại chọn gói khác bất kỳ lúc nào.'}
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link className="plan-cta plan-cta--primary" to="/designs">
            Bắt đầu thiết kế ngay <ArrowRight size={16} />
          </Link>
          {!isSuccess && (
            <Link className="plan-cta" to="/plans">
              Xem lại các gói
            </Link>
          )}
        </div>
      </section>
    </div>
  )
}
