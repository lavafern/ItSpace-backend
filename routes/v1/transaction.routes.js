const {createTransaction,getAllTransaction,payTransaction,deleteTransaction, getTransactionDetail} = require('../../controllers/transaction.controller')
const {restrict} = require("../../middlewares/auth.middleware")
const router = require('express').Router()

router.post('/transactions',restrict,createTransaction)
router.get('/transactions',restrict,getAllTransaction)
router.get('/transactions/:id',restrict,getTransactionDetail)
router.put('/transactions/:id',restrict,payTransaction)
router.delete('/transactions/:id',restrict,deleteTransaction)

module.exports = router