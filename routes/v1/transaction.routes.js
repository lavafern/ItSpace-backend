const {createTransaction,getAllTransaction} = require('../../controllers/transaction.controller')
const {restrict} = require("../../middlewares/auth.middleware")
const router = require('express').Router()

router.post('/transactions',createTransaction)
router.get('/transactions',getAllTransaction)

module.exports = router