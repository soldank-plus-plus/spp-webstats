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
import { UsersService } from '@api/features/users/users.service';
import { UserEntity } from '@api/features/users/user.entity';
import { FindAllUsersDto } from '@api/features/users/dto/response.dto';
import { RANKED_USERS_PAGINATION_CONFIG } from '@api/features/users/users.pagination';
import { ClansService } from './clans.service';
import { ClanEntity } from './clan.entity';
import { FindAllClansDto } from './dto/response.dto';
import { CLANS_PAGINATION_CONFIG } from './clans.pagination';

@ApiTags('clans')
@Controller('clans')
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
  @PaginatedSwaggerDocs(FindAllUsersDto, RANKED_USERS_PAGINATION_CONFIG)
  @SerializePaginate(FindAllUsersDto)
  async findUsers(
    @Param('clanId', ParseIntPipe) clanId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<UserEntity>> {
    if (!(await this.clansService.exists(clanId))) {
      throw new NotFoundException('Clan not found');
    }

    return this.usersService.findAllForClan(clanId, query);
  }
}
