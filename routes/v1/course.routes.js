const {createCourse, updateCourse, deleteCourse,getAllCourse,getCourseDetail} = require('../../controllers/course.controller');
const {restrict, restrictGuest} = require('../../middlewares/authentication.middleware');
const {image} = require('../../libs/multer');
const { adminAccess } = require('../../middlewares/authorization.middleware');
const router = require('express').Router();

router.post('/courses',restrict,adminAccess,image.single('image'),createCourse);
router.get('/courses',getAllCourse);
router.get('/courses/:id',restrictGuest,getCourseDetail);
router.put('/courses/:id',restrict,adminAccess,image.single('image'),updateCourse);
router.delete('/courses/:id',restrict,adminAccess,deleteCourse);

module.exports = router;