const {createCourse, updateCourse, deleteCourse} = require('../../controllers/course.controller')
const {restrict} = require("../../middlewares/auth.middleware")
const router = require('express').Router()

router.post('/courses',restrict,createCourse)
router.put('/courses/:id',restrict,updateCourse)
router.delete('/courses/:id',restrict,deleteCourse)

module.exports = router