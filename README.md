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

# 15. Advanced Improvements You Can Add

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

# 16. Best Part of Your Architecture

Your strongest architectural decisions are:

✅ Immutable Ledger
✅ Double Entry Accounting
✅ MongoDB Transactions
✅ Idempotency Key Handling
✅ PIN Locking System
✅ JWT Blacklisting
✅ Dynamic Balance Calculation

These are concepts used in real fintech/backend systems.

---

# 17. Suggested Architecture Name

You can present this project as:

> “Secure Ledger-Based Banking Transaction System”

or

> “Fintech Wallet & Double Entry Ledger Backend”

or

> “Banking Core System using Node.js & MongoDB”

This is a strong backend project for:

* Backend Developer roles
* Fintech Companies
* System Design Interviews
* Banking Software Engineering roles
