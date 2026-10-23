import { useEffect, useRef, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, LabelList,
} from 'recharts'
import { adminApi } from '../../services/api'
import AccessDenied from '../../components/AccessDenied'

// ── Màu biểu đồ ───────────────────────────────────────────────────────────────
const COLORS = ['#ea580c', '#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#be185d']
const STATUS_COLOR = {
  COMPLETED: '#16a34a',
  FAILED: '#dc2626',
  PENDING: '#d97706',
  PROCESSING: '#2563eb',
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmt = (n) => (n ?? 0).toLocaleString('vi-VN')
const pct = (n) => `${(n ?? 0).toFixed(1)}%`
const sec = (s) => s == null ? '–' : s < 60 ? `${Math.round(s)}s` : `${(s / 60).toFixed(1)} phút`

function StatTile({ label, value, sub, accent }) {
  return (
    <div className="stat-tile" style={accent ? { '--tile-bg': accent } : undefined}>
      <p className="stat-tile-label">{label}</p>
      <p className="stat-tile-value">{value}</p>
      {sub && <p style={{ fontSize: '0.78rem', color: 'var(--color-muted)', marginTop: 2 }}>{sub}</p>}
    </div>
  )
}

function SectionHeading({ letter, title }) {
  return (
    <h3 style={{ marginTop: 32, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{
        background: 'var(--color-primary)',
        color: '#fff',
        borderRadius: '50%',
        width: 28, height: 28,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '0.85rem', fontWeight: 700, flexShrink: 0,
      }}>{letter}</span>
      {title}
    </h3>
  )
}

function ChartBox({ title, children, note }) {
  return (
    <div style={{
      background: 'var(--color-surface, var(--bg-card, #fff))',
      border: '1px solid var(--color-border)',
      borderRadius: 10,
      padding: '16px 16px 8px',
      marginBottom: 16,
    }}>
      <p style={{ fontWeight: 600, marginBottom: 12, fontSize: '0.9rem' }}>{title}</p>
      {children}
      {note && (
        <p style={{ fontSize: '0.72rem', color: 'var(--color-muted)', marginTop: 8, fontStyle: 'italic' }}>
          {note}
        </p>
      )}
    </div>
  )
}

const CHART_H = 220

// ── Trang chính ───────────────────────────────────────────────────────────────
export default function AdminReport() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [exporting, setExporting] = useState(false)
  const reportRef = useRef()

  useEffect(() => {
    adminApi.analytics().then(setData).catch((err) => setError(err))
  }, [])

  const handleExportPdf = async () => {
    if (!reportRef.current) return
    setExporting(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const { jsPDF } = await import('jspdf')

      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
      const imgWidth = 210
      const pageHeight = 297
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let position = 0

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)

      while (position + imgHeight > pageHeight) {
        position -= pageHeight
        pdf.addPage()
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight)
      }

      const dateStr = new Date().toISOString().slice(0, 10)
      pdf.save(`homely-report-${dateStr}.pdf`)
    } catch (e) {
      alert('Xuất PDF thất bại: ' + e.message)
    } finally {
      setExporting(false)
    }
  }

  if (error) return error.status === 403 ? <AccessDenied /> : <p className="error-text">{error.message}</p>
  if (!data) return <p>Đang tải báo cáo...</p>

  const { userGrowth: ug, behavior: bh, aiEfficiency: ai, retention: rt } = data

  return (
    <div>
      {/* Header — nằm ngoài reportRef để không in ra PDF */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0 }}>Báo cáo toàn hệ thống</h2>
        <span style={{ color: 'var(--color-muted)', fontSize: '0.82rem' }}>
          Tạo lúc {new Date(data.generatedAt).toLocaleString('vi-VN')}
        </span>
        <button
          onClick={handleExportPdf}
          disabled={exporting}
          style={{ marginLeft: 'auto', padding: '8px 18px' }}
        >
          {exporting ? 'Đang xuất...' : '⬇ Xuất PDF'}
        </button>
      </div>

      {/* Nội dung được chụp để xuất PDF */}
      <div ref={reportRef} style={{ background: 'var(--color-bg, #fff)' }}>

        {/* ═══ A. Tăng trưởng người dùng ══════════════════════════════════════ */}
        <SectionHeading letter="A" title="Tăng trưởng người dùng" />
        <div className="room-grid">
          <StatTile label="Tổng tài khoản" value={fmt(ug.totalUsers)} accent="var(--color-primary-tint)" />
          <StatTile label="Đã dùng AI" value={fmt(ug.usersWhoUsedAI)}
            sub={`${pct(ug.aiActivationRate)} tổng users`} accent="var(--color-accent-tint)" />
          <StatTile label="Chưa tạo thiết kế" value={fmt(ug.usersWithNoDesigns)} />
          <StatTile label="Tăng trưởng 30 ngày" value={`${ug.growthRateLast30Days > 0 ? '+' : ''}${pct(ug.growthRateLast30Days)}`}
            sub="so với 30 ngày trước" accent={ug.growthRateLast30Days >= 0 ? 'var(--color-accent-tint)' : 'var(--color-danger-tint)'} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <ChartBox title="Người dùng mới theo ngày (30 ngày qua)">
            <ResponsiveContainer width="100%" height={CHART_H}>
              <AreaChart data={ug.newUsersByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, 'Người dùng mới']} />
                <Area type="monotone" dataKey="value" stroke={COLORS[0]} fill={COLORS[0] + '33'} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartBox>

          <ChartBox title="Người dùng mới theo tuần (12 tuần)">
            <ResponsiveContainer width="100%" height={CHART_H}>
              <BarChart data={ug.newUsersByWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, 'Users mới']} />
                <Bar dataKey="value" fill={COLORS[1]} radius={[3, 3, 0, 0]}>
                  <LabelList dataKey="value" position="top" style={{ fontSize: 9, fill: 'var(--color-fg)' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>

          <ChartBox title="Người dùng mới theo tháng (12 tháng)">
            <ResponsiveContainer width="100%" height={CHART_H}>
              <BarChart data={ug.newUsersByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, 'Users mới']} />
                <Bar dataKey="value" fill={COLORS[0]} radius={[3, 3, 0, 0]}>
                  <LabelList dataKey="value" position="top" style={{ fontSize: 9, fill: 'var(--color-fg)' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </div>

        {/* ═══ B. Hành vi & thời gian sử dụng ════════════════════════════════ */}
        <SectionHeading letter="B" title="Hành vi & thời gian sử dụng" />
        <div style={{
          background: 'var(--color-warning-tint, #fffbeb)',
          border: '1px solid var(--color-warning, #d97706)',
          borderRadius: 8, padding: '8px 14px', marginBottom: 12,
          fontSize: '0.82rem', color: 'var(--color-fg)',
        }}>
          ⚠️ {bh.dataNote}
        </div>
        <div className="room-grid">
          <StatTile label="Tổng lượt hoạt động (proxy)" value={fmt(bh.totalJobsAsActivityProxy)} />
          <StatTile label="TB job/user" value={bh.avgJobsPerActiveUser.toFixed(1)} />
          <StatTile label="Ngày bận nhất" value={bh.busiestDayLabel || '–'}
            sub={`${fmt(bh.busiestDayCount)} hoạt động`} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <ChartBox title="Hoạt động theo ngày (30 ngày qua)" note="Mỗi lần tạo thiết kế = 1 lượt hoạt động">
            <ResponsiveContainer width="100%" height={CHART_H}>
              <AreaChart data={bh.activityByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, 'Lượt hoạt động']} />
                <Area type="monotone" dataKey="value" stroke={COLORS[2]} fill={COLORS[2] + '33'} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartBox>

          <ChartBox title="Phân bố giờ trong ngày">
            <ResponsiveContainer width="100%" height={CHART_H}>
              <BarChart data={bh.activityByHourOfDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, 'Jobs']} labelFormatter={(l) => `${l}:00`} />
                <Bar dataKey="value" fill={COLORS[3]} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>

          <ChartBox title="Hoạt động theo tuần (12 tuần)">
            <ResponsiveContainer width="100%" height={CHART_H}>
              <LineChart data={bh.activityByWeek}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, 'Jobs']} />
                <Line type="monotone" dataKey="value" stroke={COLORS[1]} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartBox>
        </div>

        {/* ═══ C. Hiệu quả sử dụng AI ═════════════════════════════════════════ */}
        <SectionHeading letter="C" title="Hiệu quả sử dụng AI" />
        <div className="room-grid">
          <StatTile label="Tổng job AI" value={fmt(ai.totalJobs)} accent="var(--color-primary-tint)" />
          <StatTile label="Thành công" value={fmt(ai.completedJobs)}
            sub={pct(ai.successRate)} accent="var(--color-accent-tint)" />
          <StatTile label="Thất bại" value={fmt(ai.failedJobs)}
            accent={ai.failedJobs > 0 ? 'var(--color-danger-tint)' : undefined} />
          <StatTile label="TB thời gian xử lý" value={sec(ai.avgProcessingSeconds)} />
          <StatTile label="TB jobs/user" value={(ai.avgJobsPerUser ?? 0).toFixed(1)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <ChartBox title="Tỷ lệ job theo trạng thái">
            <ResponsiveContainer width="100%" height={CHART_H}>
              <PieChart>
                <Pie data={ai.jobsByStatus} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }>
                  {ai.jobsByStatus.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLOR[entry.name] || COLORS[4]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [fmt(v), n]} />
              </PieChart>
            </ResponsiveContainer>
          </ChartBox>

          <ChartBox title="Phong cách phòng phổ biến">
            <ResponsiveContainer width="100%" height={CHART_H}>
              <BarChart data={ai.popularStyles.slice(0, 10)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                <Tooltip formatter={(v) => [v, 'Lượt chọn']} />
                <Bar dataKey="value" fill={COLORS[0]} radius={[0, 3, 3, 0]}>
                  <LabelList dataKey="value" position="right" style={{ fontSize: 10, fill: 'var(--color-fg)' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>

          <ChartBox title="Jobs hoàn thành theo tháng">
            <ResponsiveContainer width="100%" height={CHART_H}>
              <LineChart data={ai.completedJobsByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, 'Completed']} />
                <Line type="monotone" dataKey="value" stroke={COLORS[2]} strokeWidth={2} dot={{ r: 3 }}
                  label={{ position: 'top', fontSize: 9, fill: COLORS[2] }} />
              </LineChart>
            </ResponsiveContainer>
          </ChartBox>

          {ai.processingTimeDistribution.length > 0 && (
            <ChartBox title="Phân bố thời gian xử lý (COMPLETED)">
              <ResponsiveContainer width="100%" height={CHART_H}>
                <BarChart data={ai.processingTimeDistribution.slice(0, 15)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip formatter={(v) => [v, 'Jobs']} />
                  <Bar dataKey="value" fill={COLORS[4]} radius={[3, 3, 0, 0]}>
                    <LabelList dataKey="value" position="top" style={{ fontSize: 9, fill: 'var(--color-fg)' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartBox>
          )}
        </div>

        {/* ═══ D. Giữ chân & chuyển đổi ══════════════════════════════════════ */}
        <SectionHeading letter="D" title="Giữ chân & chuyển đổi" />

        <div className="room-grid" style={{ marginBottom: 16 }}>
          <StatTile label="Đã đăng ký" value={fmt(rt.funnelRegistered)} accent="var(--color-primary-tint)" />
          <StatTile label="Tạo phòng" value={fmt(rt.funnelCreatedRoom)}
            sub={`${rt.funnelRegistered > 0 ? ((rt.funnelCreatedRoom / rt.funnelRegistered) * 100).toFixed(1) : 0}% users`} />
          <StatTile label="Tạo thiết kế" value={fmt(rt.funnelCreatedDesign)}
            sub={`${rt.funnelRegistered > 0 ? ((rt.funnelCreatedDesign / rt.funnelRegistered) * 100).toFixed(1) : 0}% users`} />
          <StatTile label="Có kết quả AI" value={fmt(rt.funnelCompletedDesign)}
            sub={`${rt.funnelRegistered > 0 ? ((rt.funnelCompletedDesign / rt.funnelRegistered) * 100).toFixed(1) : 0}% users`}
            accent="var(--color-accent-tint)" />
          <StatTile label="Retention D1" value={pct(rt.retentionD1Rate)} sub={fmt(rt.retentionD1) + ' users'} />
          <StatTile label="Retention D7" value={pct(rt.retentionD7Rate)} sub={fmt(rt.retentionD7) + ' users'} />
          <StatTile label="Retention D30" value={pct(rt.retentionD30Rate)} sub={fmt(rt.retentionD30) + ' users'} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>
          {/* Funnel — ngang, đọc từ trên xuống */}
          <ChartBox title="Tỷ lệ chuyển đổi (% so với tổng đăng ký)">
            <ResponsiveContainer width="100%" height={CHART_H}>
              <BarChart layout="vertical"
                data={(() => {
                  const total = rt.funnelRegistered || 1
                  return [
                    { step: 'Đã đăng ký', value: 100, count: rt.funnelRegistered },
                    { step: 'Tạo phòng', value: Math.round(rt.funnelCreatedRoom / total * 100), count: rt.funnelCreatedRoom },
                    { step: 'Tạo thiết kế', value: Math.round(rt.funnelCreatedDesign / total * 100), count: rt.funnelCreatedDesign },
                    { step: 'Có kết quả', value: Math.round(rt.funnelCompletedDesign / total * 100), count: rt.funnelCompletedDesign },
                  ]
                })()}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis type="number" tick={{ fontSize: 10 }} unit="%" domain={[0, 100]} />
                <YAxis type="category" dataKey="step" tick={{ fontSize: 11 }} width={90} />
                <Tooltip formatter={(v, _n, p) => [`${v}% (${fmt(p.payload.count)} users)`, 'Tỷ lệ']} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {[COLORS[1], COLORS[0], COLORS[3], COLORS[2]].map((c, i) => <Cell key={i} fill={c} />)}
                  <LabelList dataKey="value" position="right" formatter={(v) => `${v}%`}
                    style={{ fontSize: 11, fontWeight: 600, fill: 'var(--color-fg)' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>

          {/* Retention D1/D7/D30 */}
          <ChartBox title="Tỷ lệ quay lại (D1 / D7 / D30)"
            note="Proxy: user có job trong N ngày đầu sau đăng ký.">
            <ResponsiveContainer width="100%" height={CHART_H}>
              <BarChart data={[
                { name: 'D1\n(1 ngày)', value: Math.round(rt.retentionD1Rate * 10) / 10, count: rt.retentionD1 },
                { name: 'D7\n(7 ngày)', value: Math.round(rt.retentionD7Rate * 10) / 10, count: rt.retentionD7 },
                { name: 'D30\n(30 ngày)', value: Math.round(rt.retentionD30Rate * 10) / 10, count: rt.retentionD30 },
              ]} barSize={60}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
                <Tooltip formatter={(v, _n, p) => [`${v}% — ${fmt(p.payload.count)} users`, 'Tỷ lệ quay lại']} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {[rt.retentionD1Rate, rt.retentionD7Rate, rt.retentionD30Rate].map((v, i) => (
                    <Cell key={i} fill={v >= 20 ? COLORS[2] : v >= 10 ? COLORS[3] : COLORS[0]} />
                  ))}
                  <LabelList dataKey="value" position="top" formatter={(v) => `${v}%`}
                    style={{ fontSize: 12, fontWeight: 700, fill: 'var(--color-fg)' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>

          {/* Plan distribution */}
          <ChartBox title="Phân bố gói đăng ký">
            <ResponsiveContainer width="100%" height={CHART_H}>
              <BarChart data={rt.usersByPlan.filter(p => p.value > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip formatter={(v, n) => [fmt(v) + ' users', n]} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {rt.usersByPlan.filter(p => p.value > 0).map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                  <LabelList dataKey="value" position="top"
                    style={{ fontSize: 13, fontWeight: 700, fill: 'var(--color-fg)' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </div>

        <p style={{ fontSize: '0.72rem', color: 'var(--color-muted)', marginTop: 24, textAlign: 'center' }}>
          Báo cáo Homely · {new Date(data.generatedAt).toLocaleString('vi-VN')} · Chỉ admin mới xem được
        </p>
      </div>
    </div>
  )
}
