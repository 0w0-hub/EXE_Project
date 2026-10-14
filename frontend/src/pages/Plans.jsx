import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Crown, Sparkles, WandSparkles } from 'lucide-react'
import { planApi } from '../services/api'

export const PLANS = [
  { id: 'free', code: 'FREE', name: 'Miễn phí', monthly: 0, yearly: 0, note: 'Dùng thử Homely', icon: Sparkles, features: ['3 thiết kế AI mỗi tháng', '5 dự án đang hoạt động', 'Thư viện nội thất cơ bản', 'Xuất thiết kế tiêu chuẩn'] },
  { id: 'plus', code: 'PLUS', name: 'Plus', monthly: 49000, yearly: 29000, note: 'Dành cho không gian của riêng bạn', icon: WandSparkles, popular: true, features: ['30 thiết kế AI mỗi tháng', 'Dự án không giới hạn', 'Đầy đủ thư viện nội thất 3D', 'Xuất ảnh chất lượng cao', 'Lưu và so sánh nhiều phương án'] },
  { id: 'studio', code: 'STUDIO', name: 'Studio', monthly: 79000, yearly: 59000, note: 'Cho người làm thiết kế chuyên nghiệp', icon: Crown, features: ['Thiết kế AI không giới hạn', 'Mọi quyền lợi của Plus', 'Kết xuất ảnh ưu tiên', 'Chia sẻ dự án với khách hàng', 'Hỗ trợ ưu tiên'] },
]

const money = (amount) => amount === 0 ? '0đ' : `${new Intl.NumberFormat('vi-VN').format(amount)}đ`

export default function Plans() {
  const [yearly, setYearly] = useState(false)
  const [plans, setPlans] = useState(PLANS)
  useEffect(() => {
    if (import.meta.env.VITE_MOCK_AUTH === 'true') return
    planApi.list().then((apiPlans) => {
      if (!Array.isArray(apiPlans)) return
      setPlans((current) => current.map((plan) => {
        const remote = apiPlans.find((item) => item.code === plan.code)
        return remote ? { ...plan, monthly: remote.monthlyPrice, yearly: remote.yearlyPrice } : plan
      }))
    }).catch(() => {})
  }, [])
  return (
    <div className="plans-page">
      <div className="plans-topline"><span className="plans-eyebrow"><Sparkles size={15} /> HOMELY MEMBERSHIP</span><Link to="/account/activity">Tài khoản của tôi</Link></div>
      <section className="plans-hero">
        <div><p className="plans-kicker">THIẾT KẾ KHÔNG GIỚI HẠN TRÍ TƯỞNG TƯỢNG</p><h1>Mỗi căn phòng đều<br /><em>xứng đáng thật đẹp.</em></h1><p className="plans-lead">Chọn gói phù hợp với hành trình của bạn. Bắt đầu miễn phí, nâng cấp bất cứ lúc nào.</p></div>
        <div className="plans-hero-note"><span>✳</span><p>Không gian đẹp bắt đầu từ<br /><strong>một ý tưởng</strong></p></div>
      </section>
      <div className="plans-billing"><span className={!yearly ? 'selected' : ''}>Theo tháng</span><button type="button" role="switch" aria-checked={yearly} onClick={() => setYearly(!yearly)} className={`plans-switch ${yearly ? 'on' : ''}`}><i /></button><span className={yearly ? 'selected' : ''}>Theo năm</span><small>Tiết kiệm 20%</small></div>
      <section className="plans-grid" aria-label="Các gói dịch vụ">
        {plans.map((plan) => { const Icon = plan.icon; const price = yearly ? plan.yearly : plan.monthly; return <article key={plan.id} className={`plan-card ${plan.popular ? 'plan-card--popular' : ''}`}>
          {plan.popular && <div className="plan-ribbon">ĐƯỢC YÊU THÍCH</div>}
          <div className="plan-icon"><Icon size={21} /></div><h2>{plan.name}</h2><p className="plan-note">{plan.note}</p>
          <div className="plan-price"><strong>{money(price)}</strong><span>{price === 0 ? '/ mãi mãi' : '/ tháng'}</span></div>{yearly && price > 0 && <p className="plan-billed">Thanh toán {money(price * 12)} mỗi năm</p>}
          <Link className={plan.popular ? 'plan-cta plan-cta--primary' : 'plan-cta'} to={`/subscribe/${plan.id}?billing=${yearly ? 'yearly' : 'monthly'}`}>{plan.id === 'free' ? 'Bắt đầu miễn phí' : 'Chọn gói này'} <ArrowRight size={16} /></Link>
          <div className="plan-divider" /><p className="plan-includes">GÓI NÀY BAO GỒM</p><ul>{plan.features.map((feature) => <li key={feature}><Check size={16} />{feature}</li>)}</ul>
        </article> })}
      </section>
      <p className="plans-footnote">Giá đã bao gồm thuế. Bạn có thể thay đổi hoặc hủy gói bất cứ lúc nào.</p>
    </div>
  )
}
