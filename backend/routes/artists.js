const express = require('express');
const router = express.Router();
const {
    getArtists,
    getArtist,
    createArtist,
    updateArtist,
    deleteArtist,
    searchArtists
} = require('../controllers/artistController');

router.route('/')
    .get(getArtists)
    .post(createArtist);

router.route('/search')
    .get(searchArtists);

router.route('/:id')
    .get(getArtist)
    .put(updateArtist)
    .delete(deleteArtist);

module.exports = router;
