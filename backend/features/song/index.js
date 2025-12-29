/**
 * Song Feature Index
 * features/song/index.js
 * 
 * Barrel export for Song feature
 */

const Song = require('./models/Song');
const SongRepository = require('./repositories/SongRepository');
const SongService = require('./services/SongService');
const SongController = require('./controllers/SongController');
const SongDTO = require('./dtos/SongDTO');

module.exports = {
  Song,
  SongRepository,
  SongService,
  SongController,
  SongDTO
};
