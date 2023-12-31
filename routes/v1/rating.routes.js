const {createRating,deleteRating} = require('../../controllers/rating.contoller');
const {restrict} = require('../../middlewares/authentication.middleware');
const router = require('express').Router();

router.post('/ratings',restrict,createRating);
router.delete('/ratings/:id',restrict,deleteRating);

module.exports = router;