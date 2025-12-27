const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Security: Add connection timeout and pool settings
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000, // 5 seconds timeout
            socketTimeoutMS: 45000, // 45 seconds socket timeout
        });

        console.log(` MongoDB bağlandı: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(` MongoDB bağlantı hatası: ${error.message}`);
        console.log('  MongoDB bulunamadı, in-memory data kullanılıyor');
        throw error;
    }
};

module.exports = connectDB;
