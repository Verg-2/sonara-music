// Basit tema yönetimi (index ile uyumlu)
function loadSavedTheme() {
  const saved = localStorage.getItem('theme');
  const isDark = saved !== 'light';
  document.body.classList.toggle('light-theme', !isDark);
  
  // Icon'u da ayarla
  const icon = document.querySelector('#theme-toggle-btn i');
  if (icon) {
    icon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
  }
}

function applyTheme() {
  const isLight = document.body.classList.contains('light-theme');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  const icon = document.querySelector('#theme-toggle-btn i');
  if (icon) icon.className = isLight ? 'fas fa-moon' : 'fas fa-sun';
}

function toggleTheme() {
  document.body.classList.toggle('light-theme');
  applyTheme();
}

// Navigasyon davranışı
function setupNav() {
  const homeBtn = document.getElementById('home-btn');
  const libraryBtn = document.getElementById('library-btn');
  const usersBtn = document.getElementById('users-btn');
  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      window.location.href = '../index.html';
    });
  }
  if (libraryBtn) {
    libraryBtn.classList.add('active');
  }
  if (usersBtn) {
    usersBtn.addEventListener('click', () => {
      window.location.href = '../profil/profil.html';
    });
  }
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
}

// Başlat
document.addEventListener('DOMContentLoaded', () => {
  loadSavedTheme();
  setupNav();
  setupLibrarySearch();
  setupAnimations();
});

// Kütüphane araması: Ana menüdeki arama gibi kartları filtreler
function setupLibrarySearch() {
  const input = document.getElementById('search-input');
  if (!input) return;
  input.addEventListener('input', handleLibrarySearch);
}

function handleLibrarySearch(e) {
  const query = (e.target.value || '').toLowerCase().trim();
  const cards = document.querySelectorAll('.library-card');
  if (!cards) return;
  cards.forEach(card => {
    const titleEl = card.querySelector('.library-title');
    const title = (titleEl?.textContent || '').toLowerCase();
    const match = !query || title.includes(query);
    card.style.display = match ? 'flex' : 'none';
  });
}

// Animasyonlar
function setupAnimations() {
  // Floating bubbles
  startBubbles();
  
  // Custom cursor
  setupCustomCursor();
  
  // Particle animation CSS
  addParticleStyles();
}

// Floating Bubbles
function createBubble() {
  const bubble = document.createElement('div');
  bubble.classList.add('bubble');
  
  // Random size between 15-35px
  const size = Math.random() * 20 + 15;
  bubble.style.width = size + 'px';
  bubble.style.height = size + 'px';
  
  // Random horizontal position
  bubble.style.left = Math.random() * 100 + '%';
  
  // Random animation duration between 6-10 seconds
  const duration = Math.random() * 4 + 6;
  bubble.style.animationDuration = duration + 's';
  
  // Pop bubble on click
  bubble.addEventListener('click', function() {
    this.classList.add('pop');
    setTimeout(() => this.remove(), 300);
  });
  
  document.body.appendChild(bubble);
  
  // Remove bubble after animation
  setTimeout(() => {
    if (bubble.parentElement) {
      bubble.remove();
    }
  }, duration * 1000);
}

function startBubbles() {
  // Create bubbles periodically
  setInterval(createBubble, 2000);
  
  // Create initial bubbles
  for (let i = 0; i < 3; i++) {
    setTimeout(() => createBubble(), i * 600);
  }
}

// Custom Cursor
function setupCustomCursor() {
  document.addEventListener('mousemove', (e) => {
    const cursor = document.querySelector('.cursor');
    if (!cursor) {
      const newCursor = document.createElement('div');
      newCursor.className = 'cursor';
      newCursor.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        background: radial-gradient(circle, rgba(255,0,0,0.3) 0%, transparent 70%);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        mix-blend-mode: screen;
        transition: transform 0.1s ease;
      `;
      document.body.appendChild(newCursor);
    }
    
    const cursorElement = document.querySelector('.cursor');
    cursorElement.style.left = (e.clientX - 10) + 'px';
    cursorElement.style.top = (e.clientY - 10) + 'px';
  });
}

// Particle animation styles
function addParticleStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes float {
      to {
        transform: translateY(-${window.innerHeight + 50}px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}
