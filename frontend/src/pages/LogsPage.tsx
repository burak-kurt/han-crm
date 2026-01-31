import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import api from '../lib/axios';
import { format } from 'date-fns';

interface ActivityLog {
  id: number;
  action: string;
  entity?: string;
  description: string;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function LogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [filterAction]);

  const fetchLogs = async () => {
    try {
      const params: any = { limit: 100 };
      if (filterAction) params.actionType = filterAction;
      const response = await api.get('/activitylogs', { params });
      setLogs(response.data.data.logs || response.data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.firstName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getActionBadge = (action: string) => {
    const colors: any = {
      login: 'bg-blue-100 text-blue-800',
      logout: 'bg-gray-100 text-gray-800',
      create: 'bg-green-100 text-green-800',
      update: 'bg-yellow-100 text-yellow-800',
      delete: 'bg-red-100 text-red-800',
      view: 'bg-purple-100 text-purple-800',
      export: 'bg-indigo-100 text-indigo-800',
    };
    const labels: any = {
      login: 'Giriş',
      logout: 'Çıkış',
      create: 'Oluşturma',
      update: 'Güncelleme',
      delete: 'Silme',
      view: 'Görüntüleme',
      export: 'Dışa Aktarma',
    };
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[action] || 'bg-gray-100 text-gray-800'}`}>
        {labels[action] || action}
      </span>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Aktivite Logları</h1>
        <p className="text-gray-600 mt-1">Sistem aktivitelerini görüntüleyin</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Log ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Tüm Aktiviteler</option>
              <option value="login">Giriş</option>
              <option value="logout">Çıkış</option>
              <option value="create">Oluşturma</option>
              <option value="update">Güncelleme</option>
              <option value="delete">Silme</option>
              <option value="view">Görüntüleme</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kullanıcı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aktivite
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Açıklama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tarih
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    Yükleniyor...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    Log bulunamadı
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {log.user.firstName} {log.user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{log.user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getActionBadge(log.action)}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{log.description}</div>
                      {log.entity && (
                        <div className="text-xs text-gray-500 mt-1">Entity: {log.entity}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm')}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
