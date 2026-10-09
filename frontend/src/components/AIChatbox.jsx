import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../services/api'

// Sử dụng endpoint /ai/chat nếu backend hỗ trợ, hoặc gọi Gemini trực tiếp qua VITE_GEMINI_API_KEY
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const USE_BACKEND = !GEMINI_API_KEY

async function sendToAI(messages, signal) {
  if (USE_BACKEND) {
    // Gọi endpoint backend /ai/chat
    const data = await api.post('/ai/chat', { messages }, { signal })
    return data?.reply || data?.message || 'Xin lỗi, tôi không hiểu yêu cầu đó.'
  }

  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [
            {
              text: `Bạn là trợ lý AI thông minh của Homely — nền tảng thiết kế nội thất bằng AI.
Bạn giúp người dùng:
- Tư vấn phong cách nội thất (tối giản, Scandinavian, Japandi, hiện đại, cổ điển…)
- Gợi ý màu sắc, vật liệu, bố cục phòng
- Giải thích các tính năng của Homely
- Trả lời câu hỏi về thiết kế phòng

Luôn trả lời bằng tiếng Việt, ngắn gọn, thân thiện, chuyên nghiệp.`,
            },
          ],
        },
        contents,
        generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
      }),
      signal,
    }
  )

  if (!res.ok) throw new Error('AI service không khả dụng')
  const json = await res.json()
  return json.candidates?.[0]?.content?.parts?.[0]?.text || 'Xin lỗi, tôi gặp sự cố. Vui lòng thử lại.'
}

const SUGGESTED_QUESTIONS = [
  'Phong cách Japandi là gì?',
  'Gợi ý màu sơn cho phòng ngủ',
  'Nên chọn đèn như thế nào?',
  'Tối ưu không gian nhỏ',
]

const BOT_AVATAR = (
  <span className="ai-chat__avatar ai-chat__avatar--bot" aria-hidden="true">
    ✦
  </span>
)

export default function AIChatbox() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Xin chào${user?.fullName ? ` **${user.fullName}**` : ''}! 👋\nTôi là trợ lý AI của **Homely**. Hãy hỏi tôi bất cứ điều gì về thiết kế nội thất nhé!`,
      id: 'init',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const abortRef = useRef(null)

  // Cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, open])

  // Focus input khi mở chatbox
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 120)
    }
  }, [open])

  // Hủy request nếu unmount hoặc đóng chat
  useEffect(() => {
    return () => abortRef.current?.abort()
  }, [])

  async function handleSend(text) {
    const trimmed = (text ?? input).trim()
    if (!trimmed || loading) return

    setInput('')
    setError(null)

    const userMsg = { role: 'user', content: trimmed, id: Date.now() }
    const history = [...messages, userMsg]
    setMessages(history)
    setLoading(true)

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    try {
      const reply = await sendToAI(
        history.map(({ role, content }) => ({ role, content })),
        abortRef.current.signal
      )
      setMessages((prev) => [...prev, { role: 'assistant', content: reply, id: Date.now() + 1 }])
    } catch (err) {
      if (err?.name === 'AbortError' || err?.code === 20) return
      setError('Không thể kết nối AI. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleReset() {
    abortRef.current?.abort()
    setMessages([
      {
        role: 'assistant',
        content: `Xin chào${user?.fullName ? ` **${user.fullName}**` : ''}! 👋\nTôi là trợ lý AI của **Homely**. Hãy hỏi tôi bất cứ điều gì về thiết kế nội thất nhé!`,
        id: 'init',
      },
    ])
    setInput('')
    setError(null)
    setLoading(false)
  }

  // Render markdown đơn giản (bold + newline)
  function renderContent(text) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g)
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>
      }
      return part.split('\n').map((line, j) => (
        <span key={`${i}-${j}`}>
          {line}
          {j < part.split('\n').length - 1 && <br />}
        </span>
      ))
    })
  }

  return (
    <>
      {/* Nút mở chatbox */}
      <button
        id="ai-chatbox-toggle"
        className={`ai-chat__fab${open ? ' ai-chat__fab--open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Đóng trợ lý AI' : 'Mở trợ lý AI'}
        title={open ? 'Đóng trợ lý AI' : 'Mở trợ lý AI'}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <path d="M9.5 9h5M9.5 13h3" strokeWidth="1.6"/>
          </svg>
        )}
        {/* Dot trạng thái online */}
        <span className="ai-chat__fab-dot" aria-hidden="true" />
      </button>

      {/* Panel chatbox */}
      <div
        id="ai-chatbox-panel"
        className={`ai-chat__panel${open ? ' ai-chat__panel--open' : ''}`}
        role="dialog"
        aria-label="Trợ lý AI Homely"
        aria-modal="false"
      >
        {/* Header */}
        <div className="ai-chat__header">
          <div className="ai-chat__header-left">
            <span className="ai-chat__header-icon" aria-hidden="true">✦</span>
            <div>
              <p className="ai-chat__header-title">Trợ lý AI Homely</p>
              <p className="ai-chat__header-subtitle">
                <span className="ai-chat__online-dot" aria-hidden="true" />
                Luôn sẵn sàng hỗ trợ
              </p>
            </div>
          </div>
          <div className="ai-chat__header-actions">
            <button
              className="ai-chat__icon-btn"
              onClick={handleReset}
              title="Cuộc trò chuyện mới"
              aria-label="Bắt đầu cuộc trò chuyện mới"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.68"/>
              </svg>
            </button>
            <button
              className="ai-chat__icon-btn"
              onClick={() => setOpen(false)}
              title="Đóng"
              aria-label="Đóng chatbox"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        {/* Tin nhắn */}
        <div className="ai-chat__messages" role="log" aria-live="polite">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`ai-chat__msg ai-chat__msg--${msg.role}`}
            >
              {msg.role === 'assistant' && BOT_AVATAR}
              <div className="ai-chat__bubble">
                {renderContent(msg.content)}
              </div>
              {msg.role === 'user' && (
                <span className="ai-chat__avatar ai-chat__avatar--user" aria-hidden="true">
                  {user?.fullName?.[0]?.toUpperCase() || 'U'}
                </span>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="ai-chat__msg ai-chat__msg--assistant">
              {BOT_AVATAR}
              <div className="ai-chat__bubble ai-chat__bubble--typing">
                <span /><span /><span />
              </div>
            </div>
          )}

          {/* Lỗi */}
          {error && (
            <div className="ai-chat__error">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Gợi ý nhanh — chỉ hiển thị khi chưa có câu hỏi */}
        {messages.length === 1 && !loading && (
          <div className="ai-chat__suggestions">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                className="ai-chat__suggestion-chip"
                onClick={() => handleSend(q)}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="ai-chat__footer">
          <textarea
            ref={inputRef}
            id="ai-chatbox-input"
            className="ai-chat__input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi về thiết kế nội thất…"
            rows={1}
            maxLength={1000}
            disabled={loading}
            aria-label="Nhập câu hỏi"
          />
          <button
            id="ai-chatbox-send"
            className="ai-chat__send-btn"
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            aria-label="Gửi tin nhắn"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  )
}
