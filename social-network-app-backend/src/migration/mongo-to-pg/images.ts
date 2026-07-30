import fs from 'fs';
import path from 'path';
import type { ImageCheckResult, PlannedPost } from './types';

/**
 * Resolve a post imageUrl relative to an images root.
 * Accepts both `images/foo.jpg` and `foo.jpg` forms.
 */
export function resolveImagePath(imagesRoot: string, imageUrl: string): string {
  const normalized = imageUrl.replace(/\\/g, '/').replace(/^\/+/, '');
  const relative = normalized.startsWith('images/')
    ? normalized.slice('images/'.length)
    : normalized;
  return path.join(imagesRoot, relative);
}

export function checkImages(
  posts: PlannedPost[],
  imagesSourceDir?: string,
): Pick<ImageCheckResult, 'present' | 'missing'> {
  const present: string[] = [];
  const missing: string[] = [];

  if (!imagesSourceDir) {
    for (const post of posts) {
      missing.push(post.imageUrl);
    }
    return { present, missing };
  }

  const seen = new Set<string>();
  for (const post of posts) {
    if (seen.has(post.imageUrl)) {
      continue;
    }
    seen.add(post.imageUrl);
    const absolute = resolveImagePath(imagesSourceDir, post.imageUrl);
    if (fs.existsSync(absolute)) {
      present.push(post.imageUrl);
    } else {
      missing.push(post.imageUrl);
    }
  }

  return { present, missing };
}

export function copyImages(
  imageUrls: string[],
  sourceDir: string,
  destDir: string,
): Pick<ImageCheckResult, 'copied' | 'skippedExisting'> {
  const copied: string[] = [];
  const skippedExisting: string[] = [];

  fs.mkdirSync(destDir, { recursive: true });

  for (const imageUrl of imageUrls) {
    const src = resolveImagePath(sourceDir, imageUrl);
    const dest = resolveImagePath(destDir, imageUrl);
    fs.mkdirSync(path.dirname(dest), { recursive: true });

    if (fs.existsSync(dest)) {
      skippedExisting.push(imageUrl);
      continue;
    }

    if (!fs.existsSync(src)) {
      continue;
    }

    fs.copyFileSync(src, dest);
    copied.push(imageUrl);
  }

  return { copied, skippedExisting };
}
