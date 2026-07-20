import path from 'path';
import fs from 'fs';
import { getRootDir } from './paths';

export const clearImage = (filePath: string): void => {
  const resolvedPath = path.join(getRootDir(), filePath);
  fs.unlink(resolvedPath, (err) => {
    if (err) console.log(err);
  });
};
