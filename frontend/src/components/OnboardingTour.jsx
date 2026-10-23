import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useEscapeKey from '../hooks/useEscapeKey'

const STEPS = [
  {
    title: 'Chào mừng đến với Homely ',
    description:
      'Homely giúp bạn biến một căn phòng thật thành phương án thiết kế nội thất do AI đề xuất, kèm phối cảnh 2D và 3D. Hãy xem qua 4 bước nhanh dưới đây trước khi bắt đầu.',
  },
  {
    title: '1. Tạo phòng mới',
    description:
      'Bấm "+ Tạo phòng mới", chọn loại phòng (phòng khách, phòng ngủ...) và nhập kích thước (rộng x dài) nếu có.',
  },
  {
    title: '2. Ảnh hiện trạng & sở thích',
    description:
      'Tải lên ảnh chụp phòng hiện tại (không bắt buộc) để AI phân tích chính xác hơn, sau đó chọn phong cách, màu sắc, nội thất mong muốn và ngân sách dự kiến.',
  },
  {
    title: '3. Xem kết quả AI thiết kế',
    description:
      'Sau khi gửi yêu cầu, AI sẽ xử lý và trả về phương án thiết kế với hình ảnh 2D/3D để bạn xem, so sánh trước/sau.',
  },
]

export default function OnboardingTour({ onClose }) {
  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(0)
  const step = STEPS[stepIndex]
  const isLastStep = stepIndex === STEPS.length - 1

  useEscapeKey(true, onClose)

  function handleNext() {
    if (isLastStep) {
      onClose()
      navigate('/rooms/new')
      return
    }
    setStepIndex((i) => i + 1)
  }

  return (
    <div className="onboarding-tour-overlay" onClick={onClose}>
      <div
        className="onboarding-tour-modal card"
        role="dialog"
        aria-modal="true"
        aria-label="Hướng dẫn nhanh Homely"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="onboarding-tour-dots">
          {STEPS.map((s, idx) => (
            <span
              key={s.title}
              className={`onboarding-tour-dot ${idx === stepIndex ? 'is-active' : ''}`}
            />
          ))}
        </div>

        <h3 style={{ marginTop: 0 }}>{step.title}</h3>
        <p className="text-muted">{step.description}</p>

        <div className="onboarding-tour-actions">
          <button type="button" className="secondary" onClick={onClose}>
            Bỏ qua
          </button>
          <button type="button" onClick={handleNext}>
            {isLastStep ? 'Bắt đầu' : 'Tiếp theo'}
          </button>
        </div>
      </div>
    </div>
  )
}
