import { useState, useEffect } from 'react';
import { Users, UserPlus, TrendingUp, Activity, AlertTriangle } from 'lucide-react';
import api from '../lib/axios';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalLeads: 0,
    activeUsers: 0,
    recentActivities: 0,
    staleLeads: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [customers, leads, users, logs, staleLeads] = await Promise.all([
        api.get('/customers'),
        api.get('/leads?limit=1'),
        api.get('/users'),
        api.get('/activitylogs?limit=1'),
        api.get('/leads?isStale=true&limit=1'),
      ]);

      setStats({
        totalCustomers: customers.data.data?.length || 0,
        totalLeads: leads.data.data?.totalCount || 0,
        activeUsers: users.data.data?.filter((u: any) => u.isActive).length || 0,
        recentActivities: logs.data.data?.totalCount || 0,
        staleLeads: staleLeads.data.data?.totalCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: 'Toplam Müşteri',
      value: stats.totalCustomers,
      icon: Users,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Potansiyel Müşteri',
      value: stats.totalLeads,
      icon: UserPlus,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Aktif Kullanıcı',
      value: stats.activeUsers,
      icon: TrendingUp,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Son Aktiviteler',
      value: stats.recentActivities,
      icon: Activity,
      color: 'bg-orange-500',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Bayat Müşteri',
      value: stats.staleLeads,
      icon: AlertTriangle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">HAN CRM Sistemi Genel Görünümü</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Yükleniyor...</div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            {cards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div key={index} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                      <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                    </div>
                    <div className={`${card.bgColor} p-3 rounded-lg`}>
                      <Icon className={`h-8 w-8 ${card.color.replace('bg-', 'text-')}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Hoş Geldiniz</h2>
              <p className="text-gray-600 mb-4">
                HAN CRM sistemine hoş geldiniz. Bu panel üzerinden tüm müşteri ve potansiyel müşteri
                işlemlerinizi yönetebilir, ekip üyelerinizi takip edebilir ve sistem aktivitelerini
                izleyebilirsiniz.
              </p>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• Müşteri kayıtlarınızı detaylı bir şekilde takip edin</p>
                <p>• Potansiyel müşterilerinizi satış hunisinde yönetin</p>
                <p>• Ekip üyelerinize roller ve yetkiler atayın</p>
                <p>• Tüm sistem aktivitelerini loglardan inceleyin</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Hızlı Bağlantılar</h2>
              <div className="space-y-3">
                <a
                  href="/crm/customers"
                  className="block p-3 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">Müşteriler</div>
                  <div className="text-sm text-gray-600">Müşteri listesini görüntüle</div>
                </a>
                <a
                  href="/crm/leads"
                  className="block p-3 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">Potansiyel Müşteriler</div>
                  <div className="text-sm text-gray-600">Potansiyel müşteri takibi</div>
                </a>
                <a
                  href="/crm/users"
                  className="block p-3 rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors"
                >
                  <div className="font-medium text-gray-900">Çalışanlar</div>
                  <div className="text-sm text-gray-600">Kullanıcı yönetimi</div>
                </a>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
