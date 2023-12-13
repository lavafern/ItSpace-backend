const {createVideo} = require('../../controllers/video.controller')
const router = require('express').Router()

router.post('/courses/:courseId/chapters/:chapterId/videos',createVideo)



module.exports = router