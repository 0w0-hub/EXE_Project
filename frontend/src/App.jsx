import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import NavBar from './components/NavBar'
import AIChatbox from './components/AIChatbox'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import RoomNew from './pages/RoomNew'
import DecorStudioPage from './pages/DecorStudioPage'
import DesignResult from './pages/DesignResult'
import DesignSummary from './pages/DesignSummary'
import CompareDesigns from './pages/CompareDesigns'
import Templates from './pages/Templates'
import Projects from './pages/Projects'
import Trash from './pages/Trash'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminDesigns from './pages/admin/AdminDesigns'
import AdminModeration from './pages/admin/AdminModeration'
import AdminDataExplorer from './pages/admin/AdminDataExplorer'
import AdminDataIntegrity from './pages/admin/AdminDataIntegrity'
import SharedDesign from './pages/SharedDesign'
import ChangePassword from './pages/ChangePassword'
import ExportData from './pages/ExportData'
import ActivityHistory from './pages/ActivityHistory'
import Achievements from './pages/Achievements'
import NotFound from './pages/NotFound'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-loading">Đang tải...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-loading">Đang tải...</div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ADMIN') return <Navigate to="/" replace />
  return children
}

function AIChatboxGuard() {
  const { user } = useAuth()
  const location = useLocation()
  const isStudioRoute = location.pathname.startsWith('/designs') && !location.pathname.endsWith('/summary')
  if (!user || isStudioRoute) return null
  return <AIChatbox />
}

export default function App() {
  const location = useLocation()
  const isStudioRoute = location.pathname.startsWith('/designs') && !location.pathname.endsWith('/summary')

  return (
    <>
      <NavBar />
      <main className={isStudioRoute ? 'studio-main-container' : 'container'}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* TASK-078: public, không dùng ProtectedRoute — người xem không có tài khoản Homely
              vẫn vào được, cùng cách khai báo với /login ở trên. */}
          <Route path="/share/:shareToken" element={<SharedDesign />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rooms/new"
            element={
              <ProtectedRoute>
                <RoomNew />
              </ProtectedRoute>
            }
          />
          {/* 3D Decor Studio — trang thiết kế 3D/2D CAD tương tác với tính năng lưu/tải database */}
          <Route
            path="/designs"
            element={
              <ProtectedRoute>
                <DecorStudioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/designs/:id"
            element={
              <ProtectedRoute>
                <DecorStudioPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/designs/:id/:slug"
            element={
              <ProtectedRoute>
                <DecorStudioPage />
              </ProtectedRoute>
            }
          />
          {/* TASK-108: route tĩnh /summary — React Router v6 ưu tiên segment tĩnh hơn :slug động
              (ranking theo path, không phụ thuộc thứ tự khai báo), nên luôn khớp trang này thay vì
              DesignResult ở route :slug ngay phía trên. Cùng yêu cầu đăng nhập + ownership check ở
              backend (designApi.getJob trả 403/404 qua interceptor) như route /designs/:jobId. */}
          <Route
            path="/designs/:jobId/summary"
            element={
              <ProtectedRoute>
                <DesignSummary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/compare"
            element={
              <ProtectedRoute>
                <CompareDesigns />
              </ProtectedRoute>
            }
          />
          <Route
            path="/templates"
            element={
              <ProtectedRoute>
                <Templates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/projects"
            element={
              <ProtectedRoute>
                <Projects />
              </ProtectedRoute>
            }
          />
          {/* TASK-107: thùng rác — yêu cầu đăng nhập, giống các route user thường khác (đã có link
              trong NavBar.jsx dropdown "Tài khoản", xem AccountMenu). */}
          <Route
            path="/trash"
            element={
              <ProtectedRoute>
                <Trash />
              </ProtectedRoute>
            }
          />
          {/* TASK-083: đổi mật khẩu — yêu cầu đăng nhập, chưa có link trong NavBar.jsx (coordinator
              sẽ gộp thêm link cho toàn bộ trang mới của round này). */}
          <Route
            path="/account/password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          {/* TASK-087: xuất dữ liệu cá nhân — yêu cầu đăng nhập, chưa có link trong NavBar.jsx
              (coordinator sẽ gộp thêm link cho toàn bộ trang mới của round này). */}
          <Route
            path="/account/export"
            element={
              <ProtectedRoute>
                <ExportData />
              </ProtectedRoute>
            }
          />
          {/* TASK-084: lịch sử hoạt động — yêu cầu đăng nhập, chưa có link trong NavBar.jsx
              (coordinator sẽ gộp thêm link cho toàn bộ trang mới của round này). */}
          <Route
            path="/account/activity"
            element={
              <ProtectedRoute>
                <ActivityHistory />
              </ProtectedRoute>
            }
          />
          {/* TASK-091: huy hiệu thành tựu — yêu cầu đăng nhập, chưa có link trong NavBar.jsx
              (coordinator sẽ gộp thêm link cho toàn bộ trang mới của round này). */}
          <Route
            path="/account/achievements"
            element={
              <ProtectedRoute>
                <Achievements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/designs"
            element={
              <AdminRoute>
                <AdminDesigns />
              </AdminRoute>
            }
          />
          {/* TASK-097: hàng đợi kiểm duyệt chia sẻ công khai — chưa có link trong NavBar.jsx/trang
              /admin (coordinator sẽ gộp thêm điều hướng cho toàn bộ trang mới của round này, cùng
              cách /admin/users và /admin/designs hiện cũng chưa có link điều hướng trong app). */}
          <Route
            path="/admin/moderation"
            element={
              <AdminRoute>
                <AdminModeration />
              </AdminRoute>
            }
          />
          {/* TASK-104: tra cứu dữ liệu nhanh xuyên bảng (user -> room -> job, job -> owner), THUẦN
              READ-ONLY — chưa có link trong AdminDashboard.jsx/NavBar.jsx (coordinator sẽ gộp thêm
              điều hướng cho toàn bộ trang mới của round này, cùng cách các trang admin khác). */}
          <Route
            path="/admin/explorer"
            element={
              <AdminRoute>
                <AdminDataExplorer />
              </AdminRoute>
            }
          />
          {/* TASK-111: quét dữ liệu mồ côi toàn hệ thống, THUẦN READ-ONLY — chưa có link trong
              AdminDashboard.jsx/NavBar.jsx (coordinator sẽ gộp thêm điều hướng cho toàn bộ trang mới
              của round này, cùng cách các trang admin khác — xem TASK-097/TASK-104). */}
          <Route
            path="/admin/integrity"
            element={
              <AdminRoute>
                <AdminDataIntegrity />
              </AdminRoute>
            }
          />
          {/* TASK-085 (coordinator, sau khi agent tạo NotFound.jsx): trước đây route catch-all tự
              chuyển hướng thẳng về "/" — nay hiện trang 404 thiết kế riêng, giữ nguyên đứng CUỐI
              CÙNG danh sách route (React Router match theo thứ tự). */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {/* AI Chatbox — fixed overlay, chỉ hiện khi đã đăng nhập */}
      <AIChatboxGuard />
    </>
  )
}
