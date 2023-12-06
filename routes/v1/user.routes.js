const router = require('express').Router()
const {restrict} = require("../../middlewares/auth.middleware")
const {getAllUsers,getUserDetail,updateProfile,deleteUser,changePassword} = require("../../controllers/user.controller")
const {image} = require("../../utils/multer")

router.get('/users',getAllUsers)
router.get('/users/:id',getUserDetail)
router.put('/users/:id',restrict,image.single('image'),updateProfile)
router.delete('/users/:id',restrict,deleteUser)
module.exports = router