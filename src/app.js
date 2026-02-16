const express = require('express');
const authRoutes = require('./routes/auth.routes');
const accountRoutes = require("./routes/account.route");
const transactionRoutes = require("./routes/transaction.route");
const cookieparser = require("cookie-parser")

const app = express();


app.use(express.json()); // Middleware to parse JSON request bodies
app.use(cookieparser());

app.use('/api/auth', authRoutes); // Mount auth routes at /api/auth
app.use("/api/accounts",accountRoutes);
app.use("/api/transactions",transactionRoutes)


app.get("/test",(req,res)=>{
    return res.json({
        message:"okey"
    })
})

module.exports = app;