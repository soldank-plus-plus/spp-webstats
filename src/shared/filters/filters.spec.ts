import { ArgumentsHost, Logger } from '@nestjs/common';
import { AbstractHttpAdapter } from '@nestjs/core';
import { QueryFailedError } from 'typeorm';
import { QueryFailedFilter } from './filters';

const response = {};
const host = {
  getArgByIndex: () => response,
} as unknown as ArgumentsHost;

const driverError = (code: string) =>
  Object.assign(new Error('boom'), { code });

describe('QueryFailedFilter', () => {
  const adapter = {
    isHeadersSent: () => false,
    reply: jest.fn(),
    end: jest.fn(),
  };
  const filter = new QueryFailedFilter(
    adapter as unknown as AbstractHttpAdapter,
  );

  // BaseExceptionFilter logs every unknown error, which is noise here
  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
  });
  beforeEach(() => adapter.reply.mockClear());

  it('answers 400 when the value did not parse as the column type', () => {
    filter.catch(
      new QueryFailedError('SELECT 1', [], driverError('22P02')),
      host,
    );

    expect(adapter.reply).toHaveBeenCalledWith(
      response,
      expect.objectContaining({
        statusCode: 400,
        message: 'Invalid query parameter value',
      }),
      400,
    );
  });

  it('keeps the driver message out of the response', () => {
    filter.catch(
      new QueryFailedError(
        'SELECT * FROM maps WHERE hardest = $1',
        [''],
        driverError('22P02'),
      ),
      host,
    );

    expect(JSON.stringify(adapter.reply.mock.calls[0])).not.toContain('maps');
  });

  it('leaves any other database failure a 500', () => {
    filter.catch(
      new QueryFailedError('SELECT 1', [], driverError('08006')),
      host,
    );

    expect(adapter.reply).toHaveBeenCalledWith(
      response,
      expect.objectContaining({ statusCode: 500 }),
      500,
    );
  });
});
