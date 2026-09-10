import { plainToInstance } from 'class-transformer';
import { FindAllUsersDto, FindOneUserDto } from './response.dto';

const serializeOne = (user: Record<string, unknown>) =>
  plainToInstance(FindOneUserDto, user, { excludeExtraneousValues: true });

describe('FindAllUsersDto', () => {
  it('keeps the relations of the entity out of the listing', () => {
    const dto = plainToInstance(
      FindAllUsersDto,
      {
        id: 1,
        username: 'player',
        stats: [{ id: 1 }],
        positions: [{ id: 2 }],
        createdMaps: [{ id: 3 }],
        createdClans: [{ id: 4 }],
        clan: { id: 5, clanname: 'Legends' },
        country: { id: 6 },
      },
      { excludeExtraneousValues: true },
    );

    expect(dto).not.toHaveProperty('stats');
    expect(dto).not.toHaveProperty('positions');
    expect(dto).not.toHaveProperty('createdMaps');
    expect(dto).not.toHaveProperty('createdClans');
    expect(dto).not.toHaveProperty('clan');
    expect(dto).not.toHaveProperty('country');
  });

  it('exposes the ids of the clan and country rather than the rows', () => {
    const dto = plainToInstance(
      FindAllUsersDto,
      { clanId: 5, countryId: 6, clan: { id: 5, gold: 99 } },
      { excludeExtraneousValues: true },
    );

    expect(dto.clanId).toBe(5);
    expect(dto.countryId).toBe(6);
  });
});

describe('FindOneUserDto', () => {
  it('reduces the clan to the fields the profile shows', () => {
    const dto = serializeOne({
      clan: {
        id: 5,
        clanname: 'Legends',
        tag: 'LGD',
        gold: 99,
        uniqueCaps: 500,
      },
    });

    expect({ ...dto.clan }).toEqual({ id: 5, clanname: 'Legends', tag: 'LGD' });
  });

  it('reports no clan for a user who belongs to none', () => {
    expect(serializeOne({ clan: null }).clan).toBeNull();
  });

  it('keeps the placement it was given', () => {
    const dto = serializeOne({
      placement: { records: 3, hardest: 4, golds: 5, secret: 'x' },
    });

    expect({ ...dto.placement }).toEqual({
      records: 3,
      hardest: 4,
      golds: 5,
    });
  });

  it('carries the fields of the listing as well', () => {
    const dto = serializeOne({ id: 1, username: 'player', passed: 42.5 });

    expect(dto).toMatchObject({ id: 1, username: 'player', passed: 42.5 });
  });

  it('exposes exactly the documented fields', () => {
    expect(Object.keys(serializeOne({})).sort()).toEqual([
      'bronze',
      'clan',
      'clanId',
      'countryId',
      'createdAt',
      'gold',
      'hardest',
      'id',
      'lastActiveAt',
      'mapsCreated',
      'mapsLeft',
      'noMedal',
      'passed',
      'placement',
      'playtime',
      'silver',
      'totalCaps',
      'uniqueCaps',
      'username',
    ]);
  });
});
