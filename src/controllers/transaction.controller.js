const transactionModel = require("../models/transaction.model");
const ledgerModel = require("../models/ledger.model");
const accountModel = require("../models/account.model");
const emailService = require("../services/email.service");
const mongoose = require("mongoose");
const crypto = require("crypto");


// async function createTransaction(req, res) {
//     const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

//     // validate fields
//     if (!fromAccount || !toAccount || amount == null || !idempotencyKey){
//         return res.status(400).json({
//             success: false,
//             message: "Some importent key not found",
//         });
//     }

//     // check idempotencyKey, if not provided generate random one
//     //const idempotencyKey = crypto.randomUUID();


//     // verify fromAccount, toAccount
//     const fromUserAccount = await accountModel.findOne({ _id: fromAccount });
//     const toUserAccount = await accountModel.findOne({ _id: toAccount });

//     if (!fromUserAccount || !toUserAccount) {
//         return res.status(400).json({
//             success: false,
//             message: "Invalid Account is provided.",
//         });
//     }

//     // validate idempotencyKey
//     const is_Transaction_Already_Exists = await transactionModel.findOne({
//         idempotencyKey: idempotencyKey,
//     });

//     if (is_Transaction_Already_Exists) {
//         if (is_Transaction_Already_Exists.status === "COMPLETED") {
//             return res.status(200).json({
//                 success: true,
//                 message: "Transaction is completed successfully.",
//                 transaction: is_Transaction_Already_Exists,
//             });
//         }
//         if (is_Transaction_Already_Exists.status === "PENDING") {
//             return res.status(102).json({
//                 success: false,
//                 message: "Transaction is in pending state.",
//             });
//         }

//         if (is_Transaction_Already_Exists.status === "FAILED") {
//             return res.status(409).json({
//                 success: false,
//                 message: "Transaction is failed.",
//             });
//         }

//         if (is_Transaction_Already_Exists.status === "REVERSED") {
//             return res.status(500).json({
//                 success: false,
//                 message: "Transaction is reversed. Pleased try again.",
//             });
//         }
//     }

//     // check both accounts is active or not
//     if (
//         fromUserAccount.status !== "ACTIVE" ||
//         toUserAccount.status !== "ACTIVE"
//     ) {
//         return res.status(400).json({
//             success: false,
//             message: "Both account must be active.",
//         });
//     }

//     // Determine sender balance
//     const balance = await fromUserAccount.getBalance();

//     if (balance < amount) {
//         return res.status(400).json({
//             success: false,
//             message: `Insufficient balance in sender account. Current balance: ${balance}. transfer amount: ${amount}`,
//         });
//     }


//          // create transaction
//     const session = await mongoose.startSession();
//     session.startTransaction(); // Ensure Atomicity & Prevent inconsistency

//     const [transaction] = await transactionModel.create(
//         [
//         {
//             fromAccount,
//             toAccount,
//             amount,
//             idempotencyKey,
//             status: "PENDING",
//         }
//         ],
//         { session }
//     );

//     await ledgerModel.create(
//         [{
//             account: fromAccount,
//             amount: amount,
//             transaction: transaction._id,
//             type: "DEBIT",
//         }],
//         { session }
//     );

//     await (()=>{
//         return new Promise((resolve)=>setTimeout(resolve, 30*1000))
//     })();

//     await ledgerModel.create(
//         [{
//             account: toAccount,
//             amount: amount,
//             transaction: transaction._id,
//             type: "CREDIT",
//         }],
//         { session }
//     );

//     transaction.status = "COMPLETED";
//     await transaction.save({ session });
//     // await transactionModel.findOneAndUpdate(
//     //     {_id: transaction._id},
//     //     {status: "COMPLETED"},
//     //     {session}
//     //     );


//     await session.commitTransaction();
//     session.endSession();



//     // send email
//     await emailService.sendTransactionEmail(
//         req.user.email,
//         req.user.name,
//         amount,
//         toAccount
//     );

//     return res.status(201).json({
//         success: true,
//         message: "Transaction completed successfully",
//         transaction,
//     });
// }

async function createTransaction(req, res) {
    const { fromAccount, toAccount, amount, idempotencyKey } = req.body;

    if (!fromAccount || !toAccount || amount == null || !idempotencyKey) {
        return res.status(400).json({ success: false, message: "Missing fields" });
    }

    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0) {
        return res.status(400).json({ success: false, message: "Invalid amount" });
    }

    const existingTx = await transactionModel.findOne({ idempotencyKey });
    if (existingTx) {
        return res.status(200).json({ success: true, transaction: existingTx });
    }

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        const fromUserAccount = await accountModel.findById(fromAccount)
                                                .select("+pinLockedUntil")
                                                .session(session);
        //console.log(fromUserAccount);
        const toUserAccount = await accountModel.findById(toAccount).session(session);

        if (!fromUserAccount || !toUserAccount) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: "Invalid accounts" });
        }

        // Check User own account is pin locked or not
        if (
            fromUserAccount.pinLockedUntil &&
            fromUserAccount.pinLockedUntil > new Date()
        ) {
            await session.abortTransaction();
        
            return res.status(403).json({
                success: false,
                message: "Account is temporarily locked for outgoing transactions",
            });
        }
        // TODO: check ownership: fromUserAccount.user == req.user._id
        if (
            fromUserAccount.user.toString() !== req.user._id.toString()
        ) {
            await session.abortTransaction();
        
            return res.status(403).json({
                success: false,
                message: "Unauthorized account access",
            });
        }
        // balance check MUST be safe (depends on your getBalance)
        const balance = await fromUserAccount.getBalance({ session });
        if (balance < amt) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: "Insufficient balance" });
        }

        const [transaction] = await transactionModel.create(
            [{ fromAccount, toAccount, amount: amt, idempotencyKey, status: "PENDING" }],
            { session }
        );

        await ledgerModel.create(
            [{ account: fromAccount, amount: amt, transaction: transaction._id, type: "DEBIT" }],
            { session }
        );

        await ledgerModel.create(
            [{ account: toAccount, amount: amt, transaction: transaction._id, type: "CREDIT" }],
            { session }
        );

        transaction.status = "COMPLETED";
        await transaction.save({ session });

        await accountModel.updateMany(
            { _id: { $in: [fromAccount, toAccount] } },
            { $set: { lastTransactionAt: new Date(), status: "ACTIVE" } },
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        // email should not break API
        emailService.sendTransactionEmail(req.user.email, req.user.name, amt, toAccount).catch(console.error);

        return res.status(201).json({
            success: true,
            message: "Transaction completed successfully",
            transaction,
        });
    } catch (err) {
        await session.abortTransaction();
        session.endSession();

        return res.status(500).json({
            success: false,
            message: "Transaction failed",
            error: err.message,
        });
    }
}


async function createInitialBalanceTransaction(req, res) {
    const { accountId, amount, idempotencyKey } = req.body;

    if (!accountId || amount == null || !idempotencyKey) {
        return res.status(400).json({
            success: false,
            message: "Some important key not found",
        });
    }

    const userAccount = await accountModel.findOne({ _id: accountId });
    if (!userAccount) {
        return res.status(400).json({
            success: false,
            message: "Invalid Account is provided.",
        });
    }

    const fromUserAccount = await accountModel.findOne({
        user: req.user._id.toString(),
    });
    console.log("From User Account:", fromUserAccount);
    // console.log(fromUserAccount);

    if (!fromUserAccount) {
        return res.status(400).json({
            success: false,
            message: "System account not found for the user.",
        });
    }

    // ✅ FIXED: await
    const existingTx = await transactionModel.findOne({ idempotencyKey });

    if (existingTx) {
        if (existingTx.status === "COMPLETED") {
            return res.status(200).json({
                success: true,
                message: "Transaction is completed successfully.",
                transaction: existingTx,
            });
        }

        if (existingTx.status === "PENDING") {
            return res.status(102).json({
                success: false,
                message: "Transaction is in pending state.",
            });
        }

        if (existingTx.status === "FAILED") {
            return res.status(409).json({
                success: false,
                message: "Transaction is failed.",
            });
        }

        if (existingTx.status === "REVERSED") {
            return res.status(500).json({
                success: false,
                message: "Transaction is reversed. Please try again.",
            });
        }
    }

    const session = await mongoose.startSession();

    try {
        session.startTransaction();

        // ✅ FIXED: create with session needs array
        const [transaction] = await transactionModel.create(
            [
                {
                    fromAccount: fromUserAccount._id,
                    toAccount: accountId,
                    amount,
                    idempotencyKey,
                    status: "PENDING",
                },
            ],
            { session }
        );
        console.log([transaction]);

        await ledgerModel.create(
            [
                {
                    account: fromUserAccount._id,
                    amount,
                    transaction: transaction._id,
                    type: "DEBIT",
                },
            ],
            { session }
        );

        await ledgerModel.create(
            [
                {
                    account: accountId,
                    amount,
                    transaction: transaction._id,
                    type: "CREDIT", // ✅ fixed spelling
                },
            ],
            { session }
        );

        transaction.status = "COMPLETED";
        await transaction.save({ session });

        await accountModel.updateMany(
            { _id: { $in: [fromUserAccount, accountId] } },
            { $set: { lastTransactionAt: new Date(), status: "ACTIVE" } },
            { session }
          );

        await session.commitTransaction();

        return res.status(201).json({
            success: true,
            message: "Initial balance added successfully",
            transaction,
        });
    } catch (err) {
        await session.abortTransaction();

        return res.status(500).json({
            success: false,
            message: "Transaction failed",
            error: err.message,
        });
    } finally {
        session.endSession();
    }
}

module.exports = { createTransaction, createInitialBalanceTransaction };
