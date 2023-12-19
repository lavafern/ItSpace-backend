const {createCategory,getAllCategory,deleteCategory,updateCategory} = require('../../controllers/category.controller');
const {restrict} = require('../../middlewares/authentication.middleware');
const router = require('express').Router();

router.post('/categories',restrict,createCategory);
router.get('/categories',getAllCategory);
router.put('/categories/:id',restrict,updateCategory);
router.delete('/categories/:id',restrict,deleteCategory);

module.exports = router;