const {createCategory,getAllCategory} = require('../../controllers/category.controller')
const router = require('express').Router()

router.post('/categories',createCategory)
router.get('/categories',getAllCategory)

module.exports = router