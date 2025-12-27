require('dotenv').config();
const mongoose = require('mongoose');
const Artist = require('../models/Artist');
const Song = require('../models/Song');

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Seed: MongoDB connected');

    // Clean existing
    await Song.deleteMany({});
    await Artist.deleteMany({});

    // Insert artists
    const artists = await Artist.insertMany([
      { name: 'Şiire Gazele', image: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='100%25' height='100%25' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-family='Arial' font-size='50'%3EŞG%3C/text%3E%3C/svg%3E", category: 'odaklanma' },
      { name: 'Baytar', image: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='100%25' height='100%25' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-family='Arial' font-size='50'%3EBY%3C/text%3E%3C/svg%3E", category: 'odaklanma' },
      { name: 'Bana Sor', image: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='100%25' height='100%25' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-family='Arial' font-size='50'%3EBS%3C/text%3E%3C/svg%3E", category: 'odaklanma' },
      { name: 'Tempo Up', image: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='100%25' height='100%25' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-family='Arial' font-size='50'%3ETU%3C/text%3E%3C/svg%3E", category: 'antreman' },
      { name: 'Party Time', image: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='100%25' height='100%25' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-family='Arial' font-size='50'%3EPT%3C/text%3E%3C/svg%3E", category: 'parti' },
      { name: 'Hasta İşi', image: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='100%25' height='100%25' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-family='Arial' font-size='50'%3EHI%3C/text%3E%3C/svg%3E", category: 'odaklanma' },
      { name: 'Ahmet Kaya', image: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 150 150'%3E%3Crect width='100%25' height='100%25' fill='%23663333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-family='Arial' font-size='50'%3EAK%3C/text%3E%3C/svg%3E", category: 'odaklanma' }
    ]);

    const map = Object.fromEntries(artists.map(a => [a.name, a._id]));

    // Insert songs
    await Song.insertMany([
      { title: 'Şiire Gazele', artist: map['Şiire Gazele'], album: 'Single', duration: 210, audioUrl: 'https://example.com/audio/sg.mp3', coverImage: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-family='Arial' font-size='80'%3ESG%3C/text%3E%3C/svg%3E", category: 'odaklanma' },
      { title: 'Baytar', artist: map['Baytar'], album: 'Single', duration: 200, audioUrl: 'https://example.com/audio/by.mp3', coverImage: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-family='Arial' font-size='80'%3EBY%3C/text%3E%3C/svg%3E", category: 'odaklanma' },
      { title: 'Bana Sor', artist: map['Bana Sor'], album: 'Single', duration: 190, audioUrl: 'https://example.com/audio/bs.mp3', coverImage: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-family='Arial' font-size='80'%3EBS%3C/text%3E%3C/svg%3E", category: 'odaklanma' },
      { title: 'Tempo Up', artist: map['Tempo Up'], album: 'Single', duration: 180, audioUrl: 'https://example.com/audio/tu.mp3', coverImage: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-family='Arial' font-size='80'%3ETU%3C/text%3E%3C/svg%3E", category: 'antreman' },
      { title: 'Party Time', artist: map['Party Time'], album: 'Single', duration: 175, audioUrl: 'https://example.com/audio/pt.mp3', coverImage: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-family='Arial' font-size='80'%3EPT%3C/text%3E%3C/svg%3E", category: 'parti' },
      { title: 'Hasta İşi', artist: map['Hasta İşi'], album: '2017', duration: 220, audioUrl: 'https://example.com/audio/hi.mp3', coverImage: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-family='Arial' font-size='80'%3EHI%3C/text%3E%3C/svg%3E", category: 'odaklanma' },
      { title: 'Sen İnsansın', artist: map['Ahmet Kaya'], album: 'Classic', duration: 280, audioUrl: '/api/media/sen-insansin.m4a', coverImage: "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'%3E%3Crect width='100%25' height='100%25' fill='%23663333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23fff' font-family='Arial' font-size='60'%3ESİ%3C/text%3E%3C/svg%3E", category: 'odaklanma' }
    ]);

    console.log('🌱 Seed: artists and songs inserted');
    await mongoose.disconnect();
    console.log('✅ Seed: done');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

run();
