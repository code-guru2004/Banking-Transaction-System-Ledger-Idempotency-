const express = require("express");
const authMiddlewares = require("../middleware/auth.middleware");

const { createAccount, getUserAccounts, getAccountBalance, setAccountPIN, verifyAccountPIN } = require("../controllers/account.controller");


const router = express.Router();

// create account
router.post("/", authMiddlewares.authMiddleware, createAccount);

// get Accounts of user
router.get("/", authMiddlewares.authMiddleware, getUserAccounts);

// get balance of account
router.get("/balance/:accountId", authMiddlewares.authMiddleware, getAccountBalance);

// set account PIN
router.post("/set-pin", authMiddlewares.authMiddleware, setAccountPIN);

// verify account PIN
router.post("/verify-pin", authMiddlewares.authMiddleware, verifyAccountPIN);
module.exports = router;