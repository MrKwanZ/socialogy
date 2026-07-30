import {
  Body,
  Controller,
  Put,
  Req,
  Res,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import path from 'path';
import { TypedConfigService } from '../config/typed-config.service';
import type { AuthenticatedRequest } from '../auth/authenticated-request';
import { clearImage } from '../util/file';
import { HttpErrorFilter } from '../common/filters/http-error.filter';

@Controller()
@UseFilters(HttpErrorFilter)
export class UploadsController {
  private readonly uploadPath: string;

  constructor(config: TypedConfigService) {
    const appConfig = config.get('app', { infer: true })!;
    this.uploadPath = appConfig.uploadPath;
  }

  @Put('post-image')
  @UseInterceptors(FileInterceptor('image'))
  uploadPostImage(
    @Req() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('oldPath') oldPath?: string,
  ): { message: string; filePath?: string } {
    // Contract: plain Error → HTTP 500 `{ message: "Not authenticated!" }`
    if (!req.isAuth) {
      throw new Error('Not authenticated!');
    }

    if (!file) {
      res.status(200);
      return { message: 'No file provided!' };
    }

    if (oldPath) {
      clearImage(oldPath, this.uploadPath);
    }

    const filePath = path
      .relative(process.cwd(), file.path)
      .split(path.sep)
      .join('/');

    res.status(201);
    return {
      message: 'File stored.',
      filePath,
    };
  }
}
