// Profil sayfası: tema okuma, form doğrulama ve backend isteği
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
  ? 'http://127.0.0.1:5000/api' 
  : '/api';

function loadSavedTheme() {
  const saved = localStorage.getItem('theme');
  const isLight = saved === 'light';
  document.documentElement.classList.toggle('light-theme', isLight);
  // Theme toggle ikonu güncelle
  const toggleBtn = document.getElementById('theme-toggle-btn');
  if (toggleBtn) {
    const icon = toggleBtn.querySelector('i');
    if (icon) {
      icon.className = isLight ? 'fas fa-moon' : 'fas fa-sun';
    }
  }
}

function toggleTheme() {
  document.documentElement.classList.toggle('light-theme');
  const isLight = document.documentElement.classList.contains('light-theme');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
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
    const password = (document.getElementById('password')?.value || '').trim();
    if (!email || !password) {
      alert('E-posta ve şifre zorunlu');
      return;
    }
    try {
      console.log('API URL:', API_URL);
      console.log('Giriş isteği gönderiliyor...');
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      console.log('Yanıt alındı:', res.status);
      const data = await res.json();
      console.log('Yanıt verisi:', data);
      if (!res.ok || !data?.success) {
        const msg = data?.message || 'Giriş başarısız';
        alert(msg);
        return;
      }
      // Token'ı sakla (backend data.data.token döndürüyor)
      const token = data.token || data.data?.token;
      if (token) {
        localStorage.setItem('authToken', token);
      }
      alert('Giriş başarılı! Ana menüye yönlendiriliyorsunuz...');
      setTimeout(() => {
        window.location.href = '../index.html';
      }, 1000);
    } catch (err) {
      console.error('Hata detayları:', err);
      alert('Sunucuya ulaşılamadı. Konsolu kontrol edin (F12). URL: ' + API_URL);
    }
  });
}

function initSocialButtons() {
  const googleBtn = document.querySelector('.social-btn.google');
  const appleBtn = document.querySelector('.social-btn.apple');
  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      window.location.href = 'https://accounts.google.com/signin';
    });
  }
  if (appleBtn) {
    appleBtn.addEventListener('click', () => {
      window.location.href = 'https://appleid.apple.com/auth';
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadSavedTheme();
  initForm();
  initSocialButtons();
  // Theme toggle button
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }
});
