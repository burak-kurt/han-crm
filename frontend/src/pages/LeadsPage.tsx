import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X, ExternalLink, Calendar, CheckSquare, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import api from '../lib/axios';
import { useAuthStore } from '../store/authStore';

interface Lead {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  source: string;
  status: string;
  propertyStatus: string;
  interest?: string;
  budget?: number;
  notes?: string;
  nextFollowUp?: string;
  listingUrl?: string;
  listingType?: string;
  listingStatus?: string;
  lastActionDate?: string;
  reminderDate?: string;
  notificationStatus?: string;
  isAgenda?: boolean;
  createdAt?: string;
  assignedTo?: number;
  assignedUser?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
}

export default function LeadsPage() {
  const { hasPermission } = useAuthStore();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 100;

  // Filter states
  const [filterPropertyStatus, setFilterPropertyStatus] = useState('');
  const [filterListingType, setFilterListingType] = useState('');
  const [filterListingStatus, setFilterListingStatus] = useState('');
  const [filterAssignedTo, setFilterAssignedTo] = useState('');
  const [filterIsAgenda, setFilterIsAgenda] = useState('');
  const [filterIsStale, setFilterIsStale] = useState('');
  const [formError, setFormError] = useState('');

  // Bulk selection states
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  // Users for filter dropdown
  const [users, setUsers] = useState<User[]>([]);

  // Iframe preview modal
  const [previewLead, setPreviewLead] = useState<Lead | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Form step state
  const [formStep, setFormStep] = useState(1);

  // Helper: 1 hafta sonrasını hesapla
  const getOneWeekLater = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', source: 'direct',
    propertyStatus: 'aranacak', interest: '', budget: '', notes: '',
    nextFollowUp: getOneWeekLater(), listingUrl: '', listingType: '',
    listingStatus: 'active', reminderDate: getOneWeekLater(), isAgenda: false,
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [currentPage, filterPropertyStatus, filterListingType, filterListingStatus, filterAssignedTo, filterIsAgenda, filterIsStale]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.data.filter((u: User) => u.isActive));
    } catch (error) {
      console.error('Users fetch error:', error);
    }
  };

  const fetchLeads = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        ...(filterPropertyStatus && { propertyStatus: filterPropertyStatus }),
        ...(filterListingType && { listingType: filterListingType }),
        ...(filterListingStatus && { listingStatus: filterListingStatus }),
        ...(filterAssignedTo && { assignedTo: filterAssignedTo }),
        ...(filterIsAgenda && { isAgenda: filterIsAgenda }),
        ...(filterIsStale && { isStale: filterIsStale }),
      });

      const response = await api.get(`/leads?${params.toString()}`);
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

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setFormError('');
    try {
      if (editingLead) {
        await api.put(`/leads/${editingLead.id}`, formData);
      } else {
        await api.post('/leads', formData);
      }
      setShowModal(false);
      resetForm();
      fetchLeads();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Bir hata oluştu';
      if (error.response?.status === 409) {
        setFormError(`⛔ Mükerrer kayıt: ${msg}`);
      } else {
        setFormError(msg);
      }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Silmek istediğinizden emin misiniz?')) return;
    try {
      await api.delete(`/leads/${id}`);
      fetchLeads();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Silme işlemi başarısız');
    }
  };

  const handleBulkArchive = async () => {
    if (!confirm(`${selectedLeads.length} kaydı arşive atmak istediğinizden emin misiniz?`)) return;
    try {
      await Promise.all(
        selectedLeads.map(id => api.put(`/leads/${id}`, { isArchived: true }))
      );
      setSelectedLeads([]);
      setSelectAll(false);
      fetchLeads();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Arşivleme işlemi başarısız');
    }
  };

  const handleOpenPreview = (lead: Lead) => {
    setPreviewLead(lead);
    setShowPreviewModal(true);
  };

  const handleUpdateListingStatus = async (leadId: number, newStatus: string) => {
    try {
      await api.put(`/leads/${leadId}`, { listingStatus: newStatus });
      // Update local state
      setLeads(leads.map(l => l.id === leadId ? { ...l, listingStatus: newStatus } : l));
      if (previewLead && previewLead.id === leadId) {
        setPreviewLead({ ...previewLead, listingStatus: newStatus });
      }
    } catch (error: any) {
      alert(error.response?.data?.message || 'Güncelleme başarısız');
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setFormData({
      firstName: lead.firstName, lastName: lead.lastName,
      email: lead.email || '', phone: lead.phone,
      source: lead.source, propertyStatus: lead.propertyStatus,
      interest: lead.interest || '', budget: lead.budget?.toString() || '',
      notes: lead.notes || '', nextFollowUp: lead.nextFollowUp?.split('T')[0] || '',
      listingUrl: lead.listingUrl || '', listingType: lead.listingType || '',
      listingStatus: lead.listingStatus || '', reminderDate: lead.reminderDate?.split('T')[0] || '',
      isAgenda: lead.isAgenda || false,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      firstName: '', lastName: '', email: '', phone: '', source: 'direct',
      propertyStatus: 'aranacak', interest: '', budget: '', notes: '',
      nextFollowUp: getOneWeekLater(), listingUrl: '', listingType: '',
      listingStatus: 'active', reminderDate: getOneWeekLater(), isAgenda: false,
    });
    setEditingLead(null);
    setFormStep(1);
  };

  const filteredLeads = leads.filter(l =>
    l.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.phone.includes(searchTerm)
  );

  const isLeadStale = (lead: Lead): boolean => {
    const closedStatuses = ['kaybedildi', 'kazanildi'];
    if (closedStatuses.includes((lead.propertyStatus || '').toLowerCase())) return false;
    if (!lead.createdAt) return false;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    if (new Date(lead.createdAt) > sevenDaysAgo) return false;
    if (!lead.nextFollowUp) return true;
    return new Date(lead.nextFollowUp) < new Date();
  };

  const buildWhatsAppLink = (lead: Lead): string => {
    const rawPhone = (lead.phone || '').replace(/\D/g, '');
    const phone = rawPhone.startsWith('0') ? rawPhone.slice(1) : rawPhone;
    let msg = `Sayın ${lead.firstName} ${lead.lastName}, görüşmemize istinaden randevu talebinde bulunmak istiyorum.`;
    if (lead.nextFollowUp) {
      const dateStr = new Date(lead.nextFollowUp).toLocaleDateString('tr-TR');
      msg += ` Randevu tarihi: ${dateStr}.`;
    }
    return `https://wa.me/90${phone}?text=${encodeURIComponent(msg)}`;
  };

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

  const canCreate = hasPermission('leads.create');
  const canUpdate = hasPermission('leads.update');
  const canDelete = hasPermission('leads.delete');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Potansiyel Müşteri Yönetimi</h1>
        <p className="text-gray-600 mt-1">Potansiyel müşterilerinizi takip edin</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Potansiyel müşteri ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {canCreate && (
              <button onClick={() => { resetForm(); setShowModal(true); }}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                <Plus className="h-5 w-5" /><span>Yeni Potansiyel Müşteri</span>
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <select
              value={filterPropertyStatus}
              onChange={(e) => setFilterPropertyStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="">Emlak Durumu: Tümü</option>
              <option value="aranacak">Aranacak</option>
              <option value="arandi">Arandı</option>
              <option value="ziyaret_planlandi">Ziyaret Planlandı</option>
              <option value="kaybedildi">Kaybedildi</option>
              <option value="kazanildi">Kazanıldı</option>
            </select>

            <select
              value={filterListingType}
              onChange={(e) => setFilterListingType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="">İlan Tipi: Tümü</option>
              <option value="sale">Satılık</option>
              <option value="rent">Kiralık</option>
            </select>

            <select
              value={filterListingStatus}
              onChange={(e) => setFilterListingStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="">İlan Durumu: Tümü</option>
              <option value="active">Aktif</option>
              <option value="passive">Pasif</option>
              <option value="sold">Satıldı</option>
              <option value="rented">Kiralandı</option>
            </select>

            <select
              value={filterAssignedTo}
              onChange={(e) => setFilterAssignedTo(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="">Danışman: Tümü</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>
              ))}
            </select>

            <select
              value={filterIsAgenda}
              onChange={(e) => setFilterIsAgenda(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="">Ajanda: Tümü</option>
              <option value="true">Evet</option>
              <option value="false">Hayır</option>
            </select>

            <select
              value={filterIsStale}
              onChange={(e) => { setFilterIsStale(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
            >
              <option value="">Bayat: Tümü</option>
              <option value="true">🕸️ Bayat Müşteriler</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedLeads.length > 0 && canUpdate && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mx-6 mt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">
                {selectedLeads.length} kayıt seçildi
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={handleBulkArchive}
                  className="px-4 py-2 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700"
                >
                  Arşive At
                </button>
                <button
                  onClick={() => {
                    setSelectedLeads([]);
                    setSelectAll(false);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700"
                >
                  İptal
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {canUpdate && (
                  <th className="px-6 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={selectAll}
                      onChange={(e) => {
                        setSelectAll(e.target.checked);
                        if (e.target.checked) {
                          setSelectedLeads(filteredLeads.map(l => l.id));
                        } else {
                          setSelectedLeads([]);
                        }
                      }}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ad Soyad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Danışman</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İlan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tip</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">İlan Durumu</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hatırlatma</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ajanda</th>
                {(canUpdate || canDelete) && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={canUpdate ? 11 : 10} className="px-6 py-4 text-center text-gray-500">Yükleniyor...</td></tr>
              ) : filteredLeads.length === 0 ? (
                <tr><td colSpan={canUpdate ? 11 : 10} className="px-6 py-4 text-center text-gray-500">Potansiyel müşteri bulunamadı</td></tr>
              ) : (
                filteredLeads.map((lead) => {
                  const reminderColor = lead.reminderDate ?
                    (new Date(lead.reminderDate) < new Date() ? 'text-red-600' :
                     new Date(lead.reminderDate).toDateString() === new Date().toDateString() ? 'text-yellow-600' :
                     'text-green-600') : '';

                  return (
                  <tr key={lead.id} className={`hover:bg-gray-50 ${isLeadStale(lead) ? 'border-l-4 border-orange-400' : ''}`}>
                    {canUpdate && (
                      <td className="px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedLeads([...selectedLeads, lead.id]);
                            } else {
                              setSelectedLeads(selectedLeads.filter(id => id !== lead.id));
                              setSelectAll(false);
                            }
                          }}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </td>
                    )}
                    <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{lead.firstName} {lead.lastName}</div></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="text-sm text-gray-900">{lead.phone}</div>
                        {lead.phone && (
                          <a
                            href={buildWhatsAppLink(lead)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="WhatsApp ile mesaj gönder"
                            className="text-green-600 hover:text-green-800 flex-shrink-0"
                          >
                            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {lead.assignedUser ? (
                        <div className="text-sm text-gray-900">{lead.assignedUser.firstName}</div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {lead.listingUrl ? (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => handleOpenPreview(lead)}
                            className="text-primary-600 hover:text-primary-900"
                            title="Önizleme"
                          >
                            <Eye className="h-5 w-5" />
                          </button>
                          <a
                            href={lead.listingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-500 hover:text-gray-700"
                            title="Yeni sekmede aç"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
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
                    {(canUpdate || canDelete) && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          {canUpdate && <button onClick={() => handleEdit(lead)} className="text-primary-600 hover:text-primary-900"><Edit className="h-5 w-5" /></button>}
                          {canDelete && <button onClick={() => handleDelete(lead.id)} className="text-red-600 hover:text-red-900"><Trash2 className="h-5 w-5" /></button>}
                        </div>
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
              Toplam <span className="font-medium">{totalCount}</span> kayıt
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

            {!searchTerm && totalPages > 1 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded-lg border ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="flex space-x-1">
                  {[...Array(Math.min(5, totalPages))].map((_, idx) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = idx + 1;
                    } else if (currentPage <= 3) {
                      pageNum = idx + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + idx;
                    } else {
                      pageNum = currentPage - 2 + idx;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded-lg border ${
                          currentPage === pageNum
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded-lg border ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{editingLead ? 'Düzenle' : 'Yeni Potansiyel Müşteri'}</h2>
                <p className="text-sm text-gray-500">Adım {formStep} / 3</p>
              </div>
              <button onClick={() => { setShowModal(false); setFormError(''); }} className="p-1 hover:bg-gray-200 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex px-4 pt-4">
              <div className="flex-1 flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${formStep >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}>1</div>
                <div className={`flex-1 h-1 mx-2 ${formStep >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
              </div>
              <div className="flex-1 flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${formStep >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}>2</div>
                <div className={`flex-1 h-1 mx-2 ${formStep >= 3 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
              </div>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${formStep >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'}`}>3</div>
              </div>
            </div>
            <div className="flex px-4 pb-2 text-xs text-gray-500">
              <div className="flex-1 text-center">Kişi Bilgileri</div>
              <div className="flex-1 text-center">İlan Bilgileri</div>
              <div className="flex-1 text-center">Takip</div>
            </div>

            {/* Form Error */}
            {formError && (
              <div className="mx-4 mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {formError}
              </div>
            )}

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4">
              {/* Step 1: Kişi Bilgileri */}
              {formStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ad *</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Ad"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Soyad *</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="Soyad"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefon *</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="05XX XXX XX XX"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İlan Linki</label>
                    <input
                      type="url"
                      value={formData.listingUrl}
                      onChange={(e) => setFormData({...formData, listingUrl: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="https://sahibinden.com/ilan/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="ornek@email.com"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: İlan Bilgileri */}
              {formStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">İlan Tipi</label>
                      <select
                        value={formData.listingType}
                        onChange={(e) => setFormData({...formData, listingType: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="">Seçiniz</option>
                        <option value="sale">Satılık</option>
                        <option value="rent">Kiralık</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">İlan Durumu</label>
                      <select
                        value={formData.listingStatus}
                        onChange={(e) => setFormData({...formData, listingStatus: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      >
                        <option value="active">Aktif</option>
                        <option value="passive">Pasif</option>
                        <option value="sold">Satıldı</option>
                        <option value="rented">Kiralandı</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">İlgi Alanı / Bölge</label>
                    <input
                      type="text"
                      value={formData.interest}
                      onChange={(e) => setFormData({...formData, interest: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Örn: Kadıköy, 3+1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bütçe (TL)</label>
                    <input
                      type="number"
                      value={formData.budget}
                      onChange={(e) => setFormData({...formData, budget: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Örn: 5000000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Kaynak</label>
                    <select
                      value={formData.source}
                      onChange={(e) => setFormData({...formData, source: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="direct">Direkt</option>
                      <option value="website">Web Sitesi</option>
                      <option value="referral">Referans</option>
                      <option value="social_media">Sosyal Medya</option>
                      <option value="advertisement">Reklam</option>
                      <option value="other">Diğer</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 3: Takip */}
              {formStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emlak Durumu</label>
                    <select
                      value={formData.propertyStatus}
                      onChange={(e) => setFormData({...formData, propertyStatus: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="aranacak">Aranacak</option>
                      <option value="arandi">Arandı</option>
                      <option value="ziyaret_planlandi">Ziyaret Planlandı</option>
                      <option value="kaybedildi">Kaybedildi</option>
                      <option value="kazanildi">Kazanıldı</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sonraki Takip</label>
                      <input
                        type="date"
                        value={formData.nextFollowUp}
                        onChange={(e) => setFormData({...formData, nextFollowUp: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Hatırlatma</label>
                      <input
                        type="date"
                        value={formData.reminderDate}
                        onChange={(e) => setFormData({...formData, reminderDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <input
                      type="checkbox"
                      id="isAgenda"
                      checked={formData.isAgenda}
                      onChange={(e) => setFormData({...formData, isAgenda: e.target.checked})}
                      className="h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <label htmlFor="isAgenda" className="ml-3 text-sm font-medium text-gray-700">
                      Ajandaya Ekle
                    </label>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notlar</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      rows={3}
                      placeholder="Ek bilgiler..."
                    />
                  </div>
                </div>
              )}
            </form>

            {/* Footer Buttons */}
            <div className="flex justify-between p-4 border-t bg-gray-50">
              <button
                type="button"
                onClick={() => {
                  if (formStep === 1) {
                    setShowModal(false);
                  } else {
                    setFormStep(formStep - 1);
                  }
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-gray-700"
              >
                {formStep === 1 ? 'İptal' : 'Geri'}
              </button>

              {formStep < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (formStep === 1 && (!formData.firstName || !formData.lastName || !formData.phone)) {
                      alert('Lütfen zorunlu alanları doldurun (Ad, Soyad, Telefon)');
                      return;
                    }
                    setFormStep(formStep + 1);
                  }}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  İleri
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {editingLead ? 'Güncelle' : 'Kaydet'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Iframe Preview Modal */}
      {showPreviewModal && previewLead && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  İlan Önizleme - {previewLead.firstName} {previewLead.lastName}
                </h3>
                {getListingStatusBadge(previewLead.listingStatus)}
              </div>
              <div className="flex items-center space-x-2">
                <a
                  href={previewLead.listingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Yeni Sekmede Aç</span>
                </a>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Status Update Buttons */}
            <div className="flex items-center space-x-2 p-4 bg-gray-50 border-b">
              <span className="text-sm font-medium text-gray-700 mr-2">İlan Durumu Güncelle:</span>
              <button
                onClick={() => handleUpdateListingStatus(previewLead.id, 'active')}
                className={`px-3 py-1 text-sm rounded-full ${
                  previewLead.listingStatus === 'active'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-100 text-green-800 hover:bg-green-200'
                }`}
              >
                Aktif
              </button>
              <button
                onClick={() => handleUpdateListingStatus(previewLead.id, 'passive')}
                className={`px-3 py-1 text-sm rounded-full ${
                  previewLead.listingStatus === 'passive'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                Pasif
              </button>
              <button
                onClick={() => handleUpdateListingStatus(previewLead.id, 'sold')}
                className={`px-3 py-1 text-sm rounded-full ${
                  previewLead.listingStatus === 'sold'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                }`}
              >
                Satıldı
              </button>
              <button
                onClick={() => handleUpdateListingStatus(previewLead.id, 'rented')}
                className={`px-3 py-1 text-sm rounded-full ${
                  previewLead.listingStatus === 'rented'
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                }`}
              >
                Kiralandı
              </button>
            </div>

            {/* Iframe */}
            <div className="flex-1 p-4">
              <iframe
                src={previewLead.listingUrl}
                className="w-full h-full border rounded-lg"
                title="İlan Önizleme"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>

            {/* Footer Info */}
            <div className="flex items-center justify-between p-4 border-t bg-gray-50 text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span><strong>Telefon:</strong> {previewLead.phone}</span>
                <span><strong>Danışman:</strong> {previewLead.assignedUser?.firstName || '-'}</span>
                <span><strong>Tip:</strong> {previewLead.listingType === 'sale' ? 'Satılık' : previewLead.listingType === 'rent' ? 'Kiralık' : '-'}</span>
              </div>
              <div className="text-xs text-gray-400">
                Not: Bazı siteler iframe içinde görüntülemeyi engelleyebilir. Bu durumda "Yeni Sekmede Aç" butonunu kullanın.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
