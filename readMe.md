# 📝 Notes API Service

A robust, feature-rich **Notes/E-commerce API** built with **Node.js**, **Express**, and **SQLite**.  
It supports full **CRUD** operations for user-specific notes, **product management**, **order processing**, and advanced **Admin** capabilities — all secured with **JWT (JSON Web Tokens)** authentication and authorization.

---

## ✨ Features

- **User Authentication/Authorization:**  
  Secure route access using JWT (`bcryptjs`, `jsonwebtoken`).

- **Role-Based Access Control (RBAC):**  
  Separate route sets for standard **Users** and **Admins**.

- **Notes Management:**  
  Full CRUD for user-owned notes (users can only access their own data).

- **Product Catalog:**  
  Public product listings + admin-only product management.

- **Order Processing:**  
  Protected user endpoints for creating and tracking orders.

- **Admin Tools:**  
  Manage users, all notes, products, and orders.

- **Database:**  
  Persistent storage using SQLite3.

- **API Documentation:**  
  Swagger UI integration for exploration and testing.

- **Validation:**  
  Input schema validation with Zod.

---

## 💻 Technologies Used

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** SQLite3
- **Security:** JWT, bcryptjs
- **Validation:** Zod
- **Documentation:** Swagger UI, YAMLJS

---

## 🛠️ Setup and Installation

### Prerequisites

- Node.js (and npm) installed on your system.

### 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd notes-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory with the following content:

```env
# --- General ---
PORT=9001
NODE_ENV=development

# --- JWT Configuration ---
JWT_SECRET=YourSuperSecretKey123
JWT_EXPIRES_IN=1d
```

> **Note:** Defaults to port 3000 if `PORT` is not defined.

---

## 🚀 Running the Project

### Development Mode (with Nodemon)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

Server output example:

```
Server listening on port 9001
Open http://localhost:9001
```

---

## 🌐 Accessing the API

| Endpoint    | Description                    |
| ----------- | ------------------------------ |
| `/`         | Service Root                   |
| `/api-docs` | API Documentation (Swagger UI) |
| `/api`      | Base API                       |

---

## 🧪 Running Tests

Uses **Jest** for unit testing (mainly controllers and services).

- Run all tests:

```bash
npm test
```

- Watch mode:

```bash
npm run test:watch
```

> **Important:** The included tests are designed for **PowerShell**.  
> To run, use `&` followed by the full path to the test script, with the server running.

### Example PowerShell Test Scripts

- **Register and Seed Data:**

```powershell
& .\backend\src\scripts\auto.ps1
```

- **Full Flow Test (User + Admin):**

```powershell
& .\backend\src\scripts\auto2.ps1
```

---

## 💡 Quick Start Guide

1. Start the server.
2. Run `auto.ps1` to create admin user and initial products.
3. Run `auto2.ps1` to test user registration, login, order creation, and admin updates.
4. Access Swagger UI at `http://localhost:9001/api-docs` to explore all endpoints.
