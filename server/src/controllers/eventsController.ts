import { Response } from 'express';
import pool from '../config/database';
import { AuthRequest } from '../middlewares/authMiddleware';

// Get all events for logged-in user
export const getUserEvents = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const events = await pool.query(
      'SELECT * FROM events WHERE user_id = $1 ORDER BY start_time ASC',
      [userId]
    );

    res.json({
      events: events.rows,
      count: events.rows.length
    });

  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

// Create new event
export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { title, start_time, end_time } = req.body;

    // Validation
    if (!title || !start_time || !end_time) {
      return res.status(400).json({ 
        error: 'Please provide title, start_time, and end_time' 
      });
    }

    // Validate time: start_time must be before end_time
    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    if (startDate >= endDate) {
      return res.status(400).json({ 
        error: 'Start time must be before end time' 
      });
    }

    // Check for overlapping events for this user
    const overlapCheck = await pool.query(
      `SELECT * FROM events 
       WHERE user_id = $1 
       AND (
         (start_time < $3 AND end_time > $2)
       )`,
      [userId, start_time, end_time]
    );

    if (overlapCheck.rows.length > 0) {
      return res.status(400).json({ 
        error: 'This event overlaps with an existing event in your calendar' 
      });
    }

    // Insert new event
    const newEvent = await pool.query(
      `INSERT INTO events (user_id, title, start_time, end_time, status) 
       VALUES ($1, $2, $3, $4, 'BUSY') 
       RETURNING *`,
      [userId, title, start_time, end_time]
    );

    res.status(201).json({
      message: 'Event created successfully',
      event: newEvent.rows[0]
    });

  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
};

// Update event (including status change)
export const updateEvent = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const eventId = req.params.id;
    const { title, start_time, end_time, status } = req.body;

    // Check if event exists and belongs to user
    const eventCheck = await pool.query(
      'SELECT * FROM events WHERE id = $1 AND user_id = $2',
      [eventId, userId]
    );

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Event not found or you do not have permission to update it' 
      });
    }

    const currentEvent = eventCheck.rows[0];

    // Validate status if provided
    if (status && !['BUSY', 'SWAPPABLE', 'SWAP_PENDING'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be BUSY, SWAPPABLE, or SWAP_PENDING' 
      });
    }

    // If updating times, validate them
    if (start_time && end_time) {
      const startDate = new Date(start_time);
      const endDate = new Date(end_time);

      if (startDate >= endDate) {
        return res.status(400).json({ 
          error: 'Start time must be before end time' 
        });
      }

      // Check for overlaps (excluding current event)
      const overlapCheck = await pool.query(
        `SELECT * FROM events 
         WHERE user_id = $1 
         AND id != $2
         AND (
           (start_time < $4 AND end_time > $3)
         )`,
        [userId, eventId, start_time, end_time]
      );

      if (overlapCheck.rows.length > 0) {
        return res.status(400).json({ 
          error: 'Updated times overlap with another event' 
        });
      }
    }

    // Build update query dynamically
    const updateFields = [];
    const values = [];
    let paramCounter = 1;

    if (title) {
      updateFields.push(`title = $${paramCounter}`);
      values.push(title);
      paramCounter++;
    }
    if (start_time) {
      updateFields.push(`start_time = $${paramCounter}`);
      values.push(start_time);
      paramCounter++;
    }
    if (end_time) {
      updateFields.push(`end_time = $${paramCounter}`);
      values.push(end_time);
      paramCounter++;
    }
    if (status) {
      updateFields.push(`status = $${paramCounter}`);
      values.push(status);
      paramCounter++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(eventId, userId);

    const updateQuery = `
      UPDATE events 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramCounter} AND user_id = $${paramCounter + 1}
      RETURNING *
    `;

    const updatedEvent = await pool.query(updateQuery, values);

    res.json({
      message: 'Event updated successfully',
      event: updatedEvent.rows[0]
    });

  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
};

// Delete event
export const deleteEvent = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const eventId = req.params.id;

    // Check if event exists and belongs to user
    const eventCheck = await pool.query(
      'SELECT * FROM events WHERE id = $1 AND user_id = $2',
      [eventId, userId]
    );

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ 
        error: 'Event not found or you do not have permission to delete it' 
      });
    }

    // Delete the event
    await pool.query(
      'DELETE FROM events WHERE id = $1 AND user_id = $2',
      [eventId, userId]
    );

    res.json({ message: 'Event deleted successfully' });

  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
};

// Get single event by ID
export const getEventById = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const eventId = req.params.id;

    const event = await pool.query(
      'SELECT * FROM events WHERE id = $1 AND user_id = $2',
      [eventId, userId]
    );

    if (event.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    res.json({ event: event.rows[0] });

  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
};
