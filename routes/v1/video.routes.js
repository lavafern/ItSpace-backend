const {createVideo, updateVideo} = require('../../controllers/video.controller')
const router = require('express').Router()

router.post('/courses/:courseId/chapters/:chapterId/videos',createVideo)
router.put('/courses/:courseId/chapters/:chapterId/videos/:id',updateVideo)


module.exports = router