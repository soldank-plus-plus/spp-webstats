import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { UserEntity } from '@api/features/climb/users/user.entity';
import { StatEntity } from '@api/features/climb/stats/stat.entity';
import { ClanEntity } from './clan.entity';
import { CLANS_PAGINATION_CONFIG } from './clans.pagination';

type ClanRecordsHistoryPoint = {
  label: string;
  records: number;
  gold: number;
  silver: number;
  bronze: number;
};

type RecordsHistoryRow = {
  year: string;
  records: string;
  gold: string;
  silver: string;
  bronze: string;
};

type ClanPlacement = {
  records: number;
  hardest: number;
  golds: number;
};

type EnrichedClan = ClanEntity & {
  creators: UserEntity[];
  usersCount: number;
};

type ClanDetails = EnrichedClan & {
  placement: ClanPlacement;
};

@Injectable()
export class ClansService {
  constructor(
    @InjectRepository(ClanEntity)
    private readonly clansRepository: Repository<ClanEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(StatEntity)
    private readonly statsRepository: Repository<StatEntity>,
  ) {}

  exists(id: number): Promise<boolean> {
    return this.clansRepository.existsBy({ id });
  }

  async findOne(id: number): Promise<ClanDetails | null> {
    const clan = await this.clansRepository.findOneBy({ id });

    if (!clan) {
      return null;
    }

    const [enriched] = await this.enrich([clan]);

    if (!enriched) {
      return null;
    }

    return { ...enriched, placement: await this.findPlacement(clan) };
  }

  // Mirrors the user placement: a clan's place is how many clans beat it on
  // that metric, so ties share a place
  private async findPlacement(clan: ClanEntity): Promise<ClanPlacement> {
    const row = await this.clansRepository
      .createQueryBuilder('clan')
      .select(
        'COUNT(*) FILTER (WHERE COALESCE(clan.uniqueCaps, 0) > :uniqueCaps)',
        'records',
      )
      .addSelect(
        'COUNT(*) FILTER (WHERE COALESCE(clan.hardest, 0) > :hardest)',
        'hardest',
      )
      .addSelect(
        'COUNT(*) FILTER (WHERE COALESCE(clan.gold, 0) > :gold)',
        'golds',
      )
      .setParameters({
        uniqueCaps: clan.uniqueCaps ?? 0,
        hardest: clan.hardest ?? 0,
        gold: clan.gold ?? 0,
      })
      .getRawOne<{ records: string; hardest: string; golds: string }>();

    return {
      records: Number(row?.records ?? 0) + 1,
      hardest: Number(row?.hardest ?? 0) + 1,
      golds: Number(row?.golds ?? 0) + 1,
    };
  }

  async findAll(query: PaginateQuery): Promise<Paginated<ClanEntity>> {
    const result = await paginate(
      query,
      this.clansRepository,
      CLANS_PAGINATION_CONFIG,
    );

    result.data = await this.enrich(result.data);

    return result;
  }

  async findRecordsHistory(
    clanId: number,
    userIds: number[],
  ): Promise<ClanRecordsHistoryPoint[]> {
    const memberIds = await this.filterClanMembers(clanId, userIds);

    if (memberIds.length === 0) {
      return [];
    }

    // Year keys are pinned to UTC so the buckets stay the same whatever time
    // zone the database session runs in
    const rows = await this.statsRepository
      .createQueryBuilder('stat')
      .select(
        "to_char(to_timestamp(stat.recordDate / 1000) AT TIME ZONE 'UTC', 'YYYY')",
        'year',
      )
      .addSelect('COUNT(*)', 'records')
      .addSelect('COUNT(*) FILTER (WHERE stat.position = 1)', 'gold')
      .addSelect('COUNT(*) FILTER (WHERE stat.position = 2)', 'silver')
      .addSelect('COUNT(*) FILTER (WHERE stat.position = 3)', 'bronze')
      .where('stat.userId IN (:...memberIds)', { memberIds })
      .andWhere('stat.recordDate IS NOT NULL')
      .groupBy('year')
      .getRawMany<RecordsHistoryRow>();

    if (rows.length === 0) {
      return [];
    }

    const rowsByYear = new Map(rows.map((row) => [Number(row.year), row]));
    const years = [...rowsByYear.keys()];
    const firstYear = Math.min(...years);
    const lastYear = Math.max(...years);

    // Years in between with no records still get a point, so the lines have no
    // holes
    return Array.from({ length: lastYear - firstYear + 1 }, (_, index) => {
      const year = firstYear + index;
      const row = rowsByYear.get(year);

      return {
        label: String(year),
        records: Number(row?.records ?? 0),
        gold: Number(row?.gold ?? 0),
        silver: Number(row?.silver ?? 0),
        bronze: Number(row?.bronze ?? 0),
      };
    });
  }

  private async filterClanMembers(
    clanId: number,
    userIds: number[],
  ): Promise<number[]> {
    const rows = await this.usersRepository
      .createQueryBuilder('user')
      .select('user.id', 'id')
      .where('user.clanId = :clanId', { clanId })
      .andWhere('user.id IN (:...userIds)', { userIds })
      .getRawMany<{ id: number }>();

    return rows.map((row) => row.id);
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
