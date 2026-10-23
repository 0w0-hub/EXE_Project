import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, CreditCard, LockKeyhole, Sparkles, Loader2, QrCode } from 'lucide-react'
import { PLANS } from './Plans'
import { planApi, paymentApi } from '../services/api'

const formatPrice = (n) => n === 0 ? '0đ' : `${new Intl.NumberFormat('vi-VN').format(n)}đ`

export default function Subscribe() {
  const { planId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const plan = PLANS.find((item) => item.id === planId)
  const yearly = params.get('billing') === 'yearly'
  const billingType = yearly ? 'yearly' : 'monthly'
  const [prices, setPrices] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!plan || import.meta.env.VITE_MOCK_AUTH === 'true') return
    planApi.list().then((items) => {
      const remote = Array.isArray(items) ? items.find((item) => item.code === plan.code) : null
      if (remote) setPrices({ monthly: remote.monthlyPrice, yearly: remote.yearlyPrice })
    }).catch(() => {})
  }, [plan])

  const price = plan ? (yearly ? (prices?.yearly ?? plan.yearly) : (prices?.monthly ?? plan.monthly)) : 0
  const [method, setMethod] = useState('payos')
  const [step, setStep] = useState(1)

  if (!plan) return <div className="subscribe-page"><Link to="/plans">← Quay lại các gói</Link><h1>Không tìm thấy gói dịch vụ</h1></div>

  const handleCheckout = async () => {
    if (price === 0) {
      navigate('/designs')
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage('')
      const res = await paymentApi.createLink(plan.code, billingType)
      if (res && res.checkoutUrl) {
        window.location.href = res.checkoutUrl
      } else {
        setErrorMessage('Không nhận được đường dẫn thanh toán từ PayOS')
      }
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi tạo link thanh toán PayOS')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="subscribe-page">
      <Link to="/plans" className="subscribe-back"><ArrowLeft size={17} /> Tất cả gói dịch vụ</Link>
      <div className="subscribe-heading">
        <span className="plans-eyebrow"><Sparkles size={15} /> HOMELY MEMBERSHIP</span>
        <h1>Hoàn tất đăng ký</h1>
        <p>Chỉ còn một bước nữa để mở khóa không gian sáng tạo với gói {plan.name}.</p>
      </div>

      <div className="subscribe-layout">
        <section className="subscribe-form">
          <div className="subscribe-steps">
            <span className="is-current"><b>1</b> Gói dịch vụ</span>
            <i />
            <span className={step >= 2 ? 'is-current' : ''}><b>2</b> Thanh toán</span>
            <i />
            <span className={step === 3 ? 'is-current' : ''}><b>3</b> Xác nhận</span>
          </div>

          {errorMessage && (
            <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: 8, color: '#ef4444', marginBottom: 16 }}>
              {errorMessage}
            </div>
          )}

          {step === 1 ? (
            <>
              <h2>Gói {plan.name}</h2>
              <p className="subscribe-muted">Bạn có thể thay đổi hoặc nâng cấp gói bất cứ lúc nào trong phần cài đặt.</p>
              <div className="selected-plan">
                <div>
                  <strong>{plan.name}</strong>
                  <span>{yearly ? 'Thanh toán theo năm' : 'Thanh toán theo tháng'}</span>
                </div>
                <strong>{formatPrice(price)}<small> / tháng</small></strong>
              </div>
              <button type="button" className="plan-cta plan-cta--primary full" onClick={() => setStep(2)}>
                Tiếp tục <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <>
              <h2>Phương thức thanh toán</h2>
              <p className="subscribe-muted">Thanh toán an toàn bảo mật qua cổng chuyển khoản / quét mã QR VietQR của PayOS.</p>

              <button className={`payment-choice ${method === 'payos' ? 'active' : ''}`} onClick={() => setMethod('payos')}>
                <QrCode size={22} color="#16a34a" />
                <span>
                  <strong>Chuyển khoản VietQR (PayOS)</strong>
                  <small>Quét mã QR qua mọi ứng dụng ngân hàng hoặc ví điện tử</small>
                </span>
                <i />
              </button>

              <button className={`payment-choice ${method === 'card' ? 'active' : ''}`} onClick={() => setMethod('card')}>
                <CreditCard size={20} />
                <span>
                  <strong>Thẻ quốc tế / ATM</strong>
                  <small>Visa, Mastercard, JCB qua PayOS</small>
                </span>
                <i />
              </button>

              <div className="payment-prototype" style={{ color: '#16a34a', borderColor: 'rgba(22, 163, 74, 0.3)' }}>
                <LockKeyhole size={16} /> Đã kết nối cổng thanh toán PayOS chính thức.
              </div>

              <div className="subscribe-actions">
                <button className="plan-cta" onClick={() => setStep(1)} disabled={isSubmitting}>Quay lại</button>
                <button className="plan-cta plan-cta--primary" onClick={() => setStep(3)} disabled={isSubmitting}>
                  Tiếp tục <ArrowRight size={16} />
                </button>
              </div>

              {step === 3 && (
                <div className="review-box" style={{ marginTop: 24 }}>
                  <h3>Xác nhận và Chuyển sang thanh toán</h3>
                  <p>{plan.name} · {yearly ? 'Thanh toán theo năm' : 'Thanh toán theo tháng'}</p>
                  <strong>{formatPrice(yearly ? price * 12 : price)} <small>/{yearly ? 'năm' : 'tháng'}</small></strong>
                  <button
                    className="plan-cta plan-cta--primary full"
                    onClick={handleCheckout}
                    disabled={isSubmitting}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" /> Đang tạo mã thanh toán...
                      </>
                    ) : (
                      <>
                        Thanh toán ngay qua PayOS <Check size={16} />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <aside className="subscribe-summary">
          <p className="plan-includes">TÓM TẮT ĐƠN HÀNG</p>
          <div className="summary-product">
            <div className="plan-icon"><Sparkles size={19} /></div>
            <span>
              <strong>Homely {plan.name}</strong>
              <small>{yearly ? 'Gói theo năm' : 'Gói theo tháng'}</small>
            </span>
          </div>
          <div className="summary-line">
            <span>Tạm tính</span>
            <strong>{formatPrice(yearly ? price * 12 : price)}</strong>
          </div>
          <div className="summary-line">
            <span>Thuế</span>
            <span>Đã bao gồm</span>
          </div>
          <div className="plan-divider"/>
          <div className="summary-line summary-total">
            <strong>Tổng thanh toán</strong>
            <strong>{formatPrice(yearly ? price * 12 : price)}</strong>
          </div>
          {yearly && price > 0 && <p className="summary-yearly">Tiết kiệm hơn so với thanh toán theo từng tháng</p>}
          <p className="summary-note">{price === 0 ? 'Gói miễn phí, không cần thanh toán.' : 'Thanh toán an toàn bảo mật qua PayOS.'}</p>
        </aside>
      </div>
    </div>
  )
}
