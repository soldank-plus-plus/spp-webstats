import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PositionsModule } from '@api/features/climb/positions/positions.module';
import { StatsModule } from '@api/features/climb/stats/stats.module';
import { MapEntity } from '@api/features/climb/maps/map.entity';
import { UserEntity } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, MapEntity]),
    PositionsModule,
    StatsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
