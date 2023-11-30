const {createCourse, updateCourse, deleteCourse} = require('../../controllers/course.controller')
const {restrict} = require("../../middlewares/auth.middleware")
const {image} = require("../../utils/multer")
const router = require('express').Router()

router.post('/courses',restrict,image.single("image"),createCourse)
router.put('/courses/:id',restrict,image.single("image"),restrict,updateCourse)
router.delete('/courses/:id',restrict,deleteCourse)

module.exports = router