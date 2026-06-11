# Notes App API Documentation

This document outlines the RESTful API endpoints required for the backend of the Notes App (built with Node.js, Express, and MongoDB). It handles two main entities: **Friends** and **Expenses**.

---

## 1. Friends API

### `POST /api/friends`
Create a new friend.

**Request Body**
```json
{
  "name": "John Doe",
  "phone": "9876543210",
  "email": "john.doe@example.com"
}
```
* **name** `[String]` (Required): Full name of the friend.
* **phone** `[String]` (Optional): Contact number.
* **email** `[String]` (Optional): Email address.

**Response (201 Created)**
```json
{
  "_id": "64b5f8e910a3c2b8",
  "name": "John Doe",
  "phone": "9876543210",
  "email": "john.doe@example.com",
  "createdAt": "2026-06-11T10:00:00.000Z"
}
```

### `GET /api/friends`
Retrieve all friends.

**Response (200 OK)**
```json
[
  {
    "_id": "64b5f8e910a3c2b8",
    "name": "John Doe",
    "phone": "9876543210",
    "email": "john.doe@example.com"
  }
]
```

### `PUT /api/friends/:id`
Update an existing friend.

**Request Body**
*(Include any fields you wish to update)*
```json
{
  "phone": "1112223333"
}
```

### `DELETE /api/friends/:id`
Delete a friend. *(Note: You may need to decide whether deleting a friend also deletes their associated expenses, or just unlinks them by setting `friendId` to null in the expenses collection).*

---

## 2. Expenses API

### `POST /api/expenses`
Create a new expense record.

**Request Body**
```json
{
  "name": "Dinner",
  "amount": 500.50,
  "date": "2026-06-11T10:00:00.000Z",
  "type": "send",
  "friendId": "64b5f8e910a3c2b8", 
  "notes": "Paid for pizza",
  "paymentMethod": "Credit Card",
  "isDisabled": false
}
```
* **name** `[String]` (Required): Title of the expense.
* **amount** `[Number]` (Required): The monetary value.
* **date** `[String - ISO8601]` (Required): Date and time of the expense.
* **type** `[String]` (Required): Must be either `"send"` or `"receive"`.
* **friendId** `[String - ObjectId]` (Optional): The ID of the friend this is linked to. If `null` or omitted, it is treated as a **Daily Expense**.
* **notes** `[String]` (Optional): Additional details.
* **paymentMethod** `[String]` (Optional): e.g., "Cash", "Online", "Credit Card".
* **isDisabled** `[Boolean]` (Optional): Used to mark the expense as crossed-out/disabled. Defaults to `false`.

**Response (201 Created)**
```json
{
  "_id": "81c3d9f201b4e5c9",
  "name": "Dinner",
  "amount": 500.50,
  "date": "2026-06-11T10:00:00.000Z",
  "type": "send",
  "friendId": "64b5f8e910a3c2b8",
  "notes": "Paid for pizza",
  "paymentMethod": "Credit Card",
  "isDisabled": false,
  "createdAt": "2026-06-11T10:05:00.000Z"
}
```

### `GET /api/expenses`
Retrieve all expenses. 

*Optional Query Parameters for filtering:*
* `?friendId=64b5f8e910a3c2b8` (Get expenses for a specific friend)
* `?isDaily=true` (Get expenses where `friendId` is null)

**Response (200 OK)**
```json
[
  {
    "_id": "81c3d9f201b4e5c9",
    "name": "Dinner",
    "amount": 500.50,
    "date": "2026-06-11T10:00:00.000Z",
    "type": "send",
    "friendId": "64b5f8e910a3c2b8",
    "notes": "Paid for pizza",
    "paymentMethod": "Credit Card",
    "isDisabled": false
  }
]
```

### `PUT /api/expenses/:id`
Update an existing expense (e.g., toggling `isDisabled` status, or changing the `type` between send/receive).

**Request Body**
```json
{
  "isDisabled": true
}
```

### `DELETE /api/expenses/:id`
Permanently delete an expense record.

---

## Suggested Mongoose Models

**Friend Schema**
```javascript
const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  email: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Friend', friendSchema);
```

**Expense Schema**
```javascript
const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, required: true },
  type: { type: String, enum: ['send', 'receive'], default: 'send' },
  friendId: { type: mongoose.Schema.Types.ObjectId, ref: 'Friend', default: null },
  notes: { type: String, default: '' },
  paymentMethod: { type: String, default: '' },
  isDisabled: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Expense', expenseSchema);
```
