const {createCourse, updateCourse, deleteCourse} = require('../../controllers/course.controller')
const router = require('express').Router()

router.post('/courses',createCourse)
router.put('/courses/:id',updateCourse)
router.delete('/courses/:id',deleteCourse)

module.exports = router