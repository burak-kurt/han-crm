import { useState, useEffect, useCallback } from 'react';
import { Settings, Trash2, UserPlus, Mail, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import api from '../lib/axios';

type NotificationType = 'mujde_alarm' | 'daily_summary' | 'weekly_stale';
type ActiveTab = NotificationType | 'email_logs';

interface Recipient {
  id: number;
  notificationType: string;
  userId: number | null;
  userName: string | null;
  email: string;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface EmailLog {
  id: number;
  to: string;
  subject: string;
  success: boolean;
  errorMessage: string | null;
  sentAt: string;
}

const NOTIF_TABS: { key: NotificationType; label: string; description: string }[] = [
  {
    key: 'mujde_alarm',
    label: 'Müjde Alarmı',
    description: 'Bir lead "Kazanıldı" statüsüne geçtiğinde bu kişilere mail gönderilir.',
  },
  {
    key: 'daily_summary',
    label: 'Günlük Özet',
    description: "Her sabah 08:00'de dünkü yeni kayıtların özeti bu kişilere gönderilir.",
  },
  {
    key: 'weekly_stale',
    label: 'Haftalık Bayat Raporu',
    description: "Her Cuma 16:00'da hareketsiz müşteri raporu bu kişilere gönderilir.",
  },
];

export default function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('mujde_alarm');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [externalEmail, setExternalEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [logLoading, setLogLoading] = useState(false);
  const [logTotal, setLogTotal] = useState(0);
  const [logPage, setLogPage] = useState(1);
  const [logTotalPages, setLogTotalPages] = useState(1);

  const isNotifTab = (t: ActiveTab): t is NotificationType => t !== 'email_logs';

  const fetchRecipients = useCallback(async (type: NotificationType) => {
    setLoading(true);
    try {
      const r = await api.get(`/notification-settings/${type}/recipients`);
      setRecipients(r.data.data);
    } catch {
      setRecipients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmailLogs = useCallback(async (page: number) => {
    setLogLoading(true);
    try {
      const r = await api.get(`/email-logs?page=${page}&limit=50`);
      setEmailLogs(r.data.data.logs);
      setLogTotal(r.data.data.total);
      setLogPage(r.data.data.page);
      setLogTotalPages(r.data.data.totalPages);
    } catch {
      setEmailLogs([]);
    } finally {
      setLogLoading(false);
    }
  }, []);

  useEffect(() => {
    setError('');
    if (isNotifTab(activeTab)) {
      fetchRecipients(activeTab);
    } else {
      fetchEmailLogs(1);
    }
  }, [activeTab, fetchRecipients, fetchEmailLogs]);

  useEffect(() => {
    api.get('/users?page=1&limit=100')
      .then(r => setUsers(r.data.data.users || r.data.data))
      .catch(() => {});
  }, []);

  const addUser = async () => {
    if (!selectedUserId || !isNotifTab(activeTab)) return;
    setError('');
    try {
      await api.post(`/notification-settings/${activeTab}/recipients`, { userId: Number(selectedUserId) });
      setSelectedUserId('');
      fetchRecipients(activeTab);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Hata oluştu.');
    }
  };

  const addEmail = async () => {
    if (!externalEmail || !isNotifTab(activeTab)) return;
    setError('');
    try {
      await api.post(`/notification-settings/${activeTab}/recipients`, { externalEmail });
      setExternalEmail('');
      fetchRecipients(activeTab);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Hata oluştu.');
    }
  };

  const removeRecipient = async (id: number) => {
    if (!isNotifTab(activeTab)) return;
    try {
      await api.delete(`/notification-settings/${activeTab}/recipients/${id}`);
      setRecipients(prev => prev.filter(r => r.id !== id));
    } catch {
      setError('Silme işlemi başarısız.');
    }
  };

  const clearLogs = async () => {
    if (!window.confirm('Tüm email logları silinsin mi?')) return;
    try {
      await api.delete('/email-logs');
      setEmailLogs([]);
      setLogTotal(0);
    } catch {
      setError('Loglar silinemedi.');
    }
  };

  const addedUserIds = new Set(recipients.filter(r => r.userId).map(r => r.userId));
  const availableUsers = users.filter(u => !addedUserIds.has(u.id));
  const allTabs = [...NOTIF_TABS, { key: 'email_logs' as const, label: 'Email Logları', description: '' }];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-7 w-7 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">Sistem Ayarları</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {allTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-shrink-0 py-3 px-5 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Notification recipient tabs */}
          {isNotifTab(activeTab) && (() => {
            const currentTab = NOTIF_TABS.find(t => t.key === activeTab)!;
            return (
              <>
                <p className="text-sm text-gray-500 mb-6">{currentTab.description}</p>

                <div className="flex gap-2 mb-3">
                  <select
                    value={selectedUserId}
                    onChange={e => setSelectedUserId(e.target.value)}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Kullanıcı seçin...</option>
                    {availableUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.firstName} {u.lastName} ({u.email})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={addUser}
                    disabled={!selectedUserId}
                    className="flex items-center gap-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 disabled:opacity-40 transition-colors"
                  >
                    <UserPlus className="h-4 w-4" />
                    Kullanıcı Ekle
                  </button>
                </div>

                <div className="flex gap-2 mb-6">
                  <input
                    type="email"
                    value={externalEmail}
                    onChange={e => setExternalEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addEmail()}
                    placeholder="harici@email.com"
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    onClick={addEmail}
                    disabled={!externalEmail}
                    className="flex items-center gap-1 px-4 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-800 disabled:opacity-40 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    Email Ekle
                  </button>
                </div>

                {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

                {loading ? (
                  <div className="text-center py-8 text-gray-400 text-sm">Yükleniyor...</div>
                ) : recipients.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">Henüz alıcı eklenmedi.</div>
                ) : (
                  <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg overflow-hidden">
                    {recipients.map(r => (
                      <li key={r.id} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-gray-50">
                        <div>
                          {r.userId
                            ? <span className="text-sm font-medium text-gray-900">{r.userName}</span>
                            : <span className="text-sm font-medium text-gray-700">{r.email}</span>}
                          <span className="ml-2 text-xs text-gray-400">{r.userId ? r.email : 'Harici'}</span>
                        </div>
                        <button
                          onClick={() => removeRecipient(r.id)}
                          className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            );
          })()}

          {/* Email Logs tab */}
          {activeTab === 'email_logs' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">
                  Son email gönderim denemeleri. Toplam: <strong>{logTotal}</strong>
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchEmailLogs(logPage)}
                    className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    Yenile
                  </button>
                  <button
                    onClick={clearLogs}
                    className="flex items-center gap-1 px-3 py-1.5 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Temizle
                  </button>
                </div>
              </div>

              {logLoading ? (
                <div className="text-center py-10 text-gray-400 text-sm">Yükleniyor...</div>
              ) : emailLogs.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">Henüz email logu yok.</div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-lg border border-gray-100">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                          <th className="px-3 py-2 w-8"></th>
                          <th className="px-3 py-2">Alıcı</th>
                          <th className="px-3 py-2">Konu</th>
                          <th className="px-3 py-2 whitespace-nowrap">Tarih</th>
                          <th className="px-3 py-2">Hata</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {emailLogs.map(log => (
                          <tr key={log.id} className={log.success ? 'hover:bg-gray-50' : 'bg-red-50 hover:bg-red-100'}>
                            <td className="px-3 py-2">
                              {log.success
                                ? <CheckCircle className="h-4 w-4 text-green-500" />
                                : <XCircle className="h-4 w-4 text-red-500" />}
                            </td>
                            <td className="px-3 py-2 text-gray-700 max-w-[160px] truncate" title={log.to}>{log.to}</td>
                            <td className="px-3 py-2 text-gray-600 max-w-[220px] truncate" title={log.subject}>{log.subject}</td>
                            <td className="px-3 py-2 text-gray-500 whitespace-nowrap text-xs">
                              {new Date(log.sentAt).toLocaleString('tr-TR')}
                            </td>
                            <td className="px-3 py-2 text-red-600 text-xs max-w-[200px] truncate" title={log.errorMessage ?? ''}>
                              {log.errorMessage || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {logTotalPages > 1 && (
                    <div className="flex justify-center items-center gap-3 mt-4 text-sm">
                      <button
                        onClick={() => fetchEmailLogs(logPage - 1)}
                        disabled={logPage === 1}
                        className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50"
                      >
                        ‹
                      </button>
                      <span className="text-gray-500">{logPage} / {logTotalPages}</span>
                      <button
                        onClick={() => fetchEmailLogs(logPage + 1)}
                        disabled={logPage === logTotalPages}
                        className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50"
                      >
                        ›
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
