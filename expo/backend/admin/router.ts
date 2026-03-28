import { Hono } from 'hono';
import { db } from '../lib/db';
import { comparePassword, generateAdminToken, hashPassword, verifyAdminToken } from '../lib/auth';

const FRONTEND_BACKOFFICE_URL = process.env.FRONTEND_BACKOFFICE_URL || '*';

export const adminRouter = new Hono();

adminRouter.use('*', async (c, next) => {
  c.res.headers.set('Access-Control-Allow-Origin', FRONTEND_BACKOFFICE_URL);
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  c.res.headers.set('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  if (c.req.method === 'OPTIONS') return c.text('ok');
  return next();
});

async function requireAdmin(c: any, next: () => Promise<void>) {
  const auth = c.req.header('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  const token = auth.replace('Bearer ', '');
  const payload = verifyAdminToken(token);
  if (!payload || payload.role !== 'admin') {
    return c.json({ error: 'Forbidden' }, 403);
  }
  c.set('admin', payload);
  await next();
}

adminRouter.post('/login', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const email = String(body.email || '');
    const password = String(body.password || '');

    if (!email || !password) return c.json({ error: 'Missing credentials' }, 400);

    let admin = await db.getAdminByEmail(email);

    if (!admin) {
      const seedEmail = process.env.ADMIN_SEED_EMAIL || 'admin@motofast.com';
      const seedPass = process.env.ADMIN_SEED_PASSWORD || 'admin1234';
      if (email === seedEmail && password === seedPass) {
        admin = await db.createAdminUser({
          id: `adm_${Date.now()}`,
          email,
          password_hash: await hashPassword(password),
          role: 'admin',
          created_at: new Date().toISOString(),
        });
      }
    }

    if (!admin) return c.json({ error: 'Invalid credentials' }, 401);

    const ok = await comparePassword(password, admin.password_hash);
    if (!ok) return c.json({ error: 'Invalid credentials' }, 401);

    const token = generateAdminToken({ adminId: admin.id, email: admin.email, role: 'admin' });
    return c.json({ token, user: { id: admin.id, role: 'admin' as const, email: admin.email } });
  } catch (e) {
    console.error('Admin login error', e);
    return c.json({ error: 'Login failed' }, 500);
  }
});

adminRouter.get('/users', requireAdmin, async (c) => {
  const url = new URL(c.req.url);
  const page = Math.max(parseInt(url.searchParams.get('page') || '1', 10), 1);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '20', 10), 1), 100);
  const search = (url.searchParams.get('search') || '').toLowerCase();

  const users = await db.getUsers();
  const filtered = users.filter(u =>
    !search || u.name.toLowerCase().includes(search) || u.email.toLowerCase().includes(search) || u.phone.includes(search)
  );
  const total = filtered.length;
  const start = (page - 1) * limit;
  const data = filtered.slice(start, start + limit).map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    verified: u.email_verified,
    kyc_status: u.kyc_status,
    documents: Object.entries(u.documents || {}).filter(([_, v]) => !!v).map(([k]) => ({
      type: k,
      status: u.kyc_status === 'approved' ? 'approved' : u.kyc_status === 'rejected' ? 'rejected' : 'pending',
      url: null,
    })),
    createdAt: u.created_at,
    role: 'client',
  }));

  return c.json({ total, page, limit, data });
});

adminRouter.get('/users/:id', requireAdmin, async (c) => {
  const id = c.req.param('id');
  const u = await db.getUserById(id);
  if (!u) return c.json({ error: 'Not found' }, 404);
  return c.json({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    verified: u.email_verified,
    kyc_status: u.kyc_status,
    documents: u.documents,
    createdAt: u.created_at,
    role: 'client',
  });
});

adminRouter.patch('/users/:id', requireAdmin, async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({} as any));
  const updates: any = {};
  if (typeof body.verified === 'boolean') updates.email_verified = body.verified;
  if (body.kyc_status && ['pending','approved','rejected'].includes(body.kyc_status)) updates.kyc_status = body.kyc_status;
  const updated = await db.updateUser(id, updates);
  if (!updated) return c.json({ error: 'Not found' }, 404);
  const auth = c.req.header('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const adminPayload = token ? verifyAdminToken(token) : null;
  await db.addAuditLog({ id: `log_${Date.now()}`, admin_id: adminPayload?.adminId || 'unknown', action: 'PATCH /users', target: id, created_at: new Date().toISOString() });
  return c.json({ success: true });
});

adminRouter.delete('/users/:id', requireAdmin, async (c) => {
  const id = c.req.param('id');
  const ok = await db.deleteUser(id);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  const auth = c.req.header('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const adminPayload = token ? verifyAdminToken(token) : null;
  await db.addAuditLog({ id: `log_${Date.now()}`, admin_id: adminPayload?.adminId || 'unknown', action: 'DELETE /users', target: id, created_at: new Date().toISOString() });
  return c.json({ success: true });
});

adminRouter.get('/documents', requireAdmin, async (c) => {
  const users = await db.getUsers();
  const docs = users.flatMap(u => {
    const entries = Object.entries(u.documents || {} as Record<string, string | undefined>).filter(([_, v]) => !!v);
    return entries.map(([type, value]) => ({
      id: `${u.id}_${type}`,
      userId: u.id,
      type,
      status: u.kyc_status === 'approved' ? 'approved' : u.kyc_status === 'rejected' ? 'rejected' : 'pending',
      url: null,
      size: value ? value.length : 0,
      createdAt: u.created_at,
    }));
  });
  return c.json({ total: docs.length, data: docs });
});

adminRouter.get('/documents/:docId', requireAdmin, async (c) => {
  const docId = c.req.param('docId');
  const [userId, type] = docId.split('_');
  const u = await db.getUserById(userId);
  if (!u) return c.json({ error: 'Not found' }, 404);
  const value = (u.documents as any)[type];
  if (!value) return c.json({ error: 'Not found' }, 404);
  return c.json({ id: docId, userId, type, data: value });
});

adminRouter.get('/deliveries', requireAdmin, async (c) => {
  return c.json({ total: 0, data: [] });
});

adminRouter.get('/rentals', requireAdmin, async (c) => {
  return c.json({ total: 0, data: [] });
});

adminRouter.get('/payments', requireAdmin, async (c) => {
  return c.json({ total: 0, data: [] });
});

adminRouter.get('/logs', requireAdmin, async (c) => {
  const logs = await db.getAuditLogs();
  return c.json({ total: logs.length, data: logs });
});

adminRouter.get('/config', requireAdmin, async (c) => {
  return c.json({
    env: {
      FRONTEND_BACKOFFICE_URL: process.env.FRONTEND_BACKOFFICE_URL || '*',
      JWT_ADMIN_EXPIRES_IN: process.env.JWT_ADMIN_EXPIRES_IN || '1h',
    },
  });
});
