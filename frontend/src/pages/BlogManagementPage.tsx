import { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Plus, Edit, Trash2, Eye, EyeOff, Upload, X,
  Bold, Italic, List, ListOrdered, Heading1, Heading2,
  Quote, Undo, Redo, Link as LinkIcon,
} from 'lucide-react';
import api from '../lib/axios';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImageUrl?: string;
  isPublished: boolean;
  publishedAt?: string;
  authorName?: string;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  title: string;
  excerpt: string;
  coverImageUrl: string;
  isPublished: boolean;
}

function MenuBar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  const addLink = () => {
    const url = prompt('Link URL:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
        title="Kalın"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
        title="İtalik"
      >
        <Italic className="h-4 w-4" />
      </button>
      <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200' : ''}`}
        title="Başlık 1"
      >
        <Heading1 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200' : ''}`}
        title="Başlık 2"
      >
        <Heading2 className="h-4 w-4" />
      </button>
      <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
        title="Madde listesi"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
        title="Numaralı liste"
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('blockquote') ? 'bg-gray-200' : ''}`}
        title="Alıntı"
      >
        <Quote className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={addLink}
        className={`p-1.5 rounded hover:bg-gray-200 ${editor.isActive('link') ? 'bg-gray-200' : ''}`}
        title="Link ekle"
      >
        <LinkIcon className="h-4 w-4" />
      </button>
      <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40"
        title="Geri al"
      >
        <Undo className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-40"
        title="İleri al"
      >
        <Redo className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function BlogManagementPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '', excerpt: '', coverImageUrl: '', isPublished: false,
  });
  const [coverUploading, setCoverUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: 'Blog içeriğini buraya yazın...' }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none p-4 min-h-[300px] focus:outline-none',
      },
    },
  });

  useEffect(() => { fetchPosts(); }, []);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/blog?limit=100');
      setPosts(response.data.data.posts);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = useCallback(() => {
    setEditingPost(null);
    setFormData({ title: '', excerpt: '', coverImageUrl: '', isPublished: false });
    editor?.commands.setContent('');
    setShowModal(true);
  }, [editor]);

  const openEdit = useCallback((post: BlogPost) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      excerpt: post.excerpt || '',
      coverImageUrl: post.coverImageUrl || '',
      isPublished: post.isPublished,
    });
    editor?.commands.setContent(post.content);
    setShowModal(true);
  }, [editor]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const response = await api.post('/upload/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFormData(prev => ({ ...prev, coverImageUrl: response.data.data.url }));
    } catch (error: any) {
      alert(error.response?.data?.message || 'Fotoğraf yüklenemedi');
    } finally {
      setCoverUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editor) return;
    setSaving(true);
    try {
      const payload = {
        ...formData,
        content: editor.getHTML(),
      };
      if (editingPost) {
        await api.put(`/blog/${editingPost.id}`, payload);
      } else {
        await api.post('/blog', payload);
      }
      setShowModal(false);
      fetchPosts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bu blog yazısını silmek istediğinizden emin misiniz?')) return;
    try {
      await api.delete(`/blog/${id}`);
      fetchPosts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Silme işlemi başarısız');
    }
  };

  const handleTogglePublish = async (post: BlogPost) => {
    try {
      await api.put(`/blog/${post.id}`, { isPublished: !post.isPublished });
      fetchPosts();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Bir hata oluştu');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Yazıları</h1>
          <p className="text-gray-500 text-sm mt-1">Landing page'de yayınlanacak blog yazılarını yönetin</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          <Plus className="h-5 w-5" />
          <span>Yeni Yazı</span>
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">Henüz blog yazısı yok.</p>
          <button onClick={openCreate} className="mt-4 text-primary-600 hover:underline">İlk yazıyı oluştur</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex items-start gap-4">
              {post.coverImageUrl && (
                <img src={post.coverImageUrl} alt={post.title} className="w-24 h-16 object-cover rounded flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold text-gray-900 truncate">{post.title}</h2>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${post.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {post.isPublished ? 'Yayında' : 'Taslak'}
                  </span>
                </div>
                {post.excerpt && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.excerpt}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {post.authorName} · {new Date(post.createdAt).toLocaleDateString('tr-TR')}
                  {post.isPublished && post.publishedAt && ` · Yayınlandı: ${new Date(post.publishedAt).toLocaleDateString('tr-TR')}`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleTogglePublish(post)}
                  className={`p-2 rounded-lg ${post.isPublished ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                  title={post.isPublished ? 'Yayından Kaldır' : 'Yayınla'}
                >
                  {post.isPublished ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
                <button
                  onClick={() => openEdit(post)}
                  className="p-2 rounded-lg text-blue-600 hover:bg-blue-50"
                  title="Düzenle"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(post.id)}
                  className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                  title="Sil"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl my-4">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-bold">{editingPost ? 'Blog Yazısını Düzenle' : 'Yeni Blog Yazısı'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Başlık *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Blog yazısı başlığı"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Özet</label>
                <textarea
                  rows={2}
                  value={formData.excerpt}
                  onChange={e => setFormData(prev => ({ ...prev, excerpt: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="Blog listesinde görünecek kısa açıklama (opsiyonel)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kapak Fotoğrafı</label>
                <div className="flex items-center gap-3">
                  {formData.coverImageUrl && (
                    <img src={formData.coverImageUrl} alt="Kapak" className="h-16 w-24 object-cover rounded border" />
                  )}
                  <label className={`flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 ${coverUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <Upload className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{coverUploading ? 'Yükleniyor...' : 'Fotoğraf Yükle'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={coverUploading}
                      onChange={handleCoverUpload}
                    />
                  </label>
                  {formData.coverImageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, coverImageUrl: '' }))}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Kaldır
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">İçerik *</label>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <MenuBar editor={editor} />
                  <EditorContent editor={editor} />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={e => setFormData(prev => ({ ...prev, isPublished: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                </label>
                <span className="text-sm font-medium text-gray-700">
                  {formData.isPublished ? 'Yayında' : 'Taslak olarak kaydet'}
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {saving ? 'Kaydediliyor...' : editingPost ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
