# Banking / Wallet System Architecture

This project is a **Secure Digital Banking & Transaction Ledger System** built with:

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT

It follows a layered backend architecture with:

* Authentication System
* Account Management
* Transaction Processing
* Immutable Ledger System
* Security & PIN Verification
* Email Notification System

---

# 1. High Level Architecture

```text
                ┌─────────────────────┐
                │     Client App      │
                │ React / Mobile App  │
                └─────────┬───────────┘
                          │ HTTP API
                          ▼
                ┌──────────────────────┐
                │    Express Server    │
                │  Routes + Middleware │
                └─────────┬────────────┘
                          │
          ┌───────────────┼────────────────┐
          ▼               ▼                ▼
 ┌────────────────┐ ┌──────────────┐ ┌───────────────┐
 │ Auth Controller│ │ Account Ctrl │ │TransactionCtrl│
 └────────┬───────┘ └──────┬───────┘ └──────┬────────┘
          │                │                │
          ▼                ▼                ▼
 ┌──────────────────────────────────────────────────┐
 │                Business Logic Layer              │
 │ JWT • PIN Security • Validation • Ledger Logic   │
 └──────────────────────────────────────────────────┘
                          │
                          ▼
 ┌──────────────────────────────────────────────────┐
 │                 MongoDB Database                 │
 │ Users • Accounts • Transactions • Ledger • JWT   │
 └──────────────────────────────────────────────────┘
```

---

# 2. Folder Structure Architecture

```text
project/
│
├── controllers/
│   ├── auth.controller.js
│   ├── account.controller.js
│   └── transaction.controller.js
│
├── models/
│   ├── user.model.js
│   ├── account.model.js
│   ├── transaction.model.js
│   ├── ledger.model.js
│   └── blackList.model.js
│
├── routes/
│   ├── auth.routes.js
│   ├── account.routes.js
│   └── transaction.routes.js
│
├── middleware/
│   └── auth.middleware.js
│
├── services/
│   └── email.service.js
│
├── config/
│    └── db.js
├── app.js
├── server.js
└── .env
```

---

# 3. Core Modules

# A. Authentication Module

Handles:

* User Registration
* Login
* Logout
* JWT Authentication
* Token Blacklisting

## Flow

```text
Register/Login
      │
      ▼
Generate JWT Token
      │
      ▼
Store Token in Cookie
      │
      ▼
Protected Routes
      │
      ▼
Auth Middleware verifies JWT
```

## Security Features

### Password Hashing

Uses:

* bcryptjs

```js
bcrypt.hash(password, 10)
```

### JWT Authentication

Uses:

* JWT

```js
jwt.sign({userId}, SECRET)
```

### Token Blacklisting

When user logs out:

* Token stored in blacklist collection
* TTL index auto deletes after 3 days

```text
Logout
  ↓
Blacklist Token
  ↓
Token expires automatically
```

---

# B. Account Module

Each user can create accounts.

## Account Entity

```text
User
 └── Multiple Accounts
```

Each account contains:

* Status
* Currency
* PIN
* Last Transaction Time

---

## Account Security

### PIN Protection

Features:

* 4-digit PIN
* PIN hashing
* Lock after 5 failed attempts
* Auto unlock after 10 minutes

```text
Wrong PIN → Failed Attempts++
        ↓
5 Attempts Reached
        ↓
Account Locked
        ↓
Unlock After 10 mins
```

---

# C. Transaction System

This is the most important module.

## Transaction Flow

```text
Sender Account
      │
      ▼
Check Balance
      │
      ▼
Create Transaction (PENDING)
      │
      ▼
Create DEBIT Ledger
      │
      ▼
Create CREDIT Ledger
      │
      ▼
Mark Transaction COMPLETED
```

---

# 4. Ledger-Based Banking Architecture

This project uses:

# Double Entry Ledger System

Very similar to real banking systems.

Each transaction creates:

| Entry Type | Account  |
| ---------- | -------- |
| DEBIT      | Sender   |
| CREDIT     | Receiver |

---

## Example

Suppose:

```text
A sends ₹500 to B
```

Ledger entries:

| Account | Type   | Amount |
| ------- | ------ | ------ |
| A       | DEBIT  | 500    |
| B       | CREDIT | 500    |

Balance is calculated dynamically:

```text
Balance = Total Credits - Total Debits
```

---

# 5. Database Architecture

## Collections

```text
users
accounts
transactions
ledgers
tokenblacklists
```

---

# Entity Relationship Diagram (ERD)

```text
User
 └── Account
       ├── Ledger
       └── Transaction

Transaction
 ├── fromAccount
 └── toAccount
```

---

# 6. Transaction Atomicity

Uses:

* MongoDB Transactions
* Mongoose Sessions

```js
const session = await mongoose.startSession();
session.startTransaction();
```

Ensures:

* No partial transaction
* No inconsistent balance
* Debit & Credit happen together

---

# 7. Idempotency Architecture

Very advanced backend concept.

## Problem

User clicks payment button twice.

Without idempotency:

* Money deducted twice.

## Solution

Each request contains:

```text
idempotencyKey
```

System checks:

```text
If key exists:
   return existing transaction
Else:
   create new transaction
```

Prevents:

* Duplicate payments
* Retry issues
* Network resend problems

---

# 8. Immutable Ledger Design

Ledger entries cannot be:

* Updated
* Deleted
* Replaced

This is extremely important in finance systems.

```js
ledgerSchema.pre("updateOne", preventLedgerModification)
```

Benefits:

* Audit safety
* Fraud prevention
* Financial traceability

---

# 9. Middleware Architecture

## Authentication Middleware

```text
Request
   ↓
Verify JWT
   ↓
Load User
   ↓
Attach req.user
   ↓
Next()
```

---

## Admin Middleware

Used for:

* Initial balance transactions
* System operations

---

# 10. Email Notification Architecture

Uses:

* Email Service Layer

Example:

* Registration Email
* Transaction Email

```text
Controller
   ↓
Email Service
   ↓
SMTP Provider
```

---

# 11. API Architecture

# Auth APIs

| Method | Route              | Purpose  |
| ------ | ------------------ | -------- |
| POST   | /api/auth/register | Register |
| POST   | /api/auth/login    | Login    |
| POST   | /api/auth/logout   | Logout   |

---

# Account APIs

| Method | Route                     |
| ------ | ------------------------- |
| POST   | /api/accounts             |
| GET    | /api/accounts             |
| GET    | /api/accounts/balance/:id |
| POST   | /api/accounts/set-pin     |
| POST   | /api/accounts/verify-pin  |

---

# Transaction APIs

| Method | Route                                    |
| ------ | ---------------------------------------- |
| POST   | /api/transactions                        |
| POST   | /api/transactions/system/initial-balance |

---

# 12. Security Architecture

## Implemented Security

✅ Password Hashing
✅ PIN Hashing
✅ JWT Auth
✅ Token Blacklisting
✅ Immutable Ledger
✅ Transaction Atomicity
✅ Idempotency Protection
✅ Account Locking
✅ Partial Indexing
✅ Hidden Sensitive Fields

---

# 13. Performance Optimizations

## Indexes Used

```js
accountSchema.index({ user: 1, status: 1 })
```

```js
transaction.idempotencyKey
```

```js
ledger.account
```

Benefits:

* Faster queries
* Faster balance calculation
* Faster transaction lookup

---

# 14. Recommended Production Architecture

```text
                    Load Balancer
                          │
          ┌───────────────┼───────────────┐
          ▼                               ▼
   Express Server 1                Express Server 2
          │                               │
          └───────────────┬───────────────┘
                          ▼
                     Redis Cache
                          │
                          ▼
                    MongoDB Cluster
                          │
                          ▼
                    Background Workers
                     (Emails/Jobs)
```

---

# 15. Advanced Improvements we Can Add

## Recommended Features

### Banking Features

* UPI Support
* Scheduled Payments
* Beneficiary System
* Transaction History
* Mini Statement
* Account Freeze

---

### Security Features

* OTP Verification
* Device Tracking
* Refresh Tokens
* Rate Limiting
* Fraud Detection
* IP Blocking

---

### Scalability Features

* Redis Caching
* Queue System (BullMQ)
* Event Driven Architecture
* Kafka/RabbitMQ
* Microservices

---

# 16. Best Part of Our Architecture

Our strongest architectural decisions are:

✅ Immutable Ledger
✅ Double Entry Accounting
✅ MongoDB Transactions
✅ Idempotency Key Handling
✅ PIN Locking System
✅ JWT Blacklisting
✅ Dynamic Balance Calculation

These are concepts used in real fintech/backend systems.

---

This is a strong backend project for:

* Backend Developer roles
* Fintech Companies
* System Design Interviews
* Banking Software Engineering roles

# Postman Testing Data for Banking Ledger API

## Base URL

```text
http://localhost:3000/api
```

---

# 1. AUTH ROUTES

# Register User

## POST `/auth/register`

```json
{
  "email": "nayan@example.com",
  "name": "Nayan Das",
  "password": "123456"
}
```

---

# Login User

## POST `/auth/login`

```json
{
  "email": "nayan@example.com",
  "password": "123456"
}
```

### Expected Response

```json
{
  "success": true,
  "message": "User login successfully",
  "user": {
    "_id": "6640d1f1234567890abc111",
    "email": "nayan@example.com",
    "name": "Nayan Das"
  },
  "token": "JWT_TOKEN"
}
```

Save:

* token
* userId

---

# Logout User

## POST `/auth/logout`

### Headers

```text
Authorization: Bearer JWT_TOKEN
```

---

# 2. ACCOUNT ROUTES

# Create Account

## POST `/accounts`

### Headers

```text
Authorization: Bearer JWT_TOKEN
```

### Body

```json
{}
```

### Expected Response

```json
{
  "success": true,
  "message": "Account created successfully",
  "account": {
    "_id": "6640d1f1234567890acc001",
    "user": "6640d1f1234567890abc111",
    "status": "ACTIVE",
    "currency": "INR"
  }
}
```

Save:

* accountId

---

# Get User Accounts

## GET `/accounts`

### Headers

```text
Authorization: Bearer JWT_TOKEN
```

---

# Get Account Balance

## GET `/accounts/balance/:accountId`

Example:

```text
/accounts/balance/6640d1f1234567890acc001
```

### Headers

```text
Authorization: Bearer JWT_TOKEN
```

---

# Set Account PIN

## POST `/accounts/set-pin`

### Headers

```text
Authorization: Bearer JWT_TOKEN
```

### Body

```json
{
  "accountId": "6640d1f1234567890acc001",
  "pin": "1234"
}
```

---

# Verify Account PIN

## POST `/accounts/verify-pin`

### Headers

```text
Authorization: Bearer JWT_TOKEN
```

### Body

```json
{
  "accountId": "6640d1f1234567890acc001",
  "pin": "1234"
}
```

---

# 3. TRANSACTION ROUTES

Before transaction:

* Create TWO users
* Create TWO accounts

Example:

| User  | Account |
| ----- | ------- |
| Nayan | acc001  |
| Rahul | acc002  |

---

# Add Initial Balance (Admin/System)

## POST `/transactions/system/initial-balance`

### Headers

```text
Authorization: Bearer ADMIN_JWT_TOKEN
```

### Body

```json
{
  "accountId": "6640d1f1234567890acc001",
  "amount": 10000,
  "idempotencyKey": "init-balance-001"
}
```

---

# Create Transaction

## POST `/transactions`

### Headers

```text
Authorization: Bearer JWT_TOKEN
```

### Body

```json
{
  "fromAccount": "6640d1f1234567890acc001",
  "toAccount": "6640d1f1234567890acc002",
  "amount": 500,
  "idempotencyKey": "txn-001"
}
```

---

# 4. FULL TEST FLOW (Recommended)

# STEP 1 → Register User A

```json
{
  "email": "usera@gmail.com",
  "name": "User A",
  "password": "123456"
}
```

---

# STEP 2 → Login User A

```json
{
  "email": "usera@gmail.com",
  "password": "123456"
}
```

Copy JWT Token.

---

# STEP 3 → Create Account for User A

Save:

* accountA

---

# STEP 4 → Set PIN

```json
{
  "accountId": "ACCOUNT_A",
  "pin": "1234"
}
```

---

# STEP 5 → Register User B

```json
{
  "email": "userb@gmail.com",
  "name": "User B",
  "password": "123456"
}
```

---

# STEP 6 → Login User B

Copy token.

---

# STEP 7 → Create Account for User B

Save:

* accountB

---

# STEP 8 → Add Initial Balance to User A

```json
{
  "accountId": "ACCOUNT_A",
  "amount": 5000,
  "idempotencyKey": "initial-balance-user-a"
}
```

---

# STEP 9 → Check Balance

```text
GET /accounts/balance/ACCOUNT_A
```

Expected:

```json
{
  "balance": 5000
}
```

---

# STEP 10 → Transfer Money

```json
{
  "fromAccount": "ACCOUNT_A",
  "toAccount": "ACCOUNT_B",
  "amount": 1000,
  "idempotencyKey": "transfer-1000-001"
}
```

---

# STEP 11 → Verify Balances

## User A

Expected:

* 4000

## User B

Expected:

* 1000

---

# 5. Duplicate Transaction Test (Idempotency)

Send SAME request again:

```json
{
  "fromAccount": "ACCOUNT_A",
  "toAccount": "ACCOUNT_B",
  "amount": 1000,
  "idempotencyKey": "transfer-1000-001"
}
```

Expected:

* No duplicate debit
* Existing transaction returned

---

# 6. PIN Lock Test

Send wrong PIN 5 times:

```json
{
  "accountId": "ACCOUNT_A",
  "pin": "9999"
}
```

Expected:

```json
{
  "success": false,
  "message": "Account is locked due to multiple failed attempts"
}
```

---

# 7. Suggested Postman Environment Variables

Create environment variables:

| Variable | Value                                                  |
| -------- | ------------------------------------------------------ |
| baseUrl  | [http://localhost:3000/api](http://localhost:3000/api) |
| tokenA   | JWT_TOKEN                                              |
| tokenB   | JWT_TOKEN                                              |
| accountA | ACCOUNT_ID                                             |
| accountB | ACCOUNT_ID                                             |

---

# 8. Authorization Header Format

For all protected routes:

```text
Authorization: Bearer YOUR_JWT_TOKEN
```

---

# 9. Recommended Additional Testing

## Negative Tests

### Invalid Login

```json
{
  "email": "wrong@gmail.com",
  "password": "wrongpass"
}
```

---

### Insufficient Balance

```json
{
  "fromAccount": "ACCOUNT_A",
  "toAccount": "ACCOUNT_B",
  "amount": 999999,
  "idempotencyKey": "huge-transfer"
}
```

---

### Invalid PIN Format

```json
{
  "accountId": "ACCOUNT_A",
  "pin": "12"
}
```

---

### Duplicate Email Registration

```json
{
  "email": "usera@gmail.com",
  "name": "Duplicate",
  "password": "123456"
}
```

---

# 10. Recommended Postman Collection Structure

```text
Auth
 ├── Register
 ├── Login
 └── Logout

Accounts
 ├── Create Account
 ├── Get Accounts
 ├── Get Balance
 ├── Set PIN
 └── Verify PIN

Transactions
 ├── Initial Balance
 └── Transfer Money
```

