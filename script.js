// Artists data
const artistsData = {
    odaklanma: [
        { name: "Şiire Gazele", image: "https://via.placeholder.com/150x150/333/fff?text=ŞG" },
        { name: "Baytar", image: "https://via.placeholder.com/150x150/333/fff?text=BY" },
        { name: "Bana Sor", image: "https://via.placeholder.com/150x150/333/fff?text=BS" },
        { name: "Yazdım", image: "https://via.placeholder.com/150x150/333/fff?text=YZ" },
        { name: "Ummadığım Anda", image: "https://via.placeholder.com/150x150/333/fff?text=UA" },
        { name: "Yanlış", image: "https://via.placeholder.com/150x150/333/fff?text=YN" },
        { name: "Aya", image: "https://via.placeholder.com/150x150/333/fff?text=AY" },
        { name: "Yazlar", image: "https://via.placeholder.com/150x150/333/fff?text=YZ" },
        { name: "Bitmiyor", image: "https://via.placeholder.com/150x150/333/fff?text=BM" },
        { name: "Heycan Yok", image: "https://via.placeholder.com/150x150/333/fff?text=HY" },
        { name: "Gül Pembe", image: "https://via.placeholder.com/150x150/333/fff?text=GP" },
        { name: "Hasta İşi", image: "https://via.placeholder.com/150x150/333/fff?text=HI" }
    ],
    antreman: [
        { name: "Tempo Up", image: "https://via.placeholder.com/150x150/333/fff?text=TU" },
        { name: "Beat Master", image: "https://via.placeholder.com/150x150/333/fff?text=BM" },
        { name: "Power Mix", image: "https://via.placeholder.com/150x150/333/fff?text=PM" },
        { name: "Energy Boost", image: "https://via.placeholder.com/150x150/333/fff?text=EB" }
    ],
    parti: [
        { name: "Party Time", image: "https://via.placeholder.com/150x150/333/fff?text=PT" },
        { name: "Dance Floor", image: "https://via.placeholder.com/150x150/333/fff?text=DF" },
        { name: "Club Mix", image: "https://via.placeholder.com/150x150/333/fff?text=CM" },
        { name: "Night Vibes", image: "https://via.placeholder.com/150x150/333/fff?text=NV" }
    ],
    huzunlu: [
        { name: "Slow Motion", image: "https://via.placeholder.com/150x150/333/fff?text=SM" },
        { name: "Melancholy", image: "https://via.placeholder.com/150x150/333/fff?text=ML" },
        { name: "Rain Drops", image: "https://via.placeholder.com/150x150/333/fff?text=RD" },
        { name: "Blue Moon", image: "https://via.placeholder.com/150x150/333/fff?text=BM" }
    ],
    enerjik: [
        { name: "High Energy", image: "https://via.placeholder.com/150x150/333/fff?text=HE" },
        { name: "Power Drive", image: "https://via.placeholder.com/150x150/333/fff?text=PD" },
        { name: "Electric", image: "https://via.placeholder.com/150x150/333/fff?text=EL" },
        { name: "Thunder", image: "https://via.placeholder.com/150x150/333/fff?text=TH" }
    ]
};

// Global variables
let currentCategory = 'odaklanma';
let isPlaying = false;
let currentSong = { title: "Hasta İşi", artist: "Yener Çevik Hasta İşi 2017" };
let isShuffleOn = false;
let isRepeatOn = false;
let volume = 0.8;

// Backend API base URL
const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : '/api';

// DOM elements
const categoryButtons = document.querySelectorAll('.category-btn');
const artistsGrid = document.getElementById('artists-grid');
const searchInput = document.getElementById('search-input');
const contextMenu = document.getElementById('context-menu');
const playPauseBtn = document.getElementById('play-pause-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const shuffleBtn = document.getElementById('shuffle-btn');
const repeatBtn = document.getElementById('repeat-btn');
const favoriteBtn = document.getElementById('favorite-btn');
const volumeBtn = document.getElementById('volume-btn');
const currentTitle = document.getElementById('current-title');
const currentArtist = document.getElementById('current-artist');
const currentCover = document.getElementById('current-cover');

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadArtists(currentCategory);
    setupEventListeners();
    updatePlayerDisplay();
});

// Load artists for category
async function loadArtists(category) {
    let artists = [];
    try {
        const res = await fetch(`${API_URL}/artists?category=${encodeURIComponent(category)}`);
        const data = await res.json();
        artists = data?.data || [];
    } catch (err) {
        console.warn('API erişilemedi, yerel veriye düşüyor:', err);
        artists = artistsData[category] || artistsData.odaklanma || [];
    }
    artistsGrid.innerHTML = '';
    artists.forEach(artist => {
        const artistCard = createArtistCard(artist);
        artistsGrid.appendChild(artistCard);
    });
}

async function searchArtistsAPI(query) {
    try {
        const res = await fetch(`${API_URL}/artists/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        return data?.data || [];
    } catch (err) {
        console.warn('Arama API erişilemedi, yerel filtre uygulanıyor:', err);
        // Yerel veri üzerinden filtreleme (fallback)
        const all = artistsData[currentCategory] || artistsData.odaklanma || [];
        return all.filter(a => a.name.toLowerCase().includes(query.toLowerCase()));
    }
}

// Create artist card
function createArtistCard(artist) {
    const card = document.createElement('div');
    card.className = 'artist-card';
    card.innerHTML = `
        <div class="artist-image">
            <img src="${artist.image}" alt="${artist.name}" onerror="this.src='https://via.placeholder.com/150x150/333/fff?text=${artist.name.charAt(0)}'">
        </div>
        <div class="artist-name">${artist.name}</div>
    `;
    
    // Add event listeners
    card.addEventListener('click', () => playArtist(artist));
    card.addEventListener('contextmenu', (e) => showContextMenu(e, artist));
    
    return card;
}

// Setup event listeners
function setupEventListeners() {
    // Category buttons
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            loadArtists(currentCategory);
        });
    });
    
    // Search functionality
    searchInput.addEventListener('input', handleSearch);
    
    // Player controls
    playPauseBtn.addEventListener('click', togglePlayPause);
    prevBtn.addEventListener('click', previousSong);
    nextBtn.addEventListener('click', nextSong);
    shuffleBtn.addEventListener('click', toggleShuffle);
    repeatBtn.addEventListener('click', toggleRepeat);
    favoriteBtn.addEventListener('click', toggleFavorite);
    volumeBtn.addEventListener('click', toggleMute);
    
    // Navigation
    document.getElementById('home-btn').addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.getElementById('home-btn').classList.add('active');
        showNotification('Ana Sayfa');
    });
    
    document.getElementById('library-btn').addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.getElementById('library-btn').classList.add('active');
        showNotification('Müzik Kütüphanesi');
    });
    
    document.getElementById('users-btn').addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.getElementById('users-btn').classList.add('active');
        showNotification('Kullanıcılar');
    });
    
    // Context menu items
    setupContextMenuItems();
    
    // Close context menu when clicking outside
    document.addEventListener('click', hideContextMenu);
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// Handle search
async function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
        // Boş arama, mevcut kategori yüklenir
        await loadArtists(currentCategory);
        return;
    }
    const results = await searchArtistsAPI(query);
    artistsGrid.innerHTML = '';
    results.forEach(artist => {
        const artistCard = createArtistCard(artist);
        artistsGrid.appendChild(artistCard);
    });
}

// Show context menu
function showContextMenu(e, artist) {
    e.preventDefault();
    const menu = document.getElementById('context-menu');
    menu.style.display = 'block';
    menu.style.left = e.pageX + 'px';
    menu.style.top = e.pageY + 'px';
    menu.dataset.artist = artist.name;
}

// Hide context menu
function hideContextMenu() {
    document.getElementById('context-menu').style.display = 'none';
}

// Setup context menu items
function setupContextMenuItems() {
    document.getElementById('play-radio').addEventListener('click', () => {
        const artist = contextMenu.dataset.artist;
        showNotification(`${artist} radyosu başlatılıyor...`);
        hideContextMenu();
    });
    
    document.getElementById('play-after').addEventListener('click', () => {
        const artist = contextMenu.dataset.artist;
        showNotification(`${artist} sıradaki şarkı olarak eklendi`);
        hideContextMenu();
    });
    
    document.getElementById('add-queue').addEventListener('click', () => {
        const artist = contextMenu.dataset.artist;
        showNotification(`${artist} sıraya eklendi`);
        hideContextMenu();
    });
    
    document.getElementById('like-song').addEventListener('click', () => {
        const artist = contextMenu.dataset.artist;
        showNotification(`${artist} beğenilen şarkılara eklendi`);
        hideContextMenu();
    });
    
    document.getElementById('download').addEventListener('click', () => {
        const artist = contextMenu.dataset.artist;
        showNotification(`${artist} indiriliyor...`);
        hideContextMenu();
    });
    
    document.getElementById('add-playlist').addEventListener('click', () => {
        const artist = contextMenu.dataset.artist;
        showNotification(`${artist} oynatma listesine eklendi`);
        hideContextMenu();
    });
    
    document.getElementById('delete').addEventListener('click', () => {
        const artist = contextMenu.dataset.artist;
        showNotification(`${artist} silindi`);
        hideContextMenu();
    });
    
    document.getElementById('go-album').addEventListener('click', () => {
        const artist = contextMenu.dataset.artist;
        showNotification(`${artist} albümüne gidiliyor...`);
        hideContextMenu();
    });
    
    document.getElementById('go-artist').addEventListener('click', () => {
        const artist = contextMenu.dataset.artist;
        showNotification(`${artist} sanatçı sayfasına gidiliyor...`);
        hideContextMenu();
    });
    
    document.getElementById('share').addEventListener('click', () => {
        const artist = contextMenu.dataset.artist;
        showNotification(`${artist} paylaşılıyor...`);
        hideContextMenu();
    });
    
    document.getElementById('report').addEventListener('click', () => {
        const artist = contextMenu.dataset.artist;
        showNotification(`${artist} bildiriliyor...`);
        hideContextMenu();
    });
    
    document.getElementById('add-favorites').addEventListener('click', () => {
        const artist = contextMenu.dataset.artist;
        showNotification(`${artist} sabitlendi`);
        hideContextMenu();
    });
    
    document.getElementById('close-queue').addEventListener('click', () => {
        showNotification('Sıra kapatıldı');
        hideContextMenu();
    });
}

// Player functions
function playArtist(artist) {
    // Artist'e tıklanınca API'den şarkıları getir, yoksa yerel davranışa düş
    (async () => {
        try {
            const songs = await fetchSongsForArtist(artist);
            if (songs && songs.length > 0) {
                const song = songs[0];
                currentSong.title = song.title || artist.name;
                currentSong.artist = (song.artist && (song.artist.name || song.artist)) || artist.name;
                updatePlayerDisplay();
                isPlaying = true;
                updatePlayButton();
                showNotification(`${currentSong.title} çalıyor`);
                // Sunucuya dinlenme sayısını işaretle
                if (song._id) {
                    await playSongOnServer(song._id);
                }
            } else {
                // Fallback: önceki basit davranış
                currentSong.title = artist.name;
                currentSong.artist = "Şarkı Çalıyor...";
                updatePlayerDisplay();
                isPlaying = true;
                updatePlayButton();
                showNotification(`${artist.name} çalıyor`);
            }
        } catch (err) {
            console.warn('Şarkı yüklenemedi, yerel davranışa düşülüyor:', err);
            currentSong.title = artist.name;
            currentSong.artist = "Şarkı Çalıyor...";
            updatePlayerDisplay();
            isPlaying = true;
            updatePlayButton();
            showNotification(`${artist.name} çalıyor`);
        }
        // Oynatma animasyonu
        const allCards = document.querySelectorAll('.artist-card');
        allCards.forEach(card => card.classList.remove('playing'));
        if (event && event.currentTarget) {
            event.currentTarget.classList.add('playing');
        }
    })();
}

function togglePlayPause() {
    isPlaying = !isPlaying;
    updatePlayButton();
    showNotification(isPlaying ? 'Oynatılıyor' : 'Duraklatıldı');
}

function updatePlayButton() {
    const icon = playPauseBtn.querySelector('i');
    icon.className = isPlaying ? 'fas fa-pause' : 'fas fa-play';
}

function previousSong() {
    showNotification('Önceki şarkı');
    // Add logic for previous song
}

function nextSong() {
    showNotification('Sonraki şarkı');
    // Add logic for next song
}

function toggleShuffle() {
    isShuffleOn = !isShuffleOn;
    shuffleBtn.classList.toggle('active', isShuffleOn);
    showNotification(isShuffleOn ? 'Karıştırma açık' : 'Karıştırma kapalı');
}

function toggleRepeat() {
    isRepeatOn = !isRepeatOn;
    repeatBtn.classList.toggle('active', isRepeatOn);
    showNotification(isRepeatOn ? 'Tekrar açık' : 'Tekrar kapalı');
}

function toggleFavorite() {
    favoriteBtn.classList.toggle('active');
    const isFavorite = favoriteBtn.classList.contains('active');
    showNotification(isFavorite ? 'Favorilere eklendi' : 'Favorilerden çıkarıldı');
}

function toggleMute() {
    const icon = volumeBtn.querySelector('i');
    if (icon.classList.contains('fa-volume-up')) {
        icon.className = 'fas fa-volume-mute';
        showNotification('Ses kapatıldı');
    } else {
        icon.className = 'fas fa-volume-up';
        showNotification('Ses açıldı');
    }
}

function updatePlayerDisplay() {
    currentTitle.textContent = currentSong.title;
    currentArtist.textContent = currentSong.artist;
}

// Belirli bir artist için şarkıları API'den getir
async function fetchSongsForArtist(artist) {
    if (artist && artist._id) {
        const url = `${API_URL}/songs?artist=${encodeURIComponent(artist._id)}`;
        const res = await fetch(url);
        const data = await res.json();
        return data?.data || [];
    }
    // Artist id yoksa boş döndür (ileride yerel mapping eklenebilir)
    return [];
}

// Sunucuya dinlenme sayısını artırma isteği gönder
async function playSongOnServer(songId) {
    try {
        const res = await fetch(`${API_URL}/songs/${songId}/play`, { method: 'POST' });
        const data = await res.json();
        if (!data?.success) {
            console.warn('Play isteği başarısız:', data);
        }
    } catch (err) {
        console.warn('Play isteği gönderilemedi:', err);
    }
}

// Keyboard shortcuts
function handleKeyboardShortcuts(e) {
    switch(e.key) {
        case ' ':
            e.preventDefault();
            togglePlayPause();
            break;
        case 'ArrowLeft':
            previousSong();
            break;
        case 'ArrowRight':
            nextSong();
            break;
        case 's':
            if (e.ctrlKey) {
                e.preventDefault();
                toggleShuffle();
            }
            break;
        case 'r':
            if (e.ctrlKey) {
                e.preventDefault();
                toggleRepeat();
            }
            break;
        case 'l':
            if (e.ctrlKey) {
                e.preventDefault();
                toggleFavorite();
            }
            break;
        case 'm':
            if (e.ctrlKey) {
                e.preventDefault();
                toggleMute();
            }
            break;
    }
}

// Show notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(45deg, #ff0000, #cc0000);
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 15px rgba(255, 0, 0, 0.3);
        font-weight: 500;
        transform: translateX(400px);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add some visual effects
function addVisualEffects() {
    // Add floating particles
    setInterval(() => {
        if (isPlaying) {
            createParticle();
        }
    }, 2000);
}

function createParticle() {
    const particle = document.createElement('div');
    particle.style.cssText = `
        position: fixed;
        width: 4px;
        height: 4px;
        background: #ff0000;
        border-radius: 50%;
        pointer-events: none;
        z-index: 1;
        left: ${Math.random() * window.innerWidth}px;
        top: ${window.innerHeight}px;
        animation: float 3s linear forwards;
    `;
    
    document.body.appendChild(particle);
    
    setTimeout(() => {
        if (document.body.contains(particle)) {
            document.body.removeChild(particle);
        }
    }, 3000);
}

// Add CSS for particle animation
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

// Initialize visual effects
addVisualEffects();

// Add some interactive hover effects
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

console.log('Müzik uygulaması yüklendi! 🎵');
console.log('Klavye kısayolları:');
console.log('Space: Oynat/Duraklat');
console.log('←/→: Önceki/Sonraki şarkı');
console.log('Ctrl+S: Karıştırma');
console.log('Ctrl+R: Tekrar');
console.log('Ctrl+L: Favori');
console.log('Ctrl+M: Ses aç/kapat');
