const accountModel = require("../models/account.model")

// Create a new account for the authenticated user
async function createAccount(req,res){
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
async function getUserAccounts(req,res){
    const userId = req.user._id; //from token

    const accounts = await accountModel.find({user: userId});
    if(accounts.length===0){
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
async function getAccountBalance(req,res){
    const {accountId} = req.params;

    const account = await accountModel.findOne({
        _id: accountId,
        user: req.user._id.toString()
    });

    if(!account){
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
module.exports = { createAccount, getUserAccounts, getAccountBalance }