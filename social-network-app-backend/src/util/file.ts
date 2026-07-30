import path from 'path';
import fs from 'fs';

/**
 * Delete an uploaded image under the upload directory only.
 * Rejects absolute paths, traversal (`..`), and paths outside `uploadDir`.
 */
export function clearImage(filePath: string, uploadDir = 'images'): void {
  if (!filePath || typeof filePath !== 'string') {
    return;
  }

  const forward = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
  if (
    forward.includes('..') ||
    path.isAbsolute(filePath) ||
    !forward.startsWith(`${uploadDir}/`)
  ) {
    return;
  }

  const root = path.resolve(process.cwd(), uploadDir);
  const resolved = path.resolve(process.cwd(), forward);

  if (resolved !== root && !resolved.startsWith(root + path.sep)) {
    return;
  }

  fs.unlink(resolved, (err) => {
    if (err) {
      console.log(err);
    }
  });
}
