import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '@api/features/users/users.module';
import { UserEntity } from '@api/features/users/user.entity';
import { ClanEntity } from './clan.entity';
import { ClansController } from './clans.controller';
import { ClansService } from './clans.service';

@Module({
  imports: [TypeOrmModule.forFeature([ClanEntity, UserEntity]), UsersModule],
  controllers: [ClansController],
  providers: [ClansService],
})
export class ClansModule {}
