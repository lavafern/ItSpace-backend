const {createVideo, getVideoDetails, updateVideo, deleteVideo} = require('../../controllers/video.controller');
const { restrict } = require("../../middlewares/authentication.middleware")
const router = require('express').Router()

router.post('/courses/:courseId/chapters/:chapterId/videos',restrict,createVideo)
router.get('/courses/:courseId/chapters/:chapterId/videos/:id',restrict, getVideoDetails);
router.put('/courses/:courseId/chapters/:chapterId/videos/:id',restrict,updateVideo)
router.delete('/courses/:courseId/chapters/:chapterId/videos/:id',restrict,deleteVideo)

module.exports = router