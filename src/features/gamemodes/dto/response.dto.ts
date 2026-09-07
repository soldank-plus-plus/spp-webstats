import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class FindAllGamemodesDto {
  @Expose()
  @ApiProperty({ description: 'Gamemode slug used in URLs and query params' })
  slug: string;

  @Expose()
  @ApiProperty({ description: 'Gamemode name' })
  name: string;

  @Expose()
  @ApiProperty({
    description: 'Whether this gamemode already has a database behind it',
  })
  available: boolean;

  @Expose()
  @ApiProperty({
    description: 'Whether this gamemode is the one served by default',
  })
  isDefault: boolean;
}
