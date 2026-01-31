import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import api from '../lib/axios';
import { useAuthStore } from '../store/authStore';

interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: string[];
  createdAt: string;
}

const AVAILABLE_PERMISSIONS = [
  { value: 'users.view', label: 'Kullanıcıları Görüntüle' },
  { value: 'users.create', label: 'Kullanıcı Oluştur' },
  { value: 'users.update', label: 'Kullanıcı Güncelle' },
  { value: 'users.delete', label: 'Kullanıcı Sil' },
  { value: 'roles.view', label: 'Rolleri Görüntüle' },
  { value: 'roles.create', label: 'Rol Oluştur' },
  { value: 'roles.update', label: 'Rol Güncelle' },
  { value: 'roles.delete', label: 'Rol Sil' },
  { value: 'customers.view', label: 'Müşterileri Görüntüle' },
  { value: 'customers.create', label: 'Müşteri Oluştur' },
  { value: 'customers.update', label: 'Müşteri Güncelle' },
  { value: 'customers.delete', label: 'Müşteri Sil' },
  { value: 'leads.view', label: 'Potansiyel Müşterileri Görüntüle' },
  { value: 'leads.create', label: 'Potansiyel Müşteri Oluştur' },
  { value: 'leads.update', label: 'Potansiyel Müşteri Güncelle' },
  { value: 'leads.delete', label: 'Potansiyel Müşteri Sil' },
  { value: 'logs.view', label: 'Logları Görüntüle' },
];

export default function RolesPage() {
  const { hasPermission } = useAuthStore();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/roles');
      setRoles(response.data.data);
    } catch (error) {
      console.error('Error fetching roles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingRole) {
        await api.put(`/roles/${editingRole.id}`, formData);
      } else {
        await api.post('/roles', formData);
      }

      setShowModal(false);
      resetForm();
      fetchRoles();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Bir hata oluştu');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu rolü silmek istediğinizden emin misiniz?')) return;

    try {
      await api.delete(`/roles/${id}`);
      fetchRoles();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Silme işlemi başarısız');
    }
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions,
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissions: [],
    });
    setEditingRole(null);
  };

  const togglePermission = (permission: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const canCreate = hasPermission('roles.create');
  const canUpdate = hasPermission('roles.update');
  const canDelete = hasPermission('roles.delete');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rol ve Yetki Yönetimi</h1>
        <p className="text-gray-600 mt-1">Kullanıcı rollerini ve yetkilerini yönetin</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">Roller</h2>
            {canCreate && (
              <button
                onClick={() => {
                  resetForm();
                  setShowModal(true);
                }}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>Yeni Rol</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Yükleniyor...</div>
          ) : roles.length === 0 ? (
            <div className="text-center text-gray-500 py-8">Rol bulunamadı</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {roles.map((role) => (
                <div key={role.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{role.name}</h3>
                      {role.description && (
                        <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                      )}
                    </div>
                    {(canUpdate || canDelete) && (
                      <div className="flex space-x-1">
                        {canUpdate && (
                          <button
                            onClick={() => handleEdit(role)}
                            className="p-1 text-primary-600 hover:text-primary-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(role.id)}
                            className="p-1 text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{role.permissions.length}</span> yetki
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                {editingRole ? 'Rolü Düzenle' : 'Yeni Rol'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol Adı</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Yetkiler</label>
                <div className="border border-gray-300 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {AVAILABLE_PERMISSIONS.map((perm) => (
                      <label key={perm.value} className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(perm.value)}
                          onChange={() => togglePermission(perm.value)}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editingRole ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
