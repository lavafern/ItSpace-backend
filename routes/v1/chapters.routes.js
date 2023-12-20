const {createChapter, getChapter, getAllChaptersForCourse, updateChapter,deleteChapter} = require('../../controllers/chapter.controller');
const { restrict, restrictGuest } = require('../../middlewares/authentication.middleware');
const { adminAccess } = require('../../middlewares/authorization.middleware');
const router = require('express').Router();

router.post('/courses/:courseId/chapters',restrict,adminAccess,createChapter);
router.put('/courses/:courseId/chapters/:id',restrict,adminAccess,updateChapter);
router.delete('/courses/:courseId/chapters/:id',restrict,adminAccess,deleteChapter);
router.get('/courses/:courseId/chapters/:id',getChapter);
router.get('/courses/:courseId/chapters',restrictGuest,getAllChaptersForCourse);

module.exports = router;