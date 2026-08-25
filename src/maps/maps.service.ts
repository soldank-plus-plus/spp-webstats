import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { MapEntity } from './map.entity';
import { MAPS_PAGINATION_CONFIG } from './maps.pagination';

@Injectable()
export class MapsService {
  constructor(
    @InjectRepository(MapEntity)
    private readonly mapsRepository: Repository<MapEntity>,
  ) {}

  findAll(query: PaginateQuery): Promise<Paginated<MapEntity>> {
    return paginate(query, this.mapsRepository, MAPS_PAGINATION_CONFIG);
  }

  findOne(id: number): Promise<MapEntity | null> {
    return this.mapsRepository.findOneBy({ id });
  }
}
