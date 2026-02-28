import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, TrendingUp, Shield, BarChart3, Clock, ArrowRight, Calendar } from 'lucide-react';
import axios from 'axios';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  coverImageUrl?: string;
  publishedAt?: string;
  createdAt: string;
}

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });

export default function LandingPage() {
  const [recentPosts, setRecentPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    api.get('/blog?isPublished=true&page=1&limit=3')
      .then(r => setRecentPosts(r.data.data.posts))
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <nav className="bg-white shadow-sm">
        <div className="container-custom py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Building2 className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">HAN CRM</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/blog" className="text-gray-600 hover:text-primary-600 font-medium transition-colors">
                Blog
              </Link>
              <Link
                to="/crm/login"
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Giriş Yap
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <section className="container-custom py-20">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Gayrimenkul Danışmanlığınızı <span className="text-primary-600">Dijitalleştirin</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            HAN CRM ile müşterilerinizi takip edin, potansiyel müşterilerinizi yönetin ve satış süreçlerinizi optimize edin.
            Gayrimenkul sektörüne özel tasarlanmış güçlü CRM çözümü.
          </p>
          <div className="flex justify-center gap-4">
            <Link
              to="/crm/login"
              className="px-8 py-3 bg-primary-600 text-white rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Hemen Başlayın
            </Link>
            <a
              href="#features"
              className="px-8 py-3 bg-white text-primary-600 border-2 border-primary-600 rounded-lg text-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              Özellikler
            </a>
          </div>
        </div>

        <div id="features" className="mt-20 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <Users className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Müşteri Yönetimi</h3>
            <p className="text-gray-600">
              Tüm müşteri bilgilerinizi tek bir platformda saklayın ve kolayca erişin. Detaylı müşteri profilleri ve geçmiş takibi.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Potansiyel Müşteri Takibi</h3>
            <p className="text-gray-600">
              Potansiyel müşterilerinizi etkili bir şekilde yönetin. Satış hunisini takip edin ve dönüşüm oranlarınızı artırın.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Yetki Yönetimi</h3>
            <p className="text-gray-600">
              Ekibinizdeki her kullanıcı için özel rol ve yetki tanımlamaları yapın. Güvenli ve kontrollü erişim.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Raporlama ve Analiz</h3>
            <p className="text-gray-600">
              Detaylı raporlar ve analizlerle performansınızı takip edin. Veri odaklı kararlar alın.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aktivite Logları</h3>
            <p className="text-gray-600">
              Tüm sistem aktivitelerini kaydedin ve takip edin. Tam şeffaflık ve denetim imkanı.
            </p>
          </div>

          <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
            <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
              <Building2 className="h-6 w-6 text-primary-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Gayrimenkul Özelinde</h3>
            <p className="text-gray-600">
              Gayrimenkul sektörünün ihtiyaçlarına özel tasarlanmış özellikler. Emlak takibi ve müşteri eşleştirme.
            </p>
          </div>
        </div>
      </section>

      {recentPosts.length > 0 && (
        <section className="bg-white py-16">
          <div className="container-custom">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-bold text-gray-900">Son Blog Yazıları</h2>
              <Link to="/blog" className="flex items-center gap-1 text-primary-600 hover:underline font-medium">
                Tümünü Gör <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recentPosts.map(post => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="group rounded-xl overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  {post.coverImageUrl ? (
                    <img
                      src={post.coverImageUrl}
                      alt={post.title}
                      className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-44 bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                      <Building2 className="h-12 w-12 text-primary-400" />
                    </div>
                  )}
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">{post.excerpt}</p>
                    )}
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="h-3 w-3" />
                      {new Date(post.publishedAt || post.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <footer className="bg-gray-900 text-white py-8 mt-20">
        <div className="container-custom text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Building2 className="h-6 w-6" />
            <span className="text-xl font-bold">HAN CRM</span>
          </div>
          <p className="text-gray-400">
            © 2024 HAN Gayrimenkul CRM. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  );
}
