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
    pinHash: { 
        type: String, 
        select: false , 
        default: null,
        required: function() {
            return this.pinSet; // pinHash is required if pinSet is true
        }
    },
    pinSet: { 
        type: Boolean, 
        default: false,
        select: false,
    },
    pinFailedAttempts: { 
        type: Number, 
        default: 0,
        select: false,
    },
    pinLockedUntil: { 
        type: Date, 
        default: null,
        select: false,
    },
    lastTransactionAt: {
        type: Date,
        default: Date.now,
        index: true
      }
      
},{
    timestamps: true
});

accountSchema.index(
    { user: 1, status: 1 },
    { unique: true, partialFilterExpression: { status: "ACTIVE" } }
  );
   // combined index on user and status for efficient queries

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
//             | Type   | Meaning                        |
//             | ------ | ------------------------------ |
//             | DEBIT  | Money goes OUT from an account |
//             | CREDIT | Money comes INTO an account    |

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