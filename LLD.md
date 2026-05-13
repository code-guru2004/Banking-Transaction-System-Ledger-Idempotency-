# Low Level Architecture (LLD) — Banking Ledger System

Your project follows a layered modular backend architecture.

---

# 1. Complete Low Level Flow

```text id="9d2t6f"
Client Request
      │
      ▼
Express Route
      │
      ▼
Authentication Middleware
      │
      ▼
Controller Layer
      │
      ▼
Business Logic
      │
      ▼
Database Models (Mongoose)
      │
      ▼
MongoDB
```

---

# 2. Route Layer Architecture

# Auth Routes

```text id="v3az0v"
POST /auth/register
POST /auth/login
POST /auth/logout
```

### Route Flow

```text id="qfqrz9"
Request
   ↓
auth.routes.js
   ↓
auth.controller.js
   ↓
user.model.js
```

---

# Account Routes

```text id="2m6vgm"
POST /accounts
GET  /accounts
GET  /accounts/balance/:id
POST /accounts/set-pin
POST /accounts/verify-pin
```

### Flow

```text id="hqk4dx"
Request
   ↓
account.routes.js
   ↓
auth.middleware.js
   ↓
account.controller.js
   ↓
account.model.js
```

---

# Transaction Routes

```text id="gjvkn7"
POST /transactions
POST /transactions/system/initial-balance
```

### Flow

```text id="0v4lmc"
Request
   ↓
transaction.routes.js
   ↓
auth.middleware.js
   ↓
transaction.controller.js
   ↓
transaction.model.js
ledger.model.js
account.model.js
```

---

# 3. Middleware Layer

# Auth Middleware

Purpose:

* Verify JWT
* Load User
* Attach `req.user`

---

## Internal Flow

```text id="7wh0xk"
Authorization Header
        │
        ▼
Extract Token
        │
        ▼
Verify JWT
        │
        ▼
Check Blacklist
        │
        ▼
Load User
        │
        ▼
req.user = user
        │
        ▼
next()
```

---

# Admin Middleware

Purpose:

* Allow only system/admin users

---

## Internal Logic

```text id="lycq0j"
if(user.systemUser !== true)
    reject request
```

---

# 4. Controller Layer

Controllers contain:

* request validation
* orchestration logic
* business workflow

---

# Auth Controller LLD

## Register User

```text id="34qg6u"
Validate Input
      ↓
Check Existing User
      ↓
Hash Password
      ↓
Create User
      ↓
Generate JWT
      ↓
Send Email
      ↓
Return Response
```

---

## Login User

```text id="clszww"
Validate Email
      ↓
Find User
      ↓
Compare Password
      ↓
Generate JWT
      ↓
Set Cookie
      ↓
Return Token
```

---

# Account Controller LLD

# Create Account

```text id="w9i2fj"
Authenticated User
      ↓
Create Account
      ↓
Default Status = ACTIVE
      ↓
Return Account
```

---

# Set PIN

```text id="q0hym0"
Validate PIN
      ↓
Find User Account
      ↓
Check PIN Already Exists
      ↓
Hash PIN
      ↓
Store PIN Hash
      ↓
Return Success
```

---

# Verify PIN

```text id="q2a3wb"
Find Account
      ↓
Check Lock Status
      ↓
Compare PIN
      ↓
Wrong PIN?
   ┌─────┴──────┐
   ▼            ▼
Increment      Success
Attempts         │
   │             ▼
5 Attempts?   Reset Counters
   │
   ▼
Lock Account
```

---

# Transaction Controller LLD

This is the core system.

---

# createTransaction() Flow

```text id="jlwmqk"
Validate Request
      ↓
Check Idempotency Key
      ↓
Start MongoDB Session
      ↓
Load Sender Account
Load Receiver Account
      ↓
Verify Ownership
      ↓
Check Account Lock
      ↓
Check Account Status
      ↓
Check Balance
      ↓
Create Transaction(PENDING)
      ↓
Create DEBIT Ledger
      ↓
Create CREDIT Ledger
      ↓
Update Transaction(COMPLETED)
      ↓
Commit Transaction
      ↓
Send Email
      ↓
Return Response
```

---

# 5. Database Layer Architecture

# User Collection

```js id="16jk4q"
{
  email,
  name,
  password,
  systemUser
}
```

---

# Account Collection

```js id="aq5x0u"
{
  user,
  status,
  currency,
  pinHash,
  pinSet,
  pinFailedAttempts,
  pinLockedUntil,
  lastTransactionAt
}
```

---

# Transaction Collection

```js id="d9m8rz"
{
  fromAccount,
  toAccount,
  amount,
  status,
  idempotencyKey
}
```

---

# Ledger Collection

```js id="ltb25c"
{
  account,
  transaction,
  amount,
  type
}
```

---

# Blacklist Collection

```js id="r9rk7m"
{
  token,
  createdAt
}
```

---

# 6. Model Layer Architecture

# User Model Responsibilities

### Features

* password hashing
* password comparison
* email validation

---

## Internal Hooks

```text id="vjlxhn"
Before Save
     ↓
Hash Password
```

---

# Account Model Responsibilities

### Features

* balance calculation
* account indexing
* pin security

---

## getBalance()

```text id="g5d0sy"
Aggregate Ledger Entries
        ↓
Sum CREDIT
        ↓
Sum DEBIT
        ↓
Balance = CREDIT - DEBIT
```

---

# Ledger Model Responsibilities

### Features

* immutable transaction records

---

## Ledger Protection

```text id="bujesn"
Prevent:
- update
- delete
- replace
```

---

# Transaction Model Responsibilities

### Features

* transaction state tracking
* idempotency protection

---

# 7. Transaction Atomicity Architecture

Uses:

* MongoDB Transactions

---

# Transaction Session Flow

```text id="0n2a5k"
Start Session
      ↓
Start Transaction
      ↓
DB Operations
      ↓
Success?
 ┌────┴─────┐
 ▼          ▼
Commit     Abort
```

---

# 8. Ledger Architecture (Most Important)

# Double Entry Ledger

Every transfer creates:

```text id="7o0fvy"
Sender   → DEBIT
Receiver → CREDIT
```

---

# Example

```text id="i9z5yi"
A sends ₹1000 to B
```

Ledger Entries:

| Account | Type   | Amount |
| ------- | ------ | ------ |
| A       | DEBIT  | 1000   |
| B       | CREDIT | 1000   |

---

# Balance Calculation Architecture

```text id="6wo7mb"
Balance
   =
Total CREDIT
   -
Total DEBIT
```

---

# 9. Security Architecture

# Authentication Security

| Feature      | Purpose               |
| ------------ | --------------------- |
| bcrypt       | Password hashing      |
| JWT          | Stateless auth        |
| Blacklist    | Logout invalidation   |
| select:false | Hide sensitive fields |

---

# PIN Security

```text id="1fzw0m"
Wrong PIN
    ↓
Increment Counter
    ↓
5 Attempts?
    ↓
Lock Account
```

---

# Transaction Security

| Protection           | Purpose                        |
| -------------------- | ------------------------------ |
| Ownership Validation | Prevent unauthorized transfers |
| PIN Lock Check       | Prevent outgoing transfer      |
| Idempotency          | Prevent duplicate payments     |
| Transactions         | Prevent partial updates        |
| Immutable Ledger     | Prevent fraud                  |

---

# 10. Concurrency Architecture

# Problem

Two simultaneous transfers can cause:

* double spending

---

# Solution

Uses:

* MongoDB transactions
* session isolation
* idempotency

---

# 11. Email Service Architecture

```text id="7wsd2n"
Controller
    ↓
Email Service
    ↓
SMTP Provider
```

Async:

* email failure does not fail transaction

---

# 12. Index Architecture

# Account Index

```js id="9o93uv"
{ user: 1, status: 1 }
```

Purpose:

* faster account lookup

---

# Transaction Index

```js id="dpxd9s"
{ idempotencyKey: 1 }
```

Purpose:

* duplicate prevention

---

# Ledger Index

```js id="4oqx9u"
{ account: 1 }
```

Purpose:

* faster balance aggregation

---

# 13. Suggested Future LLD Improvements

# Add Service Layer

Current:

```text id="a0mr13"
Route → Controller → Model
```

Better:

```text id="mp9do7"
Route
  ↓
Controller
  ↓
Service Layer
  ↓
Repository Layer
  ↓
MongoDB
```

---

# Why?

Separates:

* business logic
* DB logic
* controller logic

Cleaner for scaling.

---

# 14. Recommended Advanced Modules

| Module             | Purpose                     |
| ------------------ | --------------------------- |
| Fraud Service      | Detect suspicious transfers |
| Notification Queue | Async email/SMS             |
| Redis Cache        | Faster balance reads        |
| Audit Service      | Compliance logging          |
| Rate Limiter       | API abuse protection        |
| Scheduler          | Auto payments               |

---

# 15. Final LLD Summary

Your project architecture already includes real backend engineering concepts:

✅ JWT Authentication
✅ PIN Security
✅ Immutable Ledger
✅ Double Entry Accounting
✅ MongoDB Transactions
✅ Idempotency Handling
✅ Account Ownership Validation
✅ Transaction Locking
✅ Aggregation-Based Balance Calculation

This is a strong low-level architecture for:

* fintech systems
* wallet applications
* banking backends
* payment gateways
* transaction engines
