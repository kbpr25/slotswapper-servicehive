# SlotSwapper - Peer-to-Peer Time Slot Scheduling Application

![Status](https://img.shields.io/badge/Status-Live%20in%20Production-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue)

**A full-stack web application for peer-to-peer time slot swapping built for the ServiceHive Full Stack Internship Challenge.**

## 🚀 Live Demo

- **Frontend:** https://slotswapper-servicehive.vercel.app
- **Backend API:** https://slotswapper-servicehive-production.up.railway.app/
- **GitHub:** https://github.com/kbpr25/slotswapper-servicehive

---

## 📋 Project Overview

SlotSwapper solves the problem of **rigid scheduling** by enabling users to:
- Create and manage time slots
- Mark slots as available for swapping
- Browse other users' available slots in a marketplace
- Request swaps with atomic transaction guarantees
- Receive real-time notifications instantly
- Complete peer-to-peer exchanges seamlessly

### Real-World Use Cases
- Healthcare professionals swapping shifts
- Educational institutions managing class schedules
- Corporate teams coordinating meeting times
- Event planners managing volunteer slots

---

## 🛠 Tech Stack

### Frontend
- **React 18** + **TypeScript** - UI components with type safety
- **Vite** - Lightning-fast build tool
- **TailwindCSS** - Responsive styling
- **Socket.IO Client** - Real-time WebSocket connections
- **date-fns** - Date/time formatting
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **React Hot Toast** - Toast notifications

### Backend
- **Node.js** + **Express** - REST API server
- **TypeScript** - Type-safe backend
- **PostgreSQL** (Neon) - Cloud database
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - Secure authentication
- **bcryptjs** - Password hashing
- **pg** - PostgreSQL client

### Deployment
- **Vercel** - Frontend hosting (serverless)
- **Railway** - Backend hosting (containerized Node.js)
- **Neon** - PostgreSQL database hosting

### Testing
- **Jest** - Testing framework
- **Supertest** - HTTP assertions
- **React Testing Library** - Component testing
- **Vitest** - Vite-native test runner

---

## 📁 Project Structure

slotswapper-servicehive/
├── client/ # React Frontend (Vite)
│ ├── src/
│ │ ├── components/ # Reusable components
│ │ ├── pages/ # Page components
│ │ │ ├── Login.tsx
│ │ │ ├── Register.tsx
│ │ │ ├── Dashboard.tsx # Event management
│ │ │ ├── CreateEvent.tsx # Event creation
│ │ │ ├── Marketplace.tsx # Browse swappable slots
│ │ │ └── Requests.tsx # Manage swap requests
│ │ ├── contexts/ # Global state
│ │ │ ├── AuthContext.tsx # Authentication state
│ │ │ └── SocketContext.tsx # WebSocket state
│ │ ├── utils/
│ │ │ └── ProtectedRoute.tsx # Route guarding
│ │ ├── App.tsx # Main app component
│ │ └── main.tsx # Entry point
│ ├── package.json
│ └── vite.config.ts
│
├── server/ # Node.js Backend
│ ├── src/
│ │ ├── config/
│ │ │ └── database.ts # PostgreSQL connection
│ │ ├── controllers/
│ │ │ ├── authController.ts # Auth logic (register, login)
│ │ │ ├── eventsController.ts # Event CRUD
│ │ │ └── swapController.ts # Swap marketplace & transactions
│ │ ├── middlewares/
│ │ │ └── authMiddleware.ts # JWT verification
│ │ ├── routes/
│ │ │ ├── authRoutes.ts
│ │ │ ├── eventsRoutes.ts
│ │ │ └── swapRoutes.ts
│ │ ├── tests/ # Test files
│ │ │ ├── auth.test.ts
│ │ │ ├── events.test.ts
│ │ └── index.ts # Server entry point
│ ├── package.json
│ ├── tsconfig.json
│ └── jest.config.js
│
├── .gitignore
├── README.md
└── docker-compose.yml

---

## 🔑 Key Features

### 1. **User Authentication** ✅
- JWT-based authentication
- Secure password hashing with bcryptjs (10 salt rounds)
- Token expiration (24 hours)
- Protected routes on frontend and backend

### 2. **Event Management** ✅
- Create events with date/time validation
- Mark events as BUSY, SWAPPABLE, or SWAP_PENDING
- Automatic overlap detection (prevents double-booking)
- User-specific event isolation
- CRUD operations with proper authorization

### 3. **Peer-to-Peer Swaps** ✅
- **Atomic Transactions**: PostgreSQL transactions ensure consistency
- **Ownership Exchange**: Events swap ownership only if both parties agree
- **Status Management**: Tracks swap lifecycle (PENDING → ACCEPTED/REJECTED)
- **Marketplace**: Browse other users' available slots
- **Request System**: Track incoming and outgoing swap requests

### 4. **Real-Time Notifications** ✅
- Socket.IO WebSocket connections
- User-specific rooms for targeted messaging
- Instant notifications for:
  - New swap requests received
  - Swap acceptance
  - Swap rejection
- Auto-reconnection with exponential backoff
- Multi-tab support

### 5. **Production Ready** ✅
- Comprehensive test coverage (20+ tests)
- CORS configuration for cross-origin requests
- Environment-based configuration
- Error handling and validation
- Database indexing for performance

---

## 🚀 Getting Started

### Local Development

**Prerequisites:**
- Node.js 18+ (with npm)
- Git
- PostgreSQL (or Neon account for cloud)

### Backend Setup

cd server
npm install

Create .env file
cp .env.example .env

Edit .env with your DATABASE_URL, JWT_SECRET, etc.
Run development server
npm run dev

Run tests
npm test

Build for production
npm run build

### Frontend Setup

cd client
npm install

Create .env file with API URL
echo "VITE_API_URL=http://localhost:5000" > .env

Run development server
npm run dev

Run tests
npm run test:watch

Build for production
npm run build

### Database Setup

1. Create Neon PostgreSQL account: https://neon.tech
2. Get connection string
3. Add to `.env` as `DATABASE_URL`
4. Tables auto-created on first API call (or run migrations)

---

## 📊 Database Schema

### Users Table
CREATE TABLE users (
id SERIAL PRIMARY KEY,
name VARCHAR(255) NOT NULL,
email VARCHAR(255) UNIQUE NOT NULL,
password_hash VARCHAR(255) NOT NULL,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

### Events Table
CREATE TABLE events (
id SERIAL PRIMARY KEY,
user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
title VARCHAR(255) NOT NULL,
start_time TIMESTAMP NOT NULL,
end_time TIMESTAMP NOT NULL,
status VARCHAR(50) DEFAULT 'BUSY',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
CHECK (status IN ('BUSY', 'SWAPPABLE', 'SWAP_PENDING'))
);

### Swap Requests Table
CREATE TABLE swap_requests (
id SERIAL PRIMARY KEY,
requester_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
requester_slot_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
target_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
target_slot_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
status VARCHAR(50) DEFAULT 'PENDING',
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED'))
);

---

## 🔗 API Endpoints

### Authentication
POST /api/auth/register - Register new user
POST /api/auth/login - Login with credentials

### Events (Protected Routes)
GET /api/events - Get user's events
POST /api/events - Create new event
GET /api/events/:id - Get specific event
PUT /api/events/:id - Update event
DELETE /api/events/:id - Delete event

### Swap Marketplace (Protected Routes)
GET /api/swap/marketplace - Browse swappable slots from other users
GET /api/swap/my-swappable - Get my swappable slots
POST /api/swap/request - Create swap request (TRANSACTION)
GET /api/swap/incoming - View incoming swap requests
GET /api/swap/outgoing - View outgoing swap requests
POST /api/swap/respond/:id - Accept/reject swap request (TRANSACTION)

---

## 🧪 Testing

### Backend Tests (Jest + Supertest)
cd server
npm test # Run all tests
npm run test:watch # Watch mode
npm run test:coverage # Generate coverage report

**Test Coverage:**
- ✅ Authentication (register, login, validation)
- ✅ Events CRUD (create, read, update, delete)
- ✅ Event validation (time ranges, overlaps)
- ✅ Swap request creation with transactions
- ✅ Swap acceptance with ownership exchange
- ✅ Swap rejection with rollback
- ✅ Authorization checks

### Frontend Tests (Vitest + React Testing Library)
cd client
npm run test # Run tests
npm run test:watch # Watch mode
npm run test:coverage # Coverage report

---

## 🔒 Security Features

1. **Password Security**
   - bcryptjs with 10 salt rounds
   - Never stored in plain text
   - Validated on registration

2. **Authentication**
   - JWT tokens with 24-hour expiration
   - Tokens sent in Authorization header
   - Token refresh on login

3. **Database Security**
   - Parameterized queries (prevent SQL injection)
   - Foreign keys with cascade delete
   - Check constraints on enums

4. **API Security**
   - CORS configured for specific origins
   - Protected routes require valid JWT
   - User ownership verification on all operations

5. **Transaction Safety**
   - PostgreSQL transactions for atomic operations
   - Rollback on errors
   - No partial state

---

## 🎯 Performance Optimizations

- Database indexes on frequently queried columns
- Socket.IO connection pooling
- JWT token validation caching
- Efficient JOIN queries for marketplace
- Response compression

---

## 🚢 Deployment

### Frontend (Vercel)
1. Connect GitHub repository
2. Set root directory to `client/`
3. Set environment variables: `VITE_API_URL`, `VITE_WS_URL`
4. Deploy (auto-redeploy on git push)

### Backend (Railway)
1. Connect GitHub repository
2. Set root directory to `server/`
3. Set environment variables: `DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`
4. Set build command: `npm install && npm run build`
5. Set start command: `npm start`

### Database (Neon)
1. Create PostgreSQL database on Neon
2. Get connection string
3. Add to backend environment variables
4. Tables created automatically on first API call

---

## 📈 Future Enhancements

- [ ] User profiles and ratings
- [ ] Recurring events
- [ ] Event conflicts resolution UI
- [ ] Email notifications
- [ ] Mobile app (React Native)
- [ ] Analytics dashboard
- [ ] Calendar integrations (Google, Outlook)
- [ ] Video call integration for negotiations

---

## 🐛 Known Issues & Limitations

- Free tier Render/Railway may have cold starts
- Database backups not automated (backup via Neon UI)
- No email verification (future enhancement)
- Timezone handling is UTC only

---

## 📝 License

MIT License - Feel free to use this project for learning and commercial purposes.

---

## 👨‍💻 Author

**kbpr25** - Built for ServiceHive Full Stack Internship Challenge

- GitHub: https://github.com/kbpr25
- LinkedIn: https://linkedin.com/in/k-bharath-prakash-reddy-81a138336/

---

## 🙏 Acknowledgments

- React, Node.js, PostgreSQL communities
- ServiceHive for the challenge
- All open-source contributors

---

## 📞 Support

For issues or questions:
1. Check GitHub Issues
2. Review API documentation
3. Check test files for usage examples

---

**Author:** kbpr25
**Last Updated:** November 5, 2025  
**Status:** ✅ Production Ready