jest.mock('../../../shared/utils/errors', () => {
  class NotFoundError extends Error {
    constructor(message) {
      super(message);
      this.name = 'NotFoundError';
      this.statusCode = 404;
    }
  }

  return { NotFoundError };
}, { virtual: true });

const mongoose = require('mongoose');
require('../../models/Artist');
const SongRepository = require('../../features/song/repositories/SongRepository');
const { NotFoundError } = require('../../../shared/utils/errors');

const Song = require('../../features/song/models/Song');

describe('SongRepository (unit, MongoDB mock)', () => {
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
    await Song.deleteMany({});
  });

  it('should create a song', async () => {
    const repo = new SongRepository();
    const artistId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    const song = await repo.create({
      title: 'Repo Test Song',
      artist: artistId,
      genre: 'pop',
      audioUrl: 'https://example.com/audio.mp3',
      duration: 180,
      uploadedBy: userId
    });

    expect(song).toBeTruthy();
    expect(song.title).toBe('Repo Test Song');
  });

  it('should update a song', async () => {
    const repo = new SongRepository();
    const artistId = new mongoose.Types.ObjectId();
    const userId = new mongoose.Types.ObjectId();

    const created = await repo.create({
      title: 'Original',
      artist: artistId,
      genre: 'pop',
      audioUrl: 'https://example.com/audio.mp3',
      duration: 120,
      uploadedBy: userId
    });

    const updated = await repo.update(created._id, { title: 'Updated Title' });

    expect(updated.title).toBe('Updated Title');
  });

  it('should throw NotFoundError when deleting missing song', async () => {
    const repo = new SongRepository();
    const missingId = new mongoose.Types.ObjectId();

    await expect(repo.delete(missingId)).rejects.toBeInstanceOf(NotFoundError);
  });
});
