import { Fragment, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useNavigationType } from 'react-router-dom'
import { designApi } from '../services/api'
import { slugify } from '../lib/slug'
import RequestError from '../components/RequestError'
import useDocumentTitle from '../hooks/useDocumentTitle'
import useEscapeKey from '../hooks/useEscapeKey'

const MAX_COMPARE_SELECTION = 2

const TABS = [
  { label: 'Tất cả', value: '' },
  { label: 'Hoàn thành', value: 'COMPLETED' },
  { label: 'Đang xử lý', value: 'PROCESSING' },
  { label: 'Đang chờ', value: 'PENDING' },
  { label: 'Lỗi', value: 'FAILED' },
]

const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Mới tạo trước' },
  { value: 'createdAt_asc', label: 'Cũ nhất trước' },
  { value: 'updatedAt_desc', label: 'Cập nhật gần đây' },
  { value: 'roomType_asc', label: 'Tên loại phòng A-Z' },
]

const PAGE_SIZE = 10

const VIEW_MODE_STORAGE_KEY = 'homely_projects_view_mode'

function readStoredViewMode() {
  try {
    const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY)
    return stored === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
  }
}

const PINNED_STORAGE_KEY = 'homely_pinned_designs'

function readStoredPinnedIds() {
  try {
    const stored = window.localStorage.getItem(PINNED_STORAGE_KEY)
    const parsed = stored ? JSON.parse(stored) : []
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

function writeStoredPinnedIds(idsSet) {
  try {
    window.localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(Array.from(idsSet)))
  } catch {
  }
}

const RECENT_PROJECTS_STORAGE_KEY = 'homely_recent_projects'
const RECENT_PROJECTS_MAX = 5

function readStoredRecentProjectIds() {
  try {
    const stored = window.localStorage.getItem(RECENT_PROJECTS_STORAGE_KEY)
    const parsed = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function normalize(str) {
  return (str || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

const ROOM_ICONS = [
  { keyword: 'khach' },
  { keyword: 'ngu' },
  { keyword: 'bep' },
  { keyword: 'lam viec' },
  { keyword: 'tam' },
]

function iconForRoomType(roomType) {
  const n = normalize(roomType)
  return ROOM_ICONS.find((r) => n.includes(r.keyword))?.icon || ''
}

function displayName(job) {
  return job.customName || job.suggestedName || job.roomType || 'Phòng'
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function groupByRelativeDate(items, dateField) {
  const today = startOfDay(new Date())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const weekStart = new Date(today)
  weekStart.setDate(weekStart.getDate() - 7)

  const groups = {
    today: { label: 'Hôm nay', items: [] },
    yesterday: { label: 'Hôm qua', items: [] },
    thisWeek: { label: 'Tuần này', items: [] },
    older: { label: 'Cũ hơn', items: [] },
  }

  items.forEach((item) => {
    const raw = item[dateField]
    const itemDay = raw ? startOfDay(new Date(raw)) : null
    if (itemDay && itemDay.getTime() === today.getTime()) {
      groups.today.items.push(item)
    } else if (itemDay && itemDay.getTime() === yesterday.getTime()) {
      groups.yesterday.items.push(item)
    } else if (itemDay && itemDay.getTime() >= weekStart.getTime() && itemDay.getTime() < yesterday.getTime()) {
      groups.thisWeek.items.push(item)
    } else {
      groups.older.items.push(item)
    }
  })

  return [groups.today, groups.yesterday, groups.thisWeek, groups.older].filter((g) => g.items.length > 0)
}

const COLLAPSED_GROUPS_STORAGE_KEY = 'homely_projects_collapsed_groups'

function readStoredCollapsedGroups() {
  try {
    const stored = window.localStorage.getItem(COLLAPSED_GROUPS_STORAGE_KEY)
    const parsed = stored ? JSON.parse(stored) : []
    return new Set(Array.isArray(parsed) ? parsed : [])
  } catch {
    return new Set()
  }
}

function writeStoredCollapsedGroups(labelsSet) {
  try {
    window.localStorage.setItem(COLLAPSED_GROUPS_STORAGE_KEY, JSON.stringify(Array.from(labelsSet)))
  } catch {
  }
}

const UNDO_TOAST_TIMEOUT_MS = 5000

const PREVIEW_HOVER_DELAY_MS = 350
const PREVIEW_PRESS_DELAY_MS = 500

const SCROLL_TOP_THRESHOLD_PX = 400

let lastSearchValue = ''

let savedProjectsScrollY = null

export default function Projects() {
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState(() => lastSearchValue)
  const [page, setPage] = useState(0)
  const [favoriteOnly, setFavoriteOnly] = useState(false)
  const [sort, setSort] = useState('createdAt_desc')
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState(readStoredViewMode)
  const [pinnedIds, setPinnedIds] = useState(readStoredPinnedIds)
  const [recentProjectIds, setRecentProjectIds] = useState(readStoredRecentProjectIds)
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [collapsedGroupLabels, setCollapsedGroupLabels] = useState(readStoredCollapsedGroups)
  const [undoDeleteJobId, setUndoDeleteJobId] = useState(null)
  const undoDeleteTimerRef = useRef(null)
  const [openMenuJobId, setOpenMenuJobId] = useState(null)
  const [copiedNameJobId, setCopiedNameJobId] = useState(null)
  const copiedNameTimerRef = useRef(null)
  const [selectedForCompare, setSelectedForCompare] = useState([])
  const [editingJobId, setEditingJobId] = useState(null)
  const [editingValue, setEditingValue] = useState('')
  const skipNextBlurSaveRef = useRef(false)
  const [previewJobId, setPreviewJobId] = useState(null)
  const previewTimerRef = useRef(null)
  const cardRefs = useRef([])
  const menuTriggerRefs = useRef({})
  const searchInputRef = useRef(null)
  const navigate = useNavigate()
  const navigationType = useNavigationType()
  const scrollRestoredRef = useRef(false)

  useDocumentTitle('Dự án của tôi')

  function clearPreviewTimer() {
    if (previewTimerRef.current) {
      clearTimeout(previewTimerRef.current)
      previewTimerRef.current = null
    }
  }

  function schedulePreview(jobId, delayMs) {
    clearPreviewTimer()
    previewTimerRef.current = setTimeout(() => {
      previewTimerRef.current = null
      setPreviewJobId(jobId)
    }, delayMs)
  }

  function closePreview() {
    clearPreviewTimer()
    setPreviewJobId(null)
  }

  useEffect(() => () => clearPreviewTimer(), [])

  useEffect(() => () => {
    if (copiedNameTimerRef.current) {
      clearTimeout(copiedNameTimerRef.current)
      copiedNameTimerRef.current = null
    }
  }, [])

  useEffect(() => () => {
    savedProjectsScrollY = window.scrollY
  }, [])

  useEffect(() => {
    if (scrollRestoredRef.current || loading) return
    scrollRestoredRef.current = true
    if (navigationType === 'PUSH' && savedProjectsScrollY !== null) {
      window.scrollTo(0, savedProjectsScrollY)
    }
  }, [loading])

  useEffect(() => {
    function handleScroll() {
      setShowScrollTop(window.scrollY > SCROLL_TOP_THRESHOLD_PX)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => () => clearUndoDeleteTimer(), [])

  useEffect(() => {
    lastSearchValue = search
  }, [search])

  useEscapeKey(previewJobId !== null, closePreview)

  useEffect(() => {
    if (previewJobId === null) return undefined
    function handleDocumentMouseDown(e) {
      if (!e.target.closest('.project-preview-trigger')) {
        closePreview()
      }
    }
    document.addEventListener('mousedown', handleDocumentMouseDown)
    return () => document.removeEventListener('mousedown', handleDocumentMouseDown)
  }, [previewJobId])

  function closeActionsMenu(jobId) {
    setOpenMenuJobId(null)
    menuTriggerRefs.current[jobId]?.focus()
  }

  useEscapeKey(openMenuJobId !== null, () => closeActionsMenu(openMenuJobId))

  useEffect(() => {
    if (openMenuJobId === null) return undefined
    function handleDocumentMouseDown(e) {
      if (!e.target.closest('.project-actions-menu')) {
        closeActionsMenu(openMenuJobId)
      }
    }
    document.addEventListener('mousedown', handleDocumentMouseDown)
    return () => document.removeEventListener('mousedown', handleDocumentMouseDown)
  }, [openMenuJobId])

  useEffect(() => {
    function onGlobalKeyDown(evt) {
      if (evt.key === '/') {
        const active = document.activeElement
        const isTyping = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT' || active.isContentEditable)
        if (isTyping) return
        evt.preventDefault()
        searchInputRef.current?.focus()
        return
      }
      if (evt.key === 'Escape' && document.activeElement === searchInputRef.current) {
        if (search !== '') {
          setSearch('')
        } else {
          searchInputRef.current?.blur()
        }
      }
    }
    document.addEventListener('keydown', onGlobalKeyDown)
    return () => document.removeEventListener('keydown', onGlobalKeyDown)
  }, [search])

  function toggleActionsMenu(jobId, e) {
    e.preventDefault()
    e.stopPropagation()
    setOpenMenuJobId((prev) => (prev === jobId ? null : jobId))
  }

  function handleCopyName(job, e) {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(displayName(job)).then(() => {
      setCopiedNameJobId(job.jobId)
      if (copiedNameTimerRef.current) clearTimeout(copiedNameTimerRef.current)
      copiedNameTimerRef.current = setTimeout(() => {
        copiedNameTimerRef.current = null
        setCopiedNameJobId(null)
      }, 2000)
    }).catch(() => {})
  }

  function recordRecentProject(jobId) {
    const next = [jobId, ...recentProjectIds.filter((id) => id !== jobId)].slice(0, RECENT_PROJECTS_MAX)
    try {
      window.localStorage.setItem(RECENT_PROJECTS_STORAGE_KEY, JSON.stringify(next))
    } catch {
    }
    setRecentProjectIds(next)
  }

  function loadItems() {
    setLoading(true)
    setError(null)
    designApi
      .listMine(status || undefined, page, PAGE_SIZE, favoriteOnly, sort)
      .then((data) => {
        setItems(data.items)
        setMeta(data.meta)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadItems()
  }, [status, page, favoriteOnly, sort])

  function changeTab(value) {
    setStatus(value)
    setPage(0)
  }

  function toggleFavoriteOnly() {
    setFavoriteOnly((prev) => !prev)
    setPage(0)
  }

  function resetFilters() {
    setStatus('')
    setFavoriteOnly(false)
    setSearch('')
    setPage(0)
  }

  function changeSort(value) {
    setSort(value)
    setPage(0)
  }

  function changeViewMode(mode) {
    setViewMode(mode)
    try {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode)
    } catch {
    }
  }

  function togglePin(jobId, e) {
    e.preventDefault()
    e.stopPropagation()
    setPinnedIds((prev) => {
      const next = new Set(prev)
      if (next.has(jobId)) {
        next.delete(jobId)
      } else {
        next.add(jobId)
      }
      writeStoredPinnedIds(next)
      return next
    })
  }

  function toggleGroupCollapsed(label) {
    setCollapsedGroupLabels((prev) => {
      const next = new Set(prev)
      if (next.has(label)) {
        next.delete(label)
      } else {
        next.add(label)
      }
      writeStoredCollapsedGroups(next)
      return next
    })
  }

  function startEditingName(job, e) {
    e.preventDefault()
    e.stopPropagation()
    setEditingJobId(job.jobId)
    setEditingValue(job.customName || '')
  }

  function cancelEditingName(e) {
    e?.preventDefault()
    e?.stopPropagation()
    skipNextBlurSaveRef.current = true
    setEditingJobId(null)
    setEditingValue('')
  }

  function saveEditingName(jobId, e) {
    e?.preventDefault()
    e?.stopPropagation()
    const trimmed = editingValue.trim()
    designApi
      .renameJob(jobId, trimmed ? trimmed : null)
      .then((updated) => {
        setItems((prev) => prev.map((job) => (job.jobId === jobId ? { ...job, customName: updated.customName } : job)))
        setEditingJobId(null)
        setEditingValue('')
      })
      .catch((err) => setError(err.message))
  }

  function handleNameKeyDown(jobId, e) {
    if (e.key === 'Enter') {
      saveEditingName(jobId, e)
    } else if (e.key === 'Escape') {
      cancelEditingName(e)
    }
  }

  function handleNameBlur(jobId) {
    if (skipNextBlurSaveRef.current) {
      skipNextBlurSaveRef.current = false
      return
    }
    saveEditingName(jobId)
  }

  function handleToggleFavorite(jobId, e) {
    e.preventDefault()
    e.stopPropagation()
    designApi
      .toggleFavorite(jobId)
      .then((updated) => {
        setItems((prev) => {
          if (favoriteOnly && !updated.isFavorite) {
            return prev.filter((job) => job.jobId !== jobId)
          }
          return prev.map((job) => (job.jobId === jobId ? { ...job, isFavorite: updated.isFavorite } : job))
        })
      })
      .catch((err) => setError(err.message))
  }

  function handleSoftDelete(jobId, e) {
    e.preventDefault()
    e.stopPropagation()
    designApi
      .softDelete(jobId)
      .then(() => {
        setItems((prev) => prev.filter((job) => job.jobId !== jobId))
        showUndoDeleteToast(jobId)
      })
      .catch((err) => setError(err.message))
  }

  function clearUndoDeleteTimer() {
    if (undoDeleteTimerRef.current) {
      clearTimeout(undoDeleteTimerRef.current)
      undoDeleteTimerRef.current = null
    }
  }

  function showUndoDeleteToast(jobId) {
    clearUndoDeleteTimer()
    setUndoDeleteJobId(jobId)
    undoDeleteTimerRef.current = setTimeout(() => {
      undoDeleteTimerRef.current = null
      setUndoDeleteJobId(null)
    }, UNDO_TOAST_TIMEOUT_MS)
  }

  function handleUndoDelete() {
    if (!undoDeleteJobId) return
    const jobId = undoDeleteJobId
    clearUndoDeleteTimer()
    setUndoDeleteJobId(null)
    designApi
      .restore(jobId)
      .then(() => loadItems())
      .catch((err) => setError(err.message))
  }

  function toggleCompareSelection(jobId) {
    setSelectedForCompare((prev) => {
      if (prev.includes(jobId)) return prev.filter((id) => id !== jobId)
      if (prev.length < MAX_COMPARE_SELECTION) return [...prev, jobId]
      return [...prev.slice(1), jobId]
    })
  }

  function goToCompare() {
    if (selectedForCompare.length !== MAX_COMPARE_SELECTION) return
    const [a, b] = selectedForCompare
    navigate(`/compare?a=${a}&b=${b}`)
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function handleCardKeyDown(e, index, job, href) {
    if (e.target !== e.currentTarget) return
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight': {
        e.preventDefault()
        cardRefs.current[index + 1]?.focus()
        break
      }
      case 'ArrowUp':
      case 'ArrowLeft': {
        e.preventDefault()
        cardRefs.current[index - 1]?.focus()
        break
      }
      case 'Enter':
        e.preventDefault()
        recordRecentProject(job.jobId)
        navigate(href)
        break
      case 'Escape':
        e.currentTarget.blur()
        break
      case 'Home':
        e.preventDefault()
        cardRefs.current[0]?.focus()
        break
      case 'End':
        e.preventDefault()
        cardRefs.current[cardRefs.current.length - 1]?.focus()
        break
      default:
        break
    }
  }

  function renderQuickPreview(job) {
    return (
      <div className="project-preview-popup no-print">
        <div className="project-preview-popup__icon" aria-hidden="true">
          {iconForRoomType(job.roomType)}
        </div>
        <div className="project-preview-popup__body">
          <p className="project-preview-popup__name">{displayName(job)}</p>
          <p className="project-preview-popup__updated">
            Cập nhật: {job.updatedAt ? new Date(job.updatedAt).toLocaleString('vi-VN') : new Date(job.createdAt).toLocaleString('vi-VN')}
          </p>
        </div>
      </div>
    )
  }

  const searchQuery = normalize(search.trim())
  const filteredItems = searchQuery ? items.filter((job) => normalize(job.roomType).includes(searchQuery)) : items
  const displayItems = [...filteredItems].sort((a, b) => {
    const aPinned = pinnedIds.has(a.jobId) ? 1 : 0
    const bPinned = pinnedIds.has(b.jobId) ? 1 : 0
    return bPinned - aPinned
  })
  const pinnedDisplayItems = displayItems.filter((job) => pinnedIds.has(job.jobId))
  const unpinnedDisplayItems = displayItems.filter((job) => !pinnedIds.has(job.jobId))
  const groupDateField = sort === 'updatedAt_desc' ? 'updatedAt' : 'createdAt'
  const dateGroups = groupByRelativeDate(unpinnedDisplayItems, groupDateField)
  const displaySections = [
    ...(pinnedDisplayItems.length > 0 ? [{ label: ' Đã ghim', items: pinnedDisplayItems }] : []),
    ...dateGroups,
  ]
  const orderedDisplayItems = displaySections.flatMap((group) => group.items)
  const jobIndexById = new Map(orderedDisplayItems.map((job, idx) => [job.jobId, idx]))
  const recentProjectsDisplay = recentProjectIds.map((jobId) => {
    const job = items.find((it) => it.jobId === jobId)
    if (job) {
      const slug = slugify(job.roomType)
      return {
        jobId,
        href: slug ? `/designs/${jobId}/${slug}` : `/designs/${jobId}`,
        label: displayName(job),
        icon: iconForRoomType(job.roomType),
      }
    }
    return { jobId, href: `/designs/${jobId}`, label: 'Dự án đã mở', icon: '' }
  })
  const isFilterActive = status !== '' || favoriteOnly || search.trim() !== ''
  const noDesignsAtAll = !loading && !error && items.length === 0 && !isFilterActive
  const noFilterMatch = !loading && !error && !noDesignsAtAll && isFilterActive && (items.length === 0 || filteredItems.length === 0)
  cardRefs.current = []

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
        <h2 style={{ margin: 0 }}>Dự án của tôi</h2>
        <Link
          to="/designs"
          className="btn btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            textDecoration: 'none',
            padding: '8px 16px',
            borderRadius: 10,
            fontWeight: 600,
            fontSize: '0.875rem'
          }}
        >
          Tạo thiết kế 3D mới
        </Link>
      </div>

      {recentProjectsDisplay.length > 0 && (
        <div className="recent-projects-row no-print">
          <span className="recent-projects-row__label"> Mở nhanh</span>
          <div className="recent-projects-row__list">
            {recentProjectsDisplay.map((entry) => (
              <Link
                key={entry.jobId}
                to={entry.href}
                className="recent-projects-row__item"
                onClick={() => recordRecentProject(entry.jobId)}
              >
                <span aria-hidden="true">{entry.icon}</span>
                {entry.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <label style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '16px 0 0', cursor: 'pointer', width: 'fit-content' }}>
        <input type="checkbox" checked={favoriteOnly} onChange={toggleFavoriteOnly} />
        Chỉ hiện yêu thích
      </label>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '16px 0', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TABS.map((tab) => (
            <button
              key={tab.value}
              className={status === tab.value ? '' : 'secondary'}
              onClick={() => changeTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="view-mode-toggle" role="group" aria-label="Kiểu hiển thị">
            <button
              type="button"
              className={viewMode === 'grid' ? '' : 'secondary'}
              onClick={() => changeViewMode('grid')}
              title="Hiển thị dạng lưới"
              aria-pressed={viewMode === 'grid'}
            >
              Lưới
            </button>
            <button
              type="button"
              className={viewMode === 'list' ? '' : 'secondary'}
              onClick={() => changeViewMode('list')}
              title="Hiển thị dạng danh sách"
              aria-pressed={viewMode === 'list'}
            >
              Danh sách
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <input
              type="text"
              ref={searchInputRef}
              className="projects-search-input"
              placeholder="Tìm theo loại phòng (vd: khách, ngủ)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search !== '' && (
              <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                Tìm thấy {filteredItems.length} project
              </span>
            )}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem' }}>
            Sắp xếp theo
            <select
              className="projects-sort-select"
              value={sort}
              onChange={(e) => changeSort(e.target.value)}
              aria-label="Sắp xếp theo"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {error && <RequestError message={error} onRetry={loadItems} />}
      {loading && <p>Đang tải...</p>}

      {noDesignsAtAll && (
        <div className="card">
          <p>Chưa có thiết kế nào. Bắt đầu bằng cách tạo phòng đầu tiên và để AI đề xuất phương án thiết kế.</p>
          <Link to="/designs">
            <button type="button">Tạo thiết kế 3D mới</button>
          </Link>
        </div>
      )}

      {noFilterMatch && (
        <div className="card">
          <p>Không có thiết kế nào khớp với bộ lọc/tìm kiếm hiện tại. Thử đổi từ khoá hoặc bỏ bớt bộ lọc.</p>
          <button type="button" className="secondary" onClick={resetFilters}>
            Xoá bộ lọc
          </button>
        </div>
      )}

      {viewMode === 'grid' && (
      <div className="room-grid">
        {displaySections.map((group) => {
        const isGroupCollapsed = collapsedGroupLabels.has(group.label)
        return (
        <Fragment key={group.label}>
          <h3
            className="project-group-header no-print"
            style={{ gridColumn: '1 / -1', margin: group.label === displaySections[0].label ? '0 0 4px' : '20px 0 4px', fontSize: '1rem' }}
          >
            <button
              type="button"
              onClick={() => toggleGroupCollapsed(group.label)}
              aria-expanded={!isGroupCollapsed}
              style={{
                background: 'none', border: 'none', color: 'inherit', padding: 0,
                margin: 0, font: 'inherit', fontWeight: 700, cursor: 'pointer', display: 'block',
              }}
            >
              {isGroupCollapsed ? '▸' : '▾'} {group.label}
            </button>
          </h3>
          <div style={{ display: isGroupCollapsed ? 'none' : 'contents' }}>
        {group.items.map((job) => {
          const index = jobIndexById.get(job.jobId)
          const slug = slugify(job.roomType)
          const href = slug ? `/designs/${job.jobId}/${slug}` : `/designs/${job.jobId}`
          const canCompare = job.status === 'COMPLETED'
          const isPinned = pinnedIds.has(job.jobId)
          return (
            <div
              className="card project-preview-trigger"
              key={job.jobId}
              style={{ position: 'relative' }}
              ref={(el) => {
                cardRefs.current[index] = el
              }}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => handleCardKeyDown(e, index, job, href)}
              onMouseEnter={() => schedulePreview(job.jobId, PREVIEW_HOVER_DELAY_MS)}
              onMouseLeave={closePreview}
              onTouchStart={() => schedulePreview(job.jobId, PREVIEW_PRESS_DELAY_MS)}
              onTouchEnd={closePreview}
              onTouchCancel={closePreview}
            >
              <span
                className="project-actions-menu no-print"
                onClick={(e) => e.stopPropagation()}
                style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}
              >
                <button
                  type="button"
                  className="project-actions-menu__trigger"
                  title="Tuỳ chọn"
                  aria-haspopup="true"
                  aria-expanded={openMenuJobId === job.jobId}
                  ref={(el) => {
                    menuTriggerRefs.current[job.jobId] = el
                  }}
                  onClick={(e) => toggleActionsMenu(job.jobId, e)}
                >
                  ⋮
                </button>
                {openMenuJobId === job.jobId && (
                  <span className="project-actions-menu__dropdown">
                    <button
                      type="button"
                      onClick={(e) => {
                        startEditingName(job, e)
                        closeActionsMenu(job.jobId)
                      }}
                    >
                      Đổi tên
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        togglePin(job.jobId, e)
                        closeActionsMenu(job.jobId)
                      }}
                    >
                      {isPinned ? 'Bỏ ghim' : 'Ghim lên đầu danh sách'}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        handleToggleFavorite(job.jobId, e)
                        closeActionsMenu(job.jobId)
                      }}
                    >
                      {job.isFavorite ? 'Bỏ yêu thích' : 'Đánh dấu yêu thích'}
                    </button>
                    <button type="button" onClick={(e) => handleCopyName(job, e)}>
                      {copiedNameJobId === job.jobId ? 'Đã sao chép' : 'Sao chép tên'}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        handleSoftDelete(job.jobId, e)
                        closeActionsMenu(job.jobId)
                      }}
                    >
                      Chuyển vào thùng rác
                    </button>
                  </span>
                )}
              </span>
              {canCompare && (
                <label className="compare-select-checkbox no-print" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedForCompare.includes(job.jobId)}
                    onChange={() => toggleCompareSelection(job.jobId)}
                  />
                  Chọn để so sánh
                </label>
              )}
              <Link to={href} onClick={() => recordRecentProject(job.jobId)} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '1.8rem' }}>{iconForRoomType(job.roomType)}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {recentProjectIds[0] === job.jobId && <span className="badge-recent">Vừa mở</span>}
                    <span className={`status-badge status-${job.status}`}>{job.status}</span>
                  </span>
                </div>
                <h3 style={{ margin: '12px 0 4px' }}>{job.customName || job.suggestedName || job.roomType || 'Phòng'}</h3>
                <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                  {new Date(job.createdAt).toLocaleString('vi-VN')}
                </p>
              </Link>
              {editingJobId === job.jobId && (
                <div className="no-print" style={{ marginTop: 4 }} onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    autoFocus
                    maxLength={200}
                    className="design-name-input"
                    value={editingValue}
                    placeholder="Nhập tên riêng, để trống để dùng tên tự sinh"
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={(e) => handleNameKeyDown(job.jobId, e)}
                    onBlur={() => handleNameBlur(job.jobId)}
                    style={{ width: '100%', fontSize: '0.85rem', padding: '4px 6px' }}
                  />
                </div>
              )}
              {previewJobId === job.jobId && renderQuickPreview(job)}
            </div>
          )
        })}
          </div>
        </Fragment>
        )})}
      </div>
      )}

      {viewMode === 'list' && (
      <div className="room-list">
        {displaySections.map((group) => {
        const isGroupCollapsed = collapsedGroupLabels.has(group.label)
        return (
        <Fragment key={group.label}>
          <h3
            className="project-group-header no-print"
            style={{ margin: group.label === displaySections[0].label ? '0 0 4px' : '20px 0 4px', fontSize: '1rem' }}
          >
            <button
              type="button"
              onClick={() => toggleGroupCollapsed(group.label)}
              aria-expanded={!isGroupCollapsed}
              style={{
                background: 'none', border: 'none', color: 'inherit', padding: 0,
                margin: 0, font: 'inherit', fontWeight: 700, cursor: 'pointer', display: 'block',
              }}
            >
              {isGroupCollapsed ? '▸' : '▾'} {group.label}
            </button>
          </h3>
          <div style={{ display: isGroupCollapsed ? 'none' : 'contents' }}>
        {group.items.map((job) => {
          const index = jobIndexById.get(job.jobId)
          const slug = slugify(job.roomType)
          const href = slug ? `/designs/${job.jobId}/${slug}` : `/designs/${job.jobId}`
          const canCompare = job.status === 'COMPLETED'
          const isPinned = pinnedIds.has(job.jobId)
          return (
            <div
              className="room-list-row project-preview-trigger"
              key={job.jobId}
              ref={(el) => {
                cardRefs.current[index] = el
              }}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => handleCardKeyDown(e, index, job, href)}
              onMouseEnter={() => schedulePreview(job.jobId, PREVIEW_HOVER_DELAY_MS)}
              onMouseLeave={closePreview}
              onTouchStart={() => schedulePreview(job.jobId, PREVIEW_PRESS_DELAY_MS)}
              onTouchEnd={closePreview}
              onTouchCancel={closePreview}
            >
              <Link
                to={href}
                className="room-list-main"
                onClick={() => recordRecentProject(job.jobId)}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <span style={{ fontSize: '1.5rem' }}>{iconForRoomType(job.roomType)}</span>
                <span className="room-list-name">
                  {job.customName || job.suggestedName || job.roomType || 'Phòng'}
                </span>
                {recentProjectIds[0] === job.jobId && <span className="badge-recent">Vừa mở</span>}
                <span className={`status-badge status-${job.status}`}>{job.status}</span>
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                  {new Date(job.createdAt).toLocaleString('vi-VN')}
                </span>
              </Link>

              <div className="no-print room-list-actions" onClick={(e) => e.stopPropagation()}>
                {editingJobId === job.jobId && (
                  <input
                    type="text"
                    autoFocus
                    maxLength={200}
                    className="design-name-input"
                    value={editingValue}
                    placeholder="Nhập tên riêng, để trống để dùng tên tự sinh"
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={(e) => handleNameKeyDown(job.jobId, e)}
                    onBlur={() => handleNameBlur(job.jobId)}
                    style={{ fontSize: '0.85rem', padding: '4px 6px' }}
                  />
                )}
                {canCompare && (
                  <label className="compare-select-checkbox no-print" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedForCompare.includes(job.jobId)}
                      onChange={() => toggleCompareSelection(job.jobId)}
                    />
                    So sánh
                  </label>
                )}
                <span className="project-actions-menu">
                  <button
                    type="button"
                    className="project-actions-menu__trigger"
                    title="Tuỳ chọn"
                    aria-haspopup="true"
                    aria-expanded={openMenuJobId === job.jobId}
                    ref={(el) => {
                      menuTriggerRefs.current[job.jobId] = el
                    }}
                    onClick={(e) => toggleActionsMenu(job.jobId, e)}
                  >
                    ⋮
                  </button>
                  {openMenuJobId === job.jobId && (
                    <span className="project-actions-menu__dropdown">
                      <button
                        type="button"
                        onClick={(e) => {
                          startEditingName(job, e)
                          closeActionsMenu(job.jobId)
                        }}
                      >
                        Đổi tên
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          togglePin(job.jobId, e)
                          closeActionsMenu(job.jobId)
                        }}
                      >
                        {isPinned ? 'Bỏ ghim' : 'Ghim lên đầu danh sách'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          handleToggleFavorite(job.jobId, e)
                          closeActionsMenu(job.jobId)
                        }}
                      >
                        {job.isFavorite ? 'Bỏ yêu thích' : 'Đánh dấu yêu thích'}
                      </button>
                      <button type="button" onClick={(e) => handleCopyName(job, e)}>
                        {copiedNameJobId === job.jobId ? 'Đã sao chép' : 'Sao chép tên'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          handleSoftDelete(job.jobId, e)
                          closeActionsMenu(job.jobId)
                        }}
                      >
                        Chuyển vào thùng rác
                      </button>
                    </span>
                  )}
                </span>
              </div>
              {previewJobId === job.jobId && renderQuickPreview(job)}
            </div>
          )
        })}
          </div>
        </Fragment>
        )})}
      </div>
      )}

      {selectedForCompare.length > 0 && (
        <button
          type="button"
          className="compare-fab no-print"
          disabled={selectedForCompare.length !== MAX_COMPARE_SELECTION}
          onClick={goToCompare}
        >
          So sánh {selectedForCompare.length}/{MAX_COMPARE_SELECTION} phương án đã chọn
        </button>
      )}

      {meta && meta.totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
          <button className="secondary" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>
            ← Trước
          </button>
          <span style={{ alignSelf: 'center' }}>
            Trang {meta.page + 1} / {meta.totalPages}
          </span>
          <button className="secondary" disabled={page >= meta.totalPages - 1} onClick={() => setPage((p) => p + 1)}>
            Sau →
          </button>
        </div>
      )}

      {undoDeleteJobId && (
        <div className="card undo-toast no-print" role="status">
          <span>Đã chuyển vào Thùng rác —</span>
          <button type="button" className="secondary" onClick={handleUndoDelete}>
            Hoàn tác
          </button>
        </div>
      )}

      {showScrollTop && (
        <button type="button" className="scroll-to-top-btn no-print secondary" onClick={scrollToTop} aria-label="Về đầu danh sách">
          ↑ Về đầu
        </button>
      )}
    </div>
  )
}
