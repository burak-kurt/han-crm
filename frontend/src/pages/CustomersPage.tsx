import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';
import api from '../lib/axios';
import { useAuthStore } from '../store/authStore';

interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  address?: string;
  city?: string;
  status: string;
  budget?: number;
  propertyType?: string;
  notes?: string;
  assignedUser?: { id: number; firstName: string; lastName: string };
}

export default function CustomersPage() {
  const { hasPermission } = useAuthStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', address: '',
    city: '', status: 'active', budget: '', propertyType: '', notes: '',
  });

  useEffect(() => { fetchCustomers(); }, []);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/customers');
      setCustomers(response.data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, formData);
      } else {
        await api.post('/customers', formData);
      }
      setShowModal(false);
      resetForm();
      fetchCustomers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Bir hata oluştu');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Silmek istediğinizden emin misiniz?')) return;
    try {
      await api.delete(`/customers/${id}`);
      fetchCustomers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Silme işlemi başarısız');
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      firstName: customer.firstName, lastName: customer.lastName,
      email: customer.email || '', phone: customer.phone,
      address: customer.address || '', city: customer.city || '',
      status: customer.status, budget: customer.budget?.toString() || '',
      propertyType: customer.propertyType || '', notes: customer.notes || '',
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      firstName: '', lastName: '', email: '', phone: '', address: '',
      city: '', status: 'active', budget: '', propertyType: '', notes: '',
    });
    setEditingCustomer(null);
  };

  const filteredCustomers = customers.filter(c =>
    c.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const canCreate = hasPermission('customers.create');
  const canUpdate = hasPermission('customers.update');
  const canDelete = hasPermission('customers.delete');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Müşteri Yönetimi</h1>
        <p className="text-gray-600 mt-1">Müşterilerinizi yönetin</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Müşteri ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            {canCreate && (
              <button onClick={() => { resetForm(); setShowModal(true); }}
                className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                <Plus className="h-5 w-5" /><span>Yeni Müşteri</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ad Soyad</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Şehir</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Emlak Tipi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
                {(canUpdate || canDelete) && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlemler</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">Yükleniyor...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-4 text-center text-gray-500">Müşteri bulunamadı</td></tr>
              ) : (
                filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4"><div className="text-sm font-medium text-gray-900">{customer.firstName} {customer.lastName}</div></td>
                    <td className="px-6 py-4"><div className="text-sm text-gray-900">{customer.phone}</div></td>
                    <td className="px-6 py-4"><div className="text-sm text-gray-900">{customer.city || '-'}</div></td>
                    <td className="px-6 py-4"><div className="text-sm text-gray-900">{customer.propertyType || '-'}</div></td>
                    <td className="px-6 py-4">
                      <span className={`px-2 text-xs font-semibold rounded-full ${customer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {customer.status === 'active' ? 'Aktif' : customer.status === 'potential' ? 'Potansiyel' : 'Pasif'}
                      </span>
                    </td>
                    {(canUpdate || canDelete) && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end space-x-2">
                          {canUpdate && <button onClick={() => handleEdit(customer)} className="text-primary-600 hover:text-primary-900"><Edit className="h-5 w-5" /></button>}
                          {canDelete && <button onClick={() => handleDelete(customer.id)} className="text-red-600 hover:text-red-900"><Trash2 className="h-5 w-5" /></button>}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingCustomer ? 'Müşteriyi Düzenle' : 'Yeni Müşteri'}</h2>
              <button onClick={() => setShowModal(false)}><X className="h-6 w-6" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Ad</label>
                  <input type="text" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required /></div>
                <div><label className="block text-sm font-medium mb-1">Soyad</label>
                  <input type="text" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">E-posta</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Telefon</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 border rounded-lg" required /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium mb-1">Şehir</label>
                  <input type="text" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
                <div><label className="block text-sm font-medium mb-1">Emlak Tipi</label>
                  <input type="text" value={formData.propertyType} onChange={(e) => setFormData({...formData, propertyType: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Bütçe</label>
                <input type="number" value={formData.budget} onChange={(e) => setFormData({...formData, budget: e.target.value})} className="w-full px-3 py-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Adres</label>
                <textarea value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 border rounded-lg" rows={2} /></div>
              <div><label className="block text-sm font-medium mb-1">Notlar</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full px-3 py-2 border rounded-lg" rows={3} /></div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50">İptal</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">{editingCustomer ? 'Güncelle' : 'Oluştur'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
