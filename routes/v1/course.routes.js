const {createCourse, updateCourse, deleteCourse,getAllCourse,getCourseDetail, uploadImageCourse} = require('../../controllers/course.controller')
const {restrict} = require("../../middlewares/auth.middleware")
const {image} = require("../../utils/multer")
const router = require('express').Router()

router.post('/courses',restrict,image.single("image"),createCourse)
router.get('/courses',getAllCourse)
router.get('/courses/:id',getCourseDetail)
router.put('/courses/:id',restrict,image.single("image"),restrict,updateCourse)
router.delete('/courses/:id',restrict,deleteCourse)
router.put('/courses/image/:id',restrict,image.single("image"),uploadImageCourse)

module.exports = router