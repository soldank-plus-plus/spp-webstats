import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '@api/features/climb/users/users.module';
import { UserEntity } from '@api/features/climb/users/user.entity';
import { StatEntity } from '@api/features/climb/stats/stat.entity';
import { ClanEntity } from './clan.entity';
import { ClansController } from './clans.controller';
import { ClansService } from './clans.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClanEntity, UserEntity, StatEntity]),
    UsersModule,
  ],
  controllers: [ClansController],
  providers: [ClansService],
})
export class ClansModule {}
