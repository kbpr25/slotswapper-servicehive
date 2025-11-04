import request from 'supertest';
import express from 'express';

// Helper to create a test user and return token
export const createTestUser = async (app: express.Application, userData: {
  name: string;
  email: string;
  password: string;
}) => {
  const response = await request(app)
    .post('/api/auth/register')
    .send(userData);
  
  return {
    user: response.body.user,
    token: response.body.token
  };
};

// Helper to login and get token
export const loginTestUser = async (app: express.Application, credentials: {
  email: string;
  password: string;
}) => {
  const response = await request(app)
    .post('/api/auth/login')
    .send(credentials);
  
  return {
    user: response.body.user,
    token: response.body.token
  };
};

// Helper to create a test event
export const createTestEvent = async (
  app: express.Application,
  token: string,
  eventData: {
    title: string;
    start_time: string;
    end_time: string;
  }
) => {
  const response = await request(app)
    .post('/api/events')
    .set('Authorization', `Bearer ${token}`)
    .send(eventData);
  
  return response.body.event;
};
