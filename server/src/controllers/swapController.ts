import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middlewares/authMiddleware';

// Get all swappable slots from OTHER users
export const getSwappableSlots = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    // Join events with users table to get user details
    const swappableSlots = await pool.query(
      `SELECT 
        e.id, 
        e.title, 
        e.start_time, 
        e.end_time, 
        e.user_id,
        u.name as user_name,
        u.email as user_email
       FROM events e
       INNER JOIN users u ON e.user_id = u.id
       WHERE e.status = 'SWAPPABLE' 
       AND e.user_id != $1
       ORDER BY e.start_time ASC`,
      [userId]
    );

    res.json({
      slots: swappableSlots.rows,
      count: swappableSlots.rows.length
    });

  } catch (error) {
    console.error('Get swappable slots error:', error);
    res.status(500).json({ error: 'Failed to fetch swappable slots' });
  }
};

// Get user's swappable slots (for offering in swap)
export const getUserSwappableSlots = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const mySwappableSlots = await pool.query(
      `SELECT * FROM events 
       WHERE user_id = $1 
       AND status = 'SWAPPABLE'
       ORDER BY start_time ASC`,
      [userId]
    );

    res.json({
      slots: mySwappableSlots.rows,
      count: mySwappableSlots.rows.length
    });

  } catch (error) {
    console.error('Get user swappable slots error:', error);
    res.status(500).json({ error: 'Failed to fetch your swappable slots' });
  }
};

// Create swap request
export const createSwapRequest = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    const requesterId = req.userId;
    const { mySlotId, theirSlotId } = req.body;

    // Validation
    if (!mySlotId || !theirSlotId) {
      return res.status(400).json({ 
        error: 'Please provide both mySlotId and theirSlotId' 
      });
    }

    // Start transaction
    await client.query('BEGIN');

    // Verify mySlot exists, belongs to requester, and is SWAPPABLE
    const mySlotCheck = await client.query(
      'SELECT * FROM events WHERE id = $1 AND user_id = $2',
      [mySlotId, requesterId]
    );

    if (mySlotCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        error: 'Your slot not found or does not belong to you' 
      });
    }

    if (mySlotCheck.rows[0].status !== 'SWAPPABLE') {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Your slot must be SWAPPABLE to offer in a swap' 
      });
    }

    // Verify theirSlot exists, does NOT belong to requester, and is SWAPPABLE
    const theirSlotCheck = await client.query(
      'SELECT * FROM events WHERE id = $1',
      [theirSlotId]
    );

    if (theirSlotCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ 
        error: 'Target slot not found' 
      });
    }

    const theirSlot = theirSlotCheck.rows[0];

    if (theirSlot.user_id === requesterId) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Cannot swap with your own slot' 
      });
    }

    if (theirSlot.status !== 'SWAPPABLE') {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Target slot is no longer swappable' 
      });
    }

    // Check if swap request already exists
    const existingRequest = await client.query(
      `SELECT * FROM swap_requests 
       WHERE requester_slot_id = $1 
       AND target_slot_id = $2 
       AND status = 'PENDING'`,
      [mySlotId, theirSlotId]
    );

    if (existingRequest.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'You already have a pending swap request for these slots' 
      });
    }

    // Create swap request
    const newSwapRequest = await client.query(
      `INSERT INTO swap_requests 
       (requester_id, requester_slot_id, target_user_id, target_slot_id, status) 
       VALUES ($1, $2, $3, $4, 'PENDING') 
       RETURNING *`,
      [requesterId, mySlotId, theirSlot.user_id, theirSlotId]
    );

    // Update both slots to SWAP_PENDING
    await client.query(
      'UPDATE events SET status = $1 WHERE id = $2',
      ['SWAP_PENDING', mySlotId]
    );

    await client.query(
      'UPDATE events SET status = $1 WHERE id = $2',
      ['SWAP_PENDING', theirSlotId]
    );

    // Commit transaction
    await client.query('COMMIT');

    res.status(201).json({
      message: 'Swap request created successfully',
      swapRequest: newSwapRequest.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create swap request error:', error);
    res.status(500).json({ error: 'Failed to create swap request' });
  } finally {
    client.release();
  }
};

// Get incoming swap requests (requests others made to me)
export const getIncomingSwapRequests = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const incomingRequests = await pool.query(
      `SELECT 
        sr.id,
        sr.status,
        sr.created_at,
        sr.requester_id,
        u_req.name as requester_name,
        u_req.email as requester_email,
        e_req.id as their_slot_id,
        e_req.title as their_slot_title,
        e_req.start_time as their_slot_start,
        e_req.end_time as their_slot_end,
        e_target.id as my_slot_id,
        e_target.title as my_slot_title,
        e_target.start_time as my_slot_start,
        e_target.end_time as my_slot_end
       FROM swap_requests sr
       INNER JOIN users u_req ON sr.requester_id = u_req.id
       INNER JOIN events e_req ON sr.requester_slot_id = e_req.id
       INNER JOIN events e_target ON sr.target_slot_id = e_target.id
       WHERE sr.target_user_id = $1
       ORDER BY sr.created_at DESC`,
      [userId]
    );

    res.json({
      requests: incomingRequests.rows,
      count: incomingRequests.rows.length
    });

  } catch (error) {
    console.error('Get incoming swap requests error:', error);
    res.status(500).json({ error: 'Failed to fetch incoming swap requests' });
  }
};

// Get outgoing swap requests (requests I made to others)
export const getOutgoingSwapRequests = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const outgoingRequests = await pool.query(
      `SELECT 
        sr.id,
        sr.status,
        sr.created_at,
        sr.target_user_id,
        u_target.name as target_user_name,
        u_target.email as target_user_email,
        e_req.id as my_slot_id,
        e_req.title as my_slot_title,
        e_req.start_time as my_slot_start,
        e_req.end_time as my_slot_end,
        e_target.id as their_slot_id,
        e_target.title as their_slot_title,
        e_target.start_time as their_slot_start,
        e_target.end_time as their_slot_end
       FROM swap_requests sr
       INNER JOIN users u_target ON sr.target_user_id = u_target.id
       INNER JOIN events e_req ON sr.requester_slot_id = e_req.id
       INNER JOIN events e_target ON sr.target_slot_id = e_target.id
       WHERE sr.requester_id = $1
       ORDER BY sr.created_at DESC`,
      [userId]
    );

    res.json({
      requests: outgoingRequests.rows,
      count: outgoingRequests.rows.length
    });

  } catch (error) {
    console.error('Get outgoing swap requests error:', error);
    res.status(500).json({ error: 'Failed to fetch outgoing swap requests' });
  }
};

// Respond to swap request (accept or reject)
export const respondToSwapRequest = async (req: AuthRequest, res: Response) => {
  const client = await pool.connect();
  
  try {
    const userId = req.userId;
    const requestId = req.params.requestId;
    const { accept } = req.body; // boolean: true = accept, false = reject

    if (accept === undefined) {
      return res.status(400).json({ 
        error: 'Please provide accept field (true or false)' 
      });
    }

    // Start transaction
    await client.query('BEGIN');

    // Get swap request details
    const swapRequest = await client.query(
      'SELECT * FROM swap_requests WHERE id = $1',
      [requestId]
    );

    if (swapRequest.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Swap request not found' });
    }

    const request = swapRequest.rows[0];

    // Verify user is the target of this swap request
    if (request.target_user_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ 
        error: 'You are not authorized to respond to this swap request' 
      });
    }

    // Check if request is still pending
    if (request.status !== 'PENDING') {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: `This swap request has already been ${request.status.toLowerCase()}` 
      });
    }

    if (accept) {
      // ACCEPT - Perform the swap
      
      // Update swap request status to ACCEPTED
      await client.query(
        'UPDATE swap_requests SET status = $1, updated_at = NOW() WHERE id = $2',
        ['ACCEPTED', requestId]
      );

      // SWAP THE OWNERS - This is the core swap logic
      // Temporarily store user IDs
      const requesterId = request.requester_id;
      const targetUserId = request.target_user_id;

      // Swap ownership: requester gets target's slot, target gets requester's slot
      await client.query(
        'UPDATE events SET user_id = $1, status = $2 WHERE id = $3',
        [requesterId, 'BUSY', request.target_slot_id]
      );

      await client.query(
        'UPDATE events SET user_id = $1, status = $2 WHERE id = $3',
        [targetUserId, 'BUSY', request.requester_slot_id]
      );

      await client.query('COMMIT');

      res.json({
        message: 'Swap request accepted! Events have been swapped.',
        swapRequest: request
      });

    } else {
      // REJECT - Revert slots back to SWAPPABLE
      
      // Update swap request status to REJECTED
      await client.query(
        'UPDATE swap_requests SET status = $1, updated_at = NOW() WHERE id = $2',
        ['REJECTED', requestId]
      );

      // Revert both slots back to SWAPPABLE
      await client.query(
        'UPDATE events SET status = $1 WHERE id = $2',
        ['SWAPPABLE', request.requester_slot_id]
      );

      await client.query(
        'UPDATE events SET status = $1 WHERE id = $2',
        ['SWAPPABLE', request.target_slot_id]
      );

      await client.query('COMMIT');

      res.json({
        message: 'Swap request rejected. Slots are back to swappable.',
        swapRequest: request
      });
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Respond to swap request error:', error);
    res.status(500).json({ error: 'Failed to respond to swap request' });
  } finally {
    client.release();
  }
};
