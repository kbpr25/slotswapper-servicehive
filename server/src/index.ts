import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/authRoutes';
import eventsRoutes from './routes/eventsRoutes';
import swapRoutes from './routes/swapRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/swap', swapRoutes);

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'Server is running!', 
    timestamp: new Date().toISOString(),
    socketConnections: io.engine.clientsCount
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('✅ Socket connected:', socket.id);

  // User joins their personal room (using userId)
  socket.on('join', (userId: number) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Socket disconnected:', socket.id);
  });
});

// Test database connection on startup
import pool from './config/database';
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
  } else {
    console.log('✅ Database connected at:', res.rows[0].now);
  }
});

// Use server.listen instead of app.listen for Socket.IO
server.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`✅ Socket.IO enabled with CORS for http://localhost:5173`);
});
