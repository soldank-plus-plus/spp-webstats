import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '@api/users/user.entity';
import { ClanEntity } from './clan.entity';
import { ClansController } from './clans.controller';
import { ClansService } from './clans.service';

@Module({
  imports: [TypeOrmModule.forFeature([ClanEntity, UserEntity])],
  controllers: [ClansController],
  providers: [ClansService],
})
export class ClansModule {}
