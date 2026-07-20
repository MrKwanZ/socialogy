import path from 'path';

export function getRootDir(): string {
  const dir = __dirname;

  if (path.basename(dir) === 'dist') {
    return path.join(dir, '..');
  }

  if (
    path.basename(dir) === 'util' &&
    path.basename(path.dirname(dir)) === 'dist'
  ) {
    return path.join(dir, '../..');
  }

  if (path.basename(dir) === 'util') {
    return path.join(dir, '..');
  }

  return dir;
}
