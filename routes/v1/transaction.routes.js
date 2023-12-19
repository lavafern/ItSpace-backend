const {createTransaction,getAllTransaction,payTransaction,deleteTransaction, getTransactionDetail, myTransactions} = require('../../controllers/transaction.controller')
const {restrict} = require("../../middlewares/authentication.middleware")
const router = require('express').Router()

router.post('/transactions',restrict,createTransaction)
router.get('/transactions',restrict,getAllTransaction)
router.get('/transactions/:id',restrict,getTransactionDetail)
router.put('/transactions/:id',restrict,payTransaction)
router.delete('/transactions/:id',restrict,deleteTransaction)
router.get('/my-transactions',restrict,myTransactions)

module.exports = router