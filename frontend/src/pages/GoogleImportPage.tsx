import { useState, useEffect } from 'react';
import { Cloud, Link, Download, CheckCircle, AlertCircle, ExternalLink, RefreshCw, ArrowRight } from 'lucide-react';
import api from '../lib/axios';

interface SpreadsheetInfo {
  title: string;
  sheets: Array<{
    title: string;
    sheetId: number;
    rowCount: number;
    columnCount: number;
  }>;
}

interface PreviewData {
  headers: string[];
  rows: string[][];
  totalRows: number;
}

interface ColumnMapping {
  sheetColumn: string;
  sheetColumnIndex: number;
  mappedField: string;
  autoMatched: boolean;
}

interface AvailableField {
  value: string;
  label: string;
}

export default function GoogleImportPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authUrl, setAuthUrl] = useState('');
  const [authCode, setAuthCode] = useState('');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [spreadsheetInfo, setSpreadsheetInfo] = useState<SpreadsheetInfo | null>(null);
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [availableFields, setAvailableFields] = useState<AvailableField[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await api.get('/google/status');
      setIsAuthenticated(response.data.authenticated);
    } catch (err) {
      console.error('Auth status check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAuthUrl = async () => {
    try {
      setError('');
      const response = await api.get('/google/auth-url');
      setAuthUrl(response.data.authUrl);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Auth URL alınamadı');
    }
  };

  const submitAuthCode = async () => {
    try {
      setError('');
      await api.post('/google/callback', { code: authCode });
      setIsAuthenticated(true);
      setAuthUrl('');
      setAuthCode('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Yetkilendirme başarısız');
    }
  };

  const extractSpreadsheetId = (url: string): string | null => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const loadSpreadsheet = async () => {
    const spreadsheetId = extractSpreadsheetId(spreadsheetUrl);
    if (!spreadsheetId) {
      setError('Geçersiz Google Sheets URL\'si');
      return;
    }

    try {
      setError('');
      setLoading(true);
      setImportResult(null);

      const [infoRes, previewRes, mappingRes] = await Promise.all([
        api.get(`/google/spreadsheet/${spreadsheetId}`),
        api.get(`/google/spreadsheet/${spreadsheetId}/preview`),
        api.get(`/google/spreadsheet/${spreadsheetId}/mapping`),
      ]);

      setSpreadsheetInfo(infoRes.data);
      setPreviewData(previewRes.data);
      setMappings(mappingRes.data.mappings);
      setAvailableFields(mappingRes.data.availableFields);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Spreadsheet yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const updateMapping = (index: number, field: string) => {
    setMappings(prev => prev.map((m, i) =>
      i === index ? { ...m, mappedField: field, autoMatched: false } : m
    ));
  };

  const handleImport = async () => {
    const spreadsheetId = extractSpreadsheetId(spreadsheetUrl);
    if (!spreadsheetId) return;

    try {
      setImporting(true);
      setError('');
      setImportResult(null);

      const response = await api.post('/google/import', {
        spreadsheetId,
        mappings: mappings.map(m => ({
          sheetColumnIndex: m.sheetColumnIndex,
          mappedField: m.mappedField,
        })),
      });
      setImportResult({
        imported: response.data.imported,
        skipped: response.data.skipped,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Import başarısız');
    } finally {
      setImporting(false);
    }
  };

  const mappedCount = mappings.filter(m => m.mappedField !== 'skip').length;
  const unmappedCount = mappings.filter(m => m.mappedField === 'skip').length;

  if (loading && !spreadsheetInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Google Sheets Import</h1>
        <p className="text-gray-600 mt-1">Google Sheets'ten lead verilerini içe aktarın</p>
      </div>

      {/* Auth Status Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
              isAuthenticated ? 'bg-green-100' : 'bg-yellow-100'
            }`}>
              <Cloud className={`h-5 w-5 ${isAuthenticated ? 'text-green-600' : 'text-yellow-600'}`} />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Google Hesabı</h3>
              <p className={`text-sm ${isAuthenticated ? 'text-green-600' : 'text-yellow-600'}`}>
                {isAuthenticated ? 'Bağlı' : 'Bağlı değil'}
              </p>
            </div>
          </div>

          {!isAuthenticated && !authUrl && (
            <button
              onClick={getAuthUrl}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Google ile Bağlan
            </button>
          )}
        </div>

        {/* Auth Flow */}
        {!isAuthenticated && authUrl && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Adım 1: Google'da Yetkilendirme</h4>
              <p className="text-sm text-blue-700 mb-3">
                Aşağıdaki linke tıklayın ve Google hesabınızla giriş yapın. Onay verdikten sonra size bir kod verilecek.
              </p>
              <a
                href={authUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Google'da Yetkilendir</span>
              </a>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Adım 2: Kodu Girin</h4>
              <p className="text-sm text-gray-600 mb-3">
                Google'dan aldığınız kodu aşağıya yapıştırın:
              </p>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={authCode}
                  onChange={(e) => setAuthCode(e.target.value)}
                  placeholder="Yetkilendirme kodunu yapıştırın..."
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={submitAuthCode}
                  disabled={!authCode}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Onayla
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Spreadsheet URL Input */}
      {isAuthenticated && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-medium text-gray-900 mb-4">Google Sheets URL</h3>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={spreadsheetUrl}
                onChange={(e) => setSpreadsheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <button
              onClick={loadSpreadsheet}
              disabled={!spreadsheetUrl || loading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {loading ? 'Yükleniyor...' : 'Yükle'}
            </button>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Import Result */}
      {importResult && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
          <div className="flex items-center">
            <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
            <p className="text-green-700">
              Import tamamlandı! <strong>{importResult.imported}</strong> kayıt eklendi,
              <strong> {importResult.skipped}</strong> atlandı.
            </p>
          </div>
        </div>
      )}

      {/* Column Mapping */}
      {mappings.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-medium text-gray-900">Kolon Eşleştirme</h3>
              <p className="text-sm text-gray-500 mt-1">
                Her sütunun hangi alana karşılık geldiğini kontrol edin.
                <span className="ml-2 text-green-600 font-medium">{mappedCount} eşleşti</span>
                {unmappedCount > 0 && (
                  <span className="ml-2 text-yellow-600 font-medium">{unmappedCount} eşleşmedi</span>
                )}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {mappings.map((mapping, idx) => (
              <div
                key={idx}
                className={`flex items-center space-x-3 p-3 rounded-lg ${
                  mapping.mappedField === 'skip'
                    ? 'bg-gray-50'
                    : mapping.autoMatched
                    ? 'bg-green-50'
                    : 'bg-blue-50'
                }`}
              >
                <div className="w-1/3 min-w-0">
                  <span className="text-sm font-medium text-gray-700 truncate block">
                    {mapping.sheetColumn || `Kolon ${idx + 1}`}
                  </span>
                </div>

                <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />

                <div className="w-1/3 min-w-0">
                  <select
                    value={mapping.mappedField}
                    onChange={(e) => updateMapping(idx, e.target.value)}
                    className={`w-full px-3 py-1.5 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 ${
                      mapping.mappedField === 'skip'
                        ? 'border-gray-300 text-gray-400'
                        : mapping.autoMatched
                        ? 'border-green-300'
                        : 'border-blue-300'
                    }`}
                  >
                    {availableFields.map(field => (
                      <option key={field.value} value={field.value}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-shrink-0 w-20 text-right">
                  {mapping.autoMatched && mapping.mappedField !== 'skip' && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Otomatik
                    </span>
                  )}
                  {!mapping.autoMatched && mapping.mappedField !== 'skip' && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      Manuel
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spreadsheet Info & Preview */}
      {spreadsheetInfo && (
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">{spreadsheetInfo.title}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {spreadsheetInfo.sheets.length} sayfa,
                  toplam {previewData?.totalRows || 0} satır veri
                </p>
              </div>
              <button
                onClick={handleImport}
                disabled={importing || mappedCount === 0}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {importing ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Download className="h-5 w-5" />
                )}
                <span>{importing ? 'Import Ediliyor...' : 'Import Et'}</span>
              </button>
            </div>
          </div>

          {/* Preview Table */}
          {previewData && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {previewData.headers.map((header, idx) => {
                      const mapping = mappings.find(m => m.sheetColumnIndex === idx);
                      const field = availableFields.find(f => f.value === mapping?.mappedField);
                      return (
                        <th key={idx} className="px-4 py-3 text-left text-xs font-medium text-gray-500">
                          <div>{header || `Kolon ${idx + 1}`}</div>
                          {field && field.value !== 'skip' && (
                            <div className="text-primary-600 font-normal mt-0.5">
                              → {field.label}
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.rows.map((row, rowIdx) => (
                    <tr key={rowIdx}>
                      {row.map((cell, cellIdx) => {
                        const mapping = mappings.find(m => m.sheetColumnIndex === cellIdx);
                        const isSkipped = mapping?.mappedField === 'skip';
                        return (
                          <td
                            key={cellIdx}
                            className={`px-4 py-3 text-sm max-w-xs truncate ${
                              isSkipped ? 'text-gray-300' : 'text-gray-900'
                            }`}
                          >
                            {cell || '-'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.totalRows > 10 && (
                <div className="p-4 bg-gray-50 text-center text-sm text-gray-500">
                  İlk 10 satır gösteriliyor. Toplam {previewData.totalRows} satır.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      {isAuthenticated && !spreadsheetInfo && (
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="font-medium text-blue-900 mb-2">Nasıl Kullanılır?</h3>
          <ol className="list-decimal list-inside text-sm text-blue-800 space-y-2">
            <li>Google Sheets dosyanızın URL'sini yukarıdaki alana yapıştırın</li>
            <li>"Yükle" butonuna tıklayın</li>
            <li>Kolon eşleştirmelerini kontrol edin, gerekirse değiştirin</li>
            <li>Veri önizlemesini kontrol edin</li>
            <li>"Import Et" butonuyla verileri sisteme aktarın</li>
          </ol>
          <p className="text-sm text-blue-700 mt-4">
            <strong>Not:</strong> Spreadsheet'inizin ilk satırı başlık satırı olmalıdır.
            Eşleşmeyen sütunları "Notlara Ekle" seçeneğiyle notlara aktarabilir veya "Atla" ile atlayabilirsiniz.
          </p>
        </div>
      )}
    </div>
  );
}
