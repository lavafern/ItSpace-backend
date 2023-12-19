const {restrict} = require('../../middlewares/authentication.middleware');
const router = require('express').Router();
const {createEnrollment,getMyEnrollment} = require('../../controllers/enrollment.controller');

router.post('/enrollments',restrict,createEnrollment);
router.get('/my-enrollments',restrict,getMyEnrollment);

module.exports = router;
