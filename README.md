# HAN CRM - Gayrimenkul Danışmanlık CRM Sistemi

Modern ve kullanıcı dostu gayrimenkul CRM sistemi. React, TypeScript, Node.js, Express ve PostgreSQL teknolojileri ile geliştirilmiştir.

## Özellikler

### Temel Özellikler
- 🏢 **Tanıtım Sayfası**: Profesyonel landing page
- 🔐 **Güvenli Giriş**: JWT tabanlı authentication sistemi
- 👥 **Kullanıcı Yönetimi**: Çalışan kayıt ve yönetimi
- 🛡️ **Rol ve Yetki Yönetimi**: Detaylı izin sistemi
- 📝 **Aktivite Logları**: Tüm sistem aktivitelerinin kaydı

### CRM Özellikleri
- 👨‍💼 **Müşteri Yönetimi**: Detaylı müşteri profilleri
- 🎯 **Potansiyel Müşteri Takibi**: Lead yönetimi ve satış hunisi
- 📊 **Dashboard**: Özet istatistikler ve hızlı erişim
- 🔍 **Arama ve Filtreleme**: Gelişmiş arama özellikleri
- 📱 **Responsive Tasarım**: Mobil uyumlu arayüz

## Teknoloji Stack

### Backend
- Node.js + Express
- TypeScript
- PostgreSQL + Sequelize ORM
- JWT Authentication
- Winston Logger
- Helmet Security

### Frontend
- React 18
- TypeScript
- React Router v6
- Zustand (State Management)
- Tailwind CSS
- Axios
- Lucide Icons

## Kurulum

### Gereksinimler
- Node.js 18+
- PostgreSQL 14+
- npm veya yarn

### Backend Kurulumu

```bash
cd backend
cp .env.example .env
# .env dosyasını düzenleyin
npm install
npm run dev
```

### Frontend Kurulumu

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

### Tüm Projeyi Başlatma

```bash
npm install
npm run dev
```

## API Endpoints

- `POST /api/auth/login` - Giriş
- `GET /api/users` - Kullanıcı listesi
- `GET /api/customers` - Müşteri listesi
- `GET /api/leads` - Potansiyel müşteri listesi
- `GET /api/roles` - Rol listesi
- `GET /api/logs` - Aktivite logları

## Lisans

Bu proje özel kullanım içindir
