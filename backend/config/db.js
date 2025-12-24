const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);

        console.log(` MongoDB bağlandı: ${conn.connection.host}`);
    } catch (error) {
        console.error(` MongoDB bağlantı hatası: ${error.message}`);
        console.log('  MongoDB bulunamadı, in-memory data kullanılıyor');
    }
};

module.exports = connectDB;
