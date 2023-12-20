const {createCategory,getAllCategory,deleteCategory,updateCategory} = require('../../controllers/category.controller');
const {restrict} = require('../../middlewares/authentication.middleware');
const { adminAccess } = require('../../middlewares/authorization.middleware');
const router = require('express').Router();

router.post('/categories',restrict,adminAccess,createCategory);
router.get('/categories',getAllCategory);
router.put('/categories/:id',restrict,adminAccess,updateCategory);
router.delete('/categories/:id',restrict,adminAccess,deleteCategory);

module.exports = router;