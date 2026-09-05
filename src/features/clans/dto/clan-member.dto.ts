import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { FindAllUsersDto } from '@api/features/users/dto/response.dto';

export class ClanMemberDto extends FindAllUsersDto {
  @Expose()
  @ApiProperty({ description: 'Whether this member founded the clan' })
  founder: boolean;
}
