import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  PaginatedSwaggerDocs,
  Paginate,
  PaginateQuery,
  Paginated,
} from 'nestjs-paginate';
import { SerializePaginate } from '@api/shared/serialization/serialize';
import { UsersService } from '@api/features/climb/users/users.service';
import { UserEntity } from '@api/features/climb/users/user.entity';
import { FindAllUsersDto } from '@api/features/climb/users/dto/response.dto';
import { RANKED_USERS_PAGINATION_CONFIG } from '@api/features/climb/users/users.pagination';
import { CountriesService } from './countries.service';
import { CountryEntity } from './country.entity';
import { FindAllCountriesDto } from './dto/response.dto';
import { COUNTRIES_PAGINATION_CONFIG } from './countries.pagination';

@ApiTags('countries')
@Controller('countries')
export class CountriesController {
  constructor(
    private readonly countriesService: CountriesService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all countries' })
  @PaginatedSwaggerDocs(FindAllCountriesDto, COUNTRIES_PAGINATION_CONFIG)
  @SerializePaginate(FindAllCountriesDto)
  findAll(@Paginate() query: PaginateQuery): Promise<Paginated<CountryEntity>> {
    return this.countriesService.findAll(query);
  }

  @Get(':countryId/users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get users from a country' })
  @PaginatedSwaggerDocs(FindAllUsersDto, RANKED_USERS_PAGINATION_CONFIG)
  @SerializePaginate(FindAllUsersDto)
  async findUsers(
    @Param('countryId', ParseIntPipe) countryId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<UserEntity>> {
    if (!(await this.countriesService.exists(countryId))) {
      throw new NotFoundException('Country not found');
    }

    return this.usersService.findAllForCountry(countryId, query);
  }
}
