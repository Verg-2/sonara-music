const express = require('express');
const router = express.Router();
const {
    getUsers,
    getUser,
    updateUser,
    deleteUser,
    addFavorite,
    removeFavorite
} = require('../controllers/userController');

router.route('/')
    .get(getUsers);

router.route('/:id')
    .get(getUser)
    .put(updateUser)
    .delete(deleteUser);

router.route('/:id/favorites/:type/:itemId')
    .post(addFavorite)
    .delete(removeFavorite);

module.exports = router;
