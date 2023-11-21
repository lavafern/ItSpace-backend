const {createCourse} = require('../../controllers/course.controller')
const router = require('express').Router()

router.post('/courses',createCourse)

module.exports = router