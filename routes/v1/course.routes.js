const {createCourse} = require('../../controllers/course.controller')
const {updateCourse} = require('../../controllers/course.controller')
const {deleteCourse} = require('../../controllers/course.controller')
const router = require('express').Router()

router.post('/courses',createCourse)
router.put('/courses/:id',updateCourse)
router.delete('/courses',deleteCourse)

module.exports = router