import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { UserEntity } from './user.entity';
import { USERS_PAGINATION_CONFIG } from './users.pagination';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  findAll(query: PaginateQuery): Promise<Paginated<UserEntity>> {
    return paginate(query, this.usersRepository, USERS_PAGINATION_CONFIG);
  }

  findOne(id: number): Promise<UserEntity | null> {
    return this.usersRepository.findOneBy({ id });
  }

  findOneByUsername(username: string): Promise<UserEntity | null> {
    return this.usersRepository.findOneBy({ username });
  }
}
