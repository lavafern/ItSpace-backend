const {createVideo, getVideoDetails} = require('../../controllers/video.controller')
const router = require('express').Router()

router.post('/courses/:courseId/chapters/:chapterId/videos',createVideo)
router.get('/videos/:videoId', getVideoDetails);


module.exports = router