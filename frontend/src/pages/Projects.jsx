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

// TASK-106: giá trị phải khớp đúng với các giá trị `sort` hợp lệ ở backend (DesignController.listMine/
// DesignService) — mặc định "createdAt_desc" giữ đúng hành vi cũ.
const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Mới tạo trước' },
  { value: 'createdAt_asc', label: 'Cũ nhất trước' },
  { value: 'updatedAt_desc', label: 'Cập nhật gần đây' },
  { value: 'roomType_asc', label: 'Tên loại phòng A-Z' },
]

const PAGE_SIZE = 10

// TASK-119: key localStorage lưu lựa chọn kiểu hiển thị (grid/list) — theo đúng pattern
// homely_theme (TASK-088)/homely_onboarding_seen (TASK-081): đọc đồng bộ lúc khởi tạo state, bọc
// try/catch vì localStorage có thể throw ở chế độ duyệt web riêng tư (AC yêu cầu console sạch lỗi).
const VIEW_MODE_STORAGE_KEY = 'homely_projects_view_mode'

// Mặc định 'grid' nếu chưa từng chọn — giữ nguyên trải nghiệm hiện tại cho ai chưa đổi (không hồi quy).
function readStoredViewMode() {
  try {
    const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY)
    return stored === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
  }
}

// TASK-122: key localStorage lưu danh sách jobId đã ghim — THUẦN CLIENT-SIDE (không đồng bộ nhiều
// thiết bị, không lưu server, khác "Yêu thích" TASK-103). Cùng pattern try/catch với
// VIEW_MODE_STORAGE_KEY ở trên để console luôn sạch lỗi kể cả ở chế độ duyệt web riêng tư.
const PINNED_STORAGE_KEY = 'homely_pinned_designs'

// Mặc định Set rỗng nếu chưa từng ghim/đọc lỗi — không có gì được ghim.
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
    // Không lưu được (chế độ riêng tư/quota) vẫn áp dụng cho phiên hiện tại, chỉ không giữ được
    // lựa chọn sau khi tải lại trang — giống pattern changeViewMode.
  }
}

// TASK-147: key localStorage lưu jobId các project VỪA MỞ (click) gần nhất, mới nhất lên đầu, tối đa 5,
// bỏ trùng — ĐÚNG pattern `homely_recent_furniture` (TASK-130, Room3DViewer.jsx): lazy init đọc lúc
// khởi tạo state, bọc try/catch để console luôn sạch lỗi kể cả ở chế độ duyệt web riêng tư. Khác hẳn
// "Dự án gần đây" trên Dashboard (RecentDesigns, dữ liệu server "vừa SỬA") — đây thuần client-side,
// chỉ ghi nhận hành vi "vừa TRUY CẬP" của riêng trình duyệt này.
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

// Bỏ dấu để so khớp ổn định kể cả khi dữ liệu roomType không nhất quán dấu (vd "Phong khach").
function normalize(str) {
  return (str || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

const ROOM_ICONS = [
  { keyword: 'khach', icon: '🛋️' },
  { keyword: 'ngu', icon: '🛏️' },
  { keyword: 'bep', icon: '🍳' },
  { keyword: 'lam viec', icon: '💻' },
  { keyword: 'tam', icon: '🛁' },
]

function iconForRoomType(roomType) {
  const n = normalize(roomType)
  return ROOM_ICONS.find((r) => n.includes(r.keyword))?.icon || '🏠'
}

// TASK-106: cùng thứ tự ưu tiên tên hiển thị dùng ở cả card/row/preview popup — tách hàm dùng chung
// để không lặp lại logic customName > suggestedName > roomType > fallback "Phòng" ở nhiều nơi.
function displayName(job) {
  return job.customName || job.suggestedName || job.roomType || 'Phòng'
}

// TASK-157: quy về đầu ngày (00:00:00 local) để so sánh NGÀY LỊCH, không phải chênh lệch 24h tuyệt
// đối — vd 23h hôm qua và 1h hôm nay chỉ cách nhau 2 tiếng nhưng vẫn phải rơi vào 2 nhóm "Hôm qua"/
// "Hôm nay" khác nhau theo đúng ngữ nghĩa "ngày tương đối" của Scope.
function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

// TASK-157: nhóm `items` theo thời gian tương đối so với thời điểm gọi hàm (new Date()), dựa trên
// `dateField` do caller truyền vào (xem lựa chọn createdAt/updatedAt ở nơi gọi trong component, theo
// đúng field đang dùng để sắp xếp hiện tại — Scope). Trả về mảng { label, items } CHỈ gồm các nhóm
// THỰC SỰ có item (không trả nhóm rỗng — AC), theo thứ tự cố định Hôm nay > Hôm qua > Tuần này >
// Cũ hơn. Thứ tự các item BÊN TRONG mỗi nhóm giữ nguyên đúng thứ tự đã có ở `items` truyền vào —
// hàm này chỉ PHÂN LOẠI, không sắp xếp lại (không đụng logic sort/pin hiện có, đúng Out of scope).
function groupByRelativeDate(items, dateField) {
  const today = startOfDay(new Date())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  // "Tuần này" = trong 7 ngày gần nhất KHÔNG tính Hôm nay/Hôm qua (Scope) → từ 7 ngày trước tới
  // trước hôm qua, tức [weekStart, yesterday).
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
    // Không có giá trị ngày hợp lệ (dữ liệu cũ/thiếu field) → xếp vào "Cũ hơn" thay vì bịa ngày hoặc
    // làm rớt item khỏi danh sách hiển thị (không được mất item nào so với danh sách đã filter/sort).
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

// TASK-160: key localStorage lưu NHÃN các nhóm ngày đang ĐÓNG (vd "Hôm nay") — lưu theo nhãn thay vì
// index/thứ tự vì `displaySections`/`dateGroups` (TASK-157) được TÍNH LẠI mỗi render (nhóm nào có item
// mới xuất hiện/biến mất tuỳ dữ liệu) nên không thể suy trạng thái đóng/mở từ vị trí trong mảng đó —
// phải là 1 state độc lập, bền qua render, khớp đúng gợi ý ở Scope. Cùng pattern try/catch an toàn với
// PINNED_STORAGE_KEY ở trên (console sạch lỗi kể cả chế độ duyệt web riêng tư).
const COLLAPSED_GROUPS_STORAGE_KEY = 'homely_projects_collapsed_groups'

// Mặc định Set rỗng (tất cả nhóm mở) nếu chưa từng đóng nhóm nào/đọc lỗi.
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
    // Không lưu được (chế độ riêng tư/quota) vẫn áp dụng cho phiên hiện tại, chỉ không giữ được
    // trạng thái đóng/mở sau khi tải lại trang — giống pattern writeStoredPinnedIds.
  }
}

// TASK-160: thời gian tự ẩn thanh "Hoàn tác" sau khi xoá mềm 1 project (Scope: "vài giây (vd 5s)").
const UNDO_TOAST_TIMEOUT_MS = 5000

// TASK-144: hover phải giữ chuột lại một chút trước khi hiện popup (tránh popup chớp nháy khi user
// chỉ đang rê chuột lướt qua danh sách để tìm project) — bấm giữ (chủ yếu cho thiết bị cảm ứng,
// không có hover) cần giữ lâu hơn để phân biệt với 1 cú chạm/tap bình thường (vẫn phải điều hướng
// như cũ, không đổi hành vi click chính theo Out of scope của task).
const PREVIEW_HOVER_DELAY_MS = 350
const PREVIEW_PRESS_DELAY_MS = 500

// TASK-163: ngưỡng (px) cuộn xuống trước khi hiện nút nổi "↑ Về đầu" — theo đúng gợi ý "vd 400px" ở Scope.
const SCROLL_TOP_THRESHOLD_PX = 400

// TASK-154: biến MODULE-LEVEL (KHÔNG phải React state/localStorage/sessionStorage) lưu giá trị
// `search` gần nhất — module chỉ được load 1 lần trong 1 phiên SPA nên biến này tự nhiên sống sót
// qua unmount/remount của component (vd mở 1 project rồi Back về /projects) TRONG CÙNG PHIÊN, nhưng
// mất khi F5/đóng tab (biến JS module bị nạp lại từ đầu) — đúng đúng nghĩa "cùng phiên" theo yêu cầu,
// KHÔNG cần thêm cơ chế lưu trữ trình duyệt nào, và KHÔNG đổi quyết định `search`/`sort` là
// session-transient (TASK-106/150) thành persist qua reload trang.
let lastSearchValue = ''

// TASK-168: cùng pattern module-level như lastSearchValue ở trên — lưu window.scrollY NGAY TRƯỚC khi
// rời /projects (xem useEffect cleanup lúc unmount bên dưới). Chỉ dùng lại để khôi phục khi quay lại
// /projects qua điều hướng PUSH (bấm LINK, forward navigation mới) — xem useNavigationType +
// scrollRestoredRef trong component. KHÔNG đụng gì tới trường hợp POP (nút Back trình duyệt): browser
// đã tự khôi phục đúng nhờ history.scrollRestoration = 'auto' mặc định (đã xác nhận ở TASK-168), code
// này chỉ không làm gì thêm khi navigationType là 'POP' — không ghi đè/can thiệp cơ chế đó.
let savedProjectsScrollY = null

export default function Projects() {
  const [status, setStatus] = useState('')
  // TASK-154: lazy initializer đọc `lastSearchValue` (module-level) — nếu component vừa remount
  // trong cùng phiên (vd quay lại từ 1 project) thì khôi phục đúng từ khoá đã gõ; lần đầu tải trang
  // `lastSearchValue` vẫn là '' nên hành vi mặc định không đổi.
  const [search, setSearch] = useState(() => lastSearchValue)
  const [page, setPage] = useState(0)
  const [favoriteOnly, setFavoriteOnly] = useState(false)
  // TASK-106: session-only (không nhớ qua localStorage giữa các phiên — xem Out of scope TASK-106).
  const [sort, setSort] = useState('createdAt_desc')
  const [items, setItems] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  // TASK-119: 'grid' (mặc định, hành vi cũ) | 'list' — đọc lúc mount qua lazy initializer, ghi lại
  // mỗi khi đổi (xem changeViewMode) để giữ lựa chọn qua các lần ghé lại trang.
  const [viewMode, setViewMode] = useState(readStoredViewMode)
  // TASK-122: jobId đang được ghim lên đầu danh sách — độc lập với filter/sort, THUẦN CLIENT-SIDE
  // (localStorage), đọc lúc mount qua lazy initializer giống viewMode ở trên.
  const [pinnedIds, setPinnedIds] = useState(readStoredPinnedIds)
  // TASK-147: jobId các project vừa mở gần nhất — đọc lúc mount qua lazy initializer giống pinnedIds.
  const [recentProjectIds, setRecentProjectIds] = useState(readStoredRecentProjectIds)
  // TASK-163: chỉ HIỆN/ẨN nút nổi "↑ Về đầu" — không lưu localStorage (thuần trạng thái cuộn trang
  // hiện tại, mất khi rời trang là đúng ý nghĩa, không cần nhớ qua lần ghé lại sau).
  const [showScrollTop, setShowScrollTop] = useState(false)
  // TASK-160: nhãn các nhóm (ngày HOẶC "📌 Đã ghim" — cùng dùng chung 1 kiểu tiêu đề `<h3
  // className="project-group-header">` nên áp dụng chung 1 cơ chế thu gọn) hiện đang ĐÓNG — đọc lúc
  // mount qua lazy initializer giống pinnedIds/recentProjectIds ở trên.
  const [collapsedGroupLabels, setCollapsedGroupLabels] = useState(readStoredCollapsedGroups)
  // TASK-160: jobId vừa được xoá mềm mà thanh "Hoàn tác" đang hiện cho nó — null nghĩa là không có
  // thanh nào đang hiện. Chỉ 1 thanh hiện cùng lúc (xoá tiếp 1 project khác trong lúc thanh đang hiện
  // sẽ thay bằng thanh mới, dời lại timer 5s — đủ dùng cho Scope, không cần hàng đợi nhiều thanh).
  const [undoDeleteJobId, setUndoDeleteJobId] = useState(null)
  const undoDeleteTimerRef = useRef(null)
  // TASK-147: menu ngữ cảnh "⋮" đang mở (chỉ 1 menu mở cùng lúc) — cùng pattern editingJobId/previewJobId.
  const [openMenuJobId, setOpenMenuJobId] = useState(null)
  // TASK-168: jobId vừa "📋 Sao chép tên" gần nhất — điều khiển label đổi tạm thời "Đã sao chép" của
  // ĐÚNG mục menu đó, tự trở lại null sau ~2s (xem handleCopyName/copiedNameTimerRef bên dưới). Không
  // gộp vào openMenuJobId vì mục đích khác (openMenuJobId chỉ quyết định menu nào đang MỞ).
  const [copiedNameJobId, setCopiedNameJobId] = useState(null)
  const copiedNameTimerRef = useRef(null)
  const [selectedForCompare, setSelectedForCompare] = useState([])
  // TASK-106: ô nhập tên riêng inline — chỉ 1 card được sửa cùng lúc.
  const [editingJobId, setEditingJobId] = useState(null)
  const [editingValue, setEditingValue] = useState('')
  // Esc huỷ sửa tên phải KHÔNG kích hoạt lưu qua sự kiện blur theo sau (input mất focus khi unmount) —
  // cờ này báo cho onBlur biết lần mất focus tới là do huỷ, không phải do user click ra ngoài để lưu.
  const skipNextBlurSaveRef = useRef(false)
  // TASK-144: jobId đang được xem trước (hover/bấm giữ) — null nghĩa là không có popup nào đang mở.
  // Chỉ 1 popup hiện cùng lúc (giống editingJobId ở trên), THUẦN UI, không fetch thêm dữ liệu (dùng
  // đúng field đã có sẵn trong `items` từ API listMine — xem Out of scope).
  const [previewJobId, setPreviewJobId] = useState(null)
  const previewTimerRef = useRef(null)
  // TASK-148: mảng phần tử card/row theo ĐÚNG thứ tự displayItems — grid và list dùng CHUNG 1 mảng
  // (chỉ 1 trong 2 render tại 1 thời điểm theo viewMode, cùng lặp qua displayItems nên index khớp
  // nhau) để mũi tên lên/xuống/trái/phải chuyển focus qua .focus() trực tiếp, không cần thư viện
  // roving-tabindex riêng. Reset về [] đầu mỗi lần render (xem trước đoạn return) để không giữ tham
  // chiếu tới phần tử đã unmount khi danh sách đổi (filter/sort/page).
  const cardRefs = useRef([])
  // TASK-168: map jobId -> phần tử nút "⋮" mở menu ngữ cảnh của đúng job đó — dùng để trả `.focus()`
  // về ĐÚNG nút vừa mở menu khi menu đóng (Escape/click ra ngoài/chọn 1 hành động), xem
  // closeActionsMenu bên dưới. Khác cardRefs (mảng theo INDEX hiển thị, đổi mỗi lần filter/sort) —
  // đây là object theo jobId (ổn định, không cần reset mỗi render) vì mỗi job chỉ có đúng 1 nút "⋮"
  // tại 1 thời điểm (grid/list không render đồng thời, xem viewMode). React tự gán null vào đúng key
  // này khi phần tử unmount (callback ref) nên không cần dọn thủ công.
  const menuTriggerRefs = useRef({})
  // TASK-150: ref cho ô tìm kiếm "🔍 Tìm theo loại phòng" — dùng để focus() từ phím tắt "/" (xem
  // useEffect bên dưới).
  const searchInputRef = useRef(null)
  const navigate = useNavigate()
  const navigationType = useNavigationType()
  // TASK-168: chỉ khôi phục scroll ĐÚNG 1 LẦN sau khi component vừa mount và danh sách tải xong lần
  // đầu — không áp dụng lại mỗi khi loadItems() chạy lại do đổi filter/sort/trang (effect bên dưới phụ
  // thuộc `loading`, mà loading bật/tắt nhiều lần trong 1 lần mount).
  const scrollRestoredRef = useRef(false)

  useDocumentTitle('Dự án của tôi')

  // TASK-144: dọn timer hover/bấm-giữ đang chờ (nếu có) trước khi đặt lại/tắt hẳn — tránh trường hợp
  // timer cũ vẫn chạy ngầm rồi bật popup sai job sau khi chuột đã rời sang chỗ khác.
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

  // Dọn timer khi component unmount (đổi trang) — tránh setState sau khi unmount.
  useEffect(() => () => clearPreviewTimer(), [])

  // TASK-168: dọn timer "Đã sao chép" đang chờ (nếu có) khi unmount — cùng lý do clearPreviewTimer.
  useEffect(() => () => {
    if (copiedNameTimerRef.current) {
      clearTimeout(copiedNameTimerRef.current)
      copiedNameTimerRef.current = null
    }
  }, [])

  // TASK-168: lưu vị trí cuộn hiện tại vào biến module-level NGAY TRƯỚC khi component unmount (rời
  // /projects — bất kể click vào 1 project hay điều hướng đi nơi khác) để dùng lại NẾU quay lại
  // /projects qua điều hướng PUSH (xem effect khôi phục bên dưới). Cleanup-only effect, không phụ
  // thuộc gì nên chỉ chạy đúng 1 lần lúc unmount, không phải mỗi lần state đổi.
  useEffect(() => () => {
    savedProjectsScrollY = window.scrollY
  }, [])

  // TASK-168: khôi phục vị trí cuộn ĐÃ LƯU — chỉ khi mount này là điều hướng PUSH (bấm LINK, forward
  // navigation mới, đúng phạm vi Scope) VÀ đã có giá trị lưu từ lần rời trang trước trong cùng phiên.
  // Chờ `loading` chuyển false (danh sách đã render xong, trang đã đủ chiều cao) rồi mới scrollTo, nếu
  // scroll ngay lúc mount thì trang còn ngắn (đang "Đang tải...") nên không cuộn tới đúng vị trí được.
  // KHÔNG làm gì khi navigationType === 'POP' (nút Back trình duyệt) — để nguyên cơ chế
  // history.scrollRestoration = 'auto' mặc định của trình duyệt tự xử lý, đúng Out of scope.
  useEffect(() => {
    if (scrollRestoredRef.current || loading) return
    scrollRestoredRef.current = true
    if (navigationType === 'PUSH' && savedProjectsScrollY !== null) {
      window.scrollTo(0, savedProjectsScrollY)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  // TASK-163: nút nổi "↑ Về đầu" — CHỈ hiện sau khi user đã cuộn xuống quá 1 ngưỡng (SCROLL_TOP_THRESHOLD_PX),
  // tự ẩn lại khi cuộn lên gần đầu trang. Gắn/gỡ listener `scroll` qua useEffect (cleanup lúc unmount —
  // tránh setState sau khi unmount, cùng lý do các cleanup effect khác ở trên). Không có cơ chế
  // scroll-to-top nào khác trong toàn app trước đây (đã xác nhận ở TASK-163) nên không xung đột.
  useEffect(() => {
    function handleScroll() {
      setShowScrollTop(window.scrollY > SCROLL_TOP_THRESHOLD_PX)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // TASK-160: dọn timer tự-ẩn thanh "Hoàn tác" khi component unmount — cùng lý do clearPreviewTimer trên.
  useEffect(() => () => clearUndoDeleteTimer(), [])

  // TASK-154: đồng bộ lại biến module-level `lastSearchValue` mỗi khi `search` đổi — bắt được MỌI
  // đường đổi giá trị (gõ vào ô tìm kiếm, "Xoá bộ lọc" resetFilters, Esc xoá chữ TASK-152), không chỉ
  // riêng onChange, để lần remount tiếp theo trong cùng phiên luôn đọc đúng giá trị mới nhất.
  useEffect(() => {
    lastSearchValue = search
  }, [search])

  // TASK-144: đóng popup khi bấm Esc, đúng pattern useEscapeKey đã dùng ở NavBar/OnboardingTour/
  // DesignResult.jsx — chỉ gắn listener khi có popup đang mở (active = previewJobId !== null).
  useEscapeKey(previewJobId !== null, closePreview)

  // TASK-144: đóng popup khi click ra ngoài card/row đang preview — mỗi card/row có class
  // "project-preview-trigger" (thêm ở JSX bên dưới) để nhận diện click có nằm trong nó hay không.
  useEffect(() => {
    if (previewJobId === null) return undefined
    function handleDocumentMouseDown(e) {
      if (!e.target.closest('.project-preview-trigger')) {
        closePreview()
      }
    }
    document.addEventListener('mousedown', handleDocumentMouseDown)
    return () => document.removeEventListener('mousedown', handleDocumentMouseDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewJobId])

  // TASK-168: đóng menu ngữ cảnh "⋮" + TRẢ FOCUS về ĐÚNG nút "⋮" đã mở nó (menuTriggerRefs, theo
  // jobId) — dùng chung cho cả 3 cách đóng menu (Escape/click ra ngoài/chọn 1 hành động trong menu),
  // thay cho việc gọi setOpenMenuJobId(null) rải rác nhiều nơi như trước (TASK-147). Nhận `jobId` làm
  // tham số thay vì đọc trực tiếp state `openMenuJobId` bên trong để dùng được cả ở những nơi đã có sẵn
  // `job.jobId` trong scope (JSX các mục menu) lẫn nơi chỉ có state (Escape/click ra ngoài bên dưới).
  function closeActionsMenu(jobId) {
    setOpenMenuJobId(null)
    menuTriggerRefs.current[jobId]?.focus()
  }

  // TASK-147: đóng menu ngữ cảnh khi bấm Esc, đúng pattern useEscapeKey ở previewJobId trên.
  useEscapeKey(openMenuJobId !== null, () => closeActionsMenu(openMenuJobId))

  // TASK-147: đóng menu ngữ cảnh khi click ra ngoài — mỗi menu bọc trong span.project-actions-menu,
  // cùng cách ly bằng closest() như previewJobId/.project-preview-trigger ở trên.
  useEffect(() => {
    if (openMenuJobId === null) return undefined
    function handleDocumentMouseDown(e) {
      if (!e.target.closest('.project-actions-menu')) {
        closeActionsMenu(openMenuJobId)
      }
    }
    document.addEventListener('mousedown', handleDocumentMouseDown)
    return () => document.removeEventListener('mousedown', handleDocumentMouseDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openMenuJobId])

  // TASK-150: phím "/" focus nhanh ô tìm kiếm "🔍 Tìm theo loại phòng" — cùng tinh thần pattern đã
  // dùng ở Room3DViewer.jsx (TASK-069, phím "/" focus ô tìm loại đồ nội thất): chỉ hoạt động khi
  // KHÔNG đang gõ trong 1 input/textarea/select khác (tránh chặn nhầm dấu "/" hợp lệ khi đang nhập
  // liệu — trang này còn có thêm <select> sắp xếp nên check cả tagName "SELECT", khác Room3DViewer.jsx
  // chỉ cần check INPUT/TEXTAREA). Esc khi CHÍNH ô tìm kiếm đang focus → blur() — so sánh trực tiếp
  // document.activeElement với searchInputRef.current để KHÔNG đụng tới useEscapeKey đang đóng popup
  // xem trước (previewJobId)/menu "⋮" (openMenuJobId) ở trên, hay cách Esc bỏ focus card ở TASK-148.
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
      // TASK-152: ô tìm kiếm đang focus VÀ có nội dung → Esc xoá nội dung (setSearch(''), GIỮ focus để
      // gõ tiếp ngay) thay vì chỉ blur() như trước; ô tìm kiếm đang focus nhưng ĐÃ TRỐNG → vẫn blur()
      // như hành vi cũ TASK-150 (không đổi khi không có gì để xoá). Cần đọc đúng giá trị `search` mới
      // nhất nên effect này phải phụ thuộc [search] (xem dependency array bên dưới) thay vì [] như cũ.
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

  // TASK-168: "📋 Sao chép tên" trong menu "⋮" — copy ĐÚNG tên đang hiển thị trên card (displayName,
  // TASK-106: customName > suggestedName > roomType > "Phòng", cùng field/thứ tự ưu tiên dùng ở
  // renderQuickPreview/recentProjectsDisplay và trực tiếp trong <h3> của card). Đúng pattern
  // handleCopyJobId (TASK-115, DesignResult.jsx): .then()/.catch() rỗng (không hiện lỗi nếu trình
  // duyệt chặn clipboard — chỉ đơn giản không đổi label). KHÔNG đóng menu ở đây (khác 4 mục còn lại)
  // để label "Đã sao chép" còn chỗ hiển thị cho user thấy — menu vẫn đóng được bình thường sau đó qua
  // Escape/click ra ngoài (closeActionsMenu, có trả focus đúng nút "⋮").
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

  // TASK-147: ghi nhận project vừa được click mở — gọi từ onClick của <Link> (không preventDefault nên
  // vẫn điều hướng bình thường như cũ), mới nhất lên đầu, tối đa 5, bỏ trùng — ĐÚNG pattern addFurniture
  // ghi `homely_recent_furniture` (TASK-130, Room3DViewer.jsx).
  function recordRecentProject(jobId) {
    // Ghi localStorage NGAY, TRƯỚC/NGOÀI setState — click này đồng thời kích hoạt điều hướng
    // (Link), có thể unmount component TRƯỚC khi React xử lý updater của setState ở lượt render
    // kế tiếp (updater không đảm bảo được gọi nếu component unmount trước đó) — side effect đặt
    // trong updater sẽ bị mất. Tính `next` từ state hiện tại (đọc trực tiếp `recentProjectIds`,
    // đủ chính xác vì hàm này chỉ gọi từ 1 click tại 1 thời điểm, không có race ghi đồng thời).
    const next = [jobId, ...recentProjectIds.filter((id) => id !== jobId)].slice(0, RECENT_PROJECTS_MAX)
    try {
      window.localStorage.setItem(RECENT_PROJECTS_STORAGE_KEY, JSON.stringify(next))
    } catch {
      // Bỏ qua lỗi ghi localStorage (private mode/storage đầy) — chỉ mất tính năng nhớ, không chặn mở project.
    }
    setRecentProjectIds(next)
  }

  // TASK-113: tách riêng thành hàm để nút "Thử lại" (RequestError) gọi lại đúng logic fetch này,
  // không viết lại logic mới — vẫn dùng đúng status/page/favoriteOnly/sort hiện tại của lần render.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page, favoriteOnly, sort])

  function changeTab(value) {
    setStatus(value)
    setPage(0)
  }

  function toggleFavoriteOnly() {
    setFavoriteOnly((prev) => !prev)
    setPage(0)
  }

  // TASK-113: dùng cho nút "Xoá bộ lọc" ở empty state khi filter/tìm kiếm không khớp kết quả nào —
  // về đúng trạng thái mặc định (tab "Tất cả", không yêu thích-only, không tìm kiếm, trang đầu).
  function resetFilters() {
    setStatus('')
    setFavoriteOnly(false)
    setSearch('')
    setPage(0)
  }

  // TASK-106: đổi sort giữ nguyên status/favoriteOnly/search đang chọn (chỉ đổi tham số sort, không
  // reset các filter khác) — về trang đầu vì thứ tự đổi khiến trang hiện tại không còn ý nghĩa cũ.
  function changeSort(value) {
    setSort(value)
    setPage(0)
  }

  // TASK-119: đổi kiểu hiển thị grid/list — chỉ đổi cách render (không đổi filter/sort/page), ghi
  // lại localStorage ngay để giữ lựa chọn qua các lần ghé lại trang.
  function changeViewMode(mode) {
    setViewMode(mode)
    try {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode)
    } catch {
      // Không lưu được (chế độ riêng tư/quota) vẫn áp dụng cho phiên hiện tại, chỉ không giữ được
      // lựa chọn sau khi tải lại trang — giống pattern ThemeToggle.jsx.
    }
  }

  // TASK-122: ghim/bỏ ghim 1 job — chỉ đổi thứ tự hiển thị (áp dụng ở bước sắp-xếp-lại-theo-pin sau
  // filteredItems), KHÔNG phải 1 filter nên không đụng status/favoriteOnly/search/sort/page. Ghi lại
  // localStorage ngay để giữ trạng thái qua các lần tải lại trang (giống changeViewMode).
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

  // TASK-160: thu gọn/mở 1 nhóm (theo nhãn) — đúng pattern toggleFurniturePanel (Room3DViewer.jsx,
  // TASK-126): tính `next` ngay trong updater rồi ghi localStorage trước khi return, tránh 2 nguồn sự
  // thật (state React vs. giá trị vừa đọc lúc đóng) lệch nhau nếu bấm rất nhanh liên tiếp.
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

  // TASK-106: mở ô nhập inline — giá trị khởi tạo là customName hiện có (rỗng nếu chưa đặt, KHÔNG
  // prefill bằng suggestedName vì đó là tên tự sinh, không phải tên user đã gõ).
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

  // TASK-106: lưu tên riêng — rỗng/chỉ khoảng trắng thì gửi null để XOÁ tên riêng (quay về tên tự
  // sinh). Chỉ cập nhật customName trong state local (suggestedName không đổi vì roomType/style/kích
  // thước phòng không đổi khi đổi tên) — tránh phải fetch lại toàn bộ danh sách.
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

  // TASK-103: toggle yêu thích 1 job — cập nhật lại đúng item đó trong `items` từ response thật,
  // không fetch lại toàn bộ danh sách (trừ khi favoriteOnly đang bật và job vừa bị bỏ yêu thích thì
  // loại khỏi danh sách hiện tại, đúng ngữ nghĩa filter đang áp dụng).
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

  // TASK-107: xoá mềm 1 job — biến mất khỏi danh sách NGAY (optimistic, tự loại khỏi `items`), job
  // vẫn còn trong thùng rác (/trash) để khôi phục nếu bấm nhầm nên KHÔNG cần xác nhận trước (khác
  // "Xoá vĩnh viễn" ở Trash.jsx — hành động đó không thể hoàn tác nên PHẢI xác nhận).
  function handleSoftDelete(jobId, e) {
    e.preventDefault()
    e.stopPropagation()
    designApi
      .softDelete(jobId)
      .then(() => {
        setItems((prev) => prev.filter((job) => job.jobId !== jobId))
        // TASK-160: hiện thanh "Hoàn tác" NGAY sau khi xoá mềm thành công (không phải optimistic trước
        // API resolve — chỉ hiện nút Hoàn tác khi chắc chắn job đã thật sự nằm trong thùng rác).
        showUndoDeleteToast(jobId)
      })
      .catch((err) => setError(err.message))
  }

  // TASK-160: dọn timer tự-ẩn thanh "Hoàn tác" đang chờ (nếu có) — cùng lý do clearPreviewTimer
  // (TASK-144) ở trên: tránh timer cũ vẫn chạy ngầm rồi tắt nhầm thanh mới/set nhầm state sau khi đã
  // xử lý xong (bấm "Hoàn tác" hoặc xoá tiếp project khác).
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

  // TASK-160: bấm "Hoàn tác" — gọi lại đúng API restore đã có (TASK-107, y hệt Trash.jsx) rồi tải lại
  // danh sách qua `loadItems()` (hàm fetch hiện có của trang, TASK-113) thay vì tự chèn job vừa khôi
  // phục vào `items` bằng tay — đảm bảo project xuất hiện lại ĐÚNG vị trí thật theo sort/filter/trang
  // hiện tại (khớp AC "xác nhận qua reload trang thật, không chỉ optimistic UI").
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

  // TASK-077: chọn để so sánh, tối đa 2. Chọn thêm cái thứ 3 thì bỏ chọn cái đầu tiên (FIFO) thay vì
  // disable — giữ trải nghiệm mượt, user không cần bỏ chọn thủ công trước khi đổi ý.
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

  // TASK-163: cuộn mượt về đầu trang — nút tự ẩn ngay sau đó nhờ useEffect ở trên (scrollY về dưới
  // ngưỡng khi cuộn xong sẽ tự setShowScrollTop(false) qua sự kiện 'scroll' phát sinh trong lúc cuộn).
  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // TASK-148: onKeyDown gắn TRỰC TIẾP lên từng card/row (không phải listener toàn cục ở document,
  // khác pattern useEscapeKey) — nên mũi tên/Enter chỉ được bắt khi 1 card đang THỰC SỰ focus. Khi
  // user gõ trong ô tìm kiếm/input khác, input đó mới đang focus (không phải card) nên sự kiện không
  // bao giờ tới đây — tự nhiên thoả yêu cầu "không bắt nhầm ngữ cảnh" ở Scope mà không cần kiểm tra
  // document.activeElement thủ công như Room3DViewer.jsx (nơi listener gắn ở document nên cần check).
  function handleCardKeyDown(e, index, job, href) {
    // TASK-148: card chứa NHIỀU phần tử focusable con (Link, checkbox so sánh, nút "⋮", ô đổi tên
    // inline) — onKeyDown gắn ở đây cũng nhận được sự kiện bubble lên TỪ các phần tử con đó (native
    // DOM bubbling, xảy ra trước khi tới React onKeyDown của div cha). Nếu không chặn, mũi tên
    // trái/phải sẽ bị bắt nhầm khi user đang di chuyển con trỏ trong ô đổi tên (input), hoặc Enter/Esc
    // sẽ xử lý trùng với hành vi mặc định của Link/nút/ô input đó. Chỉ xử lý khi sự kiện phát sinh
    // TRỰC TIẾP trên chính card (div đang có tabIndex/role="button"), tức là card đang thật sự được
    // focus qua Tab/mũi tên — đúng tinh thần "kiểm tra document.activeElement trước khi xử lý" ở Scope.
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
        // Cùng hành vi ghi "Mở nhanh" (TASK-147) như khi click chuột vào <Link> — Enter là 1 cách
        // khác để "mở" project, không phải hành vi khác biệt.
        recordRecentProject(job.jobId)
        navigate(href)
        break
      case 'Escape':
        // CHỈ bỏ focus card đang bấm Esc — KHÔNG đụng tới useEscapeKey đang đóng popup xem trước
        // (previewJobId) hay menu "⋮" (openMenuJobId) ở trên; 2 cơ chế độc lập, có thể cùng xảy ra
        // (vd Esc khi vừa focus card vừa đang mở popup) mà không xung đột nhau.
        e.currentTarget.blur()
        break
      case 'Home':
        // TASK-154: nhảy thẳng tới card ĐẦU TIÊN — preventDefault để chặn hành vi cuộn lên đầu trang
        // mặc định của trình duyệt cho phím Home.
        e.preventDefault()
        cardRefs.current[0]?.focus()
        break
      case 'End':
        // TASK-154: nhảy thẳng tới card CUỐI CÙNG — preventDefault để chặn hành vi cuộn xuống cuối
        // trang mặc định của trình duyệt cho phím End.
        e.preventDefault()
        cardRefs.current[cardRefs.current.length - 1]?.focus()
        break
      default:
        break
    }
  }

  // TASK-144: popup xem trước nhanh — ảnh phòng (icon theo roomType, ĐÚNG nguồn "ảnh" card hiện có,
  // vì DesignJobSummaryResponse chưa có field ảnh thumbnail thật nào để dùng), tên (cùng thứ tự ưu
  // tiên displayName ở trên) và ngày cập nhật (updatedAt THẬT từ API, KHÔNG bịa). KHÔNG hiện số lượng
  // design/version vì DesignJobSummaryResponse (backend/.../dto/DesignJobSummaryResponse.java) không
  // có field nào cho việc này — xem Scope: "KHÔNG bịa dữ liệu".
  // Popup THUẦN xem-trước (không tương tác) — CSS .project-preview-popup có pointer-events: none nên
  // không cần chặn nổi bọt sự kiện chuột: hover/click luôn "xuyên qua" tới phần tử bên dưới nó.
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

  // TASK-080: tìm kiếm thuần client-side trên danh sách job đã fetch sẵn (song song với filter trạng thái
  // đang áp dụng qua API) — chỉ có roomType trong DesignJobSummaryResponse, không có style/màu nên không lọc theo đó.
  const searchQuery = normalize(search.trim())
  const filteredItems = searchQuery ? items.filter((job) => normalize(job.roomType).includes(searchQuery)) : items

  // TASK-122: sắp xếp lại filteredItems để item đã ghim lên đầu — áp dụng SAU khi đã filter/sort
  // theo tiêu chí hiện có (KHÔNG thay thế logic sort cũ). So sánh chỉ dựa vào có ghim hay không, JS
  // Array.prototype.sort hiện đại ổn định (stable) nên thứ tự tương đối trong từng nhóm (đã ghim /
  // chưa ghim) được giữ nguyên theo đúng sort hiện tại. Item bị filter ra ở trên vẫn không hiện dù
  // đã ghim — ghim chỉ ảnh hưởng thứ tự, không phải 1 filter riêng.
  const displayItems = [...filteredItems].sort((a, b) => {
    const aPinned = pinnedIds.has(a.jobId) ? 1 : 0
    const bPinned = pinnedIds.has(b.jobId) ? 1 : 0
    return bPinned - aPinned
  })

  // TASK-157: nhóm hiển thị theo ngày tương đối (Hôm nay/Hôm qua/Tuần này/Cũ hơn) ÁP DỤNG TRÊN
  // displayItems (tức là TRÊN tập đã filter/search + đã sắp ghim-lên-đầu ở trên — đúng Scope "danh
  // sách sau khi filter/search vẫn nhóm đúng theo tập kết quả đã lọc").
  //
  // Xử lý pin (phần khó nhất — xem hành vi hiện tại ở đoạn sort ngay trên): pin hiện KÉO TUYỆT ĐỐI
  // lên đầu TOÀN BỘ danh sách, không phụ thuộc ngày/sort — đây là 1 kiểu sắp xếp lại độc lập, không
  // phải "1 nhóm ngày cụ thể". Nếu gộp chung item đã ghim vào 4 nhóm ngày bên dưới theo đúng ngày của
  // nó, 1 item ghim có createdAt/updatedAt cũ sẽ bị nhóm "Cũ hơn" kéo xuống CUỐI trang — PHÁ VỠ đúng
  // ý nghĩa "ghim lên đầu danh sách" của TASK-122. Vì vậy: tách riêng item đã ghim thành 1 nhóm
  // "📌 Đã ghim" LUÔN đứng đầu (giữ nguyên thứ tự tương đối vốn có, không tính ngày), KHÔNG đưa vào 4
  // nhóm ngày; chỉ các item CHƯA ghim mới nhóm theo ngày như bình thường. Cách này giữ nguyên 100%
  // hành vi pin hiện có (vẫn luôn ở đầu danh sách) trong khi vẫn thêm được lớp nhóm ngày cho phần còn lại.
  const pinnedDisplayItems = displayItems.filter((job) => pinnedIds.has(job.jobId))
  const unpinnedDisplayItems = displayItems.filter((job) => !pinnedIds.has(job.jobId))

  // TASK-157: field ngày dùng để nhóm PHẢI khớp đúng field đang dùng để sắp xếp hiện tại (Scope) —
  // `updatedAt_desc` nhóm theo `updatedAt`; các lựa chọn sort còn lại (`createdAt_desc`, `createdAt_asc`,
  // VÀ `roomType_asc` — sort không liên quan tới ngày) mặc định nhóm theo `createdAt`. Chọn "vẫn nhóm
  // theo createdAt" thay vì "tắt nhóm hẳn" khi sort là roomType_asc để UI nhất quán, không đột ngột ẩn
  // hết tiêu đề nhóm chỉ vì đổi 1 lựa chọn sort không liên quan ngày — AC chỉ kiểm tra hành vi mặc định
  // (createdAt_desc) và khi đổi sang "Cập nhật gần đây" (updatedAt_desc) nên lựa chọn này không vi phạm
  // AC nào, đồng thời đúng tinh thần "field ngày ĐANG DÙNG để sắp xếp" khi sort thực sự dựa trên ngày.
  const groupDateField = sort === 'updatedAt_desc' ? 'updatedAt' : 'createdAt'

  const dateGroups = groupByRelativeDate(unpinnedDisplayItems, groupDateField)

  // TASK-157: danh sách "section" cuối cùng dùng để render CẢ 2 chế độ grid/list — nhóm ghim (nếu có
  // item nào đang ghim) luôn đứng trước, sau đó tới các nhóm ngày (groupByRelativeDate đã lọc bỏ nhóm
  // rỗng — chỉ hiện nhóm có item, đúng AC).
  const displaySections = [
    ...(pinnedDisplayItems.length > 0 ? [{ label: '📌 Đã ghim', items: pinnedDisplayItems }] : []),
    ...dateGroups,
  ]

  // TASK-157: index phẳng theo ĐÚNG thứ tự hiển thị thật trên màn hình sau khi nhóm (nhóm ghim rồi tới
  // từng nhóm ngày) — TASK-148/154 (điều hướng bàn phím mũi tên/Home/End) dựa vào cardRefs.current[index]
  // nên index gán cho từng card/row PHẢI khớp đúng thứ tự hiển thị mới này, không còn là thứ tự cũ của
  // displayItems (thứ tự cũ chỉ đổi cách nhóm HIỂN THỊ, không đổi filter/sort/pin — Out of scope).
  const orderedDisplayItems = displaySections.flatMap((group) => group.items)
  const jobIndexById = new Map(orderedDisplayItems.map((job, idx) => [job.jobId, idx]))

  // TASK-147: dựng dữ liệu hiển thị cho hàng "🕘 Mở nhanh" từ recentProjectIds — chỉ lưu jobId trong
  // localStorage (đúng Scope), nên tra tên/icon từ `items` (trang hiện tại) nếu có; project không nằm
  // trong `items` (đã sang trang/filter khác) vẫn hiện được nhờ nhãn/icon mặc định, KHÔNG gọi thêm API
  // (giữ đúng nguyên tắc "không bịa dữ liệu" — chỉ fallback nhãn chung, không đoán tên/loại phòng).
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
    return { jobId, href: `/designs/${jobId}`, label: 'Dự án đã mở', icon: '🏠' }
  })

  // TASK-113: phân biệt 2 loại empty state — "chưa có thiết kế nào" (tài khoản mới, KHÔNG có filter
  // nào đang áp dụng) khác với "có dữ liệu nhưng filter/tìm kiếm không khớp" (đang áp dụng status
  // khác "Tất cả", và/hoặc favoriteOnly, và/hoặc search). Không dùng chung 1 thông điệp.
  // TASK-113: khi đang có lỗi API, KHÔNG hiện đồng thời empty-state CTA (dễ gây hiểu nhầm — ví dụ
  // "Xoá bộ lọc" trong khi thật ra server đang lỗi, không liên quan tới filter) — chỉ hiện RequestError.
  const isFilterActive = status !== '' || favoriteOnly || search.trim() !== ''
  const noDesignsAtAll = !loading && !error && items.length === 0 && !isFilterActive
  const noFilterMatch = !loading && !error && !noDesignsAtAll && isFilterActive && (items.length === 0 || filteredItems.length === 0)

  // TASK-148: reset mỗi lần render — grid/list bên dưới sẽ điền lại theo đúng thứ tự displayItems
  // hiện tại (tránh giữ tham chiếu tới card/row đã unmount ở lần render trước).
  cardRefs.current = []

  return (
    <div>
      <h2>Dự án của tôi</h2>

      {/* TASK-147: "🕘 Mở nhanh" — CHỈ hiện khi có ít nhất 1 project đã từng click mở (localStorage),
          không hiện khung trống vô nghĩa. Khác hẳn "Dự án gần đây" trên Dashboard (server-data "vừa SỬA"). */}
      {recentProjectsDisplay.length > 0 && (
        <div className="recent-projects-row no-print">
          <span className="recent-projects-row__label">🕘 Mở nhanh</span>
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
        ⭐ Chỉ hiện yêu thích
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
          {/* TASK-119: toggle kiểu hiển thị — cạnh ô tìm kiếm/sắp xếp có sẵn. */}
          <div className="view-mode-toggle" role="group" aria-label="Kiểu hiển thị">
            <button
              type="button"
              className={viewMode === 'grid' ? '' : 'secondary'}
              onClick={() => changeViewMode('grid')}
              title="Hiển thị dạng lưới"
              aria-pressed={viewMode === 'grid'}
            >
              ▦ Lưới
            </button>
            <button
              type="button"
              className={viewMode === 'list' ? '' : 'secondary'}
              onClick={() => changeViewMode('list')}
              title="Hiển thị dạng danh sách"
              aria-pressed={viewMode === 'list'}
            >
              ☰ Danh sách
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <input
              type="text"
              ref={searchInputRef}
              className="projects-search-input"
              placeholder="🔍 Tìm theo loại phòng (vd: khach, ngu)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {/* TASK-152: "Tìm thấy X project" — CHỈ hiện khi `search` khác rỗng (tránh nhiễu UI mặc
                định lúc chưa gõ gì), dùng đúng filteredItems đã tính sẵn ở trên (không gọi thêm API). */}
            {search !== '' && (
              <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                Tìm thấy {filteredItems.length} project
              </span>
            )}
          </div>
          {/* TASK-106: dropdown sắp xếp — cạnh ô tìm kiếm, đổi lựa chọn giữ nguyên status/favoriteOnly/search. */}
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
          <Link to="/rooms/new">
            <button type="button">+ Tạo phòng mới</button>
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
          {/* TASK-157: tiêu đề nhóm — gridColumn: '1 / -1' để chiếm trọn 1 hàng trong .room-grid
              (display: grid, auto-fill nhiều cột), tránh bị co hẹp vào 1 ô cột như thẻ project.
              TASK-160: nút toggle bọc trong <h3> — đúng pattern toggleFurniturePanel (Room3DViewer.jsx,
              TASK-126): glyph ▾/▸ + aria-expanded, style "trong suốt" để trông vẫn như tiêu đề cũ. */}
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
          {/* TASK-160: bọc toàn bộ card của nhóm trong 1 wrapper `display: contents` khi MỞ — wrapper
              KHÔNG tạo box riêng nên các card bên trong vẫn là grid item TRỰC TIẾP của .room-grid (giữ
              nguyên layout lưới/gap hiện có); khi ĐÓNG chuyển hẳn wrapper (và mọi card con) sang
              `display: none` — giữ mounted (KHÔNG unmount) đúng pattern TASK-126, không mất state
              bên trong card (vd đang gõ ô đổi tên) khi mở lại. */}
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
              {/* TASK-147: gộp Ghim/Yêu thích/Đổi tên/Xoá mềm (trước là 3 icon rời + nút "Đổi tên" riêng,
                  TASK-107/103/106/122) vào 1 menu ngữ cảnh "⋮" gọn — GIỮ NGUYÊN logic từng handler, chỉ
                  đổi cách trình bày. Checkbox "Chọn để so sánh" (TASK-077) vẫn tách riêng, không gộp vào. */}
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
                      ✏️ Đổi tên
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        togglePin(job.jobId, e)
                        closeActionsMenu(job.jobId)
                      }}
                    >
                      {isPinned ? '📍 Bỏ ghim' : '📌 Ghim lên đầu danh sách'}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        handleToggleFavorite(job.jobId, e)
                        closeActionsMenu(job.jobId)
                      }}
                    >
                      {job.isFavorite ? '⭐ Bỏ yêu thích' : '☆ Đánh dấu yêu thích'}
                    </button>
                    <button type="button" onClick={(e) => handleCopyName(job, e)}>
                      {copiedNameJobId === job.jobId ? 'Đã sao chép' : '📋 Sao chép tên'}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        handleSoftDelete(job.jobId, e)
                        closeActionsMenu(job.jobId)
                      }}
                    >
                      🗑️ Chuyển vào thùng rác
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
                    {/* TASK-163: huy hiệu "Vừa mở" — đọc THẲNG recentProjectIds[0] (TASK-147, đã xác nhận
                        là jobId project mở gần nhất, KHÔNG thêm state/localStorage key mới). Đặt CÙNG
                        hàng, TRƯỚC status-badge (không phải absolute) để không đè lên status-badge hay
                        menu "⋮" (absolute top-right, đã có sẵn) — chỉ thêm 1 phần tử vào flow bình thường. */}
                    {recentProjectIds[0] === job.jobId && <span className="badge-recent">Vừa mở</span>}
                    <span className={`status-badge status-${job.status}`}>{job.status}</span>
                  </span>
                </div>
                {/* TASK-106: hiện tên riêng nếu đã đặt, ngược lại hiện tên tự sinh (suggestedName, tính
                    từ roomType/style/kích thước THẬT) — fallback cuối cùng về roomType/"Phòng" nếu
                    backend chưa trả suggestedName (dữ liệu cũ/lỗi mạng chưa đủ field). */}
                <h3 style={{ margin: '12px 0 4px' }}>{job.customName || job.suggestedName || job.roomType || 'Phòng'}</h3>
                <p className="text-muted" style={{ margin: 0, fontSize: '0.85rem' }}>
                  {new Date(job.createdAt).toLocaleString('vi-VN')}
                </p>
              </Link>
              {/* TASK-106: ô nhập tên riêng inline — chỉ hiện khi đang sửa (trigger "Đổi tên" giờ nằm
                  trong menu "⋮" ở trên, TASK-147), tách khỏi <h3>/Link để không kích hoạt điều hướng. */}
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

      {/* TASK-119: dạng danh sách gọn — CÙNG filteredItems/handlers, chỉ đổi layout container (mỗi
          hàng ngang thay vì card). Không đổi filter/sort/search/favorite/rename logic phía trên. */}
      {viewMode === 'list' && (
      <div className="room-list">
        {displaySections.map((group) => {
        const isGroupCollapsed = collapsedGroupLabels.has(group.label)
        return (
        <Fragment key={group.label}>
          {/* TASK-157: tiêu đề nhóm — .room-list là flex column nên <h3> tự chiếm trọn 1 hàng, không
              cần gridColumn như bên grid.
              TASK-160: cùng nút toggle ▾/▸ + aria-expanded như bên grid ở trên. */}
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
          {/* TASK-160: .room-list là flex column — wrapper `display: contents` khi mở giữ mỗi hàng
              (.room-list-row) là flex item TRỰC TIẾP của .room-list (giữ nguyên gap 8px hiện có giữa
              các hàng); đóng thì cả wrapper lẫn hàng con chuyển `display: none`, vẫn mounted. */}
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
                  {/* TASK-106: cùng ưu tiên tên hiển thị như grid — customName > suggestedName > roomType. */}
                  {job.customName || job.suggestedName || job.roomType || 'Phòng'}
                </span>
                {/* TASK-163: cùng huy hiệu "Vừa mở" như bên grid — trước status-badge trong hàng, không đè lên gì. */}
                {recentProjectIds[0] === job.jobId && <span className="badge-recent">Vừa mở</span>}
                <span className={`status-badge status-${job.status}`}>{job.status}</span>
                <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                  {new Date(job.createdAt).toLocaleString('vi-VN')}
                </span>
              </Link>

              <div className="no-print room-list-actions" onClick={(e) => e.stopPropagation()}>
                {/* TASK-106: ô nhập tên riêng inline — chỉ hiện khi đang sửa (trigger "Đổi tên" giờ nằm
                    trong menu "⋮", TASK-147). */}
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
                {/* TASK-147: gộp Ghim/Yêu thích/Đổi tên/Xoá mềm vào menu ngữ cảnh "⋮" — cùng pattern grid
                    ở trên, GIỮ NGUYÊN logic từng handler. */}
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
                        ✏️ Đổi tên
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          togglePin(job.jobId, e)
                          closeActionsMenu(job.jobId)
                        }}
                      >
                        {isPinned ? '📍 Bỏ ghim' : '📌 Ghim lên đầu danh sách'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          handleToggleFavorite(job.jobId, e)
                          closeActionsMenu(job.jobId)
                        }}
                      >
                        {job.isFavorite ? '⭐ Bỏ yêu thích' : '☆ Đánh dấu yêu thích'}
                      </button>
                      <button type="button" onClick={(e) => handleCopyName(job, e)}>
                        {copiedNameJobId === job.jobId ? 'Đã sao chép' : '📋 Sao chép tên'}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          handleSoftDelete(job.jobId, e)
                          closeActionsMenu(job.jobId)
                        }}
                      >
                        🗑️ Chuyển vào thùng rác
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

      {/* TASK-160: thanh "Hoàn tác" sau khi xoá mềm 1 project vào Thùng rác — CHỈ hiện khi
          `undoDeleteJobId` khác null (đặt trong handleSoftDelete sau khi API softDelete thành công),
          tự ẩn sau UNDO_TOAST_TIMEOUT_MS (showUndoDeleteToast) hoặc khi bấm "Hoàn tác"
          (handleUndoDelete). role="status" để trình đọc màn hình thông báo không cần focus. */}
      {undoDeleteJobId && (
        <div className="card undo-toast no-print" role="status">
          <span>Đã chuyển vào Thùng rác —</span>
          <button type="button" className="secondary" onClick={handleUndoDelete}>
            Hoàn tác
          </button>
        </div>
      )}

      {/* TASK-163: nút nổi "↑ Về đầu" — CHỈ hiện khi showScrollTop true (đã cuộn quá SCROLL_TOP_THRESHOLD_PX,
          xem useEffect ở trên). Đặt ở góc dưới-TRÁI (khác ".compare-fab" giữa/".undo-toast" phải) để
          không đè lên 2 phần tử nổi đã có, dù cả 3 hiếm khi cùng hiện cùng lúc. */}
      {showScrollTop && (
        <button type="button" className="scroll-to-top-btn no-print secondary" onClick={scrollToTop} aria-label="Về đầu danh sách">
          ↑ Về đầu
        </button>
      )}
    </div>
  )
}
