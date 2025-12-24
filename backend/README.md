# Müzik Uygulaması Backend API

Node.js + Express + MongoDB ile geliştirilmiş RESTful API

## 🚀 Kurulum

### 1. Bağımlılıkları Yükle

```bash
cd backend
npm install
```

### 2. MongoDB'yi Başlat (Opsiyonel)

MongoDB kurulu değilse, API in-memory data ile çalışacaktır.

```bash
mongod
```

### 3. Environment Variables

`.env` dosyasını düzenleyin:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/muzik-db
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
```

### 4. Sunucuyu Başlat

**Development (nodemon ile):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server http://localhost:5000 adresinde çalışacaktır.

## 📚 API Endpoints

### Artists (Sanatçılar)

- `GET /api/artists` - Tüm sanatçıları listele
- `GET /api/artists/:id` - Belirli bir sanatçıyı getir
- `GET /api/artists/search?q=query` - Sanatçı ara
- `POST /api/artists` - Yeni sanatçı oluştur
- `PUT /api/artists/:id` - Sanatçı güncelle
- `DELETE /api/artists/:id` - Sanatçı sil

**Query Parameters:**
- `category` - Kategoriye göre filtrele (odaklanma, antreman, parti, huzunlu, enerjik)
- `limit` - Sayfa başına kayıt sayısı (varsayılan: 20)
- `page` - Sayfa numarası (varsayılan: 1)

### Songs (Şarkılar)

- `GET /api/songs` - Tüm şarkıları listele
- `GET /api/songs/:id` - Belirli bir şarkıyı getir
- `POST /api/songs` - Yeni şarkı oluştur
- `PUT /api/songs/:id` - Şarkı güncelle
- `DELETE /api/songs/:id` - Şarkı sil
- `POST /api/songs/:id/play` - Dinlenme sayısını artır

### Playlists (Oynatma Listeleri)

- `GET /api/playlists` - Tüm playlistleri listele
- `GET /api/playlists/:id` - Belirli bir playlist getir
- `POST /api/playlists` - Yeni playlist oluştur
- `PUT /api/playlists/:id` - Playlist güncelle
- `DELETE /api/playlists/:id` - Playlist sil
- `POST /api/playlists/:id/songs` - Playlist'e şarkı ekle
- `DELETE /api/playlists/:id/songs/:songId` - Playlist'ten şarkı çıkar

### Users (Kullanıcılar)

- `GET /api/users` - Tüm kullanıcıları listele
- `GET /api/users/:id` - Belirli bir kullanıcıyı getir
- `PUT /api/users/:id` - Kullanıcı güncelle
- `DELETE /api/users/:id` - Kullanıcı sil
- `POST /api/users/:id/favorites/:type/:itemId` - Favorilere ekle
- `DELETE /api/users/:id/favorites/:type/:itemId` - Favorilerden çıkar

### Auth (Kimlik Doğrulama)

- `POST /api/auth/register` - Yeni kullanıcı kaydı
- `POST /api/auth/login` - Kullanıcı girişi
- `GET /api/auth/me` - Mevcut kullanıcı bilgisi (Auth gerekli)

## 🔐 Authentication

Korumalı endpoint'ler için JWT token kullanılır:

```javascript
headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

## 📦 Örnek İstekler

### Sanatçı Listesi (Kategoriye Göre)
```bash
GET http://localhost:5000/api/artists?category=odaklanma&limit=10
```

### Sanatçı Ara
```bash
GET http://localhost:5000/api/artists/search?q=yener
```

### Kullanıcı Kaydı
```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "username": "kadir",
  "email": "kadir@example.com",
  "password": "123456"
}
```

### Kullanıcı Girişi
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "kadir@example.com",
  "password": "123456"
}
```

## 🗂️ Proje Yapısı

```
backend/
├── config/
│   └── db.js           # Database bağlantısı
├── controllers/
│   ├── artistController.js
│   ├── songController.js
│   ├── playlistController.js
│   ├── userController.js
│   └── authController.js
├── middleware/
│   └── auth.js         # JWT authentication
├── models/
│   ├── Artist.js
│   ├── Song.js
│   ├── Playlist.js
│   └── User.js
├── routes/
│   ├── artists.js
│   ├── songs.js
│   ├── playlists.js
│   ├── users.js
│   └── auth.js
├── .env
├── package.json
└── server.js
```

## 🛠️ Teknolojiler

- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **MongoDB** - NoSQL veritabanı
- **Mongoose** - MongoDB ODM
- **JWT** - Token-based authentication
- **bcryptjs** - Şifre hashleme
- **CORS** - Cross-origin resource sharing

## 📝 Notlar

- MongoDB yoksa API in-memory data ile çalışır
- JWT token 30 gün geçerlidir
- Tüm şifreler bcrypt ile hashlenmiştir
- CORS tüm originler için açıktır (production'da değiştirin)

## 🔄 Frontend ile Bağlantı

Frontend'inizde API'yi kullanmak için:

```javascript
// script.js dosyanızda
const API_URL = 'http://localhost:5000/api';

// Sanatçıları çek
async function loadArtists(category) {
    const response = await fetch(`${API_URL}/artists?category=${category}`);
    const data = await response.json();
    return data.data;
}
```
