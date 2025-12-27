# 🚀 Express + Rust Birlikte Çalıştırma Kılavuzu

## ✅ Kurulum Tamamlandı!

### 📦 Yüklenen Paket
```bash
npm install --save-dev concurrently
```

---

## 🎯 Kullanım Komutları

### **TEK KOMUTLA HER İKİSİNİ BAŞLAT:**
```bash
cd backend
npm run dev:all
```

Bu komut şunları yapar:
- ✅ Express server'ı başlatır (port 5000) - **nodemon ile** (otomatik yeniden başlatma)
- ✅ Rust microservice'i başlatır (port 8000)
- ✅ İki servisin çıktılarını renkli gösterir
  - 🔵 EXPRESS: Mavi
  - 🟡 RUST: Sarı

---

## 📝 package.json Script'leri

### Eklenen script'ler:
```json
{
  "scripts": {
    "start": "node server.js",              // Production: Sadece Express
    "dev": "nodemon server.js",             // Development: Sadece Express (auto-reload)
    "rust": "cd ../rust-service && cargo run",  // Sadece Rust
    "dev:all": "concurrently --kill-others-on-fail --names \"EXPRESS,RUST\" --prefix-colors \"cyan,yellow\" \"npm run dev\" \"npm run rust\"",
    "seed": "node scripts/seed.js"
  }
}
```

### Seçenekler:
| Komut | Ne Yapar | Ne Zaman Kullan |
|-------|----------|-----------------|
| `npm start` | Sadece Express (production) | Production deployment |
| `npm run dev` | Sadece Express (auto-reload) | Frontend geliştirme |
| `npm run rust` | Sadece Rust | Rust geliştirme |
| `npm run dev:all` | **İkisi birlikte** | Full-stack geliştirme |

---

## 🌐 Endpoint'ler

### Express (Port 5000):
- `http://localhost:5000/` - Root endpoint
- `http://localhost:5000/api/artists` - Artists API
- `http://localhost:5000/api/songs` - Songs API
- `http://localhost:5000/api/media/sen-insansin.m4a` - Static media

### Rust Proxy (Express üzerinden):
- `http://localhost:5000/api/rust/hello` - Hello endpoint (Express → Rust)
- `http://localhost:5000/api/rust/hash?data=test` - Hash endpoint (Express → Rust)

### Rust Direct (Port 8000):
- `http://127.0.0.1:8000/api/rust/hello` - Doğrudan Rust
- `http://127.0.0.1:8000/api/rust/hash?data=test` - Doğrudan Rust

---

## 🔌 Express'ten Rust'a İstek Atma

### server.js içinde zaten yapılandırılmış:

```javascript
const http = require('http');

// Rust microservice proxy
app.get('/api/rust/hello', (req, res) => {
    const options = {
        hostname: '127.0.0.1',
        port: 8000,  // Rust port
        path: '/api/rust/hello',
        method: 'GET',
        headers: { 'accept': 'application/json' }
    };

    const proxyReq = http.request(options, (proxyRes) => {
        let data = '';
        proxyRes.on('data', chunk => data += chunk);
        proxyRes.on('end', () => {
            try {
                const json = JSON.parse(data);
                console.log('[RUST RESPONSE] Başarılı:', json);
                res.status(proxyRes.statusCode || 200).json(json);
            } catch (e) {
                console.error('[RUST ERROR] JSON parse hatası:', e.message);
                res.status(502).json({ 
                    success: false, 
                    message: 'JSON parse failed', 
                    raw: data 
                });
            }
        });
    });

    proxyReq.on('error', (err) => {
        console.warn('[RUST ERROR] Bağlantı hatası:', err.message);
        res.status(502).json({ 
            success: false, 
            message: 'Rust servisi offline', 
            error: err.message 
        });
    });

    proxyReq.end();
});
```

### Yeni endpoint eklemek için:

1. **Rust'ta endpoint yaz** (`rust-service/src/main.rs`):
```rust
async fn my_new_endpoint() -> impl IntoResponse {
    let data = MyData { message: "Hello from Rust" };
    (StatusCode::OK, Json(data))
}

// Router'a ekle:
let app = Router::new()
    .route("/api/rust/my-endpoint", get(my_new_endpoint))
```

2. **Express'te proxy ekle** (`backend/server.js`):
```javascript
app.get('/api/rust/my-endpoint', (req, res) => {
    const options = {
        hostname: '127.0.0.1',
        port: 8000,
        path: '/api/rust/my-endpoint',
        method: 'GET',
        headers: { 'accept': 'application/json' }
    };
    // ... (yukarıdaki proxy pattern'i kullan)
});
```

---

## 🧪 Test Etme

### PowerShell'den test:
```powershell
# Root endpoint
Invoke-RestMethod http://localhost:5000/

# Rust proxy üzerinden
Invoke-RestMethod http://localhost:5000/api/rust/hello

# Rust hash (query parameter ile)
Invoke-RestMethod "http://localhost:5000/api/rust/hash?data=test123"
```

### Browser'dan test:
```
http://localhost:5000/
http://localhost:5000/api/rust/hello
http://localhost:5000/api/rust/hash?data=merhaba
```

### curl ile test:
```bash
curl http://localhost:5000/api/rust/hello
curl "http://localhost:5000/api/rust/hash?data=test"
```

---

## 🛠️ Sorun Giderme

### Problem: Rust servisi başlamıyor
**Çözüm:**
```powershell
# Cargo'nun PATH'te olduğundan emin ol
$env:Path = "$Env:USERPROFILE\.cargo\bin;" + $env:Path

# Manuel test
cd rust-service
cargo run
```

### Problem: Port zaten kullanımda
**Çözüm:**
```powershell
# Port 5000'i kim kullanıyor?
Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue

# Port 8000'i kim kullanıyor?
Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue

# Process'i durdur
Stop-Process -Id <PID>
```

### Problem: Bir servis çöktü, diğeri çalışıyor
**Not:** `--kill-others-on-fail` flag'i sayesinde biri çökerse diğeri de durur.
Bu sayede tutarsız durum oluşmaz.

---

## 🎨 Terminal Çıktısı Örneği

```
[EXPRESS] [nodemon] 3.1.11
[EXPRESS] [nodemon] starting `node server.js`
[RUST] 🚀 Rust service listening on http://127.0.0.1:8000
[EXPRESS] [INIT] Middleware yapılandırıldı
[EXPRESS] [INIT] Rust proxy routes yapılandırıldı
[EXPRESS] ✅ 🎵 Server 5000 portunda çalışıyor
[EXPRESS] ✅ 🚀 Rust proxy: /api/rust/hello, /api/rust/hash
[EXPRESS]  MongoDB bağlandı: localhost
```

---

## 📚 Ek Bilgiler

### concurrently seçenekleri:
- `--kill-others-on-fail`: Biri çökerse hepsini durdur
- `--names "EXPRESS,RUST"`: Log prefix isimleri
- `--prefix-colors "cyan,yellow"`: Renk kodları

### nodemon:
- Dosya değişikliklerinde otomatik restart
- `rs` yazıp Enter: Manuel restart
- `.js`, `.json` dosyalarını izler

### Rust cargo:
- `cargo run`: Development mode (unoptimized)
- `cargo run --release`: Production mode (optimized)
- `cargo build`: Sadece derle, çalıştırma

---

## ✅ Özet

**Tek komut:**
```bash
cd backend
npm run dev:all
```

**Sonuç:**
- ✅ Express: http://localhost:5000
- ✅ Rust: http://127.0.0.1:8000
- ✅ Proxy: http://localhost:5000/api/rust/*
- ✅ Her iki servisin logları aynı terminalde

**Başarılı! 🎉**
