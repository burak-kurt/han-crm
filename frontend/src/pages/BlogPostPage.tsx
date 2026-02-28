import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Building2, Calendar, User, ArrowLeft } from 'lucide-react';
import axios from 'axios';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImageUrl?: string;
  authorName?: string;
  publishedAt?: string;
  createdAt: string;
}

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchPost = async () => {
      try {
        const response = await api.get(`/blog/slug/${slug}`);
        setPost(response.data.data);
      } catch (error: any) {
        if (error.response?.status === 404) setNotFound(true);
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Yazı bulunamadı</h1>
        <button onClick={() => navigate('/blog')} className="text-primary-600 hover:underline">
          Blog'a dön
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <nav className="bg-white shadow-sm border-b">
        <div className="container-custom py-4">
          <div className="flex justify-between items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">HAN CRM</span>
            </Link>
            <Link
              to="/crm/login"
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Giriş Yap
            </Link>
          </div>
        </div>
      </nav>

      <article className="container-custom py-12 max-w-3xl mx-auto">
        <Link to="/blog" className="flex items-center gap-2 text-primary-600 hover:underline mb-8 text-sm">
          <ArrowLeft className="h-4 w-4" />
          Blog'a Dön
        </Link>

        {post.coverImageUrl && (
          <img
            src={post.coverImageUrl}
            alt={post.title}
            className="w-full h-64 md:h-96 object-cover rounded-xl mb-8"
          />
        )}

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{post.title}</h1>

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 pb-8 border-b">
          {post.authorName && (
            <span className="flex items-center gap-1.5">
              <User className="h-4 w-4" />
              {post.authorName}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4" />
            {new Date(post.publishedAt || post.createdAt).toLocaleDateString('tr-TR', {
              year: 'numeric', month: 'long', day: 'numeric'
            })}
          </span>
        </div>

        <div
          className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-a:text-primary-600 prose-img:rounded-lg"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </div>
  );
}
