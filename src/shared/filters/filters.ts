import { ArgumentsHost, BadRequestException, Catch } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { QueryFailedError } from 'typeorm';

// Postgres invalid_text_representation: a value could not be parsed as the
// column's type. Pagination filters go from the query string straight into the
// statement, so this means a malformed request rather than a broken server
const INVALID_TEXT_REPRESENTATION = '22P02';

@Catch(QueryFailedError)
export class QueryFailedFilter extends BaseExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost): void {
    const { code } = (exception.driverError ?? {}) as { code?: string };

    if (code === INVALID_TEXT_REPRESENTATION) {
      // the driver message quotes the failing statement, so it never reaches
      // the client
      super.catch(
        new BadRequestException('Invalid query parameter value'),
        host,
      );

      return;
    }

    super.catch(exception, host);
  }
}
