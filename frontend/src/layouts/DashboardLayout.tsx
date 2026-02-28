import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  LayoutDashboard,
  Users,
  UserPlus,
  Shield,
  FileText,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Archive,
  TrendingUp,
  Cloud,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasPermission } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      logout();
      navigate('/login');
    }
  };

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      permission: null,
    },
    {
      name: 'Müşteriler',
      href: '/dashboard/customers',
      icon: Users,
      permission: 'customers.view',
    },
    {
      name: 'Potansiyel Müşteriler',
      href: '/dashboard/leads',
      icon: UserPlus,
      permission: 'leads.view',
    },
    {
      name: 'Arşiv',
      href: '/dashboard/leads/archived',
      icon: Archive,
      permission: 'leads.view',
    },
    {
      name: 'Danışman Performansı',
      href: '/dashboard/performance',
      icon: TrendingUp,
      permission: 'users.view',
    },
    {
      name: 'Çalışanlar',
      href: '/dashboard/users',
      icon: UserIcon,
      permission: 'users.view',
    },
    {
      name: 'Roller ve Yetkiler',
      href: '/dashboard/roles',
      icon: Shield,
      permission: 'roles.view',
    },
    {
      name: 'Aktivite Logları',
      href: '/dashboard/logs',
      icon: FileText,
      permission: 'logs.view',
    },
    {
      name: 'Google Import',
      href: '/dashboard/google-import',
      icon: Cloud,
      permission: 'leads.create',
    },
  ];

  const filteredNavigation = navigation.filter(
    (item) => !item.permission || hasPermission(item.permission)
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white shadow-md z-50 px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">HAN CRM</span>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      <aside
        className={`fixed top-0 left-0 h-full bg-white shadow-lg transition-transform duration-300 z-40 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 w-64`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b hidden lg:block">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">HAN CRM</span>
            </div>
          </div>

          <div className="p-6 border-b mt-16 lg:mt-0">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.role?.name}</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-1">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;

                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 w-full transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium">Çıkış Yap</span>
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">
              v{import.meta.env.VITE_APP_VERSION || 'dev'}
            </p>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className="lg:ml-64 pt-16 lg:pt-0">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
