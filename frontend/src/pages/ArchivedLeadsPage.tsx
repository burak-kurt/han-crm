import { useState, useEffect } from 'react';
import { Search, ExternalLink, Calendar, CheckSquare, ChevronLeft, ChevronRight, Archive } from 'lucide-react';
import api from '../lib/axios';
import { useAuthStore } from '../store/authStore';

interface Lead {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  propertyStatus: string;
  listingUrl?: string;
  listingType?: string;
  listingStatus?: string;
  reminderDate?: string;
  isAgenda?: boolean;
  assignedUser?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function ArchivedLeadsPage() {
  const { hasPermission } = useAuthStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 100;

  useEffect(() => {
    fetchLeads();
  }, [currentPage]);

  const fetchLeads = async () => {
    try {
      const response = await api.get(`/leads?page=${currentPage}&limit=${itemsPerPage}&isArchived=true`);
      const result = response.data.data;
      setLeads(result.leads || []);
      setTotalCount(result.totalCount || 0);
      setTotalPages(result.totalPages || 1);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async (id: number) => {
    if (!confirm('Bu kaydı arşivden çıkarmak istiyor musunuz?')) return;
    try {
      await api.put(`/leads/${id}`, { isArchived: false });
      fetchLeads();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Arşivden çıkarma işlemi başarısız');
    }
  };

  const filteredLeads = leads.filter(l =>
    l.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.phone.includes(searchTerm)
  );

  const getPropertyStatusBadge = (status: string) => {
    const colors: any = {
      aranacak: 'bg-blue-100 text-blue-800',
      arandi: 'bg-yellow-100 text-yellow-800',
      ziyaret_planlandi: 'bg-purple-100 text-purple-800',
      kaybedildi: 'bg-red-100 text-red-800',
      kazanildi: 'bg-green-100 text-green-800',
    };
    const labels: any = {
      aranacak: 'Aranacak',
      arandi: 'Arandı',
      ziyaret_planlandi: 'Ziyaret Planlandı',
      kaybedildi: 'Kaybedildi',
      kazanildi: 'Kazanıldı',
    };
    return <span className={`px-2 text-xs font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}`}>{labels[status] || status}</span>;
  };

  const getListingTypeBadge = (type?: string) => {
    if (!type) return '-';
    const colors: any = {
      sale: 'bg-green-100 text-green-800',
      rent: 'bg-blue-100 text-blue-800',
    };
    const labels: any = {
      sale: 'Satılık',
      rent: 'Kiralık',
    };
    return <span className={`px-2 text-xs font-semibold rounded-full ${colors[type]}`}>{labels[type]}</span>;
  };

  const getListingStatusBadge = (status?: string) => {
    if (!status) return '-';
    const colors: any = {
      active: 'bg-green-100 text-green-800',
      passive: 'bg-gray-100 text-gray-800',
      sold: 'bg-blue-100 text-blue-800',
      rented: 'bg-purple-100 text-purple-800',
    };
    const labels: any = {
      active: 'Aktif',
      passive: 'Pasif',
      sold: 'Satıldı',
      rented: 'Kiralandı',
    };
    return <span className={`px-2 text-xs font-semibold rounded-full ${colors[status]}`}>{labels[status]}</span>;
  };

  const canUpdate = hasPermission('leads.update');

  const renderPagination = () => {
    if (searchTerm || totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className={`p-2 rounded-lg ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        {startPage > 1 && (
          <>
            <button onClick={() => setCurrentPage(1)} className="px-3 py-1 rounded-lg hover:bg-gray-100">1</button>
            {startPage > 2 && <span className="text-gray-500">...</span>}
          </>
        )}
        {pages.map(page => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-1 rounded-lg ${currentPage === page ? 'bg-primary-600 text-white' : 'hover:bg-gray-100'}`}
          >
            {page}
          </button>
        ))}
        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <span className="text-gray-500">...</span>}
            <button onClick={() => setCurrentPage(totalPages)} className="px-3 py-1 rounded-lg hover:bg-gray-100">{totalPages}</button>
          </>
        )}
        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className={`p-2 rounded-lg ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Arşivlenmiş Potansiyel Müşteriler</h1>
        <p className="text-gray-600 mt-1">Arşivlenmiş müşterilerinizi görüntüleyin</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Arşivde ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ad Soyad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Personel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İlan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tip</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İlan Durumu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hatırlatma</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ajanda</th>
                {canUpdate && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={10} className="px-6 py-4 text-center text-gray-500">Yükleniyor...</td></tr>
              ) : filteredLeads.length === 0 ? (
                <tr><td colSpan={10} className="px-6 py-4 text-center text-gray-500">Arşivlenmiş kayıt bulunamadı</td></tr>
              ) : (
                filteredLeads.map((lead) => {
                  const reminderColor = lead.reminderDate ?
                    (new Date(lead.reminderDate) < new Date() ? 'text-red-600' :
                     new Date(lead.reminderDate).toDateString() === new Date().toDateString() ? 'text-yellow-600' :
                     'text-green-600') : '';

                  return (
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{lead.firstName} {lead.lastName}</div></td>
                    <td className="px-6 py-4"><div className="text-sm text-gray-900">{lead.phone}</div></td>
                    <td className="px-6 py-4">
                      {lead.assignedUser ? (
                        <div className="text-sm text-gray-900">{lead.assignedUser.firstName}</div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {lead.listingUrl ? (
                        <a href={lead.listingUrl} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-900">
                          <ExternalLink className="h-5 w-5" />
                        </a>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4">{getListingTypeBadge(lead.listingType)}</td>
                    <td className="px-6 py-4">{getListingStatusBadge(lead.listingStatus)}</td>
                    <td className="px-6 py-4">{getPropertyStatusBadge(lead.propertyStatus)}</td>
                    <td className="px-6 py-4">
                      {lead.reminderDate ? (
                        <div className={`text-sm flex items-center ${reminderColor}`}>
                          <Calendar className="h-4 w-4 mr-1" />
                          {new Date(lead.reminderDate).toLocaleDateString('tr-TR')}
                        </div>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {lead.isAgenda ? <CheckSquare className="h-5 w-5 text-green-600 mx-auto" /> : '-'}
                    </td>
                    {canUpdate && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleUnarchive(lead.id)}
                          className="text-green-600 hover:text-green-900 flex items-center justify-end space-x-1"
                        >
                          <Archive className="h-5 w-5" />
                          <span className="text-sm">Arşivden Çıkar</span>
                        </button>
                      </td>
                    )}
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Toplam <span className="font-medium">{totalCount}</span> arşivlenmiş kayıt
              {searchTerm && (
                <span className="ml-2">
                  (<span className="font-medium">{filteredLeads.length}</span> gösteriliyor)
                </span>
              )}
              {!searchTerm && (
                <span className="ml-2">
                  - Sayfa <span className="font-medium">{currentPage}</span> / <span className="font-medium">{totalPages}</span>
                </span>
              )}
            </div>
            {renderPagination()}
          </div>
        </div>
      </div>
    </div>
  );
}
