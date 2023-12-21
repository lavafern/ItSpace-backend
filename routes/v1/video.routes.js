const {createVideo, getVideoDetails, updateVideo, deleteVideo, getAllVideoForChapter} = require('../../controllers/video.controller');
const { restrict, restrictGuest } = require('../../middlewares/authentication.middleware');
const { adminAccess } = require('../../middlewares/authorization.middleware');
const router = require('express').Router();

router.post('/courses/:courseId/chapters/:chapterId/videos',restrict,adminAccess,createVideo);
router.get('/courses/:courseId/chapters/:chapterId/videos',restrict,adminAccess,getAllVideoForChapter);
router.get('/courses/:courseId/chapters/:chapterId/videos/:id',restrictGuest,getVideoDetails);
router.put('/courses/:courseId/chapters/:chapterId/videos/:id',restrict,adminAccess,updateVideo);
router.delete('/courses/:courseId/chapters/:chapterId/videos/:id',restrict,adminAccess,deleteVideo);

module.exports = router;