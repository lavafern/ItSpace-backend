const {restrict} = require('../../middlewares/authentication.middleware');
const router = require('express').Router();
const {getMyNotification,deleteNotification, readNotification} = require('../../controllers/notification.controller');

router.get('/my-notifications',restrict,getMyNotification);
router.delete('/my-notifications/:id',restrict,deleteNotification);
router.put('/my-notifications/:id',restrict,readNotification);

module.exports = router;