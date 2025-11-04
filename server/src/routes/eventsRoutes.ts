import { Router } from 'express';
import { 
  getUserEvents, 
  createEvent, 
  updateEvent, 
  deleteEvent,
  getEventById 
} from '../controllers/eventsController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/events - Get all user's events
router.get('/', getUserEvents);

// POST /api/events - Create new event
router.post('/', createEvent);

// GET /api/events/:id - Get single event
router.get('/:id', getEventById);

// PUT /api/events/:id - Update event
router.put('/:id', updateEvent);

// DELETE /api/events/:id - Delete event
router.delete('/:id', deleteEvent);

export default router;
