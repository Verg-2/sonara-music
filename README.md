# Sonara Müzik Uygulaması

Basit bir frontend (HTML/CSS/JS) ve Node.js + Express + MongoDB backend’inden oluşan müzik uygulaması.

## Çalıştırma (Yerel)
1. **Backend**
   - Dizine geç: `cd backend`
   - Bağımlılıklar: `npm install`
   - Ortam değişkenleri: `cp .env.example .env` ve `MONGODB_URI`, `JWT_SECRET` gibi değerleri doldur.
   - Geliştirme sunucusu: `npm run dev` (varsayılan port: 5000)
   - İsteğe bağlı seed: `npm run seed`

2. **Frontend**
   - Kök dizindeki `index.html`’i canlı sunucuyla (örn. VS Code Live Server) veya doğrudan dosya olarak aç.
   - API tabanı: `http://localhost:5000/api`

## Özellikler
- Kategorilere göre sanatçı listesi (API isteği; erişilemezse yerel veriye düşer)
- Temalar (dark/light) ve yumuşak geçişler
- Oynatıcı kontrolleri, klavye kısayolları
- Performans odaklı optimizasyonlar (AbortController ile istek iptali, lazy img, tek seferde DOM güncelleme)

## Güvenlik / Repo Hijyeni
- `.githooks/pre-commit`: Gerçek `.env/.npmrc` ve anahtar/sertifika dosyalarını engeller, `*.example` dosyalarına izin verir; varsa gitleaks çalıştırır.
- `.gitleaks.toml`: Temel gizli anahtar tarama yapılandırması.
- `backend/.env.example`: Örnek ortam değişkenleri.

## Komut Hızlı Referans
```bash
# Backend
cd backend
npm install
npm run dev
npm run seed   # opsiyonel

# Git hook yolunu ayarlamak için (ilk kez)
git config core.hooksPath .githooks
```
