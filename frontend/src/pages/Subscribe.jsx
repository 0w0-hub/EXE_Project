import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, CreditCard, LockKeyhole, Sparkles } from 'lucide-react'
import { PLANS } from './Plans'
import { planApi } from '../services/api'

const formatPrice = (n) => n === 0 ? '0đ' : `${new Intl.NumberFormat('vi-VN').format(n)}đ`

export default function Subscribe() {
  const { planId } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const plan = PLANS.find((item) => item.id === planId)
  const yearly = params.get('billing') === 'yearly'
  const [prices, setPrices] = useState(null)
  useEffect(() => {
    if (!plan || import.meta.env.VITE_MOCK_AUTH === 'true') return
    planApi.list().then((items) => {
      const remote = Array.isArray(items) ? items.find((item) => item.code === plan.code) : null
      if (remote) setPrices({ monthly: remote.monthlyPrice, yearly: remote.yearlyPrice })
    }).catch(() => {})
  }, [plan])
  const price = plan ? (yearly ? (prices?.yearly ?? plan.yearly) : (prices?.monthly ?? plan.monthly)) : 0
  const [method, setMethod] = useState('card')
  const [step, setStep] = useState(1)
  const [confirmed, setConfirmed] = useState(false)
  if (!plan) return <div className="subscribe-page"><Link to="/plans">← Quay lại các gói</Link><h1>Không tìm thấy gói dịch vụ</h1></div>

  return <div className="subscribe-page">
    <Link to="/plans" className="subscribe-back"><ArrowLeft size={17} /> Tất cả gói dịch vụ</Link>
    <div className="subscribe-heading"><span className="plans-eyebrow"><Sparkles size={15} /> HOMELY MEMBERSHIP</span><h1>{confirmed ? 'Bạn đã sẵn sàng!' : 'Hoàn tất đăng ký'}</h1><p>{confirmed ? 'Lựa chọn của bạn đã được ghi nhận.' : 'Chỉ còn một bước nữa để mở khóa không gian sáng tạo.'}</p></div>
    {confirmed ? <section className="subscribe-success"><div className="success-mark"><Check size={30} /></div><h2>Đã chọn gói {plan.name}</h2><p>Đây là bản xem trước luồng đăng ký. Thanh toán chưa được kết nối, bạn sẽ chưa bị tính phí.</p><Link className="plan-cta plan-cta--primary" to="/designs">Khám phá Homely <ArrowRight size={16} /></Link></section> : <div className="subscribe-layout">
      <section className="subscribe-form">
        <div className="subscribe-steps"><span className="is-current"><b>1</b> Gói dịch vụ</span><i /><span className={step === 2 ? 'is-current' : ''}><b>2</b> Thanh toán</span><i /><span><b>3</b> Xác nhận</span></div>
        {step === 1 ? <><h2>Gói {plan.name}</h2><p className="subscribe-muted">Bạn có thể thay đổi gói bất cứ lúc nào trong phần tài khoản.</p><div className="selected-plan"><div><strong>{plan.name}</strong><span>{yearly ? 'Thanh toán theo năm' : 'Thanh toán theo tháng'}</span></div><strong>{formatPrice(price)}<small> / tháng</small></strong></div><button type="button" className="plan-cta plan-cta--primary full" onClick={() => setStep(2)}>Tiếp tục <ArrowRight size={16} /></button></> : <><h2>Phương thức thanh toán</h2><p className="subscribe-muted">Chọn cách bạn muốn thanh toán khi tính năng thanh toán được kết nối.</p><button className={`payment-choice ${method === 'card' ? 'active' : ''}`} onClick={() => setMethod('card')}><CreditCard size={20} /><span><strong>Thẻ tín dụng / ghi nợ</strong><small>Visa, Mastercard, JCB</small></span><i /></button><button className={`payment-choice ${method === 'transfer' ? 'active' : ''}`} onClick={() => setMethod('transfer')}><span className="bank-icon">₫</span><span><strong>Chuyển khoản ngân hàng</strong><small>Quét mã QR để thanh toán</small></span><i /></button><div className="payment-prototype"><LockKeyhole size={16} /> Đây là bản xem trước giao diện. Chưa có giao dịch thật nào được thực hiện.</div><div className="subscribe-actions"><button className="plan-cta" onClick={() => setStep(1)}>Quay lại</button><button className="plan-cta plan-cta--primary" onClick={() => setStep(3)}>Tiếp tục <ArrowRight size={16} /></button></div>{step === 3 && <div className="review-box"><h3>Xác nhận đăng ký</h3><p>{plan.name} · {yearly ? 'Thanh toán theo năm' : 'Thanh toán theo tháng'}</p><strong>{formatPrice(price)} <small>/ tháng</small></strong><button className="plan-cta plan-cta--primary full" onClick={() => setConfirmed(true)}>Xác nhận lựa chọn <Check size={16} /></button></div>}</>}
      </section>
      <aside className="subscribe-summary"><p className="plan-includes">TÓM TẮT ĐƠN HÀNG</p><div className="summary-product"><div className="plan-icon"><Sparkles size={19} /></div><span><strong>Homely {plan.name}</strong><small>{yearly ? 'Gói theo năm' : 'Gói theo tháng'}</small></span></div><div className="summary-line"><span>Tạm tính</span><strong>{formatPrice(price)}</strong></div><div className="summary-line"><span>Thuế</span><span>Đã bao gồm</span></div><div className="plan-divider"/><div className="summary-line summary-total"><strong>Tổng mỗi tháng</strong><strong>{formatPrice(price)}</strong></div>{yearly && price > 0 && <p className="summary-yearly">Thanh toán một lần {formatPrice(price * 12)} mỗi năm</p>}<p className="summary-note">{price === 0 ? 'Gói miễn phí, không cần thanh toán.' : 'Phí gia hạn sẽ được hiển thị trước khi thanh toán.'}</p></aside>
    </div>}
  </div>
}
