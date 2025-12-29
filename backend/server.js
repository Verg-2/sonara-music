const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http'); // For Socket.io

// Load env vars
dotenv.config();

// 🔹 Redis Client (Cache System)
const redisClient = require('./services/redisClient');

// 🔹 Socket.io Configuration
const { initializeSocket } = require('./config/socket');

const app = express();
const PORT = process.env.PORT || 5000;

// 🔹 CREATE HTTP SERVER FOR SOCKET.IO
const httpServer = http.createServer(app);

// Trust proxy for correct protocol detection (behind reverse proxy)
app.set('trust proxy', 1);

// 🔹 SECURITY MIDDLEWARE
// Helmet: Set HTTP security headers
// CORS ile uyumlu olması için crossOriginResourcePolicy'yi ayarla
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false // Media dosyaları için gerekli
}));
console.log('[INIT] Helmet.js HTTP headers güvenliği aktif');

// CORS: Allow only specific origins
const isDevelopment = process.env.NODE_ENV !== 'production';
const defaultOrigins = isDevelopment 
    ? ['http://localhost:5501', 'http://127.0.0.1:5501', 'http://localhost:5000', 'http://127.0.0.1:5000']
    : ['http://localhost:5000'];

const corsOptions = {
    origin: function (origin, callback) {
        // Development ortamında origin yoksa (Postman, curl gibi) izin ver
        if (!origin && isDevelopment) {
            return callback(null, true);
        }
        
        const allowedOrigins = process.env.CORS_ORIGIN 
            ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
            : defaultOrigins;
        
        // Development ortamında localhost ve 127.0.0.1'in tüm portlarına izin ver
        if (isDevelopment && origin) {
            const isLocalhost = origin.startsWith('http://localhost:') || 
                               origin.startsWith('http://127.0.0.1:') ||
                               origin.startsWith('http://0.0.0.0:');
            if (isLocalhost) {
                return callback(null, true);
            }
        }
        
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS policy tarafından izin verilmedi'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin'],
    exposedHeaders: ['Content-Length', 'X-JSON-Response'],
    maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));
// Add CORS header middleware for all responses
app.use((req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = process.env.CORS_ORIGIN 
        ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
        : defaultOrigins;
    
    // Development ortamında localhost ve 127.0.0.1'in tüm portlarına izin ver
    if (isDevelopment && origin) {
        const isLocalhost = origin.startsWith('http://localhost:') || 
                           origin.startsWith('http://127.0.0.1:') ||
                           origin.startsWith('http://0.0.0.0:');
        if (isLocalhost) {
            res.header('Access-Control-Allow-Origin', origin);
            res.header('Access-Control-Allow-Credentials', 'true');
            res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,HEAD');
            res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,Origin');
            res.header('Access-Control-Expose-Headers', 'Content-Length,X-JSON-Response');
        } else if (allowedOrigins.includes(origin)) {
            res.header('Access-Control-Allow-Origin', origin);
            res.header('Access-Control-Allow-Credentials', 'true');
            res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,HEAD');
            res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,Origin');
            res.header('Access-Control-Expose-Headers', 'Content-Length,X-JSON-Response');
        }
    } else if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,HEAD');
        res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,Origin');
        res.header('Access-Control-Expose-Headers', 'Content-Length,X-JSON-Response');
    }
    
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});
console.log('[INIT] CORS yapılandırıldı - Development modu:', isDevelopment);
console.log('[INIT] İzin verilen orijinler:', isDevelopment ? 'Tüm localhost portları' : defaultOrigins);

// Rate Limiting: Prevent brute force & DDoS
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '15000'), // 15 seconds
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per window
    message: 'Çok fazla istek gönderdiniz, lütfen daha sonra tekrar deneyin',
    standardHeaders: true, // Return rate limit info in RateLimit-* headers
    legacyHeaders: false // Disable X-RateLimit-* headers
});
app.use(limiter);
console.log('[INIT] Rate limiting aktif - ' + process.env.RATE_LIMIT_MAX_REQUESTS + ' req/' + process.env.RATE_LIMIT_WINDOW_MS + 'ms');

// Strict body parser
app.use(express.json({ limit: '10kb' })); // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(morgan('combined'));  // HTTP request logging

console.log('[INIT] Middleware yapılandırıldı');

// 🔹 STATIC FILES
// Special CORS middleware for media files
app.use('/api/media', (req, res, next) => {
    const origin = req.headers.origin;
    const allowedOrigins = process.env.CORS_ORIGIN 
        ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
        : defaultOrigins;
    
    // Development ortamında localhost ve 127.0.0.1'in tüm portlarına izin ver
    let shouldAllow = false;
    
    if (isDevelopment && origin) {
        shouldAllow = origin.startsWith('http://localhost:') || 
                      origin.startsWith('http://127.0.0.1:') ||
                      origin.startsWith('http://0.0.0.0:');
    } else if (origin && allowedOrigins.includes(origin)) {
        shouldAllow = true;
    }
    
    // Development ortamında origin yoksa da izin ver (direct file access)
    if (isDevelopment && !origin) {
        shouldAllow = true;
    }
    
    if (shouldAllow) {
        if (origin) {
            res.header('Access-Control-Allow-Origin', origin);
        } else if (isDevelopment) {
            res.header('Access-Control-Allow-Origin', '*');
        }
        res.header('Access-Control-Allow-Credentials', 'true');
        res.header('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,Accept,Origin,Range');
        res.header('Access-Control-Expose-Headers', 'Content-Length,Content-Range,Content-Type');
        res.header('Cross-Origin-Resource-Policy', 'cross-origin'); // Allow cross-origin resource access
    }
    
    if (req.method === 'OPTIONS' || req.method === 'HEAD') {
        return res.sendStatus(200);
    }
    next();
});

// Cache control for media files
app.use('/api/media', (req, res, next) => {
    res.header('Cache-Control', 'public, max-age=31536000');
    res.header('Accept-Ranges', 'bytes');
    res.header('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
});

// Static file serving with error handling
app.use('/api/media', express.static(path.join(__dirname, 'uploads'), {
    maxAge: '1y',
    etag: false,
    dotfiles: 'allow',
    fallthrough: false // Don't continue to next middleware if file not found
}));

// 404 handler for media files
app.use('/api/media', (req, res) => {
    console.warn(`[404] Media dosyası bulunamadı: ${req.path}`);
    res.status(404).json({
        success: false,
        message: 'Media dosyası bulunamadı',
        path: req.path
    });
});

console.log('[INIT] Static dosya servisi açıldı: /api/media');

// 🔹 RUST PROXY
app.get('/api/rust/hello', (req, res) => {
    console.log('[REQUEST] /api/rust/hello çağrısı geldi');
    
    const options = {
        hostname: '127.0.0.1',
        port: 8000,
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
                res.status(502).json({ success: false, message: 'JSON parse failed', raw: data });
            }
        });
    });

    proxyReq.on('error', (err) => {
        console.warn('[RUST ERROR] Bağlantı hatası:', err.message);
        res.status(502).json({ success: false, message: 'Rust servisi offline', error: err.message });
    });

    proxyReq.end();
});

app.get('/api/rust/hash', (req, res) => {
    console.log('[REQUEST] /api/rust/hash çağrısı geldi, query:', req.query);
    
    const qs = new URLSearchParams(req.query).toString();
    const options = {
        hostname: '127.0.0.1',
        port: 8000,
        path: `/api/rust/hash${qs ? ('?' + qs) : ''}`,
        method: 'GET',
        headers: { 'accept': 'application/json' }
    };

    const proxyReq = http.request(options, (proxyRes) => {
        let data = '';
        proxyRes.on('data', chunk => data += chunk);
        proxyRes.on('end', () => {
            try {
                const json = JSON.parse(data);
                console.log('[RUST RESPONSE] Hash başarılı:', json);
                res.status(proxyRes.statusCode || 200).json(json);
            } catch (e) {
                console.error('[RUST ERROR] JSON parse hatası:', e.message);
                res.status(502).json({ success: false, message: 'JSON parse failed', raw: data });
            }
        });
    });

    proxyReq.on('error', (err) => {
        console.warn('[RUST ERROR] Bağlantı hatası:', err.message);
        res.status(502).json({ success: false, message: 'Rust servisi offline', error: err.message });
    });

    proxyReq.end();
});

console.log('[INIT] Rust proxy routes yapılandırıldı');

// 🔹 API ROUTES (safely require with error handling)
try {
    app.use('/api/artists', require('./routes/artists'));
    console.log('[INIT] /api/artists route yüklendi');
} catch (e) {
    console.error('[ERROR] /api/artists yükleme hatası:', e.message);
}

try {
    app.use('/api/songs', require('./routes/songs'));
    console.log('[INIT] /api/songs route yüklendi');
} catch (e) {
    console.error('[ERROR] /api/songs yükleme hatası:', e.message);
}

try {
    app.use('/api/playlists', require('./routes/playlists'));
    console.log('[INIT] /api/playlists route yüklendi');
} catch (e) {
    console.error('[ERROR] /api/playlists yükleme hatası:', e.message);
}

try {
    app.use('/api/users', require('./routes/users'));
    console.log('[INIT] /api/users route yüklendi');
} catch (e) {
    console.error('[ERROR] /api/users yükleme hatası:', e.message);
}

try {
    app.use('/api/auth', require('./routes/auth'));
    console.log('[INIT] /api/auth route yüklendi');
} catch (e) {
    console.error('[ERROR] /api/auth yükleme hatası:', e.message);
}

try {
    app.use('/api/upload', require('./routes/upload'));
    console.log('[INIT] /api/upload route yüklendi');
} catch (e) {
    console.error('[ERROR] /api/upload yükleme hatası:', e.message);
}

try {
    app.use('/api/search', require('./routes/search'));
    console.log('[INIT] /api/search route yüklendi');
} catch (e) {
    console.error('[ERROR] /api/search yükleme hatası:', e.message);
}

// 🔹 TEST CACHE ROUTES (Development - Redis cache testing)
try {
    app.use('/api/test-cache', require('./routes/test-cache'));
    console.log('[INIT] 🧪 /api/test-cache route yüklendi (test endpoints)');
} catch (e) {
    console.error('[ERROR] /api/test-cache yükleme hatası:', e.message);
}

// 🔹 STATIC ASSETS (Logo, favicon, etc.)
app.use('/assets', express.static(path.join(__dirname, '../assets'), {
    maxAge: '1y',
    etag: true
}));
console.log('[INIT] Static assets servisi açıldı: /assets');

// 🔹 FAVICON ENDPOINT (Browser automatically requests this)
app.get('/favicon.ico', (req, res) => {
    const faviconPath = path.join(__dirname, '../assets/images/logo.png');
    if (fs.existsSync(faviconPath)) {
        res.sendFile(faviconPath, {
            headers: {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=31536000'
            }
        });
    } else {
        // Fallback to SVG if logo not found
        const svgFavicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#333"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#fff" font-family="Arial" font-size="60">♪</text></svg>`;
        res.setHeader('Content-Type', 'image/svg+xml');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        res.send(svgFavicon);
    }
});

// 🔹 ROOT ENDPOINT
app.get('/', (req, res) => {
    console.log('[REQUEST] / root endpoint çağrısı geldi');
    res.json({
        message: 'Müzik API hoş geldiniz',
        version: '1.0.0',
        endpoints: {
            artists: '/api/artists',
            songs: '/api/songs',
            playlists: '/api/playlists',
            users: '/api/users',
            auth: '/api/auth',
            upload: '/api/upload',
            search: '/api/search',
            rustHello: '/api/rust/hello',
            rustHash: '/api/rust/hash'
        }
    });
});

// 🔹 404 HANDLER
app.use((req, res) => {
    console.warn(`[404] ${req.method} ${req.path} - Endpoint bulunamadı`);
    res.status(404).json({
        success: false,
        message: 'Endpoint bulunamadı',
        path: req.path,
        method: req.method
    });
});

// 🔹 GLOBAL ERROR HANDLER (Her zaman en sonda olmalı!)
const errorHandler = require('./middleware/errorHandler');
app.use(errorHandler);
console.log('[INIT] Global error handler aktif');

// 🔹 SERVER START
const server = httpServer.listen(PORT, '0.0.0.0', () => {
    console.log('\n' + '='.repeat(50));
    console.log(`✅ 🎵 Server ${PORT} portunda çalışıyor`);
    console.log(`✅ 🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
    console.log(`✅ 🚀 Rust proxy: /api/rust/hello, /api/rust/hash`);
    console.log(`✅ 📡 Socket.io WebSocket sunucusu aktif`);
    console.log('='.repeat(50) + '\n');
}).on('error', (err) => {
    console.error('[FATAL] Server başlatma hatası:', err.message);
    console.error('[FATAL] Port %d kullanımda olabilir', PORT);
    process.exit(1);
});

// 🔹 INITIALIZE SOCKET.IO
const io = initializeSocket(httpServer);

// Store io instance globally for use in controllers/services
global.io = io;
console.log('[INIT] Socket.io başlatıldı ve global scope\'a eklendi');

// 🔹 MONGODB CONNECTION (async, error handled)
const connectDB = require('./config/db');
connectDB().catch(err => {
    console.error('[ERROR] MongoDB bağlantı hatası:', err.message);
    console.log('[INFO] In-memory veri modları kullanılacaktır');
});

// 🔹 CLOUDINARY CONNECTION TEST
const cloudinary = require('./config/cloudinary');
cloudinary.testConnection().catch(err => {
    console.error('[ERROR] Cloudinary bağlantı hatası:', err.message);
    console.log('[WARN] Dosya yükleme özellikleri çalışmayabilir');
});
