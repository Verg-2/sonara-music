const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static dosyaları sunma - uploads klasörü
app.use('/api/media', express.static(path.join(__dirname, 'uploads')));

// Rust microservice proxy: forwards to http://127.0.0.1:8000
const http = require('http');
app.get('/api/rust/hello', (req, res) => {
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
                res.status(proxyRes.statusCode || 200).json(json);
            } catch (e) {
                res.status(502).json({ success: false, message: 'Rust yanıtı çözümlenemedi', raw: data });
            }
        });
    });

    proxyReq.on('error', (err) => {
        console.warn('Rust servisine ulaşılamadı:', err.message);
        res.status(502).json({ success: false, message: 'Rust servisi offline' });
    });

    proxyReq.end();
});

// Proxy: /api/rust/hash -> forwards query string to Rust service
app.get('/api/rust/hash', (req, res) => {
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
                res.status(proxyRes.statusCode || 200).json(json);
            } catch (e) {
                res.status(502).json({ success: false, message: 'Rust yanıtı çözümlenemedi', raw: data });
            }
        });
    });

    proxyReq.on('error', (err) => {
        console.warn('Rust servisine ulaşılamadı:', err.message);
        res.status(502).json({ success: false, message: 'Rust servisi offline' });
    });

    proxyReq.end();
});

// Quick test route to verify server reload
app.get('/api/rust/hash2', (req, res) => {
    res.json({ ok: true, note: 'hash2 test' });
});
console.log('🔧 Hash routes wired');
// Routes
app.use('/api/artists', require('./routes/artists'));
app.use('/api/songs', require('./routes/songs'));
app.use('/api/playlists', require('./routes/playlists'));
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Müzik API hoş geldiniz',
        version: '1.0.0',
        endpoints: {
            artists: '/api/artists',
            songs: '/api/songs',
            playlists: '/api/playlists',
            users: '/api/users',
            auth: '/api/auth',
            rustHello: '/api/rust/hello',
            rustHash: '/api/rust/hash'
        }
    });
});

// Debug: list registered routes
app.get('/api/routes', (req, res) => {
    try {
        const routes = [];
        if (app._router && app._router.stack) {
            app._router.stack.forEach((middleware) => {
                if (middleware.route) {
                    const m = middleware.route;
                    const methods = Object.keys(m.methods).filter(k => m.methods[k]);
                    routes.push({ path: m.path, methods });
                }
            });
        }
        res.json({ count: routes.length, routes });
    } catch (e) {
        res.status(500).json({ error: 'routes list failed', message: e.message });
    }
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Sunucu hatası',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint bulunamadı'
    });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`🎵 Server ${PORT} portunda çalışıyor`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🚀 Rust proxy endpoints: /api/rust/hello, /api/rust/hash`);
});
