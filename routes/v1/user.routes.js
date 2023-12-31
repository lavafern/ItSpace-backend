const router = require('express').Router();
const {restrict} = require('../../middlewares/authentication.middleware');
const {getAllUsers,getUserDetail,updateProfile,deleteUser} = require('../../controllers/user.controller');
const {image} = require('../../libs/multer');

router.get('/users',getAllUsers);
router.get('/users/:id',getUserDetail);
router.put('/users/:id',restrict,image.single('image'),updateProfile);
router.delete('/users/:id',restrict,deleteUser);

module.exports = router;