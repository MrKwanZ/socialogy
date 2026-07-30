import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * REST error shape: `{ message, data? }` with status from
 * HttpException or default 500 (including plain `Error('Not authenticated!')`).
 */
@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') {
      throw exception;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        response.status(status).json({ message: body });
        return;
      }
      const record = body as Record<string, unknown>;
      response.status(status).json({
        message: (record.message as string) ?? exception.message,
        data: record.data,
      });
      return;
    }

    const message =
      exception instanceof Error ? exception.message : 'An error occurred.';
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message });
  }
}
