import { plainToInstance } from 'class-transformer';
import { FindAllStatsDto } from './response.dto';

const serialize = (stat: Record<string, unknown>) =>
  plainToInstance(FindAllStatsDto, stat, { excludeExtraneousValues: true });

describe('FindAllStatsDto', () => {
  it('flattens the related map and user into names', () => {
    const dto = serialize({
      map: { id: 2, mapname: 'climb_b' },
      user: { id: 3, username: 'racer' },
    });

    expect(dto.mapname).toBe('climb_b');
    expect(dto.username).toBe('racer');
  });

  it('reports no name when the relation is missing', () => {
    const dto = serialize({ map: null });

    expect(dto.mapname).toBeNull();
    expect(dto.username).toBeNull();
  });

  it('keeps the related rows themselves out of the response', () => {
    const dto = serialize({
      map: { id: 2, mapname: 'climb_b', hardest: 9 },
      user: { id: 3, username: 'racer', playtime: 42 },
    });

    expect(dto).not.toHaveProperty('map');
    expect(dto).not.toHaveProperty('user');
    expect(JSON.stringify(dto)).not.toContain('playtime');
  });

  it('exposes exactly the documented fields', () => {
    expect(Object.keys(serialize({})).sort()).toEqual([
      'id',
      'mapId',
      'mapname',
      'position',
      'recordDate',
      'recordTime',
      'status',
      'team',
      'userId',
      'username',
    ]);
  });
});
