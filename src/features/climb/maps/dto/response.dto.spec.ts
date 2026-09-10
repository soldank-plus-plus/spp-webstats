import { plainToInstance } from 'class-transformer';
import { FindAllMapsDto } from './response.dto';

const serialize = (map: Record<string, unknown>) =>
  plainToInstance(FindAllMapsDto, map, { excludeExtraneousValues: true });

describe('FindAllMapsDto', () => {
  it('turns the stored seconds into milliseconds', () => {
    expect(serialize({ date: 1700000000 }).date).toBe(1700000000000);
  });

  it('reports an unset creation date as null', () => {
    expect(serialize({ date: 0 }).date).toBeNull();
    expect(serialize({ date: null }).date).toBeNull();
  });

  it('reduces every creator to an id and a username', () => {
    const dto = serialize({
      creators: [{ id: 1, username: 'one', gold: 5, playtime: 99, clanId: 3 }],
    });

    expect(dto.creators).toEqual([{ id: 1, username: 'one' }]);
  });

  it('reports a map nobody is credited with as having no creators', () => {
    expect(serialize({}).creators).toEqual([]);
    expect(serialize({ creators: null }).creators).toEqual([]);
  });

  it('keeps the relations of the entity out of the response', () => {
    const dto = serialize({
      id: 1,
      positions: [{ id: 9 }],
      stats: [{ id: 8 }],
    });

    expect(dto).not.toHaveProperty('positions');
    expect(dto).not.toHaveProperty('stats');
  });

  it('exposes exactly the documented fields', () => {
    expect(Object.keys(serialize({})).sort()).toEqual([
      'anticoop',
      'coop',
      'creators',
      'date',
      'hardest',
      'id',
      'jets',
      'm79',
      'm79c',
      'mapname',
      'nade',
      'recordsCount',
      'switch',
    ]);
  });
});
