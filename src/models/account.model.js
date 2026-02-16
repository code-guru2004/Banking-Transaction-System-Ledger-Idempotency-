const mongoose = require("mongoose");
const ledgerModel = require("./ledger.model");


const accountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "User ID is required"],
        index: true
    },
    status: {
        type: String,
        enum: ["ACTIVE", "INACTIVE", "CLOSED"],
        default: "ACTIVE"
    },
    currency: {
        type: String,
        required: [true, "Currency is required"],
        default: "INR",
        uppercase: true,
        trim: true
    },
},{
    timestamps: true
});

accountSchema.index({user: 1, status: 1}) // combined index on user and status for efficient queries

accountSchema.methods.getBalance = async function () {
    const balanceData = await ledgerModel.aggregate([
       { $match : { account: this._id } },
       {
        $group: {
            _id: null,
            totalDebit:{
                $sum:{
                    $cond:[
                        {$eq: ["$type", "DEBIT"]},
                        "$amount",
                        0
                    ]
                }
            },
            totalCredit: {
                $sum: {
                    $cond: [
                        {$eq:["$type","CREDIT"]},
                        "$amount",
                        0
                    ]
                }
            }
        }
       },
       {
        $project: {
            _id: 0,
            balance: {$subtract: ["$totalCredit" , "$totalDebit"] }
        }
       }
    ]);
    
    // for new account
    if(balanceData.length===0){
        return 0;
    }

    return balanceData[0].balance;
}
const accountModel = mongoose.model("Account", accountSchema);

module.exports = accountModel;