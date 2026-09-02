import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  PaginatedSwaggerDocs,
  Paginate,
  PaginateQuery,
  Paginated,
} from 'nestjs-paginate';
import { SerializePaginate } from '@api/serialize';
import { ClansService } from './clans.service';
import { ClanEntity } from './clan.entity';
import { FindAllClansDto } from './dto/response.dto';
import { CLANS_PAGINATION_CONFIG } from './clans.pagination';

@ApiTags('clans')
@Controller('clans')
export class ClansController {
  constructor(private readonly clansService: ClansService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all clans' })
  @PaginatedSwaggerDocs(FindAllClansDto, CLANS_PAGINATION_CONFIG)
  @SerializePaginate(FindAllClansDto)
  findAll(@Paginate() query: PaginateQuery): Promise<Paginated<ClanEntity>> {
    return this.clansService.findAll(query);
  }
}
