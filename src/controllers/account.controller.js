const accountModel = require("../models/account.model")
const bcrypt = require("bcryptjs");

// Create a new account for the authenticated user
async function createAccount(req, res) {
    const userId = req.user._id; //from token

    const newAccount = await accountModel.create({
        user: userId
    });


    return res.status(201).json({
        success: true,
        message: "Account created successfully",
        account: newAccount
    });

}

// Get user account
async function getUserAccounts(req, res) {
    const userId = req.user._id; //from token

    const accounts = await accountModel.find({ user: userId });
    if (accounts.length === 0) {
        return res.status(404).json({
            success: false,
            message: "No accounts found for the user"
        });
    }

    return res.status(200).json({
        success: true,
        message: "Accounts retrieved successfully",
        accounts
    });
}

// Get account balance
async function getAccountBalance(req, res) {
    const { accountId } = req.params;

    const account = await accountModel.findOne({
        _id: accountId,
        user: req.user._id.toString()
    });

    if (!account) {
        return res.status(404).json({
            success: false,
            message: "Account is not found"
        })
    }

    const balance = await account.getBalance();
    return res.status(200).json({
        accountId: account._id,
        balance: balance
    })
}


// set PIN for account
async function setAccountPIN(req, res) {
    try {
        userId = req.user._id; //from token

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });
        }

        const { accountId, pin } = req.body;

        // basic validation
        if (!accountId || pin == null) {
            return res.status(400).json({
                success: false,
                message: "accountId and pin are required",
            });
        }

        // pin validation (4 digit recommended)
        const pinStr = String(pin);

        if (!/^\d{4}$/.test(pinStr)) {
            return res.status(400).json({
                success: false,
                message: "PIN must be exactly 4 digits",
            });
        }

        // find account that belongs to logged-in user
        const account = await accountModel
            .findOne({ _id: accountId, user: userId })
            .select("+pinHash +pinSet");

        if (!account) {
            return res.status(404).json({
                success: false,
                message: "Account not found",
            });
        }

        // if already set, don't allow again (use change PIN route instead)
        if (account.pinSet) {
            return res.status(409).json({
                success: false,
                message: "PIN already set. Use change PIN option.",
            });
        }

        // hash pin
        const pinHash = await bcrypt.hash(pinStr, 10);

        // save pin
        account.pinHash = pinHash;
        account.pinSet = true;
        account.pinFailedAttempts = 0;
        account.pinLockedUntil = null;

        await account.save();

        return res.status(200).json({
            success: true,
            message: "PIN set successfully",
        });
    } catch (err) {
        console.error("setAccountPIN error:", err);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: err.message,
        });
    }
}


// verify PIN
async function verifyAccountPIN(req, res) {
    const userId = req.user._id; //from token

    if (!userId) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
        });
    }
    const { accountId, pin } = req.body;

    // basic validation
    if (!accountId || pin == null) {
        return res.status(400).json({
            success: false,
            message: "accountId and pin are required"
        });
    }

    const account = await accountModel
        .findOne({ _id: accountId, user: userId })
        .select("+pinHash +pinSet +pinFailedAttempts +pinLockedUntil");

    console.log("Account for PIN verification:", account);

    if (!account) {
        return res.status(404).json({
            success: false,
            message: "Account not found",
        });
    }

    if (!account.pinSet) {
        return res.status(400).json({
            success: false,
            message: "PIN not set for this account",
        });
    }

    // ✅ if locked, check lock expiry
    if (account.pinLockedUntil && account.pinLockedUntil > new Date()) {
        const secondsLeft = Math.ceil((account.pinLockedUntil - new Date()) / 1000);
        return res.status(403).json({
            success: false,
            message: `Account is locked due to multiple failed attempts. Try again in ${secondsLeft} seconds.`
        });
    }

    // ✅ if lock expired, reset automatically
    if (account.pinLockedUntil && account.pinLockedUntil <= new Date()) {
        account.pinLockedUntil = null;
        account.pinFailedAttempts = 0;
        await account.save();
    }

    const isMatch = await bcrypt.compare(pin, account.pinHash);
   
    // ❌ wrong pin
    if (!isMatch) {
        account.pinFailedAttempts += 1;

        // lock after 5 wrong attempts
        if (account.pinFailedAttempts >= 5) {
            account.pinLockedUntil = new Date(Date.now() + 10 * 60 * 1000); // 10 min
            account.pinFailedAttempts = 0; // reset after locking
        }

        await account.save();

        return res.status(401).json({
            success: false,
            message: "Invalid PIN",
        });
    }

    // ✅ correct pin
    account.pinFailedAttempts = 0;
    account.pinLockedUntil = null;
    await account.save();

    return res.status(200).json({
        success: true,
        message: "PIN verified successfully",
    });
}


module.exports = { createAccount, getUserAccounts, getAccountBalance, setAccountPIN, verifyAccountPIN }