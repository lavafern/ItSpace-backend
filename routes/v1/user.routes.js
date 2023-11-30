const router = require('express').Router()
const {restrict} = require("../../middlewares/auth.middleware")
const {getAllUsers,getUserDetail,updateProfile,deleteUser,changePassword,changeProfilePicture} = require("../../controllers/user.controller")
const {image} = require("../../utils/multer")

router.get('/users',getAllUsers)
router.get('/users/:id',getUserDetail)
router.put('/users/:id',restrict,updateProfile)
router.delete('/users/:id',restrict,deleteUser)
router.put('/users/:id/change-password',restrict,changePassword)
router.put('/users/:id/change-profile-picture',image.single("image"),changeProfilePicture)
module.exports = router