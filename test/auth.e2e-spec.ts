import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { AuthModule } from '../src/modules/auth/auth.module';
import { AuthRepository } from '../src/modules/auth/auth.repository';

type RefreshRecord = {
  id: string;
  userId: string;
  role: Role;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  deletedAt: Date | null;
  device?: string;
  ipAddress?: string;
  userAgent?: string;
};

class FakeAuthRepository {
  public revokedAllUsers = new Set<string>();
  private employees = new Map<string, { id: string; email: string; passwordHash: string; role: Role }>();
  private customers = new Map<string, { id: string; email: string; passwordHash: string; role: Role }>();
  private refreshTokens = new Map<string, RefreshRecord>();

  seed(employeeHash: string, customerHash: string) {
    this.employees.set('admin@example.com', { id: 'emp-1', email: 'admin@example.com', passwordHash: employeeHash, role: Role.Admin });
    this.customers.set('customer@example.com', { id: 'cus-1', email: 'customer@example.com', passwordHash: customerHash, role: Role.Customer });
  }

  findEmployeeByEmail(email: string) { return Promise.resolve(this.employees.get(email) ?? null); }
  findCustomerByEmail(email: string) { return Promise.resolve(this.customers.get(email) ?? null); }

  createRefreshToken(userId: string, role: Role, expiresAt: Date, session: Partial<RefreshRecord>) {
    const id = randomUUID();
    const record: RefreshRecord = { id, userId, role, tokenHash: '', expiresAt, revokedAt: null, deletedAt: null, ...session };
    this.refreshTokens.set(id, record);
    return Promise.resolve(record);
  }

  updateRefreshTokenHash(id: string, tokenHash: string) {
    const row = this.refreshTokens.get(id);
    if (row) row.tokenHash = tokenHash;
    return Promise.resolve(row);
  }

  findRefreshTokenById(id: string) { return Promise.resolve(this.refreshTokens.get(id) ?? null); }

  findActiveRefreshToken(id: string, userId: string, role: Role) {
    const row = this.refreshTokens.get(id);
    if (!row) return Promise.resolve(null);
    if (row.userId !== userId || row.role !== role || row.revokedAt || row.deletedAt) return Promise.resolve(null);
    return Promise.resolve(row);
  }

  revokeRefreshToken(id: string) {
    const row = this.refreshTokens.get(id);
    if (row) row.revokedAt = new Date();
    return Promise.resolve(row);
  }

  revokeAllUserRefreshTokens(userId: string) {
    this.revokedAllUsers.add(userId);
    for (const row of this.refreshTokens.values()) {
      if (row.userId === userId && !row.revokedAt) row.revokedAt = new Date();
    }
    return Promise.resolve({ count: 1 });
  }

  createAuditLog() { return Promise.resolve(null); }
}

describe('Auth E2E', () => {
  let app: INestApplication;
  let repo: FakeAuthRepository;

  beforeAll(async () => {
    process.env.JWT_ACCESS_SECRET = 'access-secret';
    process.env.JWT_REFRESH_SECRET = 'refresh-secret';

    const employeeHash = await bcrypt.hash('Password@123', 10);
    const customerHash = await bcrypt.hash('Password@123', 10);
    repo = new FakeAuthRepository();
    repo.seed(employeeHash, customerHash);

    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule],
    })
      .overrideProvider(AuthRepository)
      .useValue(repo)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  it('login should return access and refresh tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'Password@123', role: 'Admin' })
      .expect(201);

    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
  });

  it('refresh should rotate token and reject reused refresh token', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'Password@123', role: 'Admin' })
      .expect(201);

    const refresh1 = login.body.refreshToken;

    const rotated = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: refresh1 })
      .expect(201);

    const refresh2 = rotated.body.refreshToken;

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: refresh1 })
      .expect(401);

    expect(repo.revokedAllUsers.has('emp-1')).toBe(true);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: refresh2 })
      .expect(401);
  });

  it('logout should revoke token', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'Password@123', role: 'Admin' })
      .expect(201);

    const refreshToken = login.body.refreshToken;

    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(401);
  });

  it('role guard should allow admin and reject customer', async () => {
    const adminLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@example.com', password: 'Password@123', role: 'Admin' })
      .expect(201);

    await request(app.getHttpServer())
      .get('/auth/admin-example')
      .set('Authorization', `Bearer ${adminLogin.body.accessToken}`)
      .expect(200);

    const customerLogin = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'customer@example.com', password: 'Password@123', role: 'Customer' })
      .expect(201);

    await request(app.getHttpServer())
      .get('/auth/admin-example')
      .set('Authorization', `Bearer ${customerLogin.body.accessToken}`)
      .expect(403);
  });
});
