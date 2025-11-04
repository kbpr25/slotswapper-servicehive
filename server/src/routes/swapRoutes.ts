import { Router } from 'express';
import { 
  getSwappableSlots,
  getUserSwappableSlots,
  createSwapRequest,
  getIncomingSwapRequests,
  getOutgoingSwapRequests,
  respondToSwapRequest
} from '../controllers/swapController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/swap/marketplace - Get all swappable slots from other users
router.get('/marketplace', getSwappableSlots);

// GET /api/swap/my-swappable - Get my swappable slots
router.get('/my-swappable', getUserSwappableSlots);

// POST /api/swap/request - Create new swap request
router.post('/request', createSwapRequest);

// GET /api/swap/incoming - Get incoming swap requests
router.get('/incoming', getIncomingSwapRequests);

// GET /api/swap/outgoing - Get outgoing swap requests
router.get('/outgoing', getOutgoingSwapRequests);

// POST /api/swap/respond/:requestId - Accept or reject swap request
router.post('/respond/:requestId', respondToSwapRequest);

export default router;
