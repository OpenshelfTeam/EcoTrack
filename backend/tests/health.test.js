import request from 'supertest';
import { getTestApp, stopTestDB } from './testUtils.js';

let app;

describe('Health & System Check - Comprehensive Tests', () => {
  beforeAll(async () => {
    app = await getTestApp();
  });

  afterAll(async () => {
    await stopTestDB();
  });

  describe('GET /api/health - Health Check', () => {
    test('should return 200 and health status', async () => {
      const res = await request(app)
        .get('/api/health')
        .expect(200);

      expect(res.body.status).toBe('OK');
      expect(res.body).toHaveProperty('timestamp');
      expect(res.body).toHaveProperty('uptimeSeconds');
      expect(res.body).toHaveProperty('nodeVersion');
      expect(res.body).toHaveProperty('db');
    });

    test('should return valid database connection info', async () => {
      const res = await request(app)
        .get('/api/health')
        .expect(200);

      expect(res.body.db).toBeDefined();
      expect(res.body.db.readyState).toBe(1); // 1 = connected
    });

    test('should return valid timestamp format', async () => {
      const res = await request(app)
        .get('/api/health')
        .expect(200);

      const timestamp = new Date(res.body.timestamp);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });

    test('should return positive uptime', async () => {
      const res = await request(app)
        .get('/api/health')
        .expect(200);

      expect(res.body.uptimeSeconds).toBeGreaterThan(0);
    });
  });

  describe('GET /api/check - Route Check', () => {
    test('should return available routes list', async () => {
      const res = await request(app)
        .get('/api/check')
        .expect(200);

      expect(res.body.status).toBe('OK');
      expect(res.body).toHaveProperty('availableRoutes');
      expect(Array.isArray(res.body.availableRoutes)).toBe(true);
    });

    test('should check specific route existence', async () => {
      const res = await request(app)
        .get('/api/check?path=/api/health')
        .expect(200);

      expect(res.body.requestedPath).toBe('/api/health');
      expect(res.body.exists).toBe(true);
      expect(res.body.matches).toBeDefined();
      expect(res.body.matches.length).toBeGreaterThan(0);
    });

    test('should return false for non-existent route', async () => {
      const res = await request(app)
        .get('/api/check?path=/api/nonexistent')
        .expect(200);

      expect(res.body.exists).toBe(false);
    });
  });

  describe('404 Handler', () => {
    test('should return 404 for non-existent routes', async () => {
      const res = await request(app)
        .get('/api/this-route-does-not-exist')
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('not found');
    });
  });
});
