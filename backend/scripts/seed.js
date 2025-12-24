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
      { name: 'Şiire Gazele', image: 'https://via.placeholder.com/150x150/333/fff?text=ŞG', category: 'odaklanma' },
      { name: 'Baytar', image: 'https://via.placeholder.com/150x150/333/fff?text=BY', category: 'odaklanma' },
      { name: 'Bana Sor', image: 'https://via.placeholder.com/150x150/333/fff?text=BS', category: 'odaklanma' },
      { name: 'Tempo Up', image: 'https://via.placeholder.com/150x150/333/fff?text=TU', category: 'antreman' },
      { name: 'Party Time', image: 'https://via.placeholder.com/150x150/333/fff?text=PT', category: 'parti' },
      { name: 'Hasta İşi', image: 'https://via.placeholder.com/150x150/333/fff?text=HI', category: 'odaklanma' }
    ]);

    const map = Object.fromEntries(artists.map(a => [a.name, a._id]));

    // Insert songs
    await Song.insertMany([
      { title: 'Şiire Gazele', artist: map['Şiire Gazele'], album: 'Single', duration: 210, audioUrl: 'https://example.com/audio/sg.mp3', coverImage: 'https://via.placeholder.com/300x300/333/fff?text=SG', category: 'odaklanma' },
      { title: 'Baytar', artist: map['Baytar'], album: 'Single', duration: 200, audioUrl: 'https://example.com/audio/by.mp3', coverImage: 'https://via.placeholder.com/300x300/333/fff?text=BY', category: 'odaklanma' },
      { title: 'Bana Sor', artist: map['Bana Sor'], album: 'Single', duration: 190, audioUrl: 'https://example.com/audio/bs.mp3', coverImage: 'https://via.placeholder.com/300x300/333/fff?text=BS', category: 'odaklanma' },
      { title: 'Tempo Up', artist: map['Tempo Up'], album: 'Single', duration: 180, audioUrl: 'https://example.com/audio/tu.mp3', coverImage: 'https://via.placeholder.com/300x300/333/fff?text=TU', category: 'antreman' },
      { title: 'Party Time', artist: map['Party Time'], album: 'Single', duration: 175, audioUrl: 'https://example.com/audio/pt.mp3', coverImage: 'https://via.placeholder.com/300x300/333/fff?text=PT', category: 'parti' },
      { title: 'Hasta İşi', artist: map['Hasta İşi'], album: '2017', duration: 220, audioUrl: 'https://example.com/audio/hi.mp3', coverImage: 'https://via.placeholder.com/300x300/333/fff?text=HI', category: 'odaklanma' }
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
