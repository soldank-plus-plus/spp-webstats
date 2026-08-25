import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MapEntity } from './map.entity';
import { StatEntity } from '@api/stats/stat.entity';
import { MapsController } from './maps.controller';
import { MapsService } from './maps.service';

@Module({
  imports: [TypeOrmModule.forFeature([MapEntity, StatEntity])],
  controllers: [MapsController],
  providers: [MapsService],
})
export class MapsModule {}
