import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { UserEntity } from './user.entity';
import { USERS_PAGINATION_CONFIG } from './users.pagination';

type Placement = {
  records: number;
  hardest: number;
  golds: number;
};

type UserDetails = UserEntity & {
  placement: Placement;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  findAll(query: PaginateQuery): Promise<Paginated<UserEntity>> {
    return paginate(query, this.usersRepository, USERS_PAGINATION_CONFIG);
  }

  async findOne(id: number): Promise<UserDetails | null> {
    const user = await this.usersRepository.findOneBy({ id });

    return user && this.withDetails(user);
  }

  async findOneByUsername(username: string): Promise<UserDetails | null> {
    const user = await this.usersRepository.findOneBy({ username });

    return user && this.withDetails(user);
  }

  private async withDetails(user: UserEntity): Promise<UserDetails> {
    return {
      ...user,
      placement: await this.findPlacement(user),
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
