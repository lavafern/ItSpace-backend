const router = require('express').Router()
const {getAllUsers,getUserDetail,updateProfile,deleteUser} = require("../../controllers/user.controller")

router.get('/users',getAllUsers)
router.get('/users/:id',getUserDetail)
router.put('/users/:id',updateProfile)
router.delete('/users/:id',deleteUser)
module.exports = router