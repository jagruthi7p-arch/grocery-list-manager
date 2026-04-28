# Grocery List Manager

A full-stack collaborative grocery list application built with the MERN stack (MongoDB, Express, React, Node.js).

## Features

- **User Authentication** — Register & login with JWT-based sessions
- **Groups** — Create family/group workspaces with member access control
- **Shared Shopping Lists** — Multiple lists per group
- **Item Management** — Add, edit, delete items with categories and quantities
- **Purchase Tracking** — Mark items as purchased (crossed out)
- **Real-time Sync** — Live updates via Server-Sent Events (SSE)

## Project Structure

```
grocery-list-manager/
├── backend/                  # Node.js + Express API
│   ├── config/
│   │   └── db.js             # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── groupController.js
│   │   ├── listController.js
│   │   ├── itemController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   └── authMiddleware.js # JWT protect + admin guard
│   ├── models/
│   │   ├── User.js
│   │   ├── Group.js
│   │   ├── List.js
│   │   └── Item.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── groupRoutes.js
│   │   ├── listRoutes.js
│   │   ├── itemRoutes.js
│   │   └── adminRoutes.js
│   ├── server.js             # Express entry point
│   ├── .env                  # Environment variables
│   └── package.json
│
└── frontend/                 # React + Vite + TailwindCSS
    ├── src/
    │   ├── api/
    │   │   └── axios.js      # Axios instance with auth interceptors
    │   ├── components/
    │   │   ├── Auth/
    │   │   │   ├── Login.jsx
    │   │   │   └── Register.jsx
    │   │   ├── Dashboard/
    │   │   │   └── Dashboard.jsx
    │   │   ├── Groups/
    │   │   │   ├── CreateGroup.jsx
    │   │   │   └── GroupDetail.jsx
    │   │   ├── Lists/
    │   │   │   └── ShoppingList.jsx
    │   │   └── Items/
    │   │       ├── AddItem.jsx
    │   │       └── ItemCard.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

## Architecture

```
Frontend (React)
     ↓ API Requests / SSE
Backend (Node.js + Express)
  ├── Auth Middleware (JWT)
  ├── Auth Controller
  ├── Group Controller
  ├── List Controller
  ├── Item Controller (+ SSE broadcast)
  └── Admin Controller
     ↓ Mongoose ODM
MongoDB Database
```

## Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (local or Atlas)

### 1. Backend Setup

```bash
cd backend
npm install
```

Edit `.env` with your values:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/grocery_list_manager
JWT_SECRET=your_strong_secret_here
```

```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Visit **http://localhost:5173**

## API Endpoints

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/auth/register` | Register user | No |
| POST | `/api/auth/login` | Login | No |
| GET | `/api/auth/me` | Get current user | Yes |
| GET | `/api/groups` | Get my groups | Yes |
| POST | `/api/groups` | Create group | Yes |
| GET | `/api/groups/:id` | Get group detail | Yes |
| POST | `/api/groups/:id/members` | Add member | Yes |
| DELETE | `/api/groups/:id` | Delete group | Yes |
| POST | `/api/lists` | Create list | Yes |
| GET | `/api/lists/group/:groupId` | Get lists for group | Yes |
| GET | `/api/lists/:id` | Get list | Yes |
| DELETE | `/api/lists/:id` | Delete list | Yes |
| GET | `/api/items/list/:listId` | Get items | Yes |
| GET | `/api/items/stream/:listId` | SSE stream | Yes |
| POST | `/api/items` | Add item | Yes |
| PUT | `/api/items/:id` | Update item | Yes |
| PATCH | `/api/items/:id/purchased` | Toggle purchased | Yes |
| DELETE | `/api/items/:id` | Delete item | Yes |
| GET | `/api/admin/stats` | Platform stats | Admin |
| GET | `/api/admin/users` | All users | Admin |

## Database Collections

- **users** — `_id, name, email, password (hashed), role`
- **groups** — `_id, groupName, createdBy, members[]`
- **lists** — `_id, listName, groupId, createdBy`
- **items** — `_id, name, category, quantity, isPurchased, listId, addedBy`

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router 6, TailwindCSS, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Auth | JWT (jsonwebtoken, bcryptjs) |
| Real-time | Server-Sent Events (SSE) |
