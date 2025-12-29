// Placeholder helpers to avoid external image errors
// Tema tercihini sakla, diğer verileri temizle
if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
    const savedTheme = localStorage.getItem('theme');
    localStorage.clear();
    if (savedTheme) {
        localStorage.setItem('theme', savedTheme);
    }
}

const placeholderSvg = (text = '♪', size = 150) => {
    const safeText = (text || '♪').toString().slice(0, 3);
    const fontSize = Math.floor(size / 3);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="100%" height="100%" fill="#333"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-family="Arial" font-size="${fontSize}">${safeText}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const sanitizeImage = (src, text = '♪', size = 150) => {
    if (!src || src.includes('placeholder.com')) {
        return placeholderSvg(text?.toString().charAt(0) || '♪', size);
    }
    return src;
};

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
// Tema durumu
let isDarkTheme = true;
// Yükleme ve istek kontrolü
let isLoadingArtists = false;
let artistsFetchController = null;

// Audio player
let audioPlayer = new Audio();
let playlist = [];
let currentSongIndex = 0;
let isMuted = false;
let currentVolume = 1.0;

// Backend API base URL - Use current origin to avoid CORS issues
// This ensures the same protocol and host as the frontend
const API_URL = `${window.location.protocol}//${window.location.hostname}:5000/api`;

// DOM elements
// Yalnızca ana sayfadaki kategori butonları (data-category) hedeflenir
const categoryButtons = document.querySelectorAll('.category-btn[data-category]');
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
const currentTime = document.getElementById('current-time');
const totalTime = document.getElementById('total-time');
const progressFill = document.getElementById('progress-fill');
const progressBar = document.getElementById('progress-bar');

// Ensure default cover does not hit external placeholder
if (currentCover) {
    currentCover.src = sanitizeImage(currentCover.getAttribute('src'), '♪', 50);
}

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM yüklendi, başlatılıyor...');
    console.log('Player butonları:', {
        playPauseBtn: !!playPauseBtn,
        prevBtn: !!prevBtn,
        nextBtn: !!nextBtn,
        shuffleBtn: !!shuffleBtn,
        repeatBtn: !!repeatBtn,
        favoriteBtn: !!favoriteBtn,
        volumeBtn: !!volumeBtn
    });
    loadSavedTheme();
    loadArtists(currentCategory);
    setupEventListeners();
    setupAudioPlayer();
});

// Kategoriye göre sanatçılar yükleme
async function loadArtists(category) {
    if (!artistsGrid) return;
    // Önceki isteği iptal et
    if (artistsFetchController) {
        artistsFetchController.abort();
    }
    artistsFetchController = new AbortController();
    const { signal } = artistsFetchController;

    isLoadingArtists = true;
    artistsGrid.classList.add('loading');

    let artists = [];
    let apiSuccess = false;
    try {
        // Timeout ile API isteği
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 saniye timeout
        
        const res = await fetch(`${API_URL}/artists?category=${encodeURIComponent(category)}`, { 
            signal: controller.signal 
        });
        clearTimeout(timeoutId);
        
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        if (!data || !data.success) {
            throw new Error(data?.message || 'API yanıtı geçersiz');
        }
        
        artists = data?.data || [];
        apiSuccess = true;
        console.log(`✓ API başarılı: ${artists.length} sanatçı yüklendi`);
    } catch (err) {
        if (err.name !== 'AbortError') {
            // Yerel veriye düş
            console.warn('⚠ API Hatası:', err.message || 'Bağlantı başarısız');
            console.log('💾 Yerel veriye geçiliyor...');
            artists = artistsData[category] || artistsData.odaklanma || [];
        } else {
            return; // iptal edildi
        }
    }

    // DOM güncellemesini tek seferde yap
    const frag = document.createDocumentFragment();
    artists.forEach(artist => {
        const artistCard = createArtistCard(artist);
        if (artistCard) {
            frag.appendChild(artistCard);
        }
    });
    artistsGrid.replaceChildren(frag);

    // Yükleme bitti
    isLoadingArtists = false;
    artistsGrid.classList.remove('loading');
    
    if (!apiSuccess) {
        showNotification('⚠ Backend bağlantısı yok - yerel veriler kullanılıyor');
    }
}

// Arama API'si
async function searchArtistsAPI(query) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const res = await fetch(`${API_URL}/artists/search?q=${encodeURIComponent(query)}`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        const data = await res.json();
        console.log(`✓ Arama başarılı: "${query}" için sonuç bulundu`);
        return data?.data || [];
    } catch (err) {
        console.warn('⚠ Arama API hatası:', err.message);
        console.log('💾 Yerel arama yapılıyor...');
        // Yerel veri üzerinden filtreleme (fallback)
        const all = artistsData[currentCategory] || artistsData.odaklanma || [];
        return all.filter(a => a.name.toLowerCase().includes(query.toLowerCase()));
    }
}

// Create artist card
function createArtistCard(artist) {
    if (!artist || !artist.name) {
        console.warn('Invalid artist data:', artist);
        return null;
    }
    
    const card = document.createElement('div');
    card.className = 'artist-card';

    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'artist-image';

    const img = document.createElement('img');
    img.alt = artist.name || 'Artist';
    img.src = sanitizeImage(artist.image, artist.name, 150);
    img.loading = 'lazy';
    img.decoding = 'async';
    img.onerror = () => {
        img.onerror = null; // avoid infinite loop if placeholder fails
        img.src = placeholderSvg(artist.name?.charAt(0) || '♪', 150);
    };

    imageWrapper.appendChild(img);

    const nameEl = document.createElement('div');
    nameEl.className = 'artist-name';
    nameEl.textContent = artist.name;

    card.appendChild(imageWrapper);
    card.appendChild(nameEl);
    
    // Add event listeners
    card.addEventListener('click', (e) => playArtist(artist, e));
    // Context menu disabled for artist cards as requested
    
    return card;
}

// Setup event listeners
function setupEventListeners() {
    // Category buttons
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (isLoadingArtists) return; // hızlı tıklamalarda beklet
            categoryButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.dataset.category;
            loadArtists(currentCategory);
        });
    });
    
    // Search functionality
    searchInput.addEventListener('input', handleSearch);
    
    // Player controls
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', togglePlayPause);
        console.log('✓ Play/Pause butonu bağlandı');
    } else {
        console.error('✗ Play/Pause butonu bulunamadı!');
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', previousSong);
        console.log('✓ Previous butonu bağlandı');
    }
    
    if (nextBtn) {
        nextBtn.addEventListener('click', nextSong);
        console.log('✓ Next butonu bağlandı');
    }
    
    if (shuffleBtn) shuffleBtn.addEventListener('click', toggleShuffle);
    if (repeatBtn) repeatBtn.addEventListener('click', toggleRepeat);
    if (favoriteBtn) favoriteBtn.addEventListener('click', toggleFavorite);
    if (volumeBtn) volumeBtn.addEventListener('click', toggleMute);
    
    // Navigation
    const homeBtn = document.getElementById('home-btn');
    const libraryBtn = document.getElementById('library-btn');
    const usersBtn = document.getElementById('users-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    
    if (homeBtn) {
        homeBtn.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
            homeBtn.classList.add('active');
            showNotification('Ana Sayfa');
        });
    }
    
    if (libraryBtn) {
        libraryBtn.addEventListener('click', () => {
            window.location.href = 'muzik%20kutuphanesi/kutuphane.html';
        });
    }
    
    if (usersBtn) {
        usersBtn.addEventListener('click', () => {
            window.location.href = 'profil/profil.html';
        });
    }
    
    // Theme toggle
    if (themeToggleBtn) {
        console.log('✓ Tema butonu bulundu, event listener ekleniyor');
        themeToggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🎨 Tema butonu tıklandı!');
            toggleTheme();
        });
    } else {
        console.error('✗ Tema butonu bulunamadı!');
    }
    
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
        if (artistCard) {
            artistsGrid.appendChild(artistCard);
        }
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
    const menu = document.getElementById('context-menu');
    if (menu) {
        menu.style.display = 'none';
    }
}

// Setup context menu items
function setupContextMenuItems() {
    const playRadio = document.getElementById('play-radio');
    const playAfter = document.getElementById('play-after');
    
    if (playRadio) {
        playRadio.addEventListener('click', () => {
            const artist = contextMenu.dataset.artist;
            showNotification(`${artist} radyosu başlatılıyor...`);
            hideContextMenu();
        });
    }
    
    if (playAfter) {
        playAfter.addEventListener('click', () => {
            const artist = contextMenu.dataset.artist;
            showNotification(`${artist} sıradaki şarkı olarak eklendi`);
            hideContextMenu();
        });
    }
    
    const addQueue = document.getElementById('add-queue');
    if (addQueue) {
        addQueue.addEventListener('click', () => {
            const artist = contextMenu.dataset.artist;
            showNotification(`${artist} sıraya eklendi`);
            hideContextMenu();
        });
    }
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
async function playArtist(artist, clickEvent) {
    // Artist'e tıklanınca API'den şarkıları getir, yoksa yerel davranışa düş
    try {
        const songs = await fetchSongsForArtist(artist);
        if (songs && songs.length > 0) {
            playlist = songs;
            currentSongIndex = 0;
            playSongAtIndex(currentSongIndex);
        } else {
            // Fallback: önceki basit davranış
            currentSong.title = artist.name;
            currentSong.artist = "Şarkı Çalıyor...";
            updatePlayerDisplay();
            isPlaying = true;
            updatePlayButton();
        }
    } catch (err) {
        console.warn('Şarkı yüklenemedi, yerel davranışa düşülüyor:', err);
        currentSong.title = artist.name;
        currentSong.artist = "Şarkı Çalıyor...";
        updatePlayerDisplay();
        isPlaying = true;
        updatePlayButton();
    }
    
    // Oynatma animasyonu
    const allCards = document.querySelectorAll('.artist-card');
    allCards.forEach(card => card.classList.remove('playing'));
    if (clickEvent && clickEvent.currentTarget) {
        clickEvent.currentTarget.classList.add('playing');
    }
}

function playSongAtIndex(index) {
    if (index < 0 || index >= playlist.length) return;
    
    const song = playlist[index];
    currentSongIndex = index;
    console.log('DEBUG: Song object:', song);
    console.log('DEBUG: Song ID:', song._id);
    currentSong.title = song.title || 'Bilinmeyen Şarkı';
    currentSong.artist = (song.artist && (song.artist.name || song.artist)) || 'Bilinmeyen Sanatçı';
    
    // Önce görsel güncelle
    updatePlayerDisplay();
    isPlaying = true;
    updatePlayButton();
    
    // Şarkının URL'si varsa çal (opsiyonel)
    if (song.url || song.audioUrl) {
        const audioUrl = song.url || song.audioUrl;
        console.log('Şarkı yükleniyor:', audioUrl);
        audioPlayer.src = audioUrl;
        audioPlayer.play().catch(err => {
            console.warn('Ses dosyası çalınamadı (URL geçersiz veya yok), demo modunda devam ediliyor:', err.message);
            // Hata olsa bile görsel olarak oynatmaya devam et
        });
    } else {
        console.log('Demo mod: Ses dosyası URL\'si yok, sadece görsel oynatma');
        showNotification('🎵 ' + currentSong.title);
    }
    
    // Sunucuya dinlenme sayısını işaretle
    if (song._id) {
        console.log('Play isteği gönderiliyor, ID:', song._id);
        playSongOnServer(song._id);
    } else {
        console.warn('⚠️ Song._id yok! Song:', song);
    }
}

function setupAudioPlayer() {
    console.log('Audio player kuruluyor...');
    
    // Audio player event listeners
    audioPlayer.addEventListener('ended', () => {
        console.log('Şarkı bitti');
        if (isRepeatOn) {
            audioPlayer.currentTime = 0;
            audioPlayer.play();
        } else {
            nextSong();
        }
    });
    
    audioPlayer.addEventListener('play', () => {
        console.log('Audio play event');
        isPlaying = true;
        updatePlayButton();
    });
    
    audioPlayer.addEventListener('pause', () => {
        console.log('Audio pause event');
        isPlaying = false;
        updatePlayButton();
    });
    
    audioPlayer.addEventListener('timeupdate', () => {
        // Şarkı süresi güncelleme
        updateProgressBar();
    });
    
    audioPlayer.addEventListener('loadedmetadata', () => {
        console.log('Audio metadata yüklendi');
        if (totalTime && audioPlayer.duration) {
            totalTime.textContent = formatTime(audioPlayer.duration);
        }
    });
    
    audioPlayer.addEventListener('error', (e) => {
        console.warn('Audio yükleme hatası (dosya bulunamadı, demo modda devam):', e.type);
        // Hata olsa bile görsel oynatmaya devam et, sessiz çalışsın
    });
    
    audioPlayer.addEventListener('loadeddata', () => {
        console.log('Audio başarıyla yüklendi');
    });
    
    // Progress bar tıklaması
    if (progressBar) {
        progressBar.addEventListener('click', (e) => {
            if (audioPlayer.duration) {
                const rect = progressBar.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                audioPlayer.currentTime = percent * audioPlayer.duration;
            }
        });
    }
    
    // Set initial volume
    audioPlayer.volume = currentVolume;
    
    console.log('Audio player kuruldu');
}

// Süre formatı: MM:SS
function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Progress bar güncelle
function updateProgressBar() {
    if (!audioPlayer.duration) return;
    
    const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    
    if (progressFill) {
        progressFill.style.width = percent + '%';
    }
    
    if (currentTime) {
        currentTime.textContent = formatTime(audioPlayer.currentTime);
    }
}

function togglePlayPause() {
    console.log('togglePlayPause called', { isPlaying, hasAudioSrc: !!audioPlayer.src });
    
    // State'i değiştir
    isPlaying = !isPlaying;
    
    // Butonu güncelle
    updatePlayButton();
    
    // Audio varsa onu da kontrol et
    if (audioPlayer.src) {
        if (isPlaying) {
            audioPlayer.play().catch(err => {
                console.warn('Oynatma hatası:', err);
                isPlaying = false;
                updatePlayButton();
            });
        } else {
            audioPlayer.pause();
        }
    }
    
    // Bildirimi göster
    showNotification(isPlaying ? '▶ Oynatılıyor' : '⏸ Duraklatıldı');
}

function updatePlayButton() {
    if (!playPauseBtn) {
        console.warn('playPauseBtn bulunamadı');
        return;
    }
    const icon = playPauseBtn.querySelector('i');
    if (icon) {
        if (isPlaying) {
            icon.className = 'fas fa-pause';
        } else {
            icon.className = 'fas fa-play';
        }
        console.log('Buton güncellendi:', isPlaying ? 'PAUSE' : 'PLAY');
    } else {
        console.warn('Icon elementi bulunamadı');
    }
}

function previousSong() {
    console.log('previousSong called', { playlistLength: playlist.length, currentSongIndex, isShuffleOn });
    if (playlist.length === 0) {
        showNotification('Çalma listesi boş');
        return;
    }
    
    if (isShuffleOn) {
        // Karıştırma açıksa rastgele şarkı seç
        const randomIndex = Math.floor(Math.random() * playlist.length);
        playSongAtIndex(randomIndex);
    } else {
        // Normal sırada önceki şarkıya geç
        currentSongIndex--;
        if (currentSongIndex < 0) {
            currentSongIndex = playlist.length - 1;
        }
        playSongAtIndex(currentSongIndex);
    }
    showNotification('Önceki şarkı');
}

function nextSong() {
    console.log('nextSong called', { playlistLength: playlist.length, currentSongIndex, isShuffleOn });
    if (playlist.length === 0) {
        showNotification('Çalma listesi boş');
        return;
    }
    
    if (isShuffleOn) {
        // Karıştırma açıksa rastgele şarkı seç
        const randomIndex = Math.floor(Math.random() * playlist.length);
        playSongAtIndex(randomIndex);
    } else {
        // Normal sırada sonraki şarkıya geç
        currentSongIndex++;
        if (currentSongIndex >= playlist.length) {
            currentSongIndex = 0;
        }
        playSongAtIndex(currentSongIndex);
    }
    showNotification('Sonraki şarkı');
}

function toggleShuffle() {
    if (!shuffleBtn) return;
    isShuffleOn = !isShuffleOn;
    shuffleBtn.classList.toggle('active', isShuffleOn);
    showNotification(isShuffleOn ? 'Karıştırma açık' : 'Karıştırma kapalı');
}

function toggleRepeat() {
    if (!repeatBtn) return;
    isRepeatOn = !isRepeatOn;
    repeatBtn.classList.toggle('active', isRepeatOn);
    showNotification(isRepeatOn ? 'Tekrar açık' : 'Tekrar kapalı');
}

function toggleFavorite() {
    if (!favoriteBtn) return;
    favoriteBtn.classList.toggle('active');
    const isFavorite = favoriteBtn.classList.contains('active');
    showNotification(isFavorite ? 'Favorilere eklendi' : 'Favorilerden çıkarıldı');
}

function toggleMute() {
    if (!volumeBtn) return;
    const icon = volumeBtn.querySelector('i');
    if (!icon) return;
    if (!isMuted) {
        // Sesi kapat
        currentVolume = audioPlayer.volume;
        audioPlayer.volume = 0;
        isMuted = true;
        icon.className = 'fas fa-volume-mute';
        showNotification('Ses kapatıldı');
    } else {
        // Sesi aç
        audioPlayer.volume = currentVolume;
        isMuted = false;
        icon.className = 'fas fa-volume-up';
        showNotification('Ses açıldı');
    }
}

function updatePlayerDisplay() {
    if (currentTitle) currentTitle.textContent = currentSong.title;
    if (currentArtist) currentArtist.textContent = currentSong.artist;
    
    // Progress bar'ı sıfırla
    if (progressFill) {
        progressFill.style.width = '0%';
    }
    if (currentTime) {
        currentTime.textContent = '0:00';
    }
    if (totalTime) {
        totalTime.textContent = '0:00';
    }
}

// Belirli bir artist için şarkıları API'den getir
async function fetchSongsForArtist(artist) {
    if (artist && artist._id) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            const url = `${API_URL}/songs?artist=${encodeURIComponent(artist._id)}`;
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!res.ok) {
                throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            }
            
            const data = await res.json();
            if (!data || !data.success) {
                throw new Error(data?.message || 'API yanıtı geçersiz');
            }
            
            const songs = data?.data || [];
            console.log(`✓ Şarkılar yüklendi: ${artist.name} - ${songs.length} şarkı`);
            return songs;
        } catch (err) {
            console.warn(`⚠ Şarkı yükleme hatası: ${artist.name}`, err.message);
            return [];
        }
    }
    return [];
}

// Sunucuya dinlenme sayısını artırma isteği gönder
async function playSongOnServer(songId) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const res = await fetch(`${API_URL}/songs/${songId}/play`, { 
            method: 'POST',
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        clearTimeout(timeoutId);
        
        if (!res.ok) {
            throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        if (!data || !data.success) {
            console.warn('⚠ Play isteği başarısız:', data?.message || 'Bilinmeyen hata');
        } else {
            console.log('✓ Play sayısı artırıldı');
        }
    } catch (err) {
        console.warn('⚠ Play isteği gönderilemedi:', err.message);
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
    // Önceki notification varsa kaldır
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Yeni notification oluştur
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Animasyonla göster
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // 2 saniye sonra kaldır
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 300);
    }, 2000);
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

// Theme Toggle Functions
function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    applyTheme();
    const theme = isDarkTheme ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
    console.log('Tema değiştirildi:', theme);
}

function applyTheme() {
    const themeIcon = document.querySelector('#theme-toggle-btn i');
    console.log('🎨 applyTheme çağrıldı - isDarkTheme:', isDarkTheme);
    console.log('🎨 Tema ikonu element:', themeIcon);
    
    // Renkleri hemen değiştir, animasyon yok
    if (isDarkTheme) {
        document.body.classList.remove('light-theme');
        document.documentElement.setAttribute('data-theme', 'dark');
        if (themeIcon) {
            // Force class değişimi
            themeIcon.removeAttribute('class');
            themeIcon.setAttribute('class', 'fas fa-sun');
            console.log('✓ İkon güneşe değişti (dark mode) -', themeIcon.className);
        } else {
            console.error('✗ Tema ikonu bulunamadı!');
        }
    } else {
        document.body.classList.add('light-theme');
        document.documentElement.setAttribute('data-theme', 'light');
        if (themeIcon) {
            // Force class değişimi
            themeIcon.removeAttribute('class');
            themeIcon.setAttribute('class', 'fas fa-moon');
            console.log('✓ İkon aya değişti (light mode) -', themeIcon.className);
        } else {
            console.error('✗ Tema ikonu bulunamadı!');
        }
    }
}

function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    console.log('Kaydedilmiş tema:', savedTheme);
    
    if (savedTheme === 'light') {
        isDarkTheme = false;
        document.body.classList.add('light-theme');
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        isDarkTheme = true;
        document.body.classList.remove('light-theme');
        document.documentElement.setAttribute('data-theme', 'dark');
    }
    
    // İkon güncelleme için kısa bir gecikme
    setTimeout(() => {
        const themeIcon = document.querySelector('#theme-toggle-btn i');
        if (themeIcon) {
            themeIcon.className = isDarkTheme ? 'fas fa-sun' : 'fas fa-moon';
            console.log('İkon yüklendi:', themeIcon.className);
        }
    }, 100);
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

// Create bubbles periodically (daha hafif ve yükleme sırasında duraklat)
setInterval(() => {
    if (!isLoadingArtists) createBubble();
}, 3000);

// Create initial bubbles
for (let i = 0; i < 3; i++) {
    setTimeout(() => createBubble(), i * 600);
}

console.log('Müzik uygulaması yüklendi! 🎵');
console.log('Klavye kısayolları:');
console.log('Space: Oynat/Duraklat');
console.log('←/→: Önceki/Sonraki şarkı');
console.log('Ctrl+S: Karıştırma');
console.log('Ctrl+R: Tekrar');
console.log('Ctrl+L: Favori');
console.log('Ctrl+M: Ses aç/kapat');
