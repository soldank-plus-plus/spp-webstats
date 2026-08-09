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
import { Serialize, SerializePaginate } from '@api/serialize';
import { MapsService } from './maps.service';
import { MapEntity } from './map.entity';
import { FindAllMapsDto } from './dto/response.dto';
import { MAPS_PAGINATION_CONFIG } from './maps.pagination';

@ApiTags('maps')
@Controller('maps')
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all maps' })
  @PaginatedSwaggerDocs(FindAllMapsDto, MAPS_PAGINATION_CONFIG)
  @SerializePaginate(FindAllMapsDto)
  findAll(@Paginate() query: PaginateQuery): Promise<Paginated<MapEntity>> {
    return this.mapsService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get map by id' })
  @Serialize(FindAllMapsDto)
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<MapEntity> {
    const map = await this.mapsService.findOne(id);

    if (!map) {
      throw new NotFoundException(`Map not found`);
    }

    return map;
  }
}
