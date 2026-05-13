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
