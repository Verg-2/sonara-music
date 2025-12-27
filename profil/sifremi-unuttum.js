// Şifremi unuttum sayfası: tema okuma ve şifre sıfırlama isteği
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

function initForm() {
  const form = document.querySelector('.login-form');
  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (document.getElementById('email')?.value || '').trim();
    if (!email) {
      alert('E-posta zorunlu');
      return;
    }
    try {
      console.log('API URL:', API_URL);
      console.log('Şifre sıfırlama isteği gönderiliyor...');
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      console.log('Yanıt alındı:', res.status);
      const data = await res.json();
      console.log('Yanıt verisi:', data);
      if (!res.ok || !data?.success) {
        const msg = data?.message || 'İstek başarısız';
        alert(msg);
        return;
      }
      alert('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Giriş sayfasına yönlendiriliyorsunuz...');
      setTimeout(() => {
        window.location.href = 'profil.html';
      }, 2000);
    } catch (err) {
      console.error('Hata detayları:', err);
      alert('Sunucuya ulaşılamadı. Konsolu kontrol edin (F12). URL: ' + API_URL);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadSavedTheme();
  initForm();
});
