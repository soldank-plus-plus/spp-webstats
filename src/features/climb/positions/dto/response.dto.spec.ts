import { plainToInstance } from 'class-transformer';
import { FindAllPositionsDto } from './response.dto';

const serialize = (position: Record<string, unknown>) =>
  plainToInstance(FindAllPositionsDto, position, {
    excludeExtraneousValues: true,
  });

describe('FindAllPositionsDto', () => {
  it('flattens the related map and user into names', () => {
    const dto = serialize({
      map: { id: 2, mapname: 'climb_a', hardest: 4 },
      user: { id: 3, username: 'capper', gold: 7 },
    });

    expect(dto.mapname).toBe('climb_a');
    expect(dto.username).toBe('capper');
  });

  it('reports no name when the relation is missing', () => {
    const dto = serialize({ map: null, user: null });

    expect(dto.mapname).toBeNull();
    expect(dto.username).toBeNull();
  });

  it('reports no name when the relation was not loaded at all', () => {
    const dto = serialize({ id: 1 });

    expect(dto.mapname).toBeNull();
    expect(dto.username).toBeNull();
  });

  it('keeps the related rows themselves out of the response', () => {
    const dto = serialize({
      map: { id: 2, mapname: 'climb_a' },
      user: { id: 3, username: 'capper' },
    });

    expect(dto).not.toHaveProperty('map');
    expect(dto).not.toHaveProperty('user');
    expect(JSON.stringify(dto)).not.toContain('hardest');
  });

  it('exposes exactly the documented fields', () => {
    expect(Object.keys(serialize({})).sort()).toEqual([
      'id',
      'mapId',
      'mapname',
      'medal',
      'positionDate',
      'type',
      'userId',
      'username',
    ]);
  });
});
