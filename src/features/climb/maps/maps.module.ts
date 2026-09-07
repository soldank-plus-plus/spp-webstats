import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MapEntity } from './map.entity';
import { StatEntity } from '@api/features/climb/stats/stat.entity';
import { PositionsModule } from '@api/features/climb/positions/positions.module';
import { StatsModule } from '@api/features/climb/stats/stats.module';
import { MapsController } from './maps.controller';
import { MapsService } from './maps.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([MapEntity, StatEntity]),
    PositionsModule,
    StatsModule,
  ],
  controllers: [MapsController],
  providers: [MapsService],
})
export class MapsModule {}
