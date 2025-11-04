import request from 'supertest';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import authRoutes from '../routes/authRoutes';
import eventsRoutes from '../routes/eventsRoutes';
import swapRoutes from '../routes/swapRoutes';

const createApp = () => {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server);
  
  app.use(cors());
  app.use(express.json());
  app.set('io', io);
  
  app.use('/api/auth', authRoutes);
  app.use('/api/events', eventsRoutes);
  app.use('/api/swap', swapRoutes);
  
  return { app, server };
};

describe('Swap System', () => {
  let app: express.Application;
  let server: http.Server;
  let user1Token: string;
  let user2Token: string;
  let user1Id: number;
  let user2Id: number;

  beforeAll(async () => {
    const appSetup = createApp();
    app = appSetup.app;
    server = appSetup.server;

    // Create User 1
    const user1Res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User One',
        email: `user1_${Date.now()}@test.com`,
        password: 'Test123'
      });
    user1Token = user1Res.body.token;
    user1Id = user1Res.body.user.id;

    // Create User 2
    const user2Res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User Two',
        email: `user2_${Date.now()}@test.com`,
        password: 'Test123'
      });
    user2Token = user2Res.body.token;
    user2Id = user2Res.body.user.id;
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('Swap Request Creation', () => {
    let user1SlotId: number;
    let user2SlotId: number;

    beforeAll(async () => {
      // User 1 creates swappable slot
      const slot1Res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'User 1 Slot',
          start_time: new Date('2025-12-20T10:00:00Z').toISOString(),
          end_time: new Date('2025-12-20T11:00:00Z').toISOString()
        });
      user1SlotId = slot1Res.body.event.id;

      await request(app)
        .put(`/api/events/${user1SlotId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ status: 'SWAPPABLE' });

      // User 2 creates swappable slot
      const slot2Res = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          title: 'User 2 Slot',
          start_time: new Date('2025-12-21T14:00:00Z').toISOString(),
          end_time: new Date('2025-12-21T15:00:00Z').toISOString()
        });
      user2SlotId = slot2Res.body.event.id;

      await request(app)
        .put(`/api/events/${user2SlotId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ status: 'SWAPPABLE' });
    });

    it('should return swappable slots from other users', async () => {
      const response = await request(app)
        .get('/api/swap/marketplace')
        .set('Authorization', `Bearer ${user1Token}`)
        .expect(200);

      expect(response.body).toHaveProperty('slots');
      expect(Array.isArray(response.body.slots)).toBe(true);
      
      // User 1 should see User 2's slot, not their own
      const user2Slot = response.body.slots.find((s: any) => s.id === user2SlotId);
      expect(user2Slot).toBeDefined();
      
      const user1Slot = response.body.slots.find((s: any) => s.id === user1SlotId);
      expect(user1Slot).toBeUndefined();
    });

    it('should create a swap request successfully', async () => {
      const response = await request(app)
        .post('/api/swap/request')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          mySlotId: user1SlotId,
          theirSlotId: user2SlotId
        })
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Swap request created successfully');
      expect(response.body.swapRequest).toHaveProperty('id');
      expect(response.body.swapRequest.status).toBe('PENDING');
    });

    it('should mark both slots as SWAP_PENDING after request', async () => {
      // Check User 1's slot
      const slot1 = await request(app)
        .get(`/api/events/${user1SlotId}`)
        .set('Authorization', `Bearer ${user1Token}`);
      expect(slot1.body.event.status).toBe('SWAP_PENDING');

      // Check User 2's slot
      const slot2 = await request(app)
        .get(`/api/events/${user2SlotId}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(slot2.body.event.status).toBe('SWAP_PENDING');
    });

    it('should fail to create swap with own slot', async () => {
      await request(app)
        .post('/api/swap/request')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          mySlotId: user1SlotId,
          theirSlotId: user1SlotId
        })
        .expect(400);
    });
  });

  describe('Swap Response - Acceptance', () => {
    let swapRequestId: number;
    let requesterSlotId: number;
    let targetSlotId: number;

    beforeAll(async () => {
      // Create fresh slots and swap request
      const slot1 = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Swap Accept Test 1',
          start_time: new Date('2025-12-25T10:00:00Z').toISOString(),
          end_time: new Date('2025-12-25T11:00:00Z').toISOString()
        });
      requesterSlotId = slot1.body.event.id;

      await request(app)
        .put(`/api/events/${requesterSlotId}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ status: 'SWAPPABLE' });

      const slot2 = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          title: 'Swap Accept Test 2',
          start_time: new Date('2025-12-26T14:00:00Z').toISOString(),
          end_time: new Date('2025-12-26T15:00:00Z').toISOString()
        });
      targetSlotId = slot2.body.event.id;

      await request(app)
        .put(`/api/events/${targetSlotId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ status: 'SWAPPABLE' });

      const swapRes = await request(app)
        .post('/api/swap/request')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          mySlotId: requesterSlotId,
          theirSlotId: targetSlotId
        });
      swapRequestId = swapRes.body.swapRequest.id;
    });

    it('should accept swap and exchange ownership', async () => {
      // User 2 accepts the swap
      const response = await request(app)
        .post(`/api/swap/respond/${swapRequestId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ accept: true })
        .expect(200);

      expect(response.body.message).toContain('accepted');

      // Verify ownership swap
      const user1Events = await request(app)
        .get('/api/events')
        .set('Authorization', `Bearer ${user1Token}`);
      
      const user1HasTargetSlot = user1Events.body.events.some(
        (e: any) => e.id === targetSlotId && e.title === 'Swap Accept Test 2'
      );
      expect(user1HasTargetSlot).toBe(true);

      const user2Events = await request(app)
        .get('/api/events')
        .set('Authorization', `Bearer ${user2Token}`);
      
      const user2HasRequesterSlot = user2Events.body.events.some(
        (e: any) => e.id === requesterSlotId && e.title === 'Swap Accept Test 1'
      );
      expect(user2HasRequesterSlot).toBe(true);
    });
  });

  describe('Swap Response - Rejection', () => {
    let swapRequestId: number;
    let slot1Id: number;
    let slot2Id: number;

    beforeAll(async () => {
      // Create slots and request
      const slot1 = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          title: 'Reject Test 1',
          start_time: new Date('2025-12-28T10:00:00Z').toISOString(),
          end_time: new Date('2025-12-28T11:00:00Z').toISOString()
        });
      slot1Id = slot1.body.event.id;
      await request(app)
        .put(`/api/events/${slot1Id}`)
        .set('Authorization', `Bearer ${user1Token}`)
        .send({ status: 'SWAPPABLE' });

      const slot2 = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          title: 'Reject Test 2',
          start_time: new Date('2025-12-29T14:00:00Z').toISOString(),
          end_time: new Date('2025-12-29T15:00:00Z').toISOString()
        });
      slot2Id = slot2.body.event.id;
      await request(app)
        .put(`/api/events/${slot2Id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ status: 'SWAPPABLE' });

      const swapRes = await request(app)
        .post('/api/swap/request')
        .set('Authorization', `Bearer ${user1Token}`)
        .send({
          mySlotId: slot1Id,
          theirSlotId: slot2Id
        });
      swapRequestId = swapRes.body.swapRequest.id;
    });

    it('should reject swap and revert status to SWAPPABLE', async () => {
      await request(app)
        .post(`/api/swap/respond/${swapRequestId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ accept: false })
        .expect(200);

      // Verify both slots back to SWAPPABLE
      const slot1 = await request(app)
        .get(`/api/events/${slot1Id}`)
        .set('Authorization', `Bearer ${user1Token}`);
      expect(slot1.body.event.status).toBe('SWAPPABLE');

      const slot2 = await request(app)
        .get(`/api/events/${slot2Id}`)
        .set('Authorization', `Bearer ${user2Token}`);
      expect(slot2.body.event.status).toBe('SWAPPABLE');
    });
  });
});
