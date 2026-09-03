import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { MapEntity } from './map.entity';
import { StatEntity } from '@api/features/stats/stat.entity';
import { UserEntity } from '@api/features/users/user.entity';
import { MAPS_PAGINATION_CONFIG } from './maps.pagination';

type EnrichedMap = MapEntity & {
  creators: UserEntity[];
  recordsCount: number;
};

@Injectable()
export class MapsService {
  constructor(
    @InjectRepository(MapEntity)
    private readonly mapsRepository: Repository<MapEntity>,
    @InjectRepository(StatEntity)
    private readonly statsRepository: Repository<StatEntity>,
  ) {}

  async findAll(query: PaginateQuery): Promise<Paginated<MapEntity>> {
    const result = await paginate(
      query,
      this.mapsRepository,
      MAPS_PAGINATION_CONFIG,
    );

    result.data = await this.enrich(result.data);

    return result;
  }

  async findOne(id: number): Promise<MapEntity | null> {
    const map = await this.mapsRepository.findOneBy({ id });

    if (!map) {
      return null;
    }

    const [enriched] = await this.enrich([map]);

    return enriched;
  }

  async findAllByUser(userId: number): Promise<MapEntity[]> {
    const maps = await this.mapsRepository
      .createQueryBuilder('map')
      .innerJoin('map.creators', 'creator', 'creator.id = :userId', {
        userId,
      })
      .getMany();

    return this.enrich(maps);
  }

  // Fetches creators and records count for a page of maps separately from
  // the main (possibly LIMIT/OFFSET-paginated) query, rather than joining
  // them in: joining a to-many relation together with LIMIT/OFFSET truncates
  // relations unpredictably, since the limit applies to the joined row count
  // rather than to distinct maps.
  private async enrich(maps: MapEntity[]): Promise<EnrichedMap[]> {
    const mapIds = maps.map((map) => map.id);

    if (mapIds.length === 0) {
      return [];
    }

    const creatorRows = await this.mapsRepository
      .createQueryBuilder('map')
      .innerJoin('map.creators', 'creator')
      .select('map.id', 'mapId')
      .addSelect('creator.id', 'userId')
      .addSelect('creator.username', 'username')
      .where('map.id IN (:...mapIds)', { mapIds })
      .getRawMany<{ mapId: number; userId: number; username: string }>();

    const creatorsByMapId = new Map<number, UserEntity[]>();
    for (const row of creatorRows) {
      const creators = creatorsByMapId.get(row.mapId) ?? [];
      creators.push({ id: row.userId, username: row.username } as UserEntity);
      creatorsByMapId.set(row.mapId, creators);
    }

    const countRows = await this.statsRepository
      .createQueryBuilder('stat')
      .select('stat.mapId', 'mapId')
      .addSelect('COUNT(*)', 'count')
      .where('stat.mapId IN (:...mapIds)', { mapIds })
      .groupBy('stat.mapId')
      .getRawMany<{ mapId: number; count: string }>();

    const countByMapId = new Map(
      countRows.map((row) => [row.mapId, Number(row.count)]),
    );

    return maps.map((map) => ({
      ...map,
      creators: creatorsByMapId.get(map.id) ?? [],
      recordsCount: countByMapId.get(map.id) ?? 0,
    }));
  }
}
