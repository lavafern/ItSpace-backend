const {restrict} = require("../../middlewares/auth.middleware")
const router = require('express').Router()
const {createProgress} = require("../../controllers/progress.controller")

router.post('/progress',restrict,createProgress)

module.exports = router