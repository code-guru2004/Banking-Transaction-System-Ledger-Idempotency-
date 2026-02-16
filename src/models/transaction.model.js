const mongoose = require("mongoose");


const transactionSchema = new mongoose.Schema({
    fromAccount: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Account",
        required: [true, "Transaction must be associated with a from account"],
        index: true
    },
    toAccount:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Account",
        required: [true, "Transaction must be associated with a to account"],
        index: true
    },
    status: {
        type: String,
        enum: {
            values: ["PENDING","COMPLETED","FAILED","REVERSED"],

        },
        default: "PENDING"
    },
    amount: {
        type: Number,
        required: [true, "Some amount of money must be sent."],
        min: [1,"Transaction amount cannot be 0"]
    },
    idempotencyKey: { //Avoid duplicate transaction
        type: String,
        required: [true, "Idempotency Key is required."],
        unique: [true, "Idempotency Key is unique."],
        index: true
    }
},{
    timestamps: true
});

const transactionModel = mongoose.model("Transaction", transactionSchema);

module.exports = transactionModel;