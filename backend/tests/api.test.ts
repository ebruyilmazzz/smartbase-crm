import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/server.js';

describe('SMARTBASE CRM Backend API Test Suite', () => {
  let adminToken = '';
  let salesToken = '';
  let devToken = '';
  let createdCompanyId = '';
  let createdTaskId = '';
  let createdRequestId = '';

  beforeAll(async () => {
    // 1. Authenticate Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@smartbase.com', password: 'Admin123!' });
    expect(adminRes.status).toBe(200);
    expect(adminRes.body.success).toBe(true);
    expect(adminRes.body.data.token).toBeDefined();
    adminToken = adminRes.body.data.token;

    // 2. Authenticate Sales
    const salesRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'sales@smartbase.com', password: 'Sales123!' });
    expect(salesRes.status).toBe(200);
    salesToken = salesRes.body.data.token;

    // 3. Authenticate Dev
    const devRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'dev@smartbase.com', password: 'Dev123!' });
    expect(devRes.status).toBe(200);
    devToken = devRes.body.data.token;
  });

  describe('1. Authentication & Authorization', () => {
    it('should reject invalid credentials with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@smartbase.com', password: 'WrongPassword123' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return authenticated user profile from /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.email).toBe('admin@smartbase.com');
      expect(res.body.data.role).toBe('ADMIN');
    });

    it('should prevent non-admin from accessing user management /api/settings/users', async () => {
      const res = await request(app)
        .get('/api/settings/users')
        .set('Authorization', `Bearer ${salesToken}`);
      expect(res.status).toBe(403);
    });

    it('should allow admin to access /api/settings/users', async () => {
      const res = await request(app)
        .get('/api/settings/users')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('2. Company Management & Relationships', () => {
    it('should list companies with real counts and pagination', async () => {
      const res = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.meta.total).toBeGreaterThan(0);
    });

    it('should create a new company with primary contact and log activity', async () => {
      const res = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          companyName: 'Akdeniz Lojistik A.Ş.',
          status: 'Lead',
          industry: 'Lojistik & Taşımacılık',
          description: 'Filo ve sevkiyat takip entegrasyonu talep ediliyor.',
          phone: '+90 242 111 2233',
          email: 'info@akdenizlojistik.com',
          primaryContact: {
            name: 'Murat Can',
            position: 'Operasyon Müdürü',
            phone: '+90 533 111 2233',
            email: 'murat@akdenizlojistik.com',
          },
        });
      expect(res.status).toBe(201);
      expect(res.body.data.companyName).toBe('Akdeniz Lojistik A.Ş.');
      expect(res.body.data.contacts.length).toBe(1);
      createdCompanyId = res.body.data.id;
    });

    it('should get company details with full relational tabs (tasks, requests, notes, activities)', async () => {
      const res = await request(app)
        .get(`/api/companies/${createdCompanyId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(createdCompanyId);
      expect(res.body.data.contacts).toBeDefined();
      expect(res.body.data.tasks).toBeDefined();
      expect(res.body.data.customerRequests).toBeDefined();
      expect(res.body.data.activities).toBeDefined();
    });

    it('should add an additional contact to the company', async () => {
      const res = await request(app)
        .post(`/api/companies/${createdCompanyId}/contacts`)
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          name: 'Zeynep Kaya',
          position: 'Finans Yöneticisi',
          phone: '+90 534 888 7766',
          email: 'zeynep@akdenizlojistik.com',
          isPrimary: false,
        });
      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Zeynep Kaya');
    });

    it('should update company info and reflect changes', async () => {
      const res = await request(app)
        .put(`/api/companies/${createdCompanyId}`)
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          status: 'Active',
          currentSoftware: 'SAP Business One',
        });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('Active');
      expect(res.body.data.currentSoftware).toBe('SAP Business One');
    });
  });

  describe('3. Tasks & Workflow Status Updates', () => {
    it('should create a task associated with the company and trigger activity log', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          title: 'Araç Takip API Entegrasyonu',
          description: 'GPS konum verilerini SmartBase rota ekranına aktaracak web servis.',
          companyId: createdCompanyId,
          status: 'Pending',
          priority: 'High',
        });
      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Araç Takip API Entegrasyonu');
      createdTaskId = res.body.data.id;
    });

    it('should allow status transition and automatically create activity entry', async () => {
      const res = await request(app)
        .put(`/api/tasks/${createdTaskId}`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({
          status: 'Development',
        });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('Development');

      // Verify activity was created
      const actRes = await request(app)
        .get(`/api/activities?taskId=${createdTaskId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(actRes.status).toBe(200);
      expect(actRes.body.data.length).toBeGreaterThan(0);
      expect(actRes.body.data[0].action).toBe('TASK_STATUS_CHANGED');
    });
  });

  describe('4. Customer Requests & Solutions', () => {
    it('should create customer request', async () => {
      const res = await request(app)
        .post('/api/requests')
        .set('Authorization', `Bearer ${salesToken}`)
        .send({
          title: 'Sürücü Mobil Uygulamasında Dijital İmza Talebi',
          description: 'Teslimat anında müşteri imzasının tabletten kaydedilmesi gerekmektedir.',
          companyId: createdCompanyId,
          requestedBy: 'Murat Can',
          priority: 'Urgent',
          status: 'New',
        });
      expect(res.status).toBe(201);
      expect(res.body.data.priority).toBe('Urgent');
      createdRequestId = res.body.data.id;
    });

    it('should update request with solution and mark in progress', async () => {
      const res = await request(app)
        .put(`/api/requests/${createdRequestId}`)
        .set('Authorization', `Bearer ${devToken}`)
        .send({
          status: 'Development',
          solution: 'Canvas tabanlı imza bileşeni ve PDF ekleme modülü eklendi.',
        });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('Development');
      expect(res.body.data.solution).toContain('Canvas');
    });
  });

  describe('5. Notes & Collaboration', () => {
    it('should add a note to the company and task', async () => {
      const res = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${devToken}`)
        .send({
          content: 'API test anahtarları müşteri IT sorumlusundan temin edildi.',
          companyId: createdCompanyId,
          taskId: createdTaskId,
        });
      expect(res.status).toBe(201);
      expect(res.body.data.content).toContain('API test anahtarları');
    });
  });

  describe('6. Dashboard & Reports Real Data Aggregations', () => {
    it('should return live dashboard statistics with urgent tasks and activities', async () => {
      const res = await request(app)
        .get('/api/reports/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.summary.totalCompanies).toBeGreaterThanOrEqual(4);
      expect(res.body.data.summary.openTasks).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(res.body.data.urgentAndPendingTasks)).toBe(true);
      expect(Array.isArray(res.body.data.recentRequests)).toBe(true);
      expect(Array.isArray(res.body.data.recentActivities)).toBe(true);
    });

    it('should return analytics breakdown for charts', async () => {
      const res = await request(app)
        .get('/api/reports/analytics')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.charts.tasksByStatus.length).toBeGreaterThan(0);
      expect(res.body.data.charts.tasksByPriority.length).toBeGreaterThan(0);
      expect(res.body.data.charts.companiesByStatus.length).toBeGreaterThan(0);
    });
  });

  describe('7. Global Search', () => {
    it('should return matching companies, tasks, and requests across entities', async () => {
      const res = await request(app)
        .get('/api/search?q=Nova')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.companies.some((c: any) => c.companyName.includes('Nova'))).toBe(true);
      expect(res.body.data.tasks.length).toBeGreaterThan(0);
    });
  });
});
