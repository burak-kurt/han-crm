import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import CustomersPage from './pages/CustomersPage';
import LeadsPage from './pages/LeadsPage';
import ArchivedLeadsPage from './pages/ArchivedLeadsPage';
import StaffPerformancePage from './pages/StaffPerformancePage';
import UsersPage from './pages/UsersPage';
import RolesPage from './pages/RolesPage';
import LogsPage from './pages/LogsPage';
import GoogleImportPage from './pages/GoogleImportPage';
import BlogManagementPage from './pages/BlogManagementPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import SystemSettingsPage from './pages/SystemSettingsPage';
import { useAuthStore } from './store/authStore';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/crm/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/crm/login" element={<LoginPage />} />

        <Route
          path="/crm"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="leads/archived" element={<ArchivedLeadsPage />} />
          <Route path="performance" element={<StaffPerformancePage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="google-import" element={<GoogleImportPage />} />
          <Route path="blog" element={<BlogManagementPage />} />
          <Route path="settings" element={<SystemSettingsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
