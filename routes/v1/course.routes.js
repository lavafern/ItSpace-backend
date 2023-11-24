const {createCourse} = require('../../controllers/course.controller')
const {updateCourse} = require('../../controllers/course.controller')
const router = require('express').Router()

router.post('/courses',createCourse)
router.put('/courses',updateCourse)

module.exports = router