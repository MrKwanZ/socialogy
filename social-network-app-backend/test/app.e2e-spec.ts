import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';

describe('Foundation (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    process.env.PORT = '8080';
    process.env.CORS_ORIGIN = '*';
    process.env.UPLOAD_PATH = 'images';
    process.env.DB_HOST = process.env.DB_HOST ?? 'localhost';
    process.env.DB_PORT = process.env.DB_PORT ?? '5432';
    process.env.DB_USER = process.env.DB_USER ?? 'postgres';
    process.env.DB_PASSWORD = process.env.DB_PASSWORD ?? 'postgres';
    process.env.DB_DATABASE = process.env.DB_DATABASE ?? 'socialogy';
    process.env.DB_SYNC = '0';
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret-phase1';
    process.env.JWT_EXPIRES_IN = '1h';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: false,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns ok', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('POST /graphql answers the health query', async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({ query: '{ health }' })
      .expect(200);

    const body = res.body as {
      data?: { health: string };
      errors?: unknown[];
    };

    expect(body.errors).toBeUndefined();
    expect(body.data).toEqual({ health: 'ok' });
  });
});
