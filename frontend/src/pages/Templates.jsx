import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { templateApi } from '../services/api'
import useDocumentTitle from '../hooks/useDocumentTitle'
import heroFallback from '../assets/hero-living-room.jpg'
import japandiPhoto from '../assets/templates/japandi.jpg'
import scandinavianPhoto from '../assets/templates/scandinavian.jpg'
import industrialPhoto from '../assets/templates/industrial.jpg'
import bohemianPhoto from '../assets/templates/bohemian.jpg'
import minimalistPhoto from '../assets/templates/minimalist.jpg'

const STYLE_PHOTOS = [
  { keyword: 'japandi', photo: japandiPhoto },
  { keyword: 'scandinavian', photo: scandinavianPhoto },
  { keyword: 'industrial', photo: industrialPhoto },
  { keyword: 'bohemian', photo: bohemianPhoto },
  { keyword: 'minimalist', photo: minimalistPhoto },
]

function photoForTemplate(template) {
  const style = (template.style || '').toLowerCase()
  const match = STYLE_PHOTOS.find((s) => style.includes(s.keyword))
  return match?.photo || heroFallback
}

export default function Templates() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('')
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useDocumentTitle('Mẫu thiết kế')

  useEffect(() => {
    templateApi.categories().then(setCategories).catch((err) => setError(err.message))
  }, [])

  useEffect(() => {
    setLoading(true)
    templateApi
      .list(activeCategory || undefined)
      .then(setTemplates)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [activeCategory])

  function applyTemplate(template) {
    navigate('/rooms/new', { state: { template } })
  }

  return (
    <div>
      <h2>Mẫu thiết kế</h2>
      <p className="text-muted">Chọn mẫu có sẵn để điền nhanh sở thích, phong cách, màu sắc và ngân sách.</p>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '16px 0' }}>
        <button
          className={activeCategory === '' ? '' : 'secondary'}
          onClick={() => setActiveCategory('')}
        >
          Tất cả
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            className={activeCategory === cat ? '' : 'secondary'}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      {error && <p className="error-text">{error}</p>}
      {loading && <p>Đang tải...</p>}

      <div className="room-grid">
        {templates.map((t) => (
          <div className="card" key={t.id}>
            <img className="template-card-photo" src={photoForTemplate(t)} alt={t.style || t.roomType} />
            <h3>{t.style || t.roomType}</h3>
            <p>
              <span className="chip">{t.roomType}</span>
            </p>
            <p>{t.description}</p>
            {t.preferredColors && <p><strong>Màu sắc:</strong> {t.preferredColors}</p>}
            {t.desiredFurniture && <p><strong>Nội thất:</strong> {t.desiredFurniture}</p>}
            {t.suggestedBudget && (
              <p><strong>Ngân sách gợi ý:</strong> {t.suggestedBudget.toLocaleString('vi-VN')} đ</p>
            )}
            <button onClick={() => applyTemplate(t)}>Áp dụng mẫu này</button>
          </div>
        ))}
      </div>

      {!loading && templates.length === 0 && <p>Không có mẫu nào trong danh mục này.</p>}
    </div>
  )
}
