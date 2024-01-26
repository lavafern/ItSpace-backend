const {createTransaction,getAllTransaction,payTransaction,deleteTransaction, getTransactionDetail, myTransactions,totalIncome} = require('../../controllers/transaction.controller');
const {restrict} = require('../../middlewares/authentication.middleware');
const { adminAccess } = require('../../middlewares/authorization.middleware');
const router = require('express').Router();

router.post('/transactions',restrict,createTransaction);
router.get('/transactions',restrict,adminAccess,getAllTransaction);
router.get('/transactions/:id',restrict,getTransactionDetail);
router.put('/transactions/:id',restrict,payTransaction);
router.delete('/transactions/:id',restrict,deleteTransaction);
router.get('/my-transactions',restrict,myTransactions);
router.get('/total-income',totalIncome);
module.exports = router;