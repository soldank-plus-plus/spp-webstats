import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { UserEntity } from '@api/features/users/user.entity';
import { ClanEntity } from './clan.entity';
import { CLANS_PAGINATION_CONFIG } from './clans.pagination';

type EnrichedClan = ClanEntity & {
  creators: UserEntity[];
  usersCount: number;
};

@Injectable()
export class ClansService {
  constructor(
    @InjectRepository(ClanEntity)
    private readonly clansRepository: Repository<ClanEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async findAll(query: PaginateQuery): Promise<Paginated<ClanEntity>> {
    const result = await paginate(
      query,
      this.clansRepository,
      CLANS_PAGINATION_CONFIG,
    );

    result.data = await this.enrich(result.data);

    return result;
  }

  // Founders and member counts are fetched for an already-paginated page
  // rather than joined into the main query: joining a to-many relation
  // together with LIMIT/OFFSET truncates it unpredictably, because the limit
  // applies to the joined row count rather than to distinct clans.
  private async enrich(clans: ClanEntity[]): Promise<EnrichedClan[]> {
    const clanIds = clans.map((clan) => clan.id);

    if (clanIds.length === 0) {
      return [];
    }

    const creatorRows = await this.clansRepository
      .createQueryBuilder('clan')
      .innerJoin('clan.creators', 'creator')
      .select('clan.id', 'clanId')
      .addSelect('creator.id', 'userId')
      .addSelect('creator.username', 'username')
      .where('clan.id IN (:...clanIds)', { clanIds })
      .getRawMany<{ clanId: number; userId: number; username: string }>();

    const creatorsByClanId = new Map<number, UserEntity[]>();
    for (const row of creatorRows) {
      const creators = creatorsByClanId.get(row.clanId) ?? [];
      creators.push({ id: row.userId, username: row.username } as UserEntity);
      creatorsByClanId.set(row.clanId, creators);
    }

    const countRows = await this.usersRepository
      .createQueryBuilder('user')
      .select('user.clanId', 'clanId')
      .addSelect('COUNT(*)', 'count')
      .where('user.clanId IN (:...clanIds)', { clanIds })
      .groupBy('user.clanId')
      .getRawMany<{ clanId: number; count: string }>();

    const countByClanId = new Map(
      countRows.map((row) => [row.clanId, Number(row.count)]),
    );

    return clans.map((clan) => ({
      ...clan,
      creators: creatorsByClanId.get(clan.id) ?? [],
      usersCount: countByClanId.get(clan.id) ?? 0,
    }));
  }
}
