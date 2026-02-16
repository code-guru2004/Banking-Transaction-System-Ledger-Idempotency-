const mongoose = require("mongoose");


const ledgerSchema = new mongoose.Schema({
    account: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Account",
        required: [true, "Account is requied"],
        index: true,
        immutable: true
    },
    amount: {
        type: Number,
        required: [true, "Some amount of money must be sent."],
        min: [1,"Transaction amount cannot be 0"],
        immutable: true
    },
    transaction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Transaction",
        required: [true, "Ledger must be associated with a transaction."],
        index: true,
        immutable: true
    },
    type: {
        type: String,
        enum: {
            values: ["CREDIT","DEBIT"],
            message: "Type can be either CREDIT or DEBIT."
        },
        required: [true, "Ledger type is required."],
        immutable: true
    }
});

function preventLedgerModification(){
    throw new Error("Ledger entries are immutable and cannot be modified or deleted.");
}

// prevent any modification because ledger is not mutable
ledgerSchema.pre("findOneAndUpdate",preventLedgerModification);
ledgerSchema.pre("findOneAndDelete",preventLedgerModification);
ledgerSchema.pre("deleteMany",preventLedgerModification);
ledgerSchema.pre("deleteOne",preventLedgerModification);
ledgerSchema.pre("updateMany",preventLedgerModification);
ledgerSchema.pre("updateOne",preventLedgerModification);
ledgerSchema.pre("replaceOne",preventLedgerModification);
ledgerSchema.pre("findOneAndReplace",preventLedgerModification);

const ledgerModel = mongoose.model("Ledger",ledgerSchema);

module.exports = ledgerModel;