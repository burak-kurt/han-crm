import { useState, useEffect } from 'react';
import { TrendingUp, Users as UsersIcon, Award, BarChart3 } from 'lucide-react';
import api from '../lib/axios';

interface UserPerformance {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  totalLeads: number;
  wonLeads: number;
  lostLeads: number;
  toBeCalledLeads: number;
  calledLeads: number;
  visitScheduledLeads: number;
  conversionRate: string;
}

export default function StaffPerformancePage() {
  const [performanceData, setPerformanceData] = useState<UserPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      const response = await api.get('/users/performance');
      setPerformanceData(response.data.data);
    } catch (error) {
      console.error('Performance fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConversionRateBadge = (rate: string) => {
    const rateNum = parseFloat(rate);
    let colorClass = '';

    if (rateNum >= 80) {
      colorClass = 'bg-green-600 text-white';
    } else if (rateNum >= 60) {
      colorClass = 'bg-green-500 text-white';
    } else if (rateNum >= 40) {
      colorClass = 'bg-yellow-500 text-white';
    } else if (rateNum >= 20) {
      colorClass = 'bg-orange-500 text-white';
    } else {
      colorClass = 'bg-red-500 text-white';
    }

    return <span className={`px-3 py-1 text-sm font-semibold rounded-full ${colorClass}`}>{rate}%</span>;
  };

  // Summary calculations
  const totalLeadsAll = performanceData.reduce((sum, user) => sum + user.totalLeads, 0);
  const totalWonAll = performanceData.reduce((sum, user) => sum + user.wonLeads, 0);
  const avgConversionRate = performanceData.length > 0
    ? (performanceData.reduce((sum, user) => sum + parseFloat(user.conversionRate), 0) / performanceData.length).toFixed(2)
    : '0.00';
  const topPerformer = performanceData.length > 0
    ? performanceData.reduce((prev, current) =>
        parseFloat(current.conversionRate) > parseFloat(prev.conversionRate) ? current : prev
      )
    : null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Danışman Performans Raporu</h1>
        <p className="text-gray-600 mt-1">Danışmanların başarı metrikleri ve performans analizi</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Lead</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{totalLeadsAll}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Kazanılan</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{totalWonAll}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <Award className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ortalama Başarı Oranı</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">{avgConversionRate}%</p>
            </div>
            <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">En Başarılı Danışman</p>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {topPerformer ? `${topPerformer.firstName} ${topPerformer.lastName}` : '-'}
              </p>
              {topPerformer && (
                <p className="text-sm text-green-600 font-semibold">{topPerformer.conversionRate}%</p>
              )}
            </div>
            <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Detaylı Performans Metrikleri</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danışman</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Toplam Lead</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Kazanıldı</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Kaybedildi</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Aranacak</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Arandı</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ziyaret Planlandı</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Başarı Oranı</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">Yükleniyor...</td>
                </tr>
              ) : performanceData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">Performans verisi bulunamadı</td>
                </tr>
              ) : (
                performanceData.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-semibold text-gray-900">{user.totalLeads}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-semibold text-green-600">{user.wonLeads}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-semibold text-red-600">{user.lostLeads}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-900">{user.toBeCalledLeads}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-900">{user.calledLeads}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-900">{user.visitScheduledLeads}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getConversionRateBadge(user.conversionRate)}
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
