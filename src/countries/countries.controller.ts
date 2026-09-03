import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  PaginatedSwaggerDocs,
  Paginate,
  PaginateQuery,
  Paginated,
} from 'nestjs-paginate';
import { SerializePaginate } from '@api/shared/serialization/serialize';
import { CountriesService } from './countries.service';
import { CountryEntity } from './country.entity';
import { FindAllCountriesDto } from './dto/response.dto';
import { COUNTRIES_PAGINATION_CONFIG } from './countries.pagination';

@ApiTags('countries')
@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all countries' })
  @PaginatedSwaggerDocs(FindAllCountriesDto, COUNTRIES_PAGINATION_CONFIG)
  @SerializePaginate(FindAllCountriesDto)
  findAll(@Paginate() query: PaginateQuery): Promise<Paginated<CountryEntity>> {
    return this.countriesService.findAll(query);
  }
}
