const controller = require('../controllers/user');
const express = require('express');
const router = express.Router();

router.get('/', controller.getUsers);
router.get('/:id', controller.getUser);
router.get('/followers/:id', controller.getFollowers);
router.get('/following/:id', controller.getFollowing);
router.post('/follow', controller.follow);
router.delete('/unfollow', controller.unfollow);




module.exports = router; 
