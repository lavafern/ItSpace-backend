const {createChapter} = require('../../controllers/chapter.controller')
const router = require('express').Router()

router.post('/courses/:courseId/chapters',createChapter)


module.exports = router