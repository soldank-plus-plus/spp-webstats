import { plainToInstance } from 'class-transformer';
import { FindAllClansDto, FindOneClanDto } from './response.dto';
import { ClanMemberDto } from './clan-member.dto';

const serialize = (clan: Record<string, unknown>) =>
  plainToInstance(FindAllClansDto, clan, { excludeExtraneousValues: true });

describe('FindAllClansDto', () => {
  it('reduces every founder to an id and a username', () => {
    const dto = serialize({
      creators: [{ id: 1, username: 'chief', gold: 9, playtime: 100 }],
    });

    expect(dto.creators).toEqual([{ id: 1, username: 'chief' }]);
  });

  it('reports a clan without founders as having none', () => {
    expect(serialize({}).creators).toEqual([]);
    expect(serialize({ creators: null }).creators).toEqual([]);
  });

  it('exposes exactly the documented fields', () => {
    expect(Object.keys(serialize({})).sort()).toEqual([
      'bronze',
      'clanname',
      'creators',
      'gold',
      'hardest',
      'id',
      'mapsCreated',
      'silver',
      'tag',
      'totalCaps',
      'uniqueCaps',
      'usersCount',
    ]);
  });
});

describe('FindOneClanDto', () => {
  it('adds the placement to the fields of the listing', () => {
    const dto = plainToInstance(
      FindOneClanDto,
      {
        clanname: 'Rangers',
        placement: { records: 1, hardest: 2, golds: 3, secret: 'x' },
      },
      { excludeExtraneousValues: true },
    );

    expect(dto.clanname).toBe('Rangers');
    expect({ ...dto.placement }).toEqual({
      records: 1,
      hardest: 2,
      golds: 3,
    });
  });
});

describe('ClanMemberDto', () => {
  it('marks whether the member founded the clan', () => {
    const dto = plainToInstance(
      ClanMemberDto,
      { id: 1, username: 'chief', founder: true, stats: [{ id: 1 }] },
      { excludeExtraneousValues: true },
    );

    expect(dto).toMatchObject({ id: 1, username: 'chief', founder: true });
    expect(dto).not.toHaveProperty('stats');
  });
});
