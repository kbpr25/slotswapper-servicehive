import request from 'supertest';
import express from 'express';
import cors from 'cors';
import authRoutes from '../routes/authRoutes';
import eventsRoutes from '../routes/eventsRoutes';

const createApp = () => {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use('/api/events', eventsRoutes);
  return app;
};

describe('Events API', () => {
  let app: express.Application;
  let authToken: string;
  let userId: number;
  const testEmail = `events${Date.now()}@test.com`;

  beforeAll(async () => {
    app = createApp();

    // Create and login test user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Events Test User',
        email: testEmail,
        password: 'Test123'
      });

    authToken = registerRes.body.token;
    userId = registerRes.body.user.id;
  });

  describe('POST /api/events', () => {
    it('should create a new event', async () => {
      const eventData = {
        title: 'Test Meeting',
        start_time: new Date('2025-12-01T10:00:00Z').toISOString(),
        end_time: new Date('2025-12-01T11:00:00Z').toISOString()
      };

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send(eventData)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Event created successfully');
      expect(response.body.event).toHaveProperty('id');
      expect(response.body.event.title).toBe(eventData.title);
      expect(response.body.event.status).toBe('BUSY');
    });

    it('should fail without authentication', async () => {
      await request(app)
        .post('/api/events')
        .send({
          title: 'Test',
          start_time: new Date().toISOString(),
          end_time: new Date().toISOString()
        })
        .expect(401);
    });

    it('should fail with invalid time range (start >= end)', async () => {
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Invalid Event',
          start_time: new Date('2025-12-01T11:00:00Z').toISOString(),
          end_time: new Date('2025-12-01T10:00:00Z').toISOString()
        })
        .expect(400);

      expect(response.body.error).toContain('Start time must be before end time');
    });

    it('should detect overlapping events', async () => {
      // Create first event
      await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'First Event',
          start_time: new Date('2025-12-05T10:00:00Z').toISOString(),
          end_time: new Date('2025-12-05T11:00:00Z').toISOString()
        });

      // Try to create overlapping event
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Overlapping Event',
          start_time: new Date('2025-12-05T10:30:00Z').toISOString(),
          end_time: new Date('2025-12-05T11:30:00Z').toISOString()
        })
        .expect(400);

      expect(response.body.error).toContain('overlaps');
    });
  });

  describe('GET /api/events', () => {
    it('should return all user events', async () => {
      const response = await request(app)
        .get('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('events');
      expect(Array.isArray(response.body.events)).toBe(true);
      expect(response.body).toHaveProperty('count');
    });
  });

  describe('PUT /api/events/:id', () => {
    let eventId: number;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Event to Update',
          start_time: new Date('2025-12-10T14:00:00Z').toISOString(),
          end_time: new Date('2025-12-10T15:00:00Z').toISOString()
        });
      eventId = response.body.event.id;
    });

    it('should update event status to SWAPPABLE', async () => {
      const response = await request(app)
        .put(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'SWAPPABLE' })
        .expect(200);

      expect(response.body.event.status).toBe('SWAPPABLE');
    });

    it('should fail with invalid status', async () => {
      await request(app)
        .put(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'INVALID_STATUS' })
        .expect(400);
    });
  });

  describe('DELETE /api/events/:id', () => {
    it('should delete an event', async () => {
      // Create event to delete
      const createRes = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Event to Delete',
          start_time: new Date('2025-12-15T10:00:00Z').toISOString(),
          end_time: new Date('2025-12-15T11:00:00Z').toISOString()
        });

      const eventId = createRes.body.event.id;

      // Delete it
      await request(app)
        .delete(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify it's gone
      await request(app)
        .get(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});
