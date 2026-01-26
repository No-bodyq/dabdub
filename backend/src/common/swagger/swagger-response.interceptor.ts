import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SwaggerResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const requestId = request.id || `req-${Date.now()}`;

    return next.handle().pipe(
      map((data) => {
        // If data is already wrapped with requestId, return as is
        if (data && typeof data === 'object' && 'requestId' in data) {
          return data;
        }

        // Wrap response with requestId
        return {
          ...data,
          requestId,
        };
      }),
    );
  }
}
