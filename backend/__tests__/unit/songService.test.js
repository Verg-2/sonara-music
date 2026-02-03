jest.mock('../../../shared/services/cacheService', () => ({
  get: jest.fn(),
  set: jest.fn(),
  invalidate: jest.fn(),
  invalidatePattern: jest.fn()
}), { virtual: true });

jest.mock('../../../shared/services/fileService', () => ({
  uploadAudio: jest.fn(),
  deleteFile: jest.fn()
}), { virtual: true });

jest.mock('../../../shared/services/notificationService', () => ({
  notify: jest.fn()
}), { virtual: true });

jest.mock('../../../shared/utils/logger', () => ({
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
}), { virtual: true });

jest.mock('../../../shared/utils/errors', () => {
  class ValidationError extends Error {
    constructor(message) {
      super(message);
      this.name = 'ValidationError';
      this.statusCode = 400;
    }
  }

  class NotFoundError extends Error {
    constructor(message) {
      super(message);
      this.name = 'NotFoundError';
      this.statusCode = 404;
    }
  }

  return { ValidationError, NotFoundError };
}, { virtual: true });

const SongService = require('../../features/song/services/SongService');
const { ValidationError } = require('../../../shared/utils/errors');

describe('SongService (unit)', () => {
  const mockCacheService = { get: jest.fn(), set: jest.fn(), invalidate: jest.fn(), invalidatePattern: jest.fn() };
  const mockFileService = { uploadAudio: jest.fn() };
  const mockNotificationService = { notify: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw ValidationError when file is missing', async () => {
    const mockRepo = { create: jest.fn() };
    const service = new SongService(mockRepo, mockCacheService, mockFileService, mockNotificationService);

    await expect(service.createSong(null, { title: 'Test', artist: 'x', genre: 'pop' }, 'user1'))
      .rejects
      .toBeInstanceOf(ValidationError);
  });

  it('should create a song with upload result', async () => {
    const mockRepo = { create: jest.fn().mockResolvedValue({ _id: 'song1', title: 'Test Song' }) };
    mockFileService.uploadAudio.mockResolvedValue({
      secure_url: 'https://cdn.example.com/audio.mp3',
      public_id: 'songs/user1/123'
    });

    const service = new SongService(mockRepo, mockCacheService, mockFileService, mockNotificationService);

    const result = await service.createSong(
      { buffer: Buffer.from('test') },
      { title: 'Test Song', artist: 'artist1', genre: 'pop', duration: 180 },
      'user1'
    );

    expect(mockFileService.uploadAudio).toHaveBeenCalledTimes(1);
    expect(mockRepo.create).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ _id: 'song1', title: 'Test Song' });
  });
});
