import fs from 'fs';
import os from 'os';
import path from 'path';
import { checkImages, copyImages, resolveImagePath } from './images';
import type { PlannedPost } from './types';

describe('mongo-to-pg images', () => {
  it('resolves images/ relative paths under the root', () => {
    expect(resolveImagePath('/data', 'images/a-.jpg')).toBe(
      path.join('/data', 'a-.jpg'),
    );
    expect(resolveImagePath('/data', 'a-.jpg')).toBe(
      path.join('/data', 'a-.jpg'),
    );
  });

  it('checks presence and copies without overwriting', () => {
    const src = fs.mkdtempSync(path.join(os.tmpdir(), 'img-src-'));
    const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'img-dest-'));
    try {
      fs.writeFileSync(path.join(src, 'one-.jpg'), 'a');
      const posts: PlannedPost[] = [
        {
          mongoId: '1',
          title: 't',
          content: 'c',
          imageUrl: 'images/one-.jpg',
          creatorMongoId: 'u',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          mongoId: '2',
          title: 't',
          content: 'c',
          imageUrl: 'images/missing-.jpg',
          creatorMongoId: 'u',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const checked = checkImages(posts, src);
      expect(checked.present).toEqual(['images/one-.jpg']);
      expect(checked.missing).toEqual(['images/missing-.jpg']);

      const first = copyImages(checked.present, src, dest);
      expect(first.copied).toEqual(['images/one-.jpg']);
      expect(fs.readFileSync(path.join(dest, 'one-.jpg'), 'utf8')).toBe('a');

      const second = copyImages(checked.present, src, dest);
      expect(second.copied).toEqual([]);
      expect(second.skippedExisting).toEqual(['images/one-.jpg']);
    } finally {
      fs.rmSync(src, { recursive: true, force: true });
      fs.rmSync(dest, { recursive: true, force: true });
    }
  });
});
