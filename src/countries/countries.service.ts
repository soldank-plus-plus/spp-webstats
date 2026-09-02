import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { UserEntity } from '@api/users/user.entity';
import { CountryEntity } from './country.entity';
import { COUNTRIES_PAGINATION_CONFIG } from './countries.pagination';

type EnrichedCountry = CountryEntity & {
  usersCount: number;
};

@Injectable()
export class CountriesService {
  constructor(
    @InjectRepository(CountryEntity)
    private readonly countriesRepository: Repository<CountryEntity>,
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async findAll(query: PaginateQuery): Promise<Paginated<CountryEntity>> {
    const result = await paginate(
      query,
      this.countriesRepository,
      COUNTRIES_PAGINATION_CONFIG,
    );

    result.data = await this.enrich(result.data);

    return result;
  }

  private async enrich(countries: CountryEntity[]): Promise<EnrichedCountry[]> {
    const countryIds = countries.map((country) => country.id);

    if (countryIds.length === 0) {
      return [];
    }

    const countRows = await this.usersRepository
      .createQueryBuilder('user')
      .select('user.countryId', 'countryId')
      .addSelect('COUNT(*)', 'count')
      .where('user.countryId IN (:...countryIds)', { countryIds })
      .groupBy('user.countryId')
      .getRawMany<{ countryId: number; count: string }>();

    const countByCountryId = new Map(
      countRows.map((row) => [row.countryId, Number(row.count)]),
    );

    return countries.map((country) => ({
      ...country,
      usersCount: countByCountryId.get(country.id) ?? 0,
    }));
  }
}
