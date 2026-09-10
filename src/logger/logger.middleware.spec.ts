import { Logger } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { LoggerMiddleware } from './logger.middleware';

type FinishHandler = () => void;

const requestFor = (method: string, originalUrl: string) =>
  ({ method, originalUrl }) as Request;

const responseFor = (statusCode: number) => {
  const handlers: FinishHandler[] = [];

  return {
    response: {
      statusCode,
      on: (event: string, handler: FinishHandler) => {
        if (event === 'finish') {
          handlers.push(handler);
        }
      },
    } as unknown as Response,
    finish: () => handlers.forEach((handler) => handler()),
  };
};

describe('LoggerMiddleware', () => {
  const middleware = new LoggerMiddleware();
  let error: jest.SpyInstance;

  beforeEach(() => {
    error = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });
  afterEach(() => error.mockRestore());

  const handle = (
    method: string,
    url: string,
    statusCode: number,
  ): NextFunction => {
    const next = jest.fn();
    const { response, finish } = responseFor(statusCode);

    middleware.use(requestFor(method, url), response, next);
    finish();

    return next;
  };

  it('passes the request on to the next handler', () => {
    const next = handle('GET', '/climb/maps', 200);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it('says nothing about a request that succeeded', () => {
    handle('GET', '/climb/maps', 200);

    expect(error).not.toHaveBeenCalled();
  });

  it('logs the method, path and status of a failed request', () => {
    handle('GET', '/climb/maps/999', 404);

    expect(error).toHaveBeenCalledWith('GET /climb/maps/999 404');
  });

  it('logs a server error too', () => {
    handle('GET', '/climb/users', 500);

    expect(error).toHaveBeenCalledWith('GET /climb/users 500');
  });

  it('keeps the query string, which carries what people typed, out of the log', () => {
    handle('GET', '/climb/users?search=someone%20real&page=2', 400);

    expect(error).toHaveBeenCalledWith('GET /climb/users 400');
  });

  it('does not log a failed username lookup, which would name the person', () => {
    handle('GET', '/climb/users/by-username/SomeNickname', 404);

    expect(error).not.toHaveBeenCalled();
  });

  it('still logs failures on other user routes', () => {
    handle('GET', '/climb/users/12/stats', 404);

    expect(error).toHaveBeenCalledWith('GET /climb/users/12/stats 404');
  });
});
