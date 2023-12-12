const {restrict} = require("../../middlewares/auth.middleware")
const router = require('express').Router()
const {getMyNotification,deleteNotification} = require("../../controllers/notification.controller")

router.get('/my-notifications',restrict,getMyNotification)
router.delete('/my-notifications/:id',restrict,deleteNotification)

module.exports = router