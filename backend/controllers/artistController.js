const Artist = require('../models/Artist');

// In-memory data fallback (MongoDB yoksa)
let artistsData = [
    { _id: '1', name: 'Şiire Gazele', image: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='100%25' height='100%25' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-family='Arial' font-size='50'%3EŞG%3C/text%3E%3C/svg%3E", category: 'odaklanma' },
    { _id: '2', name: 'Baytar', image: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='100%25' height='100%25' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-family='Arial' font-size='50'%3EBY%3C/text%3E%3C/svg%3E", category: 'odaklanma' },
    { _id: '3', name: 'Bana Sor', image: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='100%25' height='100%25' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-family='Arial' font-size='50'%3EBS%3C/text%3E%3C/svg%3E", category: 'odaklanma' },
    { _id: '4', name: 'Tempo Up', image: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='100%25' height='100%25' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-family='Arial' font-size='50'%3ETU%3C/text%3E%3C/svg%3E", category: 'antreman' },
    { _id: '5', name: 'Party Time', image: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='100%25' height='100%25' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-family='Arial' font-size='50'%3EPT%3C/text%3E%3C/svg%3E", category: 'parti' }
];

// @desc    Get all artists
// @route   GET /api/artists
// @access  Public
exports.getArtists = async (req, res, next) => {
    try {
        const { category, limit = 20, page = 1 } = req.query;
        
        // MongoDB kullanıyorsa
        if (Artist.db && Artist.db.readyState === 1) {
            let query = {};
            if (category) query.category = category;
            
            const artists = await Artist.find(query)
                .limit(parseInt(limit))
                .skip((parseInt(page) - 1) * parseInt(limit))
                .sort('-createdAt');
            
            const total = await Artist.countDocuments(query);
            
            return res.status(200).json({
                success: true,
                count: artists.length,
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                data: artists
            });
        }
        
        // In-memory data kullan
        let filtered = category 
            ? artistsData.filter(a => a.category === category)
            : artistsData;
        
        res.status(200).json({
            success: true,
            count: filtered.length,
            data: filtered
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single artist
// @route   GET /api/artists/:id
// @access  Public
exports.getArtist = async (req, res, next) => {
    try {
        if (Artist.db && Artist.db.readyState === 1) {
            const artist = await Artist.findById(req.params.id);
            
            if (!artist) {
                return res.status(404).json({
                    success: false,
                    message: 'Sanatçı bulunamadı'
                });
            }
            
            return res.status(200).json({
                success: true,
                data: artist
            });
        }
        
        const artist = artistsData.find(a => a._id === req.params.id);
        
        if (!artist) {
            return res.status(404).json({
                success: false,
                message: 'Sanatçı bulunamadı'
            });
        }
        
        res.status(200).json({
            success: true,
            data: artist
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create artist
// @route   POST /api/artists
// @access  Private/Admin
exports.createArtist = async (req, res, next) => {
    try {
        if (Artist.db && Artist.db.readyState === 1) {
            const artist = await Artist.create(req.body);
            
            return res.status(201).json({
                success: true,
                data: artist
            });
        }
        
        const newArtist = {
            _id: Date.now().toString(),
            ...req.body
        };
        artistsData.push(newArtist);
        
        res.status(201).json({
            success: true,
            data: newArtist
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update artist
// @route   PUT /api/artists/:id
// @access  Private/Admin
exports.updateArtist = async (req, res, next) => {
    try {
        if (Artist.db && Artist.db.readyState === 1) {
            const artist = await Artist.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            
            if (!artist) {
                return res.status(404).json({
                    success: false,
                    message: 'Sanatçı bulunamadı'
                });
            }
            
            return res.status(200).json({
                success: true,
                data: artist
            });
        }
        
        const index = artistsData.findIndex(a => a._id === req.params.id);
        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: 'Sanatçı bulunamadı'
            });
        }
        
        artistsData[index] = { ...artistsData[index], ...req.body };
        
        res.status(200).json({
            success: true,
            data: artistsData[index]
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete artist
// @route   DELETE /api/artists/:id
// @access  Private/Admin
exports.deleteArtist = async (req, res, next) => {
    try {
        if (Artist.db && Artist.db.readyState === 1) {
            const artist = await Artist.findByIdAndDelete(req.params.id);
            
            if (!artist) {
                return res.status(404).json({
                    success: false,
                    message: 'Sanatçı bulunamadı'
                });
            }
            
            return res.status(200).json({
                success: true,
                data: {}
            });
        }
        
        const index = artistsData.findIndex(a => a._id === req.params.id);
        if (index === -1) {
            return res.status(404).json({
                success: false,
                message: 'Sanatçı bulunamadı'
            });
        }
        
        artistsData.splice(index, 1);
        
        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Search artists
// @route   GET /api/artists/search?q=query
// @access  Public
exports.searchArtists = async (req, res, next) => {
    try {
        const { q } = req.query;
        
        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Arama terimi gerekli'
            });
        }
        
        if (Artist.db && Artist.db.readyState === 1) {
            const artists = await Artist.find({
                $text: { $search: q }
            });
            
            return res.status(200).json({
                success: true,
                count: artists.length,
                data: artists
            });
        }
        
        const filtered = artistsData.filter(a => 
            a.name.toLowerCase().includes(q.toLowerCase())
        );
        
        res.status(200).json({
            success: true,
            count: filtered.length,
            data: filtered
        });
    } catch (error) {
        next(error);
    }
};
