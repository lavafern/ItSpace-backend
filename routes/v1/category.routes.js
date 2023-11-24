const {createCategory,getAllCategory,deleteCategory,updateCategory} = require('../../controllers/category.controller')
const router = require('express').Router()

router.post('/categories',createCategory)
router.get('/categories',getAllCategory)
router.put('/categories/:id',updateCategory)
router.delete('/categories/:id',deleteCategory)

module.exports = router