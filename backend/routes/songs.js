const express = require('express');
const router = express.Router();
const {
    getSongs,
    getSong,
    createSong,
    updateSong,
    deleteSong,
    incrementPlayCount
} = require('../controllers/songController');

router.route('/')
    .get(getSongs)
    .post(createSong);

router.route('/:id')
    .get(getSong)
    .put(updateSong)
    .delete(deleteSong);

router.route('/:id/play')
    .post(incrementPlayCount);

module.exports = router;
