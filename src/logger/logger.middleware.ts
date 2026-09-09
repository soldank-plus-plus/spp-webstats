import { NextFunction, Request, Response } from 'express';

import { Injectable, Logger, NestMiddleware } from '@nestjs/common';

// a failed lookup here would put the nickname someone typed into the log, and a
// 404 from a profile search says nothing about a broken page
const UNLOGGED_PATH_PREFIX = '/climb/users/by-username/';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    // the query string is dropped on purpose: it carries values people typed,
    // such as a username in a search filter, which have no place in a log.
    // req.path cannot be used here, it is relative to where the middleware is
    // mounted and resolves to "/" for every request
    const { method, originalUrl } = request;
    const path = originalUrl.split('?')[0];

    response.on('finish', () => {
      const { statusCode } = response;

      if (statusCode >= 400 && !path.startsWith(UNLOGGED_PATH_PREFIX)) {
        this.logger.error(`${method} ${path} ${statusCode}`);

        return;
      }
    });

    next();
  }
}
