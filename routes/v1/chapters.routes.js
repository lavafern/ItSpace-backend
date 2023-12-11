const {createChapter, getChapter, getAllChaptersForCourse} = require('../../controllers/chapter.controller')
const router = require('express').Router()

router.post('/courses/:courseId/chapters',createChapter)
router.get('/courses/:courseId/chapters/:chapterId',getChapter)
router.get('/courses/:courseId/chapters',getAllChaptersForCourse)



module.exports = router