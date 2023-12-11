const {createChapter,updateChapter,deleteChapter} = require('../../controllers/chapter.controller')
const {createChapter, getChapter, getAllChaptersForCourse} = require('../../controllers/chapter.controller')
const router = require('express').Router()

router.post('/courses/:courseId/chapters',createChapter)
router.put('/courses/:courseId/chapters/:id',updateChapter)
router.delete('/courses/:courseId/chapters/:id',deleteChapter)
router.get('/courses/:courseId/chapters/:chapterId',getChapter)
router.get('/courses/:courseId/chapters',getAllChaptersForCourse)



module.exports = router