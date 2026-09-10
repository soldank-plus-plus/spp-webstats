import {
  ArgumentMetadata,
  BadRequestException,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import { FindActivityQueryDto } from '@api/features/climb/stats/dto/activity-query.dto';
import { StatsService } from '@api/features/climb/stats/stats.service';
import { PositionsService } from '@api/features/climb/positions/positions.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

// The same options main.ts registers globally, so these cases exercise the
// pipe the activity query really goes through
const pipe = new ValidationPipe({
  transform: true,
  disableErrorMessages: false,
  forbidUnknownValues: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});

const metadata: ArgumentMetadata = {
  type: 'query',
  metatype: FindActivityQueryDto,
  data: undefined,
};

const transformQuery = (query: Record<string, unknown>) =>
  pipe.transform(query, metadata) as Promise<FindActivityQueryDto>;

describe('activity query validation', () => {
  it('accepts a year and hands it over as a number', async () => {
    const query = await transformQuery({ type: 'records', year: '2024' });

    expect(query).toBeInstanceOf(FindActivityQueryDto);
    expect(query.year).toBe(2024);
  });

  it('leaves year undefined when it is not given', async () => {
    const query = await transformQuery({ type: 'records' });

    expect(query.year).toBeUndefined();
  });

  it.each(['abc', '', '2024.5'])('rejects year=%p', async (year) => {
    await expect(transformQuery({ type: 'records', year })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects an unknown type', async () => {
    await expect(transformQuery({ type: 'bogus' })).rejects.toThrow(
      BadRequestException,
    );
  });

  it('rejects an unexpected query property', async () => {
    await expect(
      transformQuery({ type: 'records', month: '3' }),
    ).rejects.toThrow(BadRequestException);
  });
});

describe('UsersController.findActivity', () => {
  const findActivityForUser = jest.fn().mockResolvedValue({
    year: 2024,
    years: [2024],
    days: [],
  });
  const exists = jest.fn().mockResolvedValue(true);
  const controller = new UsersController(
    { exists } as unknown as UsersService,
    {} as PositionsService,
    { findActivityForUser } as unknown as StatsService,
  );

  beforeEach(() => {
    findActivityForUser.mockClear();
    exists.mockClear().mockResolvedValue(true);
  });

  it('passes the parsed year to the service', async () => {
    await controller.findActivity(
      123,
      await transformQuery({ type: 'records', year: '2024' }),
    );

    expect(findActivityForUser).toHaveBeenCalledWith(123, 'records', 2024);
  });

  it('passes undefined so the service picks the default year', async () => {
    await controller.findActivity(123, await transformQuery({ type: 'golds' }));

    expect(findActivityForUser).toHaveBeenCalledWith(123, 'golds', undefined);
  });

  it('answers 404 without asking for the activity of a user that is not there', async () => {
    exists.mockResolvedValue(false);

    await expect(
      controller.findActivity(123, await transformQuery({ type: 'records' })),
    ).rejects.toThrow(NotFoundException);

    expect(findActivityForUser).not.toHaveBeenCalled();
  });
});
