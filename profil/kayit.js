// Kayıt sayfası: tema okuma, form doğrulama ve backend isteği
const API_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') 
  ? 'http://127.0.0.1:5000/api' 
  : '/api';

function loadSavedTheme() {
  const saved = localStorage.getItem('theme');
  const isLight = saved === 'light';
  document.body.classList.toggle('light-theme', isLight);
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
      console.log('Doğrulama kodu isteği gönderiliyor...');
      const res = await fetch(`${API_URL}/auth/send-verification`, {
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
      // E-posta ve şifreyi geçici olarak sakla (kayıt kod doğrulandıktan sonra yapılacak)
      sessionStorage.setItem('verificationEmail', email);
      sessionStorage.setItem('verificationPassword', password);
      alert('E-postanıza doğrulama kodu gönderildi.');
      setTimeout(() => {
        window.location.href = 'kod-dogrulama.html';
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
      window.location.href = 'https://accounts.google.com/signup';
    });
  }
  if (appleBtn) {
    appleBtn.addEventListener('click', () => {
      window.location.href = 'https://appleid.apple.com/account';
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadSavedTheme();
  initForm();
  initSocialButtons();
});
