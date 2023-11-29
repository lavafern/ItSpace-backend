const {createCourse, updateCourse, deleteCourse, getAllCourse, getCourseDetail} = require('../../controllers/course.controller')
const router = require('express').Router()

router.post('/courses',createCourse)
router.get('/courses',getAllCourse)
router.get('/courses/:id',getCourseDetail)
router.put('/courses/:id',updateCourse)
router.delete('/courses/:id',deleteCourse)

module.exports = router