# 🚀 BAŞLANGÇ KILAVUZu

## ⚡ HIZLI BAŞLANGIÇ (30 saniye)

### Seçenek 1: Batch Dosyası (Tavsiye Edilir)
```batch
"c:\Users\kadir\OneDrive\Desktop\Projelerim\müzik-website\START-SERVICES.bat"
```

### Seçenek 2: PowerShell
```powershell
cd "c:\Users\kadir\OneDrive\Desktop\Projelerim\müzik-website\backend"
$env:Path = "$Env:USERPROFILE\.cargo\bin;" + $env:Path
npm run dev:all
```

### Seçenek 3: Command Prompt
```cmd
cd c:\Users\kadir\OneDrive\Desktop\Projelerim\müzik-website\backend
set PATH=%USERPROFILE%\.cargo\bin;%PATH%
npm run dev:all
```

---

## ✅ Başarıyı Onaylamak

Terminal'de aşağıdaki satırları görmelisiniz:

```
✅ 🎵 Server 5000 portunda çalışıyor
✅ 🌍 Environment: development
✅ 🚀 Rust proxy: /api/rust/hello, /api/rust/hash
✅ MongoDB bağlandı: localhost
🚀 Rust service listening on http://127.0.0.1:8000
```

---

## 🌐 Test URLs (Tarayıcıda Açın)

- **API Root**: http://localhost:5000/
- **Artists**: http://localhost:5000/api/artists
- **Rust Hello**: http://localhost:5000/api/rust/hello
- **Rust Hash**: http://localhost:5000/api/rust/hash?data=test

---

## 📊 Port Bilgileri

| Servis | Port | URL | Durum |
|--------|------|-----|-------|
| Express API | 5000 | http://localhost:5000 | Çalışıyor ✅ |
| Rust Service | 8000 | http://127.0.0.1:8000 | Çalışıyor ✅ |
| MongoDB | 27017 | localhost:27017 | Çalışıyor ✅ |
| Frontend (Live Server) | 5500 | http://localhost:5500 | Opsiyonel |

---

## 🔒 Güvenlik Özellikleri

✅ Helmet.js - HTTP headers güvenliği  
✅ CORS - Origin whitelist  
✅ Rate Limiting - 100 req/15s  
✅ Input Validation - Email, password strength  
✅ Error Handling - Production-safe  
✅ JWT - Token-based authentication  

[Detaylı Güvenlik Raporu](SECURITY.md)

---

## 📖 Dokümantasyon

- [SECURITY.md](SECURITY.md) - Güvenlik detayları
- [SECURITY-CHECKLIST.md](SECURITY-CHECKLIST.md) - Kontrol listesi
- [EXPRESS-RUST-GUIDE.md](EXPRESS-RUST-GUIDE.md) - API referansı
- [SERVICES-RUNNING.md](SERVICES-RUNNING.md) - Runtime bilgileri

---

## 🛑 Durdur

Terminal'de: **`Ctrl + C`**

---

## 🆘 Sorunlar?

### "Cargo not found"
```powershell
$env:Path = "$Env:USERPROFILE\.cargo\bin;" + $env:Path
npm run dev:all
```

### "Port 5000 zaten kullanımda"
```bash
netstat -ano | findstr ":5000"
taskkill /PID <PID> /F
```

### "MongoDB hatasılı"
MongoDB daemon'un çalışıyor olduğundan emin ol:
```bash
mongod
```

---

**🎉 Her şey hazır! Servisleri başlatın ve başarıyı onaylayın.**
