const {createVideo, getVideoDetails, updateVideo, deleteVideo} = require('../../controllers/video.controller')
const router = require('express').Router()

router.post('/courses/:courseId/chapters/:chapterId/videos',createVideo)
router.get('/courses/:courseId/chapters/:chapterId/videos/:id', getVideoDetails);
router.put('/courses/:courseId/chapters/:chapterId/videos/:id',updateVideo)
router.put('/courses/:courseId/chapters/:chapterId/videos/:id',deleteVideo)

module.exports = router