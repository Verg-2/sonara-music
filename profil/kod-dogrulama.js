// E-posta doğrulama sayfası
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
  ? 'http://127.0.0.1:5000/api' 
  : '/api';

function loadSavedTheme() {
  const saved = localStorage.getItem('theme');
  const isLight = saved === 'light';
  document.body.classList.toggle('light-theme', isLight);
  // Theme toggle ikonu güncelle
  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (toggleBtn) {
    const icon = toggleBtn.querySelector('i');
    if (icon) {
      icon.className = isLight ? 'fas fa-moon' : 'fas fa-sun';
    }
  }
}

function getEmailFromStorage() {
  return sessionStorage.getItem('verificationEmail') || localStorage.getItem('verificationEmail');
}

function getPasswordFromStorage() {
  return sessionStorage.getItem('verificationPassword') || localStorage.getItem('verificationPassword');
}

function initForm() {
  const form = document.querySelector('.login-form');
  const codeInput = document.getElementById('code');
  
  if (!form || !codeInput) return;

  // E-posta ve şifre kontrolü
  const email = getEmailFromStorage();
  const password = getPasswordFromStorage();
  if (!email || !password) {
    alert('E-posta veya şifre bilgisi bulunamadı. Kayıt sayfasına yönlendiriliyorsunuz...');
    window.location.href = 'kayit.html';
    return;
  }

  // Sadece rakam girişi
  codeInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
  });

  // Form gönderimi
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const code = (codeInput.value || '').trim();
    
    if (!code || code.length !== 6) {
      alert('Lütfen 6 haneli kodu girin');
      return;
    }

    try {
      console.log('API URL:', API_URL);
      console.log('Kod doğrulama ve kayıt isteği gönderiliyor...');
      const res = await fetch(`${API_URL}/auth/verify-and-register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, code })
      });
      console.log('Yanıt alındı:', res.status);
      const data = await res.json();
      console.log('Yanıt verisi:', data);
      
      if (!res.ok || !data?.success) {
        const msg = data?.message || 'Doğrulama başarısız';
        alert(msg);
        return;
      }
      
      // Başarılı kayıt ve doğrulama
      sessionStorage.removeItem('verificationEmail');
      sessionStorage.removeItem('verificationPassword');
      localStorage.removeItem('verificationEmail');
      localStorage.removeItem('verificationPassword');
      alert('Kayıt tamamlandı! Giriş sayfasına yönlendiriliyorsunuz...');
      setTimeout(() => {
        window.location.href = 'profil.html';
      }, 1000);
    } catch (err) {
      console.error('Hata detayları:', err);
      alert('Sunucuya ulaşılamadı. Konsolu kontrol edin (F12). URL: ' + API_URL);
    }
  });
}

function initResendLink() {
  const resendLink = document.getElementById('resend-link');
  if (!resendLink) return;

  resendLink.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const email = getEmailFromStorage();
    if (!email) {
      alert('E-posta bilgisi bulunamadı');
      return;
    }

    try {
      console.log('Kod tekrar gönderiliyor...');
      const res = await fetch(`${API_URL}/auth/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      
      if (!res.ok || !data?.success) {
        const msg = data?.message || 'Kod gönderilemedi';
        alert(msg);
        return;
      }
      
      alert('Doğrulama kodu tekrar gönderildi!');
    } catch (err) {
      console.error('Hata detayları:', err);
      alert('Sunucuya ulaşılamadı');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadSavedTheme();
  initForm();
  initResendLink();
});
