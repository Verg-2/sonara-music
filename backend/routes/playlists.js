const express = require('express');
const router = express.Router();
const {
    getPlaylists,
    getPlaylist,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist
} = require('../controllers/playlistController');

router.route('/')
    .get(getPlaylists)
    .post(createPlaylist);

router.route('/:id')
    .get(getPlaylist)
    .put(updatePlaylist)
    .delete(deletePlaylist);

router.route('/:id/songs')
    .post(addSongToPlaylist);

router.route('/:id/songs/:songId')
    .delete(removeSongFromPlaylist);

module.exports = router;
