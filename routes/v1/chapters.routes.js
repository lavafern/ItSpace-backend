const {createChapter, getChapter, getAllChaptersForCourse, updateChapter,deleteChapter} = require('../../controllers/chapter.controller');
const { restrict, restrictGuest } = require('../../middlewares/authentication.middleware');
const router = require('express').Router();

router.post('/courses/:courseId/chapters',restrict,createChapter);
router.put('/courses/:courseId/chapters/:id',restrict,updateChapter);
router.delete('/courses/:courseId/chapters/:id',restrict,deleteChapter);
router.get('/courses/:courseId/chapters/:id',getChapter);
router.get('/courses/:courseId/chapters',restrictGuest,getAllChaptersForCourse);

module.exports = router;