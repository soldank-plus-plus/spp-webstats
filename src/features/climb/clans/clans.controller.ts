import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  ParseArrayPipe,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  PaginatedSwaggerDocs,
  Paginate,
  PaginateQuery,
  Paginated,
} from 'nestjs-paginate';
import {
  Serialize,
  SerializePaginate,
} from '@api/shared/serialization/serialize';
import { UsersService } from '@api/features/climb/users/users.service';
import { UserEntity } from '@api/features/climb/users/user.entity';
import { RANKED_USERS_PAGINATION_CONFIG } from '@api/features/climb/users/users.pagination';
import { ClansService } from './clans.service';
import { ClanEntity } from './clan.entity';
import { FindAllClansDto } from './dto/response.dto';
import { ClanMemberDto } from './dto/clan-member.dto';
import { ClanRecordsHistoryDto } from './dto/records-history.dto';
import { CLANS_PAGINATION_CONFIG } from './clans.pagination';

@ApiTags('climb/clans')
@Controller('climb/clans')
export class ClansController {
  constructor(
    private readonly clansService: ClansService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all clans' })
  @PaginatedSwaggerDocs(FindAllClansDto, CLANS_PAGINATION_CONFIG)
  @SerializePaginate(FindAllClansDto)
  findAll(@Paginate() query: PaginateQuery): Promise<Paginated<ClanEntity>> {
    return this.clansService.findAll(query);
  }

  @Get(':clanId/users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get users in a clan' })
  @PaginatedSwaggerDocs(ClanMemberDto, RANKED_USERS_PAGINATION_CONFIG)
  @SerializePaginate(ClanMemberDto)
  async findUsers(
    @Param('clanId', ParseIntPipe) clanId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<UserEntity>> {
    if (!(await this.clansService.exists(clanId))) {
      throw new NotFoundException('Clan not found');
    }

    return this.usersService.findAllForClan(clanId, query);
  }

  @Get(':clanId/records-history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get the clan records history' })
  @ApiQuery({
    name: 'userIds',
    type: String,
    description: 'Comma-separated ids of the clan users to include',
  })
  @Serialize(ClanRecordsHistoryDto, { isArray: true })
  async findRecordsHistory(
    @Param('clanId', ParseIntPipe) clanId: number,
    @Query('userIds', new ParseArrayPipe({ items: Number, separator: ',' }))
    userIds: number[],
  ): Promise<{ label: string; records: number }[]> {
    if (!(await this.clansService.exists(clanId))) {
      throw new NotFoundException('Clan not found');
    }

    return this.clansService.findRecordsHistory(clanId, userIds);
  }
}
