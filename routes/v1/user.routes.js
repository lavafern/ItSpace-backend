const router = require('express').Router();
const {restrict} = require('../../middlewares/authentication.middleware');
const {getAllUsers,getUserDetail,updateProfile,deleteUser, verifiedUserCount} = require('../../controllers/user.controller');
const {image} = require('../../libs/multer');

router.get('/users',getAllUsers);
router.get('/users/:id',getUserDetail);
router.put('/users/:id',restrict,image.single('image'),updateProfile);
router.delete('/users/:id',restrict,deleteUser);
router.get('/verified-user-count',verifiedUserCount);

module.exports = router;