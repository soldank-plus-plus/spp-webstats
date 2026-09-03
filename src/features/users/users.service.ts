import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import {
  paginate,
  PaginateConfig,
  PaginateQuery,
  Paginated,
} from 'nestjs-paginate';
import { MapEntity } from '@api/features/maps/map.entity';
import { UserEntity } from './user.entity';
import {
  RANKED_USERS_PAGINATION_CONFIG,
  USERS_PAGINATION_CONFIG,
} from './users.pagination';

type Placement = {
  records: number;
  hardest: number;
  golds: number;
};

type EnrichedUser = UserEntity & {
  passed: number;
};

type UserDetails = EnrichedUser & {
  placement: Placement;
  mapsLeft: number;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    @InjectRepository(MapEntity)
    private readonly mapsRepository: Repository<MapEntity>,
  ) {}

  findAll(query: PaginateQuery): Promise<Paginated<UserEntity>> {
    return this.paginateWithPassed(
      this.usersRepository,
      query,
      USERS_PAGINATION_CONFIG,
    );
  }

  findAllForClan(
    clanId: number,
    query: PaginateQuery,
  ): Promise<Paginated<UserEntity>> {
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .where('user.clanId = :clanId', { clanId });

    return this.paginateWithPassed(
      queryBuilder,
      query,
      RANKED_USERS_PAGINATION_CONFIG,
    );
  }

  findAllForCountry(
    countryId: number,
    query: PaginateQuery,
  ): Promise<Paginated<UserEntity>> {
    const queryBuilder = this.usersRepository
      .createQueryBuilder('user')
      .where('user.countryId = :countryId', { countryId });

    return this.paginateWithPassed(
      queryBuilder,
      query,
      RANKED_USERS_PAGINATION_CONFIG,
    );
  }

  async findOne(id: number): Promise<UserDetails | null> {
    const user = await this.usersRepository.findOneBy({ id });

    return user && this.withDetails(user);
  }

  async findOneByUsername(username: string): Promise<UserDetails | null> {
    const user = await this.usersRepository.findOneBy({ username });

    return user && this.withDetails(user);
  }

  // Every user listing goes through here, so they all carry the same fields
  private async paginateWithPassed(
    source: Repository<UserEntity> | SelectQueryBuilder<UserEntity>,
    query: PaginateQuery,
    config: PaginateConfig<UserEntity>,
  ): Promise<Paginated<UserEntity>> {
    const result = await paginate(query, source, config);
    const totalMaps = await this.mapsRepository.count();

    result.data = result.data.map((user) => this.withPassed(user, totalMaps));

    return result;
  }

  private withPassed(user: UserEntity, totalMaps: number): EnrichedUser {
    const passed = totalMaps ? ((user.uniqueCaps ?? 0) / totalMaps) * 100 : 0;

    return { ...user, passed: Math.round(passed * 10) / 10 };
  }

  private async withDetails(user: UserEntity): Promise<UserDetails> {
    const totalMaps = await this.mapsRepository.count();

    return {
      ...this.withPassed(user, totalMaps),
      placement: await this.findPlacement(user),
      mapsLeft: Math.max(totalMaps - (user.uniqueCaps ?? 0), 0),
    };
  }

  // A user's place in a ranking is how many users beat them on that metric,
  // which is what the ranking tables show as a row number. Ties share a place,
  // so two users with the same score both get #4 and the next one gets #6.
  private async findPlacement(user: UserEntity): Promise<Placement> {
    const row = await this.usersRepository
      .createQueryBuilder('user')
      .select(
        'COUNT(*) FILTER (WHERE COALESCE(user.uniqueCaps, 0) > :uniqueCaps)',
        'records',
      )
      .addSelect(
        'COUNT(*) FILTER (WHERE COALESCE(user.hardest, 0) > :hardest)',
        'hardest',
      )
      .addSelect(
        'COUNT(*) FILTER (WHERE COALESCE(user.gold, 0) > :gold)',
        'golds',
      )
      .setParameters({
        uniqueCaps: user.uniqueCaps ?? 0,
        hardest: user.hardest ?? 0,
        gold: user.gold ?? 0,
      })
      .getRawOne<{ records: string; hardest: string; golds: string }>();

    return {
      records: Number(row?.records ?? 0) + 1,
      hardest: Number(row?.hardest ?? 0) + 1,
      golds: Number(row?.golds ?? 0) + 1,
    };
  }
}
