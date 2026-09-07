import { Injectable } from '@nestjs/common';
import { GAMEMODE_DEFINITIONS } from './gamemodes.config';

export type Gamemode = {
  slug: string;
  name: string;
  available: boolean;
  isDefault: boolean;
};

@Injectable()
export class GamemodesService {
  findAll(): Gamemode[] {
    const defaultSlug = GAMEMODE_DEFINITIONS.find(
      (gamemode) => gamemode.dataSource !== null,
    )?.slug;

    return GAMEMODE_DEFINITIONS.map((gamemode) => ({
      slug: gamemode.slug,
      name: gamemode.name,
      available: gamemode.dataSource !== null,
      isDefault: gamemode.slug === defaultSlug,
    }));
  }
}
