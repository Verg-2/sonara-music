const request = require('supertest');
const mongoose = require('mongoose');
const { app } = require('../../server');

const Artist = require('../../models/Artist');
const Song = require('../../models/Song');

describe('POST /api/songs (integration)', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URL, {
      dbName: 'music_test'
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Promise.all([Song.deleteMany({}), Artist.deleteMany({})]);
  });

  it('should create a song successfully', async () => {
    const artist = await Artist.create({
      name: 'Test Artist',
      category: 'odaklanma'
    });

    const payload = {
      title: 'Integration Song',
      artist: artist._id.toString(),
      album: 'Single',
      duration: 200,
      audioUrl: 'https://example.com/audio.mp3',
      category: 'odaklanma'
    };

    const res = await request(app)
      .post('/api/songs')
      .send(payload)
      .expect(201);

    expect(res.body).toMatchObject({ success: true });
    expect(res.body.data.title).toBe('Integration Song');

    const dbSong = await Song.findOne({ title: 'Integration Song' });
    expect(dbSong).toBeTruthy();
  });
});
