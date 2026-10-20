import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiResponse } from '@clinic/shared-types';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred';
    let code = 'INTERNAL_SERVER_ERROR';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        message = (res as any).message || message;
        code = (res as any).error || code;
        details = (res as any).details || null;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const payload: ApiResponse<null> = {
      success: false,
      data: null,
      errors: [
        {
          code: String(code),
          message: Array.isArray(message) ? message.join(', ') : String(message),
          details,
        },
      ],
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(payload);
  }
}
