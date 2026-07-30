import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import fs from 'fs';
import path from 'path';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  createNestApp,
  resetTables,
  signupAndLogin,
} from './utils/auth-helpers';
import { clearImage } from '../src/util/file';

const minimalJpegBuffer = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAn/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q==',
  'base64',
);

interface UploadBody {
  message?: string;
  filePath?: string;
}

describe('Post image upload', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;
  let token: string;

  beforeAll(async () => {
    ({ app, dataSource } = await createNestApp());
  });

  beforeEach(async () => {
    await resetTables(dataSource);
    const auth = await signupAndLogin(app);
    token = auth.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('uploads an image successfully', async () => {
    const res = await request(app.getHttpServer())
      .put('/post-image')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', minimalJpegBuffer, 'test.jpg');

    const body = res.body as UploadBody;

    expect(res.status).toBe(201);
    expect(body.message).toBe('File stored.');
    expect(body.filePath).toMatch(/^images\/[0-9a-f-]{36}-\.jpg$/i);

    const absolute = path.join(process.cwd(), body.filePath!);
    expect(fs.existsSync(absolute)).toBe(true);
    fs.unlinkSync(absolute);
  });

  it('returns message when no file is provided', async () => {
    const res = await request(app.getHttpServer())
      .put('/post-image')
      .set('Authorization', `Bearer ${token}`);

    const body = res.body as UploadBody;
    expect(res.status).toBe(200);
    expect(body.message).toBe('No file provided!');
  });

  it('returns error when not authenticated', async () => {
    const res = await request(app.getHttpServer())
      .put('/post-image')
      .attach('image', minimalJpegBuffer, 'test.jpg');

    const body = res.body as UploadBody;
    expect(res.status).toBe(500);
    expect(body.message).toBe('Not authenticated!');
  });

  it('deletes oldPath when provided on successful upload', async () => {
    const imagesDir = path.join(process.cwd(), 'images');
    fs.mkdirSync(imagesDir, { recursive: true });
    const oldRelative = 'images/old-upload-test.jpg';
    const oldAbsolute = path.join(process.cwd(), oldRelative);
    fs.writeFileSync(oldAbsolute, minimalJpegBuffer);

    const res = await request(app.getHttpServer())
      .put('/post-image')
      .set('Authorization', `Bearer ${token}`)
      .field('oldPath', oldRelative)
      .attach('image', minimalJpegBuffer, 'new.jpg');

    const body = res.body as UploadBody;
    expect(res.status).toBe(201);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(fs.existsSync(oldAbsolute)).toBe(false);

    const newAbsolute = path.join(process.cwd(), body.filePath!);
    if (fs.existsSync(newAbsolute)) {
      fs.unlinkSync(newAbsolute);
    }
  });

  it('serves uploaded files from GET /images/*', async () => {
    const upload = await request(app.getHttpServer())
      .put('/post-image')
      .set('Authorization', `Bearer ${token}`)
      .attach('image', minimalJpegBuffer, 'serve.jpg');

    const uploadBody = upload.body as UploadBody;
    expect(upload.status).toBe(201);
    const filePath = uploadBody.filePath!;

    const res = await request(app.getHttpServer()).get(`/${filePath}`);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/image|octet-stream|jpeg/);

    fs.unlinkSync(path.join(process.cwd(), filePath));
  });
});

describe('clearImage path safety', () => {
  const imagesDir = path.join(process.cwd(), 'images');
  const sentinel = path.join(imagesDir, 'safe-delete-sentinel.txt');

  beforeAll(() => {
    fs.mkdirSync(imagesDir, { recursive: true });
    fs.writeFileSync(sentinel, 'keep');
  });

  afterAll(() => {
    if (fs.existsSync(sentinel)) {
      fs.unlinkSync(sentinel);
    }
  });

  it('ignores path traversal attempts', () => {
    clearImage('../images/safe-delete-sentinel.txt');
    clearImage('images/../../package.json');
    clearImage('/etc/passwd');
    expect(fs.existsSync(sentinel)).toBe(true);
  });

  it('deletes a valid relative image path', async () => {
    const relative = 'images/clear-image-ok.jpg';
    const absolute = path.join(process.cwd(), relative);
    fs.writeFileSync(absolute, 'x');
    clearImage(relative);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(fs.existsSync(absolute)).toBe(false);
  });
});
